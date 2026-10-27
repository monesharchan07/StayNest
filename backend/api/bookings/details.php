<?php
/**
 * StayNest - Booking Details Endpoint
 *
 * GET /api/bookings/details.php?id=1
 * Authenticated user.
 * A GUEST may view only their own booking.
 * A HOST may view a booking for one of their own properties.
 * ADMIN access may be supported.
 * Do not expose unrelated users' information.
 * Return booking + property + location details.
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method Not Allowed. Use GET.', 405);
}

// Require authentication
$user = requireAuth();

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

// Fetch the booking with property and location details
$stmt = $pdo->prepare(
    'SELECT b.booking_id, b.user_id, b.property_id, b.check_in, b.check_out,
            b.guests, b.number_of_nights, b.total_amount, b.booking_status,
            p.property_name, p.description, p.property_type, p.price_per_night,
            p.max_guests, p.bedrooms, p.bathrooms, p.status as property_status,
            l.city, l.state, l.country, l.address,
            h.name as host_name, h.user_id as host_user_id
     FROM bookings b
     INNER JOIN properties p ON p.property_id = b.property_id
     INNER JOIN locations l ON l.location_id = p.location_id
     INNER JOIN users h ON h.user_id = p.host_id
     WHERE b.booking_id = :booking_id
     LIMIT 1'
);
$stmt->execute([':booking_id' => $bookingId]);
$booking = $stmt->fetch();

if (!$booking) {
    sendError('Booking not found.', 404);
}

// Authorization check:
// 1. GUEST can only view their own booking
// 2. HOST can view bookings for their own properties
// 3. ADMIN can view any booking

$isGuest   = $user['role'] === 'GUEST';
$isHost    = $user['role'] === 'HOST';
$isAdmin   = $user['role'] === 'ADMIN';
$isBookingOwner = (int) $booking['user_id'] === $user['user_id'];
$isBookingHost   = (int) $booking['host_user_id'] === $user['user_id'];

if ($isGuest && !$isBookingOwner && !$isAdmin) {
    sendError('Forbidden. You do not have permission to view this booking.', 403);
}

// Additional host check: if the user is a HOST, they can only view bookings for their own properties
if ($isHost && !$isBookingHost && !$isAdmin) {
    sendError('Forbidden. You do not have permission to view this booking.', 403);
}

// Format the response
$formatted = [
    'booking_id'       => (int) $booking['booking_id'],
    'user_id'          => (int) $booking['user_id'],
    'property_id'      => (int) $booking['property_id'],
    'check_in'         => $booking['check_in'],
    'check_out'        => $booking['check_out'],
    'guests'           => (int) $booking['guests'],
    'nights'           => (int) $booking['number_of_nights'],
    'total_amount'     => (float) $booking['total_amount'],
    'booking_status'   => $booking['booking_status'],
    'property'         => [
        'property_id'     => (int) $booking['property_id'],
        'property_name'   => $booking['property_name'],
        'description'     => $booking['description'],
        'property_type'   => $booking['property_type'],
        'price_per_night' => (float) $booking['price_per_night'],
        'max_guests'      => (int) $booking['max_guests'],
        'bedrooms'        => (int) $booking['bedrooms'],
        'bathrooms'       => (int) $booking['bathrooms'],
        'status'          => $booking['property_status'],
    ],
    'location'         => [
        'city'    => $booking['city'],
        'state'   => $booking['state'],
        'country' => $booking['country'],
        'address' => $booking['address'],
    ],
    'host'             => [
        'host_id' => (int) $booking['host_user_id'],
        'name'    => $booking['host_name'],
    ],
];

sendSuccess([
    'booking' => $formatted,
], 'Booking details retrieved successfully.');