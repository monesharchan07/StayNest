<?php
/**
 * StayNest - My Bookings Endpoint
 *
 * GET /api/bookings/my-bookings.php
 * GUEST only.
 * Returns the authenticated guest's bookings with property and location details.
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method Not Allowed. Use GET.', 405);
}

// Require authenticated GUEST only
$user = requireAuth();
if ($user['role'] !== 'GUEST') {
    sendError('Forbidden. Only guests can view their bookings.', 403);
}

// Database connection
$pdo = Database::getConnection();

// Fetch the authenticated guest's bookings with property and location details
// Never accept user_id as a filter from the client - always derive from session
$stmt = $pdo->prepare(
    'SELECT b.booking_id, b.user_id, b.property_id, b.check_in, b.check_out,
            b.guests, b.number_of_nights, b.total_amount, b.booking_status,
            p.property_name, p.price_per_night,
            l.city, l.state, l.country, l.address,
            pay.payment_id, pay.payment_method, pay.payment_status, pay.transaction_id,
            rev.review_id
     FROM bookings b
     INNER JOIN properties p ON p.property_id = b.property_id
     INNER JOIN locations l ON l.location_id = p.location_id
     LEFT JOIN payments pay ON pay.booking_id = b.booking_id
     LEFT JOIN reviews rev ON rev.booking_id = b.booking_id
     WHERE b.user_id = :user_id
     ORDER BY b.created_at DESC'
);
$stmt->execute([':user_id' => $user['user_id']]);
$bookings = $stmt->fetchAll();

$formattedBookings = [];
foreach ($bookings as $booking) {
    $payment = null;
    if (!empty($booking['payment_id'])) {
        $payment = [
            'payment_id'     => (int) $booking['payment_id'],
            'payment_method' => $booking['payment_method'],
            'payment_status' => $booking['payment_status'],
            'transaction_id' => $booking['transaction_id'] ?? null,
        ];
    }

    $formattedBookings[] = [
        'booking_id'       => (int) $booking['booking_id'],
        'property_id'      => (int) $booking['property_id'],
        'property_name'    => $booking['property_name'],
        'check_in'         => $booking['check_in'],
        'check_out'        => $booking['check_out'],
        'guests'           => (int) $booking['guests'],
        'nights'           => (int) $booking['number_of_nights'],
        'total_amount'     => (float) $booking['total_amount'],
        'booking_status'   => $booking['booking_status'],
        'payment'          => $payment,
        'has_review'       => !empty($booking['review_id']),
        'review_id'        => !empty($booking['review_id']) ? (int) $booking['review_id'] : null,
        'location'         => [
            'city'        => $booking['city'],
            'state'       => $booking['state'],
            'country'     => $booking['country'],
            'address'     => $booking['address'],
        ],
    ];
}

sendSuccess([
    'bookings' => $formattedBookings,
    'count'    => count($formattedBookings),
], 'Retrieved your bookings successfully.');