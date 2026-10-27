<?php
/**
 * StayNest - Admin Reviews Endpoint
 * GET /api/admin/reviews.php
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

$summaryStmt = $pdo->prepare('SELECT COUNT(*) AS total_reviews, AVG(rating) AS average_rating FROM reviews');
$summaryStmt->execute();
$summary = $summaryStmt->fetch();

$reviewsStmt = $pdo->prepare(
    'SELECT r.review_id, r.property_id, p.property_name, u.name AS reviewer_name,
            r.rating, r.comment, r.created_at
     FROM reviews r
     INNER JOIN properties p ON p.property_id = r.property_id
     INNER JOIN users u ON u.user_id = r.user_id
     ORDER BY r.created_at DESC, r.review_id DESC'
);
$reviewsStmt->execute();

$reviews = array_map(static function (array $review): array {
    return [
        'review_id'      => (int) $review['review_id'],
        'property_id'    => (int) $review['property_id'],
        'property_title' => $review['property_name'],
        'reviewer_name'  => $review['reviewer_name'],
        'rating'         => (int) $review['rating'],
        'comment'        => $review['comment'],
        'created_at'     => $review['created_at'],
    ];
}, $reviewsStmt->fetchAll());

sendSuccess([
    'summary' => [
        'total_reviews'  => (int) $summary['total_reviews'],
        'average_rating' => $summary['average_rating'] !== null
            ? round((float) $summary['average_rating'], 2)
            : null,
    ],
    'reviews' => $reviews,
], 'Admin reviews retrieved successfully.');
