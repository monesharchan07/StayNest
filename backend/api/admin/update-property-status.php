<?php
/**
 * StayNest - Admin Property Approval Endpoint
 * PUT /api/admin/update-property-status.php
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/validation.php';
require_once __DIR__ . '/../../includes/properties.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method Not Allowed. Use PUT.', 405);
}

requireRole('ADMIN');
$data = sanitizeInput(getJsonInput());
$missing = validateRequired($data, ['property_id', 'status']);
if (!empty($missing)) {
    sendError('Missing required fields.', 422, ['fields' => $missing]);
}

$propertyId = parseInteger($data['property_id'], 1, PHP_INT_MAX);
if ($propertyId === null) {
    sendError('Invalid property_id.', 422);
}
if (!is_string($data['status'])) {
    sendError('Invalid property status.', 422);
}

$targetStatus = strtoupper(trim($data['status']));
$knownStatuses = ['PENDING', 'ACTIVE', 'INACTIVE'];
if (!in_array($targetStatus, $knownStatuses, true)) {
    sendError('Invalid property status.', 422, ['allowed_statuses' => $knownStatuses]);
}

$pdo = Database::getConnection();

try {
    $pdo->beginTransaction();

    $propertyStmt = $pdo->prepare(
        'SELECT property_id, status
         FROM properties
         WHERE property_id = :property_id
         LIMIT 1
         FOR UPDATE'
    );
    $propertyStmt->execute([':property_id' => $propertyId]);
    $property = $propertyStmt->fetch();

    if (!$property) {
        $pdo->rollBack();
        sendError('Property not found.', 404);
    }

    // The established workflow exposes only approval of a pending listing.
    if ($property['status'] !== 'PENDING' || $targetStatus !== 'ACTIVE') {
        $pdo->rollBack();
        sendError("Invalid property status transition from '{$property['status']}' to '{$targetStatus}'.", 409);
    }

    $updateStmt = $pdo->prepare(
        'UPDATE properties
         SET status = :target_status
         WHERE property_id = :property_id
           AND status = :current_status'
    );
    $updateStmt->execute([
        ':target_status'  => 'ACTIVE',
        ':property_id'    => $propertyId,
        ':current_status' => 'PENDING',
    ]);

    if ($updateStmt->rowCount() !== 1) {
        throw new RuntimeException('Property status changed during update.');
    }

    $pdo->commit();

    sendSuccess([
        'property_id'     => $propertyId,
        'previous_status' => 'PENDING',
        'status'          => 'ACTIVE',
    ], 'Property approved successfully.');
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendError('Property status update failed. No changes were made.', 500);
}
