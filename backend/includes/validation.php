<?php
/**
 * StayNest - Request Validation and Sanitization Helpers
 */

/**
 * Parse and return the JSON request body as an associative array
 *
 * @return array
 */
function getJsonInput(): array {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return [];
    }

    // Strip UTF-8 BOM (EF BB BF) if present.
    // Some HTTP clients and Windows tools prepend a BOM to UTF-8 bodies,
    // which causes json_decode() to fail with "Syntax error" on valid JSON.
    if (str_starts_with($raw, "\xEF\xBB\xBF")) {
        $raw = substr($raw, 3);
    }

    $decoded = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        $message = 'Invalid JSON payload: ' . json_last_error_msg()
            . '. The request body must be valid UTF-8 JSON with quoted keys and string values.';

        if (function_exists('sendError')) {
            sendError($message, 400);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $message]);
            exit;
        }
    }

    return is_array($decoded) ? $decoded : [];
}

/**
 * Recursively sanitize input data by trimming strings and removing dangerous null bytes
 *
 * @param mixed $data
 * @return mixed
 */
function sanitizeInput($data) {
    if (is_array($data)) {
        foreach ($data as $key => $value) {
            $data[$key] = sanitizeInput($value);
        }
        return $data;
    }

    if (is_string($data)) {
        return trim(str_replace("\0", '', $data));
    }

    return $data;
}

/**
 * Validate that all required fields are present and not empty in the data array
 *
 * @param array $data Input data array
 * @param array $requiredFields List of required keys
 * @return array List of missing or empty field names
 */
function validateRequired(array $data, array $requiredFields): array {
    $missing = [];
    foreach ($requiredFields as $field) {
        if (!array_key_exists($field, $data) || $data[$field] === null || (is_string($data[$field]) && trim($data[$field]) === '')) {
            $missing[] = $field;
        }
    }
    return $missing;
}

/**
 * Validate an email address
 */
function validateEmail(string $email): bool {
    return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
}

/**
 * Validate a date string against a specific format
 */
function validateDate(string $date, string $format = 'Y-m-d'): bool {
    $d = DateTime::createFromFormat($format, $date);
    return $d && $d->format($format) === $date;
}

/**
 * Validate check-in and check-out dates
 *
 * @return string|null Error message or null if valid
 */
function validateDateRange(string $checkIn, string $checkOut): ?string {
    if (!validateDate($checkIn) || !validateDate($checkOut)) {
        return 'Dates must be in valid YYYY-MM-DD format.';
    }

    $inDate  = new DateTime($checkIn);
    $outDate = new DateTime($checkOut);
    $today   = new DateTime('today');

    if ($inDate < $today) {
        return 'Check-in date cannot be in the past.';
    }

    if ($outDate <= $inDate) {
        return 'Check-out date must be strictly after the check-in date.';
    }

    return null;
}

/**
 * Validate numeric value and optional range
 */
function validateNumeric($value, ?float $min = null, ?float $max = null): bool {
    if (!is_numeric($value)) {
        return false;
    }
    $num = (float) $value;
    if ($min !== null && $num < $min) {
        return false;
    }
    if ($max !== null && $num > $max) {
        return false;
    }
    return true;
}

/**
 * Validate that a value exists within an allowed list
 */
function validateEnum($value, array $allowedValues): bool {
    return in_array($value, $allowedValues, true);
}
