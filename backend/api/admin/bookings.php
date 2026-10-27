<?php
/**
 * StayNest - Admin Bookings Endpoint
 * GET /api/admin/bookings.php?status=CONFIRMED
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method Not Allowed. Use GET.', 405);
}

requireRole('ADMIN');

$status = null;
$allowedStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
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
    'SELECT b.booking_id, b.property_id, p.property_name,
            g.name AS guest_name, h.name AS host_name,
            b.check_in, b.check_out, b.guests, b.number_of_nights,
            b.total_amount, b.booking_status, b.created_at
     FROM bookings b
     INNER JOIN properties p ON p.property_id = b.property_id
     INNER JOIN users g ON g.user_id = b.user_id
     INNER JOIN users h ON h.user_id = p.host_id';
$params = [];
if ($status !== null) {
    $sql .= ' WHERE b.booking_status = :status';
    $params[':status'] = $status;
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
        'host_name'      => $booking['host_name'],
        'check_in'       => $booking['check_in'],
        'check_out'      => $booking['check_out'],
        'guests'         => (int) $booking['guests'],
        'nights'         => (int) $booking['number_of_nights'],
        'total_amount'   => (float) $booking['total_amount'],
        'booking_status' => $booking['booking_status'],
        'created_at'     => $booking['created_at'],
    ];
}, $stmt->fetchAll());

sendSuccess(['bookings' => $bookings], 'Admin bookings retrieved successfully.');
