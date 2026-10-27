<?php
/**
 * StayNest - JSON API Response Helper Functions
 *
 * Handles CORS headers, standardized JSON envelopes, and HTTP status codes.
 */

// Enable CORS and JSON output headers
function setCorsHeaders(): void {
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=UTF-8');
        header('Access-Control-Allow-Origin: http://localhost:3000');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    }

    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

/**
 * Send a standardized JSON response
 *
 * @param bool $success Whether the request succeeded
 * @param string $message Informative message
 * @param mixed $data Payload data (optional)
 * @param int $statusCode HTTP status code (default 200)
 * @param mixed $errors Validation or error details (optional)
 * @return void
 */
function sendResponse(bool $success, string $message, $data = null, int $statusCode = 200, $errors = null): void {
    if (!headers_sent()) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=UTF-8');
    }

    $response = [
        'success'   => $success,
        'message'   => $message,
        'timestamp' => date('c'),
    ];

    if ($data !== null) {
        $response['data'] = $data;
    }

    if ($errors !== null) {
        $response['errors'] = $errors;
    }

    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Send a success response
 */
function sendSuccess($data = null, string $message = 'Success', int $statusCode = 200): void {
    sendResponse(true, $message, $data, $statusCode);
}

/**
 * Send an error response
 */
function sendError(string $message = 'An error occurred', int $statusCode = 400, $errors = null): void {
    sendResponse(false, $message, null, $statusCode, $errors);
}
