<?php
/**
 * StayNest - Admin Properties Endpoint
 * GET /api/admin/properties.php?status=PENDING
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method Not Allowed. Use GET.', 405);
}

requireRole('ADMIN');

$status = null;
$allowedStatuses = ['PENDING', 'ACTIVE', 'INACTIVE'];
if (array_key_exists('status', $_GET) && $_GET['status'] !== '') {
    if (!is_string($_GET['status'])) {
        sendError('Invalid property status filter.', 422);
    }
    $status = strtoupper(trim($_GET['status']));
    if (!in_array($status, $allowedStatuses, true)) {
        sendError('Invalid property status filter.', 422, ['allowed_statuses' => $allowedStatuses]);
    }
}

$pdo = Database::getConnection();
$sql =
    'SELECT p.property_id, p.property_name, p.property_type, p.price_per_night,
            p.max_guests, p.status, p.created_at,
            l.location_id, l.city, l.state, l.country, l.address,
            h.name AS host_name,
            (SELECT COUNT(*) FROM bookings b WHERE b.property_id = p.property_id) AS booking_count,
            (SELECT COUNT(*) FROM reviews r WHERE r.property_id = p.property_id) AS review_count,
            (SELECT AVG(r.rating) FROM reviews r WHERE r.property_id = p.property_id) AS average_rating
     FROM properties p
     INNER JOIN locations l ON l.location_id = p.location_id
     INNER JOIN users h ON h.user_id = p.host_id';
$params = [];
if ($status !== null) {
    $sql .= ' WHERE p.status = :status';
    $params[':status'] = $status;
}
$sql .= ' ORDER BY p.created_at DESC, p.property_id DESC';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

$properties = array_map(static function (array $property): array {
    return [
        'property_id'     => (int) $property['property_id'],
        'title'           => $property['property_name'],
        'property_type'   => $property['property_type'],
        'price_per_night' => (float) $property['price_per_night'],
        'max_guests'      => (int) $property['max_guests'],
        'location'        => [
            'location_id' => (int) $property['location_id'],
            'city'        => $property['city'],
            'state'       => $property['state'],
            'country'     => $property['country'],
            'address'     => $property['address'],
        ],
        'host_name'       => $property['host_name'],
        'status'          => $property['status'],
        'created_at'      => $property['created_at'],
        'booking_count'   => (int) $property['booking_count'],
        'review_summary'  => [
            'review_count'   => (int) $property['review_count'],
            'average_rating' => $property['average_rating'] !== null
                ? round((float) $property['average_rating'], 2)
                : null,
        ],
    ];
}, $stmt->fetchAll());

sendSuccess(['properties' => $properties], 'Admin properties retrieved successfully.');
