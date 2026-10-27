<?php
/**
 * StayNest - Public Property Reviews Endpoint
 *
 * GET /api/reviews/property.php?property_id=1
 * Returns reviews only for an ACTIVE property, without sensitive reviewer data.
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/properties.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method Not Allowed. Use GET.', 405);
}

if (!array_key_exists('property_id', $_GET)) {
    sendError('Missing property_id.', 422);
}

$propertyId = parseInteger($_GET['property_id'], 1, PHP_INT_MAX);
if ($propertyId === null) {
    sendError('Invalid property_id.', 422);
}

$pdo = Database::getConnection();

// Inactive properties are intentionally treated as unavailable to this public
// endpoint rather than exposing their review history.
$propertyStmt = $pdo->prepare(
    'SELECT property_id
     FROM properties
     WHERE property_id = :property_id
       AND status = :status
     LIMIT 1'
);
$propertyStmt->execute([
    ':property_id' => $propertyId,
    ':status'      => 'ACTIVE',
]);

if (!$propertyStmt->fetch()) {
    sendError('Active property not found.', 404);
}

$summaryStmt = $pdo->prepare(
    'SELECT COUNT(*) AS review_count, AVG(rating) AS average_rating
     FROM reviews
     WHERE property_id = :property_id'
);
$summaryStmt->execute([':property_id' => $propertyId]);
$summary = $summaryStmt->fetch();

$reviewsStmt = $pdo->prepare(
    'SELECT r.review_id, r.rating, r.comment, r.created_at, u.name AS reviewer_name
     FROM reviews r
     INNER JOIN users u ON u.user_id = r.user_id
     WHERE r.property_id = :property_id
     ORDER BY r.created_at DESC, r.review_id DESC'
);
$reviewsStmt->execute([':property_id' => $propertyId]);

$reviews = array_map(static function (array $review): array {
    return [
        'review_id'     => (int) $review['review_id'],
        'rating'        => (int) $review['rating'],
        'comment'       => $review['comment'],
        'created_at'    => $review['created_at'],
        'reviewer_name' => $review['reviewer_name'],
    ];
}, $reviewsStmt->fetchAll());

sendSuccess([
    'property_id' => $propertyId,
    'summary'     => [
        'review_count'   => (int) $summary['review_count'],
        'average_rating' => $summary['average_rating'] !== null
            ? round((float) $summary['average_rating'], 2)
            : null,
    ],
    'reviews'     => $reviews,
], 'Property reviews retrieved successfully.');
