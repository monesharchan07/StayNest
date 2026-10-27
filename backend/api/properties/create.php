<?php
/**
 * StayNest - Create Property Endpoint
 *
 * POST /api/properties/create.php
 *
 * HOST only. The authenticated host_id is derived from the session and is
 * never accepted from the request body. New properties use the schema default
 * status (PENDING) and require an existing location_id.
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/validation.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/properties.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method Not Allowed. Use POST.', 405);
}

$user   = requireRole('HOST');
$data   = sanitizeInput(getJsonInput());
$fields = validatePropertyFields($data, false);

try {
    $pdo   = Database::getConnection();
    $hostId = (int) $user['user_id'];

    assertLocationExists($pdo, $fields['location_id']);

    $stmt = $pdo->prepare(
        'INSERT INTO properties
            (host_id, location_id, property_name, description, property_type,
             price_per_night, max_guests, bedrooms, bathrooms)
         VALUES
            (:host_id, :location_id, :property_name, :description, :property_type,
             :price_per_night, :max_guests, :bedrooms, :bathrooms)'
    );

    $stmt->execute([
        ':host_id'         => $hostId,
        ':location_id'     => $fields['location_id'],
        ':property_name'   => $fields['property_name'],
        ':description'     => $fields['description'],
        ':property_type'   => $fields['property_type'],
        ':price_per_night' => $fields['price_per_night'],
        ':max_guests'      => $fields['max_guests'],
        ':bedrooms'        => $fields['bedrooms'],
        ':bathrooms'       => $fields['bathrooms'],
    ]);

    $propertyId = (int) $pdo->lastInsertId();
    $property   = fetchPropertyRowById($pdo, $propertyId);

    sendSuccess($property, 'Property created successfully. It is pending review.', 201);
} catch (PDOException $e) {
    sendError('Failed to create property due to a database error.', 500);
}
