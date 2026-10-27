<?php
/**
 * StayNest - Payment Details Endpoint
 *
 * GET /api/payments/details.php?id=1
 * Guests may view their own payments, hosts may view payments for their own
 * properties, and admins may view all payments.
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method Not Allowed. Use GET.', 405);
}

$user = requireAuth();

if (!isset($_GET['id']) || !is_string($_GET['id']) || preg_match('/^[1-9]\d*$/', $_GET['id']) !== 1) {
    sendError('Missing or invalid payment ID.', 422);
}

$paymentId = (int) $_GET['id'];
if ($paymentId < 1) {
    sendError('Invalid payment ID.', 422);
}

$pdo = Database::getConnection();

$stmt = $pdo->prepare(
    'SELECT p.payment_id, p.booking_id, p.amount, p.payment_method, p.transaction_id,
            p.payment_status, p.payment_date,
            b.property_id, b.check_in, b.check_out, b.booking_status,
            b.user_id AS booking_guest_id, pr.host_id
     FROM payments p
     INNER JOIN bookings b ON b.booking_id = p.booking_id
     INNER JOIN properties pr ON pr.property_id = b.property_id
     WHERE p.payment_id = :payment_id OR p.booking_id = :booking_id
     ORDER BY p.payment_id DESC
     LIMIT 1'
);
$stmt->execute([
    ':payment_id' => $paymentId,
    ':booking_id' => $paymentId,
]);
$payment = $stmt->fetch();

if (!$payment) {
    sendError('Payment not found.', 404);
}

$role = $user['role'];
$canView = ($role === 'ADMIN')
    || ($role === 'GUEST' && (int) $payment['booking_guest_id'] === (int) $user['user_id'])
    || ($role === 'HOST' && (int) $payment['host_id'] === (int) $user['user_id']);

if (!$canView) {
    sendError('Forbidden. You do not have permission to view this payment.', 403);
}

sendSuccess([
    'payment' => [
        'payment_id'     => (int) $payment['payment_id'],
        'amount'         => (float) $payment['amount'],
        'payment_method' => $payment['payment_method'],
        'payment_status' => $payment['payment_status'],
        'payment_date'   => $payment['payment_date'],
        'transaction_id' => $payment['transaction_id'] ?? null,
        'booking'        => [
            'booking_id'     => (int) $payment['booking_id'],
            'property_id'    => (int) $payment['property_id'],
            'check_in'       => $payment['check_in'],
            'check_out'      => $payment['check_out'],
            'booking_status' => $payment['booking_status'],
        ],
    ],
], 'Payment details retrieved successfully.');
