<?php
/**
 * StayNest - User Logout Endpoint
 *
 * POST /api/auth/logout.php
 *
 * - Destroys the active session and its data.
 * - Expires the session cookie on the client side.
 * - Handles gracefully when no session is active.
 * - Returns JSON success in all cases.
 */

require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';

setCorsHeaders();

// ── Method guard ─────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method Not Allowed. Use POST.', 405);
}

// ── Destroy session ───────────────────────────────────────────────────────────
if (session_status() === PHP_SESSION_NONE) {
    // No session was active — user is already logged out
    sendSuccess(null, 'You are already logged out.');
}

// Session is active: clear all session data
$_SESSION = [];

// Expire the session cookie in the browser
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        [
            'expires'  => time() - 42000,
            'path'     => $params['path'],
            'domain'   => $params['domain'],
            'secure'   => $params['secure'],
            'httponly' => true,
            'samesite' => 'Lax',
        ]
    );
}

// Destroy the server-side session
session_destroy();

sendSuccess(null, 'Logged out successfully.');
