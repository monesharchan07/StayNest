<?php
/**
 * StayNest - Update Property Endpoint
 *
 * PUT /api/properties/update.php?id=1
 *
 * HOST only. The property must belong to the authenticated host. host_id and
 * status are never accepted from the client; only whitelisted listing fields
 * can be changed.
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/validation.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/properties.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    sendError('Method Not Allowed. Use PUT.', 405);
}

$user       = requireRole('HOST');
$data       = sanitizeInput(getJsonInput());
$propertyId = resolvePropertyId($_GET, $data);
$fields     = validatePropertyFields($data, true);
$hostId     = (int) $user['user_id'];

// Defense in depth: only these columns may appear in the dynamic SET clause.
$updatableColumns = [
    'property_name', 'description', 'property_type', 'price_per_night',
    'max_guests', 'bedrooms', 'bathrooms', 'location_id',
];
$fields = array_intersect_key($fields, array_flip($updatableColumns));

if (empty($fields)) {
    sendError('No updatable fields provided.', 422);
}

try {
    $pdo = Database::getConnection();

    requirePropertyOwnership($pdo, $propertyId, $hostId);

    if (array_key_exists('location_id', $fields)) {
        assertLocationExists($pdo, $fields['location_id']);
    }

    $set    = [];
    $params = [':property_id' => $propertyId];

    foreach ($fields as $column => $value) {
        $set[]                  = $column . ' = :' . $column;
        $params[':' . $column]  = $value;
    }

    $stmt = $pdo->prepare(
        'UPDATE properties SET ' . implode(', ', $set) . ' WHERE property_id = :property_id'
    );
    $stmt->execute($params);

    $property = fetchPropertyRowById($pdo, $propertyId);
    if ($property === null) {
        sendError('Property not found.', 404);
    }

    sendSuccess($property, 'Property updated successfully.');
} catch (PDOException $e) {
    sendError('Failed to update property due to a database error.', 500);
}
