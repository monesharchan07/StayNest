<?php
/**
 * StayNest - Mock Payment Processing Endpoint
 *
 * POST /api/payments/process.php
 * Authenticated GUEST only. Creates one successful mock payment for a
 * PENDING booking owned by the guest, then confirms that booking.
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/validation.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method Not Allowed. Use POST.', 405);
}

$user = requireAuth();
if ($user['role'] !== 'GUEST') {
    sendError('Forbidden. Only guests can process payments.', 403);
}

$data = sanitizeInput(getJsonInput());
$missing = validateRequired($data, ['booking_id', 'payment_method']);
if (!empty($missing)) {
    sendError('Missing required fields.', 422, ['fields' => $missing]);
}

// Accept JSON integers and digit-only strings, but reject decimals, booleans,
// arrays, and non-positive values.
$bookingValue = $data['booking_id'];
if (is_int($bookingValue)) {
    $bookingId = $bookingValue;
} elseif (is_string($bookingValue) && preg_match('/^[1-9]\d*$/', $bookingValue) === 1) {
    $bookingId = (int) $bookingValue;
} else {
    $bookingId = 0;
}

if ($bookingId < 1) {
    sendError('Invalid booking_id.', 422);
}

if (!is_string($data['payment_method'])) {
    sendError('Invalid payment_method. Allowed values: CARD, UPI, NET_BANKING.', 422);
}

$paymentMethod = strtoupper(trim($data['payment_method']));
// NET_BANKING is the schema enum; retain this alias for the API spelling in
// the project requirements without ever sending an unsupported enum to MySQL.
if ($paymentMethod === 'NETBANKING') {
    $paymentMethod = 'NET_BANKING';
}

$allowedMethods = ['CARD', 'UPI', 'NET_BANKING'];
if (!in_array($paymentMethod, $allowedMethods, true)) {
    sendError('Invalid payment_method. Allowed values: CARD, UPI, NET_BANKING.', 422);
}

$pdo = Database::getConnection();

try {
    $pdo->beginTransaction();

    // The booking lock serializes payment attempts for the same booking.
    $bookingStmt = $pdo->prepare(
        'SELECT booking_id, user_id, total_amount, booking_status
         FROM bookings
         WHERE booking_id = :booking_id
         LIMIT 1
         FOR UPDATE'
    );
    $bookingStmt->execute([':booking_id' => $bookingId]);
    $booking = $bookingStmt->fetch();

    if (!$booking) {
        $pdo->rollBack();
        sendError('Booking not found.', 404);
    }

    if ((int) $booking['user_id'] !== (int) $user['user_id']) {
        $pdo->rollBack();
        sendError('Forbidden. You do not own this booking.', 403);
    }

    // This must occur after locking so a waiting concurrent request sees the
    // first request's inserted payment before making its own decision.
    $paymentCheckStmt = $pdo->prepare(
        'SELECT payment_id
         FROM payments
         WHERE booking_id = :booking_id
         LIMIT 1'
    );
    $paymentCheckStmt->execute([':booking_id' => $bookingId]);
    if ($paymentCheckStmt->fetch()) {
        $pdo->rollBack();
        sendError('A payment already exists for this booking.', 409);
    }

    if ($booking['booking_status'] !== 'PENDING') {
        $pdo->rollBack();
        sendError('This booking is not in a payable state.', 409);
    }

    // The amount is exclusively authoritative from the locked booking row.
    $amount = (float) $booking['total_amount'];
    if ($amount <= 0) {
        $pdo->rollBack();
        sendError('This booking has an invalid payable amount.', 409);
    }

    // A mock reference is generated server-side; no payment credentials or
    // gateway data are collected or stored.
    $transactionId = 'MOCK-' . $bookingId . '-' . strtoupper(bin2hex(random_bytes(12)));

    $insertStmt = $pdo->prepare(
        'INSERT INTO payments (booking_id, amount, payment_method, payment_status, transaction_id)
         VALUES (:booking_id, :amount, :payment_method, :payment_status, :transaction_id)'
    );
    $insertStmt->execute([
        ':booking_id'       => $bookingId,
        ':amount'           => $amount,
        ':payment_method'   => $paymentMethod,
        ':payment_status'   => 'SUCCESS',
        ':transaction_id'   => $transactionId,
    ]);

    $paymentId = (int) $pdo->lastInsertId();

    // The DB trigger trg_payment_success_confirms_booking automatically sets
    // booking_status to CONFIRMED upon successful payment insertion.
    // Verify booking status is CONFIRMED; if not yet set, update it explicitly.
    $statusCheckStmt = $pdo->prepare(
        'SELECT booking_status FROM bookings WHERE booking_id = :booking_id LIMIT 1'
    );
    $statusCheckStmt->execute([':booking_id' => $bookingId]);
    $currentStatus = $statusCheckStmt->fetchColumn();

    if ($currentStatus !== 'CONFIRMED') {
        $bookingUpdateStmt = $pdo->prepare(
            'UPDATE bookings
             SET booking_status = :confirmed_status
             WHERE booking_id = :booking_id
               AND booking_status = :pending_status'
        );
        $bookingUpdateStmt->execute([
            ':confirmed_status' => 'CONFIRMED',
            ':booking_id'       => $bookingId,
            ':pending_status'   => 'PENDING',
        ]);

        if ($bookingUpdateStmt->rowCount() !== 1) {
            throw new RuntimeException('The booking payment state changed during processing.');
        }
    }

    $pdo->commit();

    sendSuccess([
        'payment_id'       => $paymentId,
        'booking_id'       => $bookingId,
        'amount'           => $amount,
        'payment_method'   => $paymentMethod,
        'payment_status'   => 'SUCCESS',
        'booking_status'   => 'CONFIRMED',
        'transaction_id'   => $transactionId,
    ], 'Mock payment processed successfully.', 201);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    sendError('Payment processing failed. No payment was recorded.', 500);
}
