<?php
/**
 * StayNest - Public Property List Endpoint
 *
 * GET /api/properties/list.php
 *
 * Public endpoint. Returns ACTIVE properties with host and location summaries.
 * Optional filters: location, property_type, min_price, max_price, guests.
 * Optional pagination: limit (1-100), offset.
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/validation.php';
require_once __DIR__ . '/../../includes/properties.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method Not Allowed. Use GET.', 405);
}

$filters          = parsePropertyFilters($_GET);
[$limit, $offset] = parsePagination($_GET, 20);

try {
    $pdo        = Database::getConnection();
    $total      = countPublicProperties($pdo, $filters);
    $properties = fetchPublicProperties($pdo, $filters, $limit, $offset);

    sendSuccess([
        'properties' => $properties,
        'count'      => count($properties),
        'total'      => $total,
        'limit'      => $limit,
        'offset'     => $offset,
    ], 'Properties retrieved successfully.');
} catch (PDOException $e) {
    sendError('Failed to retrieve properties due to a database error.', 500);
}
