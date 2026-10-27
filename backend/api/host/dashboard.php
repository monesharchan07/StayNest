<?php
/**
 * StayNest - Host Dashboard Endpoint
 *
 * GET /api/host/dashboard.php
 * Returns aggregate data only for properties owned by the authenticated host.
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method Not Allowed. Use GET.', 405);
}

$user = requireRole('HOST');
$hostId = (int) $user['user_id'];
$pdo = Database::getConnection();

// Scalar subqueries avoid join multiplication between bookings, payments, and
// reviews while keeping every total constrained by the session-derived host ID.
$stmt = $pdo->prepare(
    'SELECT
        (SELECT COUNT(*)
           FROM properties p
          WHERE p.host_id = :host_id_properties) AS total_properties,
        (SELECT COUNT(*)
           FROM properties p
          WHERE p.host_id = :host_id_active
            AND p.status = :active_status) AS active_properties,
        (SELECT COUNT(*)
           FROM properties p
          WHERE p.host_id = :host_id_pending
            AND p.status = :pending_property_status) AS pending_properties,
        (SELECT COUNT(*)
           FROM bookings b
           INNER JOIN properties p ON p.property_id = b.property_id
          WHERE p.host_id = :host_id_bookings) AS total_bookings,
        (SELECT COUNT(*)
           FROM bookings b
           INNER JOIN properties p ON p.property_id = b.property_id
          WHERE p.host_id = :host_id_pending_bookings
            AND b.booking_status = :pending_booking_status) AS pending_bookings,
        (SELECT COUNT(*)
           FROM bookings b
           INNER JOIN properties p ON p.property_id = b.property_id
          WHERE p.host_id = :host_id_confirmed_bookings
            AND b.booking_status = :confirmed_booking_status) AS confirmed_bookings,
        (SELECT COUNT(*)
           FROM bookings b
           INNER JOIN properties p ON p.property_id = b.property_id
          WHERE p.host_id = :host_id_completed_bookings
            AND b.booking_status = :completed_booking_status) AS completed_bookings,
        (SELECT COUNT(*)
           FROM bookings b
           INNER JOIN properties p ON p.property_id = b.property_id
          WHERE p.host_id = :host_id_cancelled_bookings
            AND b.booking_status = :cancelled_booking_status) AS cancelled_bookings,
        (SELECT COALESCE(SUM(pay.amount), 0)
           FROM payments pay
           INNER JOIN bookings b ON b.booking_id = pay.booking_id
           INNER JOIN properties p ON p.property_id = b.property_id
          WHERE p.host_id = :host_id_revenue
            AND pay.payment_status = :successful_payment_status) AS total_revenue,
        (SELECT COUNT(*)
           FROM reviews r
           INNER JOIN properties p ON p.property_id = r.property_id
          WHERE p.host_id = :host_id_reviews) AS total_reviews,
        (SELECT AVG(r.rating)
           FROM reviews r
           INNER JOIN properties p ON p.property_id = r.property_id
          WHERE p.host_id = :host_id_average_rating) AS average_rating'
);
$stmt->execute([
    ':host_id_properties'            => $hostId,
    ':host_id_active'                => $hostId,
    ':active_status'                 => 'ACTIVE',
    ':host_id_pending'               => $hostId,
    ':pending_property_status'       => 'PENDING',
    ':host_id_bookings'              => $hostId,
    ':host_id_pending_bookings'      => $hostId,
    ':pending_booking_status'        => 'PENDING',
    ':host_id_confirmed_bookings'    => $hostId,
    ':confirmed_booking_status'      => 'CONFIRMED',
    ':host_id_completed_bookings'    => $hostId,
    ':completed_booking_status'      => 'COMPLETED',
    ':host_id_cancelled_bookings'    => $hostId,
    ':cancelled_booking_status'      => 'CANCELLED',
    ':host_id_revenue'               => $hostId,
    ':successful_payment_status'     => 'SUCCESS',
    ':host_id_reviews'               => $hostId,
    ':host_id_average_rating'        => $hostId,
]);
$stats = $stmt->fetch();

sendSuccess([
    'properties' => [
        'total'   => (int) $stats['total_properties'],
        'active'  => (int) $stats['active_properties'],
        'pending' => (int) $stats['pending_properties'],
    ],
    'bookings' => [
        'total'     => (int) $stats['total_bookings'],
        'pending'   => (int) $stats['pending_bookings'],
        'confirmed' => (int) $stats['confirmed_bookings'],
        'completed' => (int) $stats['completed_bookings'],
        'cancelled' => (int) $stats['cancelled_bookings'],
    ],
    'total_revenue' => (float) $stats['total_revenue'],
    'reviews' => [
        'total'          => (int) $stats['total_reviews'],
        'average_rating' => $stats['average_rating'] !== null
            ? round((float) $stats['average_rating'], 2)
            : null,
    ],
], 'Host dashboard retrieved successfully.');
