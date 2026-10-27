<?php
/**
 * StayNest - Property Query and Validation Helpers
 *
 * Shared helpers for the public property endpoints and the HOST-only
 * create/update/delete endpoints. All database access uses prepared statements.
 */

const PROPERTY_TYPES         = ['APARTMENT', 'HOUSE', 'VILLA', 'ROOM', 'COTTAGE'];
const PROPERTY_PUBLIC_STATUS = 'ACTIVE';
const PROPERTY_DESCRIPTION_MAX_LENGTH = 5000;

/**
 * Length in characters, with a safe fallback when mbstring is unavailable.
 */
function propertyTextLength(string $value): int {
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

/**
 * Parse an integer from JSON/query input.
 *
 * Accepts ints, whole floats, and digit-only strings. Rejects booleans, arrays,
 * fractional values, and anything outside the given range.
 */
function parseInteger($value, int $min, int $max): ?int {
    if (is_int($value)) {
        $number = $value;
    } elseif (is_float($value) && is_finite($value) && floor($value) === $value) {
        $number = (int) $value;
    } elseif (is_string($value) && preg_match('/^-?\d+$/', $value) === 1) {
        $number = (int) $value;
    } else {
        return null;
    }

    if ($number < $min || $number > $max) {
        return null;
    }

    return $number;
}

/**
 * Parse a positive money value with at most two decimal places.
 */
function parsePropertyPrice($value): ?float {
    if (!is_numeric($value)) {
        return null;
    }

    $price = (float) $value;
    if (!is_finite($price) || $price <= 0 || $price > 99999999.99) {
        return null;
    }

    return round($price, 2);
}

/**
 * Validate and normalize the property payload.
 *
 * @param array $data    Sanitized request body.
 * @param bool  $partial True for updates (only supplied fields are validated).
 * @return array Normalized, whitelisted column => value pairs.
 */
function validatePropertyFields(array $data, bool $partial = false): array {
    $normalized = [];
    $errors     = [];

    if (!$partial) {
        foreach (validateRequired($data, ['property_name', 'location_id', 'property_type', 'price_per_night', 'max_guests']) as $field) {
            $errors[$field] = 'This field is required.';
        }
    }

    if (array_key_exists('property_name', $data) && !isset($errors['property_name'])) {
        if (!is_string($data['property_name'])) {
            $errors['property_name'] = 'Must be a string.';
        } else {
            $name = trim($data['property_name']);
            if ($name === '') {
                $errors['property_name'] = 'Cannot be empty.';
            } elseif (propertyTextLength($name) > 150) {
                $errors['property_name'] = 'Must be 150 characters or fewer.';
            } else {
                $normalized['property_name'] = $name;
            }
        }
    }

    if (array_key_exists('description', $data)) {
        if ($data['description'] === null) {
            $normalized['description'] = null;
        } elseif (!is_string($data['description'])) {
            $errors['description'] = 'Must be a string or null.';
        } elseif (propertyTextLength($data['description']) > PROPERTY_DESCRIPTION_MAX_LENGTH) {
            $errors['description'] = 'Must be ' . PROPERTY_DESCRIPTION_MAX_LENGTH . ' characters or fewer.';
        } else {
            $normalized['description'] = $data['description'];
        }
    }

    if (array_key_exists('location_id', $data) && !isset($errors['location_id'])) {
        $locationId = parseInteger($data['location_id'], 1, PHP_INT_MAX);
        if ($locationId === null) {
            $errors['location_id'] = 'Must be a positive integer.';
        } else {
            $normalized['location_id'] = $locationId;
        }
    }

    if (array_key_exists('property_type', $data) && !isset($errors['property_type'])) {
        if (!is_string($data['property_type'])) {
            $errors['property_type'] = 'Must be a string.';
        } else {
            $type = strtoupper(trim($data['property_type']));
            if (!in_array($type, PROPERTY_TYPES, true)) {
                $errors['property_type'] = 'Must be one of: ' . implode(', ', PROPERTY_TYPES) . '.';
            } else {
                $normalized['property_type'] = $type;
            }
        }
    }

    if (array_key_exists('price_per_night', $data) && !isset($errors['price_per_night'])) {
        $price = parsePropertyPrice($data['price_per_night']);
        if ($price === null) {
            $errors['price_per_night'] = 'Must be a number greater than 0 and at most 99999999.99.';
        } else {
            $normalized['price_per_night'] = $price;
        }
    }

    foreach (['max_guests' => 100, 'bedrooms' => 50, 'bathrooms' => 50] as $field => $max) {
        if (array_key_exists($field, $data) && !isset($errors[$field])) {
            $parsed = parseInteger($data[$field], 1, $max);
            if ($parsed === null) {
                $errors[$field] = 'Must be an integer between 1 and ' . $max . '.';
            } else {
                $normalized[$field] = $parsed;
            }
        }
    }

    if (!$partial) {
        if (!array_key_exists('bedrooms', $normalized)) {
            $normalized['bedrooms'] = 1;
        }
        if (!array_key_exists('bathrooms', $normalized)) {
            $normalized['bathrooms'] = 1;
        }
        if (!array_key_exists('description', $normalized)) {
            $normalized['description'] = null;
        }
    }

    if (!empty($errors)) {
        sendError('Validation failed.', 422, ['fields' => $errors]);
    }

    if ($partial && empty($normalized)) {
        sendError('No updatable fields provided.', 422);
    }

    return $normalized;
}

/**
 * Validate public search/filter query parameters.
 */
function parsePropertyFilters(array $query): array {
    $filters = [
        'location'      => null,
        'property_type' => null,
        'min_price'     => null,
        'max_price'     => null,
        'guests'        => null,
    ];

    if (array_key_exists('location', $query) && $query['location'] !== '') {
        if (!is_string($query['location'])) {
            sendError('Invalid location filter.', 422);
        }

        $location = trim($query['location']);
        if ($location !== '') {
            if (propertyTextLength($location) > 100) {
                sendError('Invalid location filter. Must be 100 characters or fewer.', 422);
            }
            $filters['location'] = $location;
        }
    }

    if (array_key_exists('property_type', $query) && $query['property_type'] !== '') {
        if (!is_string($query['property_type'])) {
            sendError('Invalid property_type filter.', 422);
        }

        $type = strtoupper(trim($query['property_type']));
        if (!in_array($type, PROPERTY_TYPES, true)) {
            sendError('Invalid property_type. Allowed values: ' . implode(', ', PROPERTY_TYPES) . '.', 422);
        }
        $filters['property_type'] = $type;
    }

    foreach (['min_price', 'max_price'] as $key) {
        if (array_key_exists($key, $query) && $query[$key] !== '') {
            if (!is_scalar($query[$key]) || !is_numeric($query[$key]) || (float) $query[$key] < 0) {
                sendError('Invalid ' . $key . '. Must be a non-negative number.', 422);
            }
            $filters[$key] = (float) $query[$key];
        }
    }

    if ($filters['min_price'] !== null && $filters['max_price'] !== null && $filters['min_price'] > $filters['max_price']) {
        sendError('Invalid price range. min_price cannot be greater than max_price.', 422);
    }

    if (array_key_exists('guests', $query) && $query['guests'] !== '') {
        $guests = parseInteger($query['guests'], 1, 1000);
        if ($guests === null) {
            sendError('Invalid guests. Must be a positive integer.', 422);
        }
        $filters['guests'] = $guests;
    }

    return $filters;
}

/**
 * Validate limit/offset query parameters.
 *
 * @return array{0:int,1:int} [limit, offset]
 */
function parsePagination(array $query, int $defaultLimit = 20): array {
    $limit  = $defaultLimit;
    $offset = 0;

    if (array_key_exists('limit', $query) && $query['limit'] !== '') {
        $parsed = parseInteger($query['limit'], 1, 100);
        if ($parsed === null) {
            sendError('Invalid limit. Must be an integer between 1 and 100.', 422);
        }
        $limit = $parsed;
    }

    if (array_key_exists('offset', $query) && $query['offset'] !== '') {
        $parsed = parseInteger($query['offset'], 0, 1000000);
        if ($parsed === null) {
            sendError('Invalid offset. Must be a non-negative integer.', 422);
        }
        $offset = $parsed;
    }

    return [$limit, $offset];
}

/**
 * Resolve a property id from the query string or request body.
 */
function resolvePropertyId(array $query, array $body): int {
    $value = $query['id'] ?? $body['property_id'] ?? $body['id'] ?? null;

    if ($value === null || $value === '') {
        sendError('Missing required property id.', 422);
    }

    $id = parseInteger($value, 1, PHP_INT_MAX);
    if ($id === null) {
        sendError('Invalid property id.', 422);
    }

    return $id;
}

/**
 * Verify that a location exists before a property references it.
 */
function assertLocationExists(PDO $pdo, int $locationId): void {
    $stmt = $pdo->prepare('SELECT location_id FROM locations WHERE location_id = :location_id LIMIT 1');
    $stmt->execute([':location_id' => $locationId]);

    if (!$stmt->fetch()) {
        sendError('Validation failed.', 422, [
            'fields' => ['location_id' => 'Referenced location does not exist.'],
        ]);
    }
}

/**
 * Ensure the authenticated host owns the property.
 *
 * Sends 404 when the property does not exist and 403 when it belongs to
 * another host. Returns the property row on success.
 */
function requirePropertyOwnership(PDO $pdo, int $propertyId, int $hostId): array {
    $stmt = $pdo->prepare('SELECT property_id, host_id, status FROM properties WHERE property_id = :property_id LIMIT 1');
    $stmt->execute([':property_id' => $propertyId]);
    $property = $stmt->fetch();

    if (!$property) {
        sendError('Property not found.', 404);
    }

    if ((int) $property['host_id'] !== $hostId) {
        sendError('Forbidden. You do not own this property.', 403);
    }

    return $property;
}

/**
 * Base SELECT used by list, search, details, and post-write responses.
 */
function propertySelectSql(string $whereSql = '', string $orderSql = 'ORDER BY p.created_at DESC, p.property_id DESC'): string {
    return "SELECT
                p.property_id, p.host_id, p.location_id, p.property_name, p.description,
                p.property_type, p.price_per_night, p.max_guests, p.bedrooms, p.bathrooms,
                p.status, p.created_at,
                l.city, l.state, l.country, l.address, l.latitude, l.longitude,
                u.name AS host_name,
                (SELECT pi.image_url
                   FROM property_images pi
                  WHERE pi.property_id = p.property_id
                  ORDER BY pi.is_primary DESC, pi.image_id ASC
                  LIMIT 1) AS primary_image
            FROM properties p
            INNER JOIN locations l ON l.location_id = p.location_id
            INNER JOIN users u ON u.user_id = p.host_id
            {$whereSql}
            {$orderSql}";
}

/**
 * Build the public WHERE clause and bound parameters for list/search.
 *
 * @return array{0:string,1:array<string,mixed>}
 */
function buildPropertyFilterSql(array $filters): array {
    $where  = ['p.status = :status'];
    $params = [':status' => PROPERTY_PUBLIC_STATUS];

    if (($filters['location'] ?? null) !== null) {
        $where[] = "LOCATE(:location, CONCAT_WS(' ', l.city, l.state, l.country, l.address)) > 0";
        $params[':location'] = $filters['location'];
    }

    if (($filters['property_type'] ?? null) !== null) {
        $where[] = 'p.property_type = :property_type';
        $params[':property_type'] = $filters['property_type'];
    }

    if (($filters['min_price'] ?? null) !== null) {
        $where[] = 'p.price_per_night >= :min_price';
        $params[':min_price'] = $filters['min_price'];
    }

    if (($filters['max_price'] ?? null) !== null) {
        $where[] = 'p.price_per_night <= :max_price';
        $params[':max_price'] = $filters['max_price'];
    }

    if (($filters['guests'] ?? null) !== null) {
        $where[] = 'p.max_guests >= :guests';
        $params[':guests'] = $filters['guests'];
    }

    return ['WHERE ' . implode(' AND ', $where), $params];
}

/**
 * Bind named parameters with their correct PDO types.
 */
function bindPropertyParams(PDOStatement $stmt, array $params): void {
    foreach ($params as $key => $value) {
        if (is_int($value)) {
            $stmt->bindValue($key, $value, PDO::PARAM_INT);
        } elseif ($value === null) {
            $stmt->bindValue($key, null, PDO::PARAM_NULL);
        } else {
            $stmt->bindValue($key, $value, PDO::PARAM_STR);
        }
    }
}

/**
 * Convert a joined property row into the public API shape.
 */
function formatPropertyRow(array $row): array {
    return [
        'property_id'     => (int) $row['property_id'],
        'property_name'   => $row['property_name'],
        'description'     => $row['description'],
        'property_type'   => $row['property_type'],
        'price_per_night' => (float) $row['price_per_night'],
        'max_guests'      => (int) $row['max_guests'],
        'bedrooms'        => (int) $row['bedrooms'],
        'bathrooms'       => (int) $row['bathrooms'],
        'status'          => $row['status'],
        'created_at'      => $row['created_at'],
        'location'        => [
            'location_id' => (int) $row['location_id'],
            'city'        => $row['city'],
            'state'       => $row['state'],
            'country'     => $row['country'],
            'address'     => $row['address'],
            'latitude'    => $row['latitude'] !== null ? (float) $row['latitude'] : null,
            'longitude'   => $row['longitude'] !== null ? (float) $row['longitude'] : null,
        ],
        'host'            => [
            'host_id' => (int) $row['host_id'],
            'name'    => $row['host_name'],
        ],
        'primary_image'   => $row['primary_image'],
    ];
}

/**
 * Fetch a paginated list of public (ACTIVE) properties.
 */
function fetchPublicProperties(PDO $pdo, array $filters, int $limit, int $offset): array {
    [$whereSql, $params] = buildPropertyFilterSql($filters);

    $sql  = propertySelectSql($whereSql) . ' LIMIT :limit OFFSET :offset';
    $stmt = $pdo->prepare($sql);
    bindPropertyParams($stmt, $params);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    return array_map('formatPropertyRow', $stmt->fetchAll());
}

/**
 * Count public (ACTIVE) properties matching the filters.
 */
function countPublicProperties(PDO $pdo, array $filters): int {
    [$whereSql, $params] = buildPropertyFilterSql($filters);

    $sql = "SELECT COUNT(*) AS total
              FROM properties p
              INNER JOIN locations l ON l.location_id = p.location_id
              {$whereSql}";

    $stmt = $pdo->prepare($sql);
    bindPropertyParams($stmt, $params);
    $stmt->execute();

    return (int) $stmt->fetchColumn();
}

/**
 * Fetch one property row regardless of status (used after create/update).
 */
function fetchPropertyRowById(PDO $pdo, int $propertyId): ?array {
    $stmt = $pdo->prepare(propertySelectSql('WHERE p.property_id = :property_id'));
    $stmt->execute([':property_id' => $propertyId]);
    $row = $stmt->fetch();

    return $row ? formatPropertyRow($row) : null;
}

/**
 * Fetch complete public details for one ACTIVE property.
 */
function fetchPublicPropertyDetails(PDO $pdo, int $propertyId): ?array {
    $stmt = $pdo->prepare(propertySelectSql('WHERE p.property_id = :property_id AND p.status = :status'));
    $stmt->execute([
        ':property_id' => $propertyId,
        ':status'      => PROPERTY_PUBLIC_STATUS,
    ]);
    $row = $stmt->fetch();

    if (!$row) {
        return null;
    }

    $property = formatPropertyRow($row);

    $stmt = $pdo->prepare(
        'SELECT a.amenity_id, a.amenity_name, a.description
           FROM property_amenities pa
           INNER JOIN amenities a ON a.amenity_id = pa.amenity_id
          WHERE pa.property_id = :property_id
          ORDER BY a.amenity_name ASC'
    );
    $stmt->execute([':property_id' => $propertyId]);
    $property['amenities'] = array_map(static function (array $amenity): array {
        return [
            'amenity_id'   => (int) $amenity['amenity_id'],
            'amenity_name' => $amenity['amenity_name'],
            'description'  => $amenity['description'],
        ];
    }, $stmt->fetchAll());

    $stmt = $pdo->prepare(
        'SELECT image_id, image_url, is_primary
           FROM property_images
          WHERE property_id = :property_id
          ORDER BY is_primary DESC, image_id ASC'
    );
    $stmt->execute([':property_id' => $propertyId]);
    $property['images'] = array_map(static function (array $image): array {
        return [
            'image_id'   => (int) $image['image_id'],
            'image_url'  => $image['image_url'],
            'is_primary' => (bool) $image['is_primary'],
        ];
    }, $stmt->fetchAll());

    $stmt = $pdo->prepare(
        'SELECT availability_id, available_from, available_to, status
           FROM availability
          WHERE property_id = :property_id
          ORDER BY available_from ASC, availability_id ASC'
    );
    $stmt->execute([':property_id' => $propertyId]);
    $property['availability'] = array_map(static function (array $window): array {
        return [
            'availability_id' => (int) $window['availability_id'],
            'available_from'  => $window['available_from'],
            'available_to'    => $window['available_to'],
            'status'          => $window['status'],
        ];
    }, $stmt->fetchAll());

    $stmt = $pdo->prepare(
        'SELECT COUNT(*) AS review_count, AVG(rating) AS average_rating
           FROM reviews
          WHERE property_id = :property_id'
    );
    $stmt->execute([':property_id' => $propertyId]);
    $summary = $stmt->fetch();

    $reviewCount   = (int) $summary['review_count'];
    $averageRating = $summary['average_rating'] !== null
        ? round((float) $summary['average_rating'], 2)
        : null;

    $stmt = $pdo->prepare(
        'SELECT r.review_id, r.rating, r.comment, r.created_at, u.name AS reviewer_name
           FROM reviews r
           INNER JOIN users u ON u.user_id = r.user_id
          WHERE r.property_id = :property_id
          ORDER BY r.created_at DESC, r.review_id DESC
          LIMIT 5'
    );
    $stmt->execute([':property_id' => $propertyId]);
    $reviews = array_map(static function (array $review): array {
        return [
            'review_id'     => (int) $review['review_id'],
            'rating'        => (int) $review['rating'],
            'comment'       => $review['comment'],
            'created_at'    => $review['created_at'],
            'reviewer_name' => $review['reviewer_name'],
        ];
    }, $stmt->fetchAll());

    $property['review_summary'] = [
        'review_count'   => $reviewCount,
        'average_rating' => $averageRating,
        'latest_reviews' => $reviews,
    ];

    return $property;
}
