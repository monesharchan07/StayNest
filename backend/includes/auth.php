<?php
/**
 * StayNest - Authentication and Authorization Helpers
 *
 * Provides session handling, role verification, and password hashing primitives.
 */

if (!function_exists('initSession')) {
    /**
     * Initialize secure session if not already active
     */
    function initSession(): void {
        if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
            ini_set('session.cookie_httponly', '1');
            ini_set('session.use_only_cookies', '1');
            session_start();
        }
    }
}

/**
 * Retrieve the current authenticated user (from session or Authorization header)
 *
 * @return array|null User record or null if not logged in
 */
function getCurrentUser(): ?array {
    initSession();
    return $_SESSION['user'] ?? null;
}

/**
 * Check if a user is currently authenticated
 */
function isAuthenticated(): bool {
    return getCurrentUser() !== null;
}

/**
 * Check if the current user has one of the allowed roles
 *
 * @param array|string $allowedRoles e.g. 'admin' or ['admin', 'host']
 */
function hasRole($allowedRoles): bool {
    $user = getCurrentUser();
    if (!$user || !isset($user['role'])) {
        return false;
    }

    $allowedRoles = (array) $allowedRoles;
    return in_array($user['role'], $allowedRoles, true);
}

/**
 * Require authentication; terminates with 401 JSON response if unauthenticated
 */
function requireAuth(): array {
    $user = getCurrentUser();
    if (!$user) {
        if (function_exists('sendError')) {
            sendError('Unauthorized. Please log in to access this resource.', 401);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            exit;
        }
    }
    return $user;
}

/**
 * Require specific role(s); terminates with 403 JSON response if role mismatch
 */
function requireRole($allowedRoles): array {
    $user = requireAuth();
    if (!hasRole($allowedRoles)) {
        if (function_exists('sendError')) {
            sendError('Forbidden. You do not have permission to perform this action.', 403);
        } else {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Forbidden']);
            exit;
        }
    }
    return $user;
}

/**
 * Hash a plain password using bcrypt
 */
function hashPassword(string $password): string {
    return password_hash($password, PASSWORD_BCRYPT);
}

/**
 * Verify a plain password against a stored hash
 */
function verifyPassword(string $password, string $hash): bool {
    return password_verify($password, $hash);
}
