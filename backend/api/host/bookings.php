<?php
/**
 * StayNest - Host Bookings Endpoint
 *
 * GET /api/host/bookings.php?status=CONFIRMED
 * Lists bookings only for properties owned by the authenticated host.
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/validation.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method Not Allowed. Use GET.', 405);
}

$user = requireRole('HOST');
$hostId = (int) $user['user_id'];

$status = null;
$allowedStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
if (array_key_exists('status', $_GET) && $_GET['status'] !== '') {
    if (!is_string($_GET['status'])) {
        sendError('Invalid booking status filter.', 422);
    }

    $status = strtoupper(trim($_GET['status']));
    if (!in_array($status, $allowedStatuses, true)) {
        sendError('Invalid booking status filter.', 422, ['allowed_statuses' => $allowedStatuses]);
    }
}

$pdo = Database::getConnection();

$sql =
    'SELECT b.booking_id, b.property_id, p.property_name, u.name AS guest_name,
            b.check_in, b.check_out, b.guests, b.number_of_nights,
            b.total_amount, b.booking_status, b.created_at
     FROM bookings b
     INNER JOIN properties p ON p.property_id = b.property_id
     INNER JOIN users u ON u.user_id = b.user_id
     WHERE p.host_id = :host_id';

$params = [':host_id' => $hostId];
if ($status !== null) {
    $sql .= ' AND b.booking_status = :booking_status';
    $params[':booking_status'] = $status;
}
$sql .= ' ORDER BY b.created_at DESC, b.booking_id DESC';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

$bookings = array_map(static function (array $booking): array {
    return [
        'booking_id'     => (int) $booking['booking_id'],
        'property_id'    => (int) $booking['property_id'],
        'property_title' => $booking['property_name'],
        'guest_name'     => $booking['guest_name'],
        'check_in'       => $booking['check_in'],
        'check_out'      => $booking['check_out'],
        'guests'         => (int) $booking['guests'],
        'nights'         => (int) $booking['number_of_nights'],
        'total_amount'   => (float) $booking['total_amount'],
        'booking_status' => $booking['booking_status'],
        'created_at'     => $booking['created_at'],
    ];
}, $stmt->fetchAll());

sendSuccess([
    'bookings' => $bookings,
], 'Host bookings retrieved successfully.');
