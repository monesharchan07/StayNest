<?php
/**
 * StayNest - Delete Property Endpoint
 *
 * DELETE /api/properties/delete.php?id=1
 *
 * HOST only. Only the owning host may delete a property. Deletion is blocked
 * when bookings reference the property; the database's RESTRICT constraint is
 * the final safeguard. Child rows defined with ON DELETE CASCADE (images,
 * amenities, availability) are removed by the database within the transaction.
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/validation.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/properties.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    sendError('Method Not Allowed. Use DELETE.', 405);
}

$user       = requireRole('HOST');
$data       = sanitizeInput(getJsonInput());
$propertyId = resolvePropertyId($_GET, $data);
$hostId     = (int) $user['user_id'];

try {
    $pdo = Database::getConnection();

    requirePropertyOwnership($pdo, $propertyId, $hostId);

    // Explicit pre-check for a clear 409 before hitting the FK constraint.
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM bookings WHERE property_id = :property_id');
    $stmt->execute([':property_id' => $propertyId]);
    $bookingCount = (int) $stmt->fetchColumn();

    if ($bookingCount > 0) {
        sendError(
            'Cannot delete property because it has existing bookings. Related bookings must be cancelled or removed first.',
            409,
            ['booking_count' => $bookingCount]
        );
    }

    $pdo->beginTransaction();

    try {
        $stmt = $pdo->prepare(
            'DELETE FROM properties WHERE property_id = :property_id AND host_id = :host_id'
        );
        $stmt->execute([
            ':property_id' => $propertyId,
            ':host_id'     => $hostId,
        ]);

        if ($stmt->rowCount() === 0) {
            $pdo->rollBack();
            sendError('Property not found.', 404);
        }

        $pdo->commit();
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }

    sendSuccess(['property_id' => $propertyId], 'Property deleted successfully.');
} catch (PDOException $e) {
    if ((string) $e->getCode() === '23000') {
        sendError('Cannot delete property because it is referenced by existing records.', 409);
    }

    sendError('Failed to delete property due to a database error.', 500);
}
