<?php
/**
 * StayNest - User Registration Endpoint
 *
 * POST /api/auth/register.php
 *
 * Accepts JSON: { "name", "email", "password", "phone"?, "role"? }
 * - Defaults role to GUEST when omitted.
 * - Blocks public ADMIN registration.
 * - Prevents duplicate emails.
 * - Hashes password with bcrypt via hashPassword() helper.
 * - Never returns password hash in response.
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/validation.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();

// ── Method guard ────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method Not Allowed. Use POST.', 405);
}

// ── Parse & sanitize input ───────────────────────────────────────────────────
$raw  = getJsonInput();
$data = sanitizeInput($raw);

// ── Required fields ──────────────────────────────────────────────────────────
$missing = validateRequired($data, ['name', 'email', 'password']);
if (!empty($missing)) {
    sendError('Missing required fields.', 422, [
        'missing_fields' => $missing,
    ]);
}

$name     = $data['name'];
$email    = $data['email'];
$password = $data['password'];
$phone    = $data['phone'] ?? null;
$role     = isset($data['role']) ? strtoupper(trim($data['role'])) : 'GUEST';

// ── Allowed public registration roles ────────────────────────────────────────
const ALLOWED_ROLES = ['GUEST', 'HOST'];

if ($role === 'ADMIN') {
    sendError('Public registration as ADMIN is not permitted.', 403);
}

if (!validateEnum($role, ALLOWED_ROLES)) {
    sendError('Invalid role. Allowed values: GUEST, HOST.', 422, [
        'allowed_roles' => ALLOWED_ROLES,
    ]);
}

// ── Email validation ──────────────────────────────────────────────────────────
if (!validateEmail($email)) {
    sendError('Invalid email address.', 422);
}

// ── Password strength ─────────────────────────────────────────────────────────
const MIN_PASSWORD_LENGTH = 8;

if (strlen($password) < MIN_PASSWORD_LENGTH) {
    sendError('Password must be at least ' . MIN_PASSWORD_LENGTH . ' characters long.', 422);
}

// ── Database operations ───────────────────────────────────────────────────────
try {
    $pdo = Database::getConnection();

    // Check for duplicate email (case-insensitive)
    $stmtCheck = $pdo->prepare(
        'SELECT user_id FROM users WHERE LOWER(email) = LOWER(:email) LIMIT 1'
    );
    $stmtCheck->execute([':email' => $email]);

    if ($stmtCheck->fetch()) {
        sendError('An account with this email address already exists.', 409);
    }

    // Hash password
    $passwordHash = hashPassword($password);

    // Insert new user
    $stmtInsert = $pdo->prepare(
        'INSERT INTO users (name, email, password, phone, role, created_at)
         VALUES (:name, :email, :password, :phone, :role, NOW())'
    );
    $stmtInsert->execute([
        ':name'     => $name,
        ':email'    => $email,
        ':password' => $passwordHash,
        ':phone'    => $phone,
        ':role'     => $role,
    ]);

    $newUserId = (int) $pdo->lastInsertId();

    sendSuccess(
        [
            'user_id' => $newUserId,
            'name'    => $name,
            'email'   => $email,
            'role'    => $role,
        ],
        'Account created successfully.',
        201
    );

} catch (PDOException $e) {
    sendError('Registration failed due to a database error.', 500, [
        'detail' => $e->getMessage(),
    ]);
} catch (Exception $e) {
    sendError('An unexpected error occurred.', 500);
}
