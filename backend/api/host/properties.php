<?php
/**
 * StayNest - Host Properties Endpoint
 *
 * GET /api/host/properties.php
 * Lists only properties owned by the authenticated host.
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/properties.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method Not Allowed. Use GET.', 405);
}

$user = requireRole('HOST');
$hostId = (int) $user['user_id'];
$pdo = Database::getConnection();

$propertyId = null;
if (array_key_exists('property_id', $_GET)) {
    $propertyId = parseInteger($_GET['property_id'], 1, PHP_INT_MAX);
    if ($propertyId === null) {
        sendError('Invalid property_id.', 422);
    }

    $ownershipStmt = $pdo->prepare(
        'SELECT host_id
         FROM properties
         WHERE property_id = :property_id
         LIMIT 1'
    );
    $ownershipStmt->execute([':property_id' => $propertyId]);
    $property = $ownershipStmt->fetch();

    if (!$property) {
        sendError('Property not found.', 404);
    }

    if ((int) $property['host_id'] !== $hostId) {
        sendError('Forbidden. You do not own this property.', 403);
    }
}

$sql =
    'SELECT p.property_id, p.property_name, p.description, p.property_type,
            p.price_per_night, p.max_guests, p.status, p.created_at,
            l.location_id, l.city, l.state, l.country, l.address,
            (SELECT COUNT(*)
               FROM bookings b
              WHERE b.property_id = p.property_id) AS booking_count,
            (SELECT COUNT(*)
               FROM reviews r
              WHERE r.property_id = p.property_id) AS review_count,
            (SELECT AVG(r.rating)
               FROM reviews r
              WHERE r.property_id = p.property_id) AS average_rating
     FROM properties p
     INNER JOIN locations l ON l.location_id = p.location_id
     WHERE p.host_id = :host_id';
$params = [':host_id' => $hostId];

if ($propertyId !== null) {
    $sql .= ' AND p.property_id = :property_id';
    $params[':property_id'] = $propertyId;
}
$sql .= ' ORDER BY p.created_at DESC, p.property_id DESC';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

$properties = array_map(static function (array $property): array {
    return [
        'property_id'     => (int) $property['property_id'],
        'title'           => $property['property_name'],
        'description'     => $property['description'],
        'property_type'   => $property['property_type'],
        'price_per_night' => (float) $property['price_per_night'],
        'max_guests'      => (int) $property['max_guests'],
        'status'          => $property['status'],
        'created_at'      => $property['created_at'],
        'location'        => [
            'location_id' => (int) $property['location_id'],
            'city'        => $property['city'],
            'state'       => $property['state'],
            'country'     => $property['country'],
            'address'     => $property['address'],
        ],
        'booking_count'   => (int) $property['booking_count'],
        'review_summary'  => [
            'review_count'   => (int) $property['review_count'],
            'average_rating' => $property['average_rating'] !== null
                ? round((float) $property['average_rating'], 2)
                : null,
        ],
    ];
}, $stmt->fetchAll());

sendSuccess([
    'properties' => $properties,
], 'Host properties retrieved successfully.');
