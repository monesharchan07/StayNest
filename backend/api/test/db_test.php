<?php
/**
 * StayNest - Database Connection Test Endpoint
 *
 * Connects to staynest_db via PDO.
 * Retrieves existing tables and table count.
 * Read-only: Does NOT modify, insert, delete, or alter any database data.
 * Returns structured JSON.
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../config/database.php';

// Set headers for JSON and CORS
setCorsHeaders();

try {
    // Attempt PDO connection
    $pdo = Database::getConnection();

    // Query existing tables using SHOW TABLES (strictly read-only)
    $stmt = $pdo->query('SHOW TABLES');
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $tableCount = count($tables);

    // Return structured confirmation
    sendSuccess([
        'database'    => 'staynest_db',
        'connected'   => true,
        'table_count' => $tableCount,
        'tables'      => $tables,
    ], 'Database connection established successfully');

} catch (PDOException $e) {
    sendError('Database connection failed: ' . $e->getMessage(), 500, [
        'error_code' => $e->getCode(),
        'hint'       => 'Verify DB credentials (host, port, user, pass) in config/database.php or set environment variables.'
    ]);
} catch (Exception $e) {
    sendError('An unexpected server error occurred: ' . $e->getMessage(), 500);
}
