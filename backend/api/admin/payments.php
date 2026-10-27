<?php
/**
 * StayNest - Admin Payments Endpoint
 * GET /api/admin/payments.php?payment_status=SUCCESS
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method Not Allowed. Use GET.', 405);
}

requireRole('ADMIN');

$paymentStatus = null;
$allowedStatuses = ['PENDING', 'SUCCESS', 'FAILED'];
if (array_key_exists('payment_status', $_GET) && $_GET['payment_status'] !== '') {
    if (!is_string($_GET['payment_status'])) {
        sendError('Invalid payment status filter.', 422);
    }
    $paymentStatus = strtoupper(trim($_GET['payment_status']));
    if (!in_array($paymentStatus, $allowedStatuses, true)) {
        sendError('Invalid payment status filter.', 422, ['allowed_statuses' => $allowedStatuses]);
    }
}

$pdo = Database::getConnection();
$sql =
    'SELECT pay.payment_id, pay.booking_id, b.booking_status, pay.amount,
            pay.payment_method, pay.payment_status, pay.payment_date
     FROM payments pay
     INNER JOIN bookings b ON b.booking_id = pay.booking_id';
$params = [];
if ($paymentStatus !== null) {
    $sql .= ' WHERE pay.payment_status = :payment_status';
    $params[':payment_status'] = $paymentStatus;
}
$sql .= ' ORDER BY pay.payment_date DESC, pay.payment_id DESC';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

$payments = array_map(static function (array $payment): array {
    return [
        'payment_id'     => (int) $payment['payment_id'],
        'booking_id'     => (int) $payment['booking_id'],
        'booking_status' => $payment['booking_status'],
        'amount'         => (float) $payment['amount'],
        'payment_method' => $payment['payment_method'],
        'payment_status' => $payment['payment_status'],
        'payment_date'   => $payment['payment_date'],
    ];
}, $stmt->fetchAll());

sendSuccess(['payments' => $payments], 'Admin payments retrieved successfully.');
