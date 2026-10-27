<?php
/**
 * StayNest - Admin Dashboard Endpoint
 * GET /api/admin/dashboard.php
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method Not Allowed. Use GET.', 405);
}

requireRole('ADMIN');
$pdo = Database::getConnection();

$stmt = $pdo->prepare(
    'SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM users WHERE role = :guest_role) AS total_guests,
        (SELECT COUNT(*) FROM users WHERE role = :host_role) AS total_hosts,
        (SELECT COUNT(*) FROM users WHERE role = :admin_role) AS total_admins,
        (SELECT COUNT(*) FROM properties) AS total_properties,
        (SELECT COUNT(*) FROM properties WHERE status = :pending_property_status) AS pending_properties,
        (SELECT COUNT(*) FROM properties WHERE status = :active_property_status) AS active_properties,
        (SELECT COUNT(*) FROM bookings) AS total_bookings,
        (SELECT COUNT(*) FROM bookings WHERE booking_status = :pending_booking_status) AS pending_bookings,
        (SELECT COUNT(*) FROM bookings WHERE booking_status = :confirmed_booking_status) AS confirmed_bookings,
        (SELECT COUNT(*) FROM bookings WHERE booking_status = :completed_booking_status) AS completed_bookings,
        (SELECT COUNT(*) FROM bookings WHERE booking_status = :cancelled_booking_status) AS cancelled_bookings,
        (SELECT COUNT(*) FROM payments WHERE payment_status = :successful_payment_status) AS successful_payment_count,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_status = :successful_revenue_status) AS successful_payment_revenue,
        (SELECT COUNT(*) FROM reviews) AS total_reviews,
        (SELECT AVG(rating) FROM reviews) AS average_review_rating'
);
$stmt->execute([
    ':guest_role'                => 'GUEST',
    ':host_role'                 => 'HOST',
    ':admin_role'                => 'ADMIN',
    ':pending_property_status'   => 'PENDING',
    ':active_property_status'    => 'ACTIVE',
    ':pending_booking_status'    => 'PENDING',
    ':confirmed_booking_status'  => 'CONFIRMED',
    ':completed_booking_status'  => 'COMPLETED',
    ':cancelled_booking_status'  => 'CANCELLED',
    ':successful_payment_status' => 'SUCCESS',
    ':successful_revenue_status' => 'SUCCESS',
]);
$stats = $stmt->fetch();

sendSuccess([
    'users' => [
        'total'  => (int) $stats['total_users'],
        'guests' => (int) $stats['total_guests'],
        'hosts'  => (int) $stats['total_hosts'],
        'admins' => (int) $stats['total_admins'],
    ],
    'properties' => [
        'total'   => (int) $stats['total_properties'],
        'pending' => (int) $stats['pending_properties'],
        'active'  => (int) $stats['active_properties'],
    ],
    'bookings' => [
        'total'     => (int) $stats['total_bookings'],
        'pending'   => (int) $stats['pending_bookings'],
        'confirmed' => (int) $stats['confirmed_bookings'],
        'completed' => (int) $stats['completed_bookings'],
        'cancelled' => (int) $stats['cancelled_bookings'],
    ],
    'payments' => [
        'successful_count'   => (int) $stats['successful_payment_count'],
        'successful_revenue' => (float) $stats['successful_payment_revenue'],
    ],
    'reviews' => [
        'total'          => (int) $stats['total_reviews'],
        'average_rating' => $stats['average_review_rating'] !== null
            ? round((float) $stats['average_review_rating'], 2)
            : null,
    ],
], 'Admin dashboard retrieved successfully.');
