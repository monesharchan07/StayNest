<?php
/**
 * StayNest - Review Creation Endpoint
 *
 * POST /api/reviews/create.php
 * Authenticated GUEST only. A guest may create one review after completing
 * their own stay. The user and property are always derived from the booking.
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/validation.php';
require_once __DIR__ . '/../../includes/properties.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method Not Allowed. Use POST.', 405);
}

$user = requireAuth();
if ($user['role'] !== 'GUEST') {
    sendError('Forbidden. Only guests can create reviews.', 403);
}

$data = sanitizeInput(getJsonInput());
$missing = validateRequired($data, ['booking_id', 'rating']);
if (!empty($missing)) {
    sendError('Missing required fields.', 422, ['fields' => $missing]);
}

$bookingId = parseInteger($data['booking_id'], 1, PHP_INT_MAX);
if ($bookingId === null) {
    sendError('Invalid booking_id.', 422);
}

$rating = parseInteger($data['rating'], 1, 5);
if ($rating === null) {
    sendError('Invalid rating. It must be an integer between 1 and 5.', 422);
}

// reviews.comment is nullable TEXT. A rating-only review is therefore valid,
// but a supplied comment must contain meaningful text and fit the TEXT limit.
$comment = null;
if (array_key_exists('comment', $data)) {
    if ($data['comment'] === null) {
        $comment = null;
    } elseif (!is_string($data['comment'])) {
        sendError('Invalid comment. It must be text or null.', 422);
    } else {
        $comment = trim($data['comment']);
        if ($comment === '') {
            sendError('Invalid comment. It cannot be empty when supplied.', 422);
        }
        // MySQL TEXT accepts up to 65,535 bytes, not characters.
        if (strlen($comment) > 65535) {
            sendError('Invalid comment. It must be 65,535 bytes or fewer.', 422);
        }
    }
}

$pdo = Database::getConnection();

try {
    $pdo->beginTransaction();

    // Lock the booking to serialize review attempts for the same booking and
    // derive the authoritative property relationship from the database.
    $bookingStmt = $pdo->prepare(
        'SELECT b.booking_id, b.user_id, b.property_id, b.booking_status,
                p.property_id AS verified_property_id
         FROM bookings b
         INNER JOIN properties p ON p.property_id = b.property_id
         WHERE b.booking_id = :booking_id
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

    if ($booking['booking_status'] !== 'COMPLETED') {
        $pdo->rollBack();
        sendError('This booking is not eligible for review until the stay is completed.', 409);
    }

    // The join above guarantees this relationship, and this guard keeps the
    // derived property value explicit before it is used for the insert.
    if ((int) $booking['property_id'] !== (int) $booking['verified_property_id']) {
        throw new RuntimeException('Booking property relationship is inconsistent.');
    }

    $reviewCheckStmt = $pdo->prepare(
        'SELECT review_id
         FROM reviews
         WHERE booking_id = :booking_id
         LIMIT 1'
    );
    $reviewCheckStmt->execute([':booking_id' => $bookingId]);
    if ($reviewCheckStmt->fetch()) {
        $pdo->rollBack();
        sendError('A review already exists for this booking.', 409);
    }

    $insertStmt = $pdo->prepare(
        'INSERT INTO reviews (user_id, property_id, booking_id, rating, comment)
         VALUES (:user_id, :property_id, :booking_id, :rating, :comment)'
    );
    $insertStmt->execute([
        ':user_id'     => (int) $user['user_id'],
        ':property_id' => (int) $booking['property_id'],
        ':booking_id'  => $bookingId,
        ':rating'      => $rating,
        ':comment'     => $comment,
    ]);

    $reviewId = (int) $pdo->lastInsertId();

    $createdStmt = $pdo->prepare(
        'SELECT created_at
         FROM reviews
         WHERE review_id = :review_id
         LIMIT 1'
    );
    $createdStmt->execute([':review_id' => $reviewId]);
    $createdAt = $createdStmt->fetchColumn();

    $pdo->commit();

    sendSuccess([
        'review_id'    => $reviewId,
        'booking_id'   => $bookingId,
        'property_id'  => (int) $booking['property_id'],
        'rating'       => $rating,
        'comment'      => $comment,
        'created_at'   => $createdAt,
    ], 'Review created successfully.', 201);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    sendError('Review creation failed. No review was recorded.', 500);
}
