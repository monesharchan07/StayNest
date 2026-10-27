<?php
/**
 * StayNest - Public Availability Check Endpoint
 *
 * GET /api/availability/check.php?property_id=1&check_in=2026-11-10&check_out=2026-11-13
 *
 * Public endpoint. check_out is the departure date and is exclusive; the stay
 * occupies the nights from check_in through check_out - 1 day.
 *
 * A property is available only when:
 * - no BLOCKED availability window overlaps the stay,
 * - no PENDING/CONFIRMED booking overlaps the stay,
 * - AVAILABLE windows fully cover every night of the stay.
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/validation.php';
require_once __DIR__ . '/../../includes/properties.php';
require_once __DIR__ . '/../../includes/availability.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method Not Allowed. Use GET.', 405);
}

[$propertyId, $checkIn, $checkOut] = validateAvailabilityCheckParams($_GET);

try {
    $pdo = Database::getConnection();

    requireActiveProperty($pdo, $propertyId);

    $result = evaluatePropertyAvailability($pdo, $propertyId, $checkIn, $checkOut);

    $message = $result['available']
        ? 'Property is available for the requested dates.'
        : 'Property is not available for the requested dates.';

    sendSuccess($result, $message);
} catch (InvalidArgumentException $e) {
    sendError($e->getMessage(), 422);
} catch (PDOException $e) {
    sendError('Failed to check availability due to a database error.', 500);
}
