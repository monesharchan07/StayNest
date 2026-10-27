<?php
/**
 * StayNest - Admin Users Endpoint
 * GET /api/admin/users.php?role=GUEST
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method Not Allowed. Use GET.', 405);
}

requireRole('ADMIN');

$role = null;
$allowedRoles = ['GUEST', 'HOST', 'ADMIN'];
if (array_key_exists('role', $_GET) && $_GET['role'] !== '') {
    if (!is_string($_GET['role'])) {
        sendError('Invalid role filter.', 422);
    }
    $role = strtoupper(trim($_GET['role']));
    if (!in_array($role, $allowedRoles, true)) {
        sendError('Invalid role filter.', 422, ['allowed_roles' => $allowedRoles]);
    }
}

$pdo = Database::getConnection();
$sql = 'SELECT user_id, name, email, role, created_at FROM users';
$params = [];
if ($role !== null) {
    $sql .= ' WHERE role = :role';
    $params[':role'] = $role;
}
$sql .= ' ORDER BY created_at DESC, user_id DESC';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

$users = array_map(static function (array $user): array {
    return [
        'user_id'    => (int) $user['user_id'],
        'name'       => $user['name'],
        'email'      => $user['email'],
        'role'       => $user['role'],
        'created_at' => $user['created_at'],
    ];
}, $stmt->fetchAll());

sendSuccess(['users' => $users], 'Admin users retrieved successfully.');
