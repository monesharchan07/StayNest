<?php
/**
 * StayNest - Add Availability Endpoint
 *
 * POST /api/availability/add.php
 *
 * HOST only. The property must belong to the authenticated host.
 * Availability windows use inclusive dates.
 *
 * Overlap policy:
 * - AVAILABLE may not overlap any existing availability record.
 * - BLOCKED may not overlap an existing BLOCKED record.
 * - BLOCKED may overlap AVAILABLE so a host can block a subrange; the public
 *   check treats BLOCKED as taking precedence.
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/validation.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/properties.php';
require_once __DIR__ . '/../../includes/availability.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method Not Allowed. Use POST.', 405);
}

$user   = requireRole('HOST');
$data   = sanitizeInput(getJsonInput());
$fields = validateAvailabilityFields($data);
$hostId = (int) $user['user_id'];

try {
    $pdo = Database::getConnection();

    requirePropertyOwnership($pdo, $fields['property_id'], $hostId);

    $pdo->beginTransaction();

    try {
        if (!lockPropertyForAvailability($pdo, $fields['property_id'])) {
            $pdo->rollBack();
            sendError('Property not found.', 404);
        }

        // AVAILABLE conflicts with anything; BLOCKED only conflicts with BLOCKED.
        $overlapStatus = $fields['status'] === 'BLOCKED' ? 'BLOCKED' : null;

        $conflicts = findAvailabilityOverlaps(
            $pdo,
            $fields['property_id'],
            $fields['available_from'],
            $fields['available_to'],
            $overlapStatus
        );

        if (!empty($conflicts)) {
            $pdo->rollBack();
            sendError(
                'Availability record overlaps an existing record for this property.',
                409,
                ['conflicts' => array_map('formatAvailabilityRow', $conflicts)]
            );
        }

        $stmt = $pdo->prepare(
            'INSERT INTO availability (property_id, available_from, available_to, status)
             VALUES (:property_id, :available_from, :available_to, :status)'
        );
        $stmt->execute([
            ':property_id'    => $fields['property_id'],
            ':available_from' => $fields['available_from'],
            ':available_to'   => $fields['available_to'],
            ':status'         => $fields['status'],
        ]);

        $availabilityId = (int) $pdo->lastInsertId();

        $stmt = $pdo->prepare(
            'SELECT availability_id, property_id, available_from, available_to, status
               FROM availability
              WHERE availability_id = :availability_id
              LIMIT 1'
        );
        $stmt->execute([':availability_id' => $availabilityId]);
        $record = $stmt->fetch();

        if (!$record) {
            $pdo->rollBack();
            sendError('Failed to retrieve the created availability record.', 500);
        }

        $pdo->commit();
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }

    sendSuccess(formatAvailabilityRow($record), 'Availability record created successfully.', 201);
} catch (PDOException $e) {
    if ((string) $e->getCode() === '23000') {
        sendError('Availability record conflicts with an existing record.', 409);
    }

    sendError('Failed to create availability due to a database error.', 500);
}
