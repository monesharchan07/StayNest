<?php
/**
 * StayNest - Booking Cancel Endpoint
 *
 * PUT /api/bookings/cancel.php?id=1
 * Authenticated GUEST.
 * Only the guest who created the booking can cancel it.
 * Validate allowed status transition.
 * Do not allow cancellation of already-cancelled/completed bookings.
 * Update status; do not delete the booking.
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    sendError('Method Not Allowed. Use PUT.', 405);
}

// Require authenticated GUEST only
$user = requireAuth();
if ($user['role'] !== 'GUEST') {
    sendError('Forbidden. Only guests can cancel bookings.', 403);
}

// Get booking ID from query string
if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    sendError('Missing or invalid booking ID.', 422);
}
$bookingId = (int) $_GET['id'];
if ($bookingId < 1) {
    sendError('Invalid booking ID.', 422);
}

// Database connection
$pdo = Database::getConnection();

// Fetch the booking with owner information
$stmt = $pdo->prepare(
    'SELECT b.*, u.name as guest_name, u.role as guest_role,
            p.host_id
     FROM bookings b
     INNER JOIN users u ON u.user_id = b.user_id
     INNER JOIN properties p ON p.property_id = b.property_id
     WHERE b.booking_id = :booking_id
     LIMIT 1'
);
$stmt->execute([':booking_id' => $bookingId]);
$booking = $stmt->fetch();

if (!$booking) {
    sendError('Booking not found.', 404);
}

// Authorization check: only the guest who created the booking can cancel it
$isBookingOwner = (int) $booking['user_id'] === $user['user_id'];
if (!$isBookingOwner) {
    sendError('Forbidden. You are not the owner of this booking.', 403);
}

// Allowed status transitions
// PENDING -> CANCELLED, CONFIRMED -> CANCELLED
// CANCELLED and COMPLETED are terminal states - cannot be cancelled
$currentStatus = $booking['booking_status'];

$allowedTransitions = [
    'PENDING' => ['CANCELLED'],
    'CONFIRMED' => ['CANCELLED'],
    'CANCELLED' => [],   // terminal state
    'COMPLETED' => [],   // terminal state
];

if (empty($allowedTransitions[$currentStatus])) {
    sendError("Cannot cancel booking with status '{$currentStatus}'. Booking is already " . ucfirst($currentStatus) . '.', 422);
}

// Check if cancellation is allowed for current status
$isTransitionAllowed = in_array('CANCELLED', $allowedTransitions[$currentStatus] ?? []);
if (!$isTransitionAllowed) {
    sendError("Cannot cancel booking with status '{$currentStatus}'.", 422);
}

// Update booking status in a transaction
try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare(
        'UPDATE bookings SET booking_status = :status WHERE booking_id = :booking_id'
    );

    $result = $stmt->execute([
        ':status' => 'CANCELLED',
        ':booking_id' => $bookingId,
    ]);

    if (!$result) {
        $pdo->rollBack();
        sendError('Failed to cancel booking due to a database error.', 500);
    }

    $pdo->commit();

    sendSuccess([
        'booking_id' => $bookingId,
        'status' => 'CANCELLED',
    ], 'Booking cancelled successfully.');

} catch (PDOException $e) {
    $pdo->rollBack();
    sendError('Database error: ' . $e->getMessage(), 500);
}