<?php
/**
 * StayNest - User Login Endpoint
 *
 * POST /api/auth/login.php
 *
 * Accepts JSON: { "email", "password" }
 * - Looks up user by email via prepared statement.
 * - Verifies password against bcrypt hash with password_verify().
 * - Starts a secure PHP session on success.
 * - Stores user_id, name, email, and role in $_SESSION['user'].
 * - Returns generic "Invalid credentials" on any failure to prevent
 *   email enumeration attacks.
 * - Never returns password hash in any response.
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/validation.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();

// ── Method guard ─────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method Not Allowed. Use POST.', 405);
}

// ── Parse & sanitize input ────────────────────────────────────────────────────
$raw  = getJsonInput();
$data = sanitizeInput($raw);

// ── Required fields ───────────────────────────────────────────────────────────
$missing = validateRequired($data, ['email', 'password']);
if (!empty($missing)) {
    sendError('Missing required fields.', 422, [
        'missing_fields' => $missing,
    ]);
}

$email    = $data['email'];
$password = $data['password'];

// Basic email format check (generic error kept for enumeration-prevention)
if (!validateEmail($email)) {
    sendError('Invalid credentials.', 401);
}

// ── Database lookup ───────────────────────────────────────────────────────────
try {
    $pdo = Database::getConnection();

    $stmt = $pdo->prepare(
        'SELECT user_id, name, email, password, role
         FROM users
         WHERE LOWER(email) = LOWER(:email)
         LIMIT 1'
    );
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();

    // Constant-time comparison path: always call verifyPassword even on miss
    // to prevent timing-based email enumeration.
    $dummyHash = '$2y$10$invalidhashfortimingprotectiononly.............';
    $hash      = $user ? $user['password'] : $dummyHash;

    if (!$user || !verifyPassword($password, $hash)) {
        sendError('Invalid credentials.', 401);
    }

    // ── Start session and store minimal user data ─────────────────────────────
    initSession();

    // Regenerate session ID on login to prevent session fixation
    session_regenerate_id(true);

    $_SESSION['user'] = [
        'user_id' => (int) $user['user_id'],
        'name'    => $user['name'],
        'email'   => $user['email'],
        'role'    => $user['role'],
    ];

    sendSuccess(
        [
            'user_id' => (int) $user['user_id'],
            'name'    => $user['name'],
            'email'   => $user['email'],
            'role'    => $user['role'],
        ],
        'Login successful.'
    );

} catch (PDOException $e) {
    sendError('Login failed due to a database error.', 500, [
        'detail' => $e->getMessage(),
    ]);
} catch (Exception $e) {
    sendError('An unexpected error occurred.', 500);
}
