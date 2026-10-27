<?php
/**
 * StayNest - Booking Create Endpoint
 *
 * POST /api/bookings/create.php
 * GUEST only.
 * Creates a new booking with availability checking and double-booking prevention.
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/validation.php';
require_once __DIR__ . '/../../includes/availability.php';
require_once __DIR__ . '/../../includes/properties.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method Not Allowed. Use POST.', 405);
}

// Require authenticated GUEST only
$user = requireAuth();
if ($user['role'] !== 'GUEST') {
    sendError('Forbidden. Only guests can create bookings.', 403);
}

// Parse and sanitize input
$raw = getJsonInput();
$data = sanitizeInput($raw);

// Validate required fields
$missing = validateRequired($data, ['property_id', 'check_in', 'check_out', 'guests']);
if (!empty($missing)) {
    sendError('Missing required fields.', 422, ['fields' => $missing]);
}

// Validate date range using existing helper
$dateRangeError = validateDateRange($data['check_in'], $data['check_out']);
if ($dateRangeError !== null) {
    sendError('Invalid date range.', 422, ['fields' => ['date_range' => $dateRangeError]]);
}

// Parse and validate property_id
$propertyId = parseInteger($data['property_id'], 1, PHP_INT_MAX);
if ($propertyId === null) {
    sendError('Invalid property_id.', 422, ['fields' => ['property_id' => 'Must be a positive integer.']]);
}

// Parse and validate guests count
$guests = parseInteger($data['guests'], 1, 1000);
if ($guests === null) {
    sendError('Invalid guest count.', 422, ['fields' => ['guests' => 'Must be a positive integer between 1 and 1000.']]);
}

// Database connection
$pdo = Database::getConnection();

// 1. Check property exists and is ACTIVE
// requireActiveProperty sends 404 for both missing and non-active properties
$property = requireActiveProperty($pdo, $propertyId);

// 2. Begin transaction with property lock to prevent concurrent double-booking
try {
    $pdo->beginTransaction();

    // Lock the property row for the duration of the transaction
    $locked = lockPropertyForAvailability($pdo, $propertyId);
    if (!$locked) {
        $pdo->rollBack();
        sendError('Property not found or could not be locked.', 404);
    }

    // Evaluate availability using the existing helper
    $availability = evaluatePropertyAvailability(
        $pdo,
        $propertyId,
        $data['check_in'],
        $data['check_out']
    );

    if (!$availability['available']) {
        $pdo->rollBack();
        $reason = $availability['reason'];
        if ($reason === 'BOOKED') {
            sendError('The property is already booked for the selected dates.', 409);
        } elseif ($reason === 'BLOCKED') {
            sendError('The property has blocked dates for the selected dates.', 409);
        } elseif ($reason === 'NO_AVAILABILITY') {
            sendError('The property has no available windows for the selected dates.', 409);
        } else {
            sendError('The property is not available for the selected dates.', 409);
        }
    }

    // 3. Calculate nights server-side
    $checkInDate = availabilityDate($data['check_in']);
    $checkOutDate = availabilityDate($data['check_out']);
    $nights = $checkOutDate->diff($checkInDate)->d;

    // 4. Calculate total_amount server-side from DB price_per_night × nights
    $pricePerNight = (float) $property['price_per_night'];
    $totalAmount = $pricePerNight * $nights;

    // 5. Insert booking - never trust user_id from client, derive from session
    $stmt = $pdo->prepare(
        'INSERT INTO bookings (user_id, property_id, check_in, check_out, guests, number_of_nights, total_amount, booking_status)
         VALUES (:user_id, :property_id, :check_in, :check_out, :guests, :number_of_nights, :total_amount, :booking_status)'
    );

    $bookingStatus = 'PENDING';

    $result = $stmt->execute([
        ':user_id'         => $user['user_id'],
        ':property_id'     => $propertyId,
        ':check_in'        => $data['check_in'],
        ':check_out'       => $data['check_out'],
        ':guests'          => $guests,
        ':number_of_nights'=> $nights,
        ':total_amount'    => $totalAmount,
        ':booking_status'  => $bookingStatus,
    ]);

    if (!$result) {
        $pdo->rollBack();
        sendError('Failed to create booking due to a database error.', 500);
    }

    $bookingId = $pdo->lastInsertId();

    // Commit transaction only after successful booking insertion
    $pdo->commit();

    // Return created booking details without sensitive information
    sendSuccess([
        'booking_id' => $bookingId,
        'property_id' => $propertyId,
        'check_in' => $data['check_in'],
        'check_out' => $data['check_out'],
        'guests' => $guests,
        'nights' => $nights,
        'total_amount' => $totalAmount,
        'booking_status' => $bookingStatus,
    ], 'Booking created successfully.', 201);

} catch (InvalidArgumentException $e) {
    $pdo->rollBack();
    sendError($e->getMessage(), 422);
} catch (PDOException $e) {
    $pdo->rollBack();
    sendError('Database error: ' . $e->getMessage(), 500);
}