<?php
/**
 * StayNest - Public Property Search Endpoint
 *
 * GET /api/properties/search.php
 *
 * Public endpoint. Supports location, property_type, min_price, max_price,
 * guests, limit, and offset query parameters. All values are validated and
 * bound through prepared statements.
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
        'filters'    => $filters,
    ], 'Search completed successfully.');
} catch (PDOException $e) {
    sendError('Search failed due to a database error.', 500);
}
