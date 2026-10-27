<?php
/**
 * StayNest - Delete Availability Endpoint
 *
 * DELETE /api/availability/delete.php?id=1
 *
 * HOST only. Only the host who owns the property may delete its availability
 * records. Delete is included because the availability module is otherwise
 * append-only; update is intentionally omitted because delete + add covers it.
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/validation.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/properties.php';
require_once __DIR__ . '/../../includes/availability.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    sendError('Method Not Allowed. Use DELETE.', 405);
}

$user           = requireRole('HOST');
$data           = sanitizeInput(getJsonInput());
$availabilityId = resolveAvailabilityId($_GET, $data);
$hostId         = (int) $user['user_id'];

try {
    $pdo = Database::getConnection();

    $record     = requireAvailabilityOwnership($pdo, $availabilityId, $hostId);
    $propertyId = (int) $record['property_id'];

    $pdo->beginTransaction();

    try {
        if (!lockPropertyForAvailability($pdo, $propertyId)) {
            $pdo->rollBack();
            sendError('Property not found.', 404);
        }

        $stmt = $pdo->prepare(
            'DELETE FROM availability WHERE availability_id = :availability_id'
        );
        $stmt->execute([':availability_id' => $availabilityId]);

        if ($stmt->rowCount() === 0) {
            $pdo->rollBack();
            sendError('Availability record not found.', 404);
        }

        $pdo->commit();
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }

    sendSuccess(['availability_id' => $availabilityId], 'Availability record deleted successfully.');
} catch (PDOException $e) {
    sendError('Failed to delete availability due to a database error.', 500);
}
