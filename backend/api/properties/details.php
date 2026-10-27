<?php
/**
 * StayNest - Public Property Details Endpoint
 *
 * GET /api/properties/details.php?id=1
 *
 * Public endpoint. Returns one ACTIVE property with location, host summary,
 * amenities, images, availability windows, and review summary.
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/validation.php';
require_once __DIR__ . '/../../includes/properties.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method Not Allowed. Use GET.', 405);
}

if (!array_key_exists('id', $_GET) || $_GET['id'] === '') {
    sendError('Missing required query parameter: id.', 422);
}

$propertyId = parseInteger($_GET['id'], 1, PHP_INT_MAX);
if ($propertyId === null) {
    sendError('Invalid property id. Must be a positive integer.', 422);
}

try {
    $pdo      = Database::getConnection();
    $property = fetchPublicPropertyDetails($pdo, $propertyId);

    if ($property === null) {
        sendError('Property not found.', 404);
    }

    sendSuccess($property, 'Property details retrieved successfully.');
} catch (PDOException $e) {
    sendError('Failed to retrieve property details due to a database error.', 500);
}
