<?php
/**
 * StayNest - Host Booking Status Update Endpoint
 *
 * PUT /api/host/update-booking-status.php
 * Hosts may advance only bookings for their own properties through the
 * supported workflow: PENDING -> CONFIRMED -> COMPLETED.
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/validation.php';
require_once __DIR__ . '/../../includes/properties.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method Not Allowed. Use PUT or POST.', 405);
}

$user = requireRole('HOST');
$hostId = (int) $user['user_id'];
$data = sanitizeInput(getJsonInput());

$missing = validateRequired($data, ['booking_id', 'status']);
if (!empty($missing)) {
    sendError('Missing required fields.', 422, ['fields' => $missing]);
}

$bookingId = parseInteger($data['booking_id'], 1, PHP_INT_MAX);
if ($bookingId === null) {
    sendError('Invalid booking_id.', 422);
}

if (!is_string($data['status'])) {
    sendError('Invalid booking status.', 422);
}

$targetStatus = strtoupper(trim($data['status']));
$knownStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
if (!in_array($targetStatus, $knownStatuses, true)) {
    sendError('Invalid booking status.', 422, ['allowed_statuses' => $knownStatuses]);
}

$pdo = Database::getConnection();

try {
    $pdo->beginTransaction();

    $bookingStmt = $pdo->prepare(
        'SELECT b.booking_id, b.booking_status, p.host_id
         FROM bookings b
         INNER JOIN properties p ON p.property_id = b.property_id
         WHERE b.booking_id = :booking_id
         LIMIT 1
         FOR UPDATE'
    );
    $bookingStmt->execute([':booking_id' => $bookingId]);
    $booking = $bookingStmt->fetch();

    if (!$booking) {
        $pdo->rollBack();
        sendError('Booking not found.', 404);
    }

    if ((int) $booking['host_id'] !== $hostId) {
        $pdo->rollBack();
        sendError('Forbidden. This booking does not belong to one of your properties.', 403);
    }

    $allowedTransitions = [
        'PENDING'   => ['CONFIRMED'],
        'CONFIRMED' => ['COMPLETED'],
        'CANCELLED' => [],
        'COMPLETED' => [],
    ];
    $currentStatus = $booking['booking_status'];

    if (!in_array($targetStatus, $allowedTransitions[$currentStatus] ?? [], true)) {
        $pdo->rollBack();
        sendError("Invalid booking status transition from '{$currentStatus}' to '{$targetStatus}'.", 409);
    }

    $updateStmt = $pdo->prepare(
        'UPDATE bookings
         SET booking_status = :target_status
         WHERE booking_id = :booking_id
           AND booking_status = :current_status'
    );
    $updateStmt->execute([
        ':target_status'  => $targetStatus,
        ':booking_id'     => $bookingId,
        ':current_status' => $currentStatus,
    ]);

    if ($updateStmt->rowCount() !== 1) {
        throw new RuntimeException('Booking status changed during update.');
    }

    $pdo->commit();

    sendSuccess([
        'booking_id'      => $bookingId,
        'previous_status' => $currentStatus,
        'booking_status'  => $targetStatus,
    ], 'Booking status updated successfully.');
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    sendError('Booking status update failed. No changes were made.', 500);
}
