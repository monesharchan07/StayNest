<?php
/**
 * StayNest - Availability Helpers
 *
 * Date semantics:
 * - Availability windows use inclusive calendar dates: available_from..available_to.
 * - A booking request uses check_in and check_out where check_out is the
 *   departure date and is exclusive. The stay occupies the nights from
 *   check_in through check_out - 1 day.
 *
 * This is the single source of truth for availability overlap logic. The future
 * Booking API should reuse evaluatePropertyAvailability() rather than
 * reimplementing it. To avoid concurrent double-booking, booking creation
 * should:
 *   1. begin a transaction,
 *   2. call lockPropertyForAvailability(),
 *   3. call evaluatePropertyAvailability(),
 *   4. insert the booking,
 *   5. commit.
 */

const AVAILABILITY_STATUSES = ['AVAILABLE', 'BLOCKED'];

/**
 * Parse a strict YYYY-MM-DD date into an immutable date at midnight.
 *
 * @throws InvalidArgumentException
 */
function availabilityDate(string $value): DateTimeImmutable {
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);

    if ($date === false || $date->format('Y-m-d') !== $value) {
        throw new InvalidArgumentException('Invalid date. Expected YYYY-MM-DD.');
    }

    return $date;
}

/**
 * Public shape for an availability row.
 */
function formatAvailabilityRow(array $row): array {
    return [
        'availability_id' => (int) $row['availability_id'],
        'property_id'     => (int) $row['property_id'],
        'available_from'  => $row['available_from'],
        'available_to'    => $row['available_to'],
        'status'          => $row['status'],
    ];
}

/**
 * Validate and normalize an add-availability payload.
 */
function validateAvailabilityFields(array $data): array {
    $errors     = [];
    $propertyId = null;
    $dates      = [];

    foreach (validateRequired($data, ['property_id', 'available_from', 'available_to']) as $field) {
        $errors[$field] = 'This field is required.';
    }

    if (array_key_exists('property_id', $data) && !isset($errors['property_id'])) {
        $propertyId = parseInteger($data['property_id'], 1, PHP_INT_MAX);
        if ($propertyId === null) {
            $errors['property_id'] = 'Must be a positive integer.';
        }
    }

    foreach (['available_from', 'available_to'] as $field) {
        if (array_key_exists($field, $data) && !isset($errors[$field])) {
            if (!is_string($data[$field]) || !validateDate($data[$field])) {
                $errors[$field] = 'Must be a valid date in YYYY-MM-DD format.';
            } else {
                $dates[$field] = availabilityDate($data[$field]);
            }
        }
    }

    if (isset($dates['available_from'], $dates['available_to']) && $dates['available_to'] <= $dates['available_from']) {
        $errors['available_to'] = 'Must be after available_from.';
    }

    $status = 'AVAILABLE';
    if (array_key_exists('status', $data) && $data['status'] !== null && $data['status'] !== '') {
        if (!is_string($data['status'])) {
            $errors['status'] = 'Must be AVAILABLE or BLOCKED.';
        } else {
            $candidate = strtoupper(trim($data['status']));
            if (!in_array($candidate, AVAILABILITY_STATUSES, true)) {
                $errors['status'] = 'Must be one of: ' . implode(', ', AVAILABILITY_STATUSES) . '.';
            } else {
                $status = $candidate;
            }
        }
    }

    if (!empty($errors)) {
        sendError('Validation failed.', 422, ['fields' => $errors]);
    }

    return [
        'property_id'    => $propertyId,
        'available_from' => $data['available_from'],
        'available_to'   => $data['available_to'],
        'status'         => $status,
    ];
}

/**
 * Validate the public check query parameters.
 *
 * @return array{0:int,1:string,2:string} [property_id, check_in, check_out]
 */
function validateAvailabilityCheckParams(array $query): array {
    $missing = validateRequired($query, ['property_id', 'check_in', 'check_out']);
    if (!empty($missing)) {
        sendError('Missing required query parameters.', 422, ['missing_fields' => $missing]);
    }

    $errors     = [];
    $propertyId = parseInteger($query['property_id'], 1, PHP_INT_MAX);

    if ($propertyId === null) {
        $errors['property_id'] = 'Must be a positive integer.';
    }

    foreach (['check_in', 'check_out'] as $field) {
        if (!is_string($query[$field]) || !validateDate($query[$field])) {
            $errors[$field] = 'Must be a valid date in YYYY-MM-DD format.';
        }
    }

    if (empty($errors['check_in']) && empty($errors['check_out'])) {
        $rangeError = validateDateRange($query['check_in'], $query['check_out']);
        if ($rangeError !== null) {
            $errors['date_range'] = $rangeError;
        }
    }

    if (!empty($errors)) {
        sendError('Validation failed.', 422, ['fields' => $errors]);
    }

    return [$propertyId, $query['check_in'], $query['check_out']];
}

/**
 * Require an existing, publicly bookable (ACTIVE) property.
 *
 * Returns 404 for both missing and non-active properties so the public API does
 * not reveal unpublished listings.
 */
function requireActiveProperty(PDO $pdo, int $propertyId): array {
    $stmt = $pdo->prepare(
        'SELECT property_id, host_id, price_per_night, status
           FROM properties
          WHERE property_id = :property_id
          LIMIT 1'
    );
    $stmt->execute([':property_id' => $propertyId]);
    $property = $stmt->fetch();

    if (!$property || $property['status'] !== PROPERTY_PUBLIC_STATUS) {
        sendError('Property not found.', 404);
    }

    return $property;
}

/**
 * Lock a property row for the duration of the current transaction.
 *
 * Call this inside a transaction before adding availability, deleting
 * availability, or creating a booking. It serializes date changes per property
 * and prevents concurrent overlap checks from both succeeding.
 */
function lockPropertyForAvailability(PDO $pdo, int $propertyId): bool {
    $stmt = $pdo->prepare(
        'SELECT property_id FROM properties WHERE property_id = :property_id FOR UPDATE'
    );
    $stmt->execute([':property_id' => $propertyId]);

    return (bool) $stmt->fetch();
}

/**
 * Find availability records overlapping an inclusive date range.
 *
 * @param string|null $status Restrict to one status (e.g. BLOCKED), or null for all.
 */
function findAvailabilityOverlaps(
    PDO $pdo,
    int $propertyId,
    string $availableFrom,
    string $availableTo,
    ?string $status = null
): array {
    $sql = 'SELECT availability_id, property_id, available_from, available_to, status
              FROM availability
             WHERE property_id = :property_id
               AND available_from <= :available_to
               AND available_to >= :available_from';

    $params = [
        ':property_id'    => $propertyId,
        ':available_to'   => $availableTo,
        ':available_from' => $availableFrom,
    ];

    if ($status !== null) {
        $sql .= ' AND status = :status';
        $params[':status'] = $status;
    }

    $sql .= ' ORDER BY available_from ASC, availability_id ASC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    return $stmt->fetchAll();
}

/**
 * Evaluate whether a property is available for a booking-style date range.
 *
 * Returns available=false when any of these is true:
 * - a non-AVAILABLE (BLOCKED) availability window overlaps the stay,
 * - a PENDING or CONFIRMED booking overlaps the stay,
 * - AVAILABLE windows do not fully cover every night of the stay.
 *
 * The optional $excludeBookingId allows a future booking-update endpoint to
 * ignore the booking being edited.
 *
 * @throws InvalidArgumentException When the date range is invalid.
 */
function evaluatePropertyAvailability(
    PDO $pdo,
    int $propertyId,
    string $checkIn,
    string $checkOut,
    ?int $excludeBookingId = null
): array {
    $stayFrom     = availabilityDate($checkIn);
    $checkOutDate = availabilityDate($checkOut);

    if ($checkOutDate <= $stayFrom) {
        throw new InvalidArgumentException('check_out must be after check_in.');
    }

    $lastNight    = $checkOutDate->modify('-1 day');
    $stayFromStr  = $stayFrom->format('Y-m-d');
    $lastNightStr = $lastNight->format('Y-m-d');

    // 1. Host-defined BLOCKED/unavailable windows overlapping the stay.
    $stmt = $pdo->prepare(
        'SELECT availability_id, property_id, available_from, available_to, status
           FROM availability
          WHERE property_id = :property_id
            AND status <> :available_status
            AND available_from <= :last_night
            AND available_to >= :check_in
          ORDER BY available_from ASC, availability_id ASC'
    );
    $stmt->execute([
        ':property_id'      => $propertyId,
        ':available_status' => 'AVAILABLE',
        ':last_night'       => $lastNightStr,
        ':check_in'         => $stayFromStr,
    ]);
    $blockedPeriods = array_map('formatAvailabilityRow', $stmt->fetchAll());

    // 2. Existing active bookings overlapping the stay (check_out is exclusive).
    $bookingSql = 'SELECT check_in, check_out, booking_status
                     FROM bookings
                    WHERE property_id = :property_id
                      AND booking_status IN (:pending_status, :confirmed_status)
                      AND check_in <= :last_night
                      AND check_out > :check_in';

    $bookingParams = [
        ':property_id'      => $propertyId,
        ':pending_status'   => 'PENDING',
        ':confirmed_status' => 'CONFIRMED',
        ':last_night'       => $lastNightStr,
        ':check_in'         => $stayFromStr,
    ];

    if ($excludeBookingId !== null) {
        $bookingSql .= ' AND booking_id <> :exclude_booking_id';
        $bookingParams[':exclude_booking_id'] = $excludeBookingId;
    }

    $bookingSql .= ' ORDER BY check_in ASC, booking_id ASC';

    $stmt = $pdo->prepare($bookingSql);
    $stmt->execute($bookingParams);
    $bookedPeriods = array_map(static function (array $booking): array {
        return [
            'check_in'       => $booking['check_in'],
            'check_out'      => $booking['check_out'],
            'booking_status' => $booking['booking_status'],
        ];
    }, $stmt->fetchAll());

    // 3. AVAILABLE windows overlapping the stay, merged when contiguous.
    $stmt = $pdo->prepare(
        'SELECT availability_id, property_id, available_from, available_to, status
           FROM availability
          WHERE property_id = :property_id
            AND status = :available_status
            AND available_from <= :last_night
            AND available_to >= :check_in
          ORDER BY available_from ASC, availability_id ASC'
    );
    $stmt->execute([
        ':property_id'      => $propertyId,
        ':available_status' => 'AVAILABLE',
        ':last_night'       => $lastNightStr,
        ':check_in'         => $stayFromStr,
    ]);
    $availableRows = $stmt->fetchAll();

    $merged = [];
    foreach ($availableRows as $row) {
        $from = availabilityDate($row['available_from']);
        $to   = availabilityDate($row['available_to']);

        if (empty($merged)) {
            $merged[] = ['from' => $from, 'to' => $to];
            continue;
        }

        $lastIndex = count($merged) - 1;
        $nextDay   = $merged[$lastIndex]['to']->modify('+1 day');

        if ($from <= $nextDay) {
            if ($to > $merged[$lastIndex]['to']) {
                $merged[$lastIndex]['to'] = $to;
            }
        } else {
            $merged[] = ['from' => $from, 'to' => $to];
        }
    }

    $covered = false;
    foreach ($merged as $interval) {
        if ($interval['from'] <= $stayFrom && $interval['to'] >= $lastNight) {
            $covered = true;
            break;
        }
    }

    $available = $covered && empty($blockedPeriods) && empty($bookedPeriods);

    if (!empty($blockedPeriods)) {
        $reason = 'BLOCKED';
    } elseif (!empty($bookedPeriods)) {
        $reason = 'BOOKED';
    } elseif (!$covered) {
        $reason = 'NO_AVAILABILITY';
    } else {
        $reason = 'AVAILABLE';
    }

    return [
        'available'         => $available,
        'reason'            => $reason,
        'property_id'       => $propertyId,
        'check_in'          => $checkIn,
        'check_out'         => $checkOut,
        'stay_from'         => $stayFromStr,
        'stay_to'           => $lastNightStr,
        'blocked_periods'   => $blockedPeriods,
        'booked_periods'    => $bookedPeriods,
        'available_windows' => array_map('formatAvailabilityRow', $availableRows),
    ];
}

/**
 * Resolve an availability id from the query string or request body.
 */
function resolveAvailabilityId(array $query, array $body): int {
    $value = $query['id'] ?? $body['availability_id'] ?? $body['id'] ?? null;

    if ($value === null || $value === '') {
        sendError('Missing required availability id.', 422);
    }

    $id = parseInteger($value, 1, PHP_INT_MAX);
    if ($id === null) {
        sendError('Invalid availability id.', 422);
    }

    return $id;
}

/**
 * Require that the availability record belongs to a property owned by the host.
 */
function requireAvailabilityOwnership(PDO $pdo, int $availabilityId, int $hostId): array {
    $stmt = $pdo->prepare(
        'SELECT a.availability_id, a.property_id, a.available_from, a.available_to,
                a.status, p.host_id
           FROM availability a
           INNER JOIN properties p ON p.property_id = a.property_id
          WHERE a.availability_id = :availability_id
          LIMIT 1'
    );
    $stmt->execute([':availability_id' => $availabilityId]);
    $record = $stmt->fetch();

    if (!$record) {
        sendError('Availability record not found.', 404);
    }

    if ((int) $record['host_id'] !== $hostId) {
        sendError('Forbidden. You do not own this property.', 403);
    }

    return $record;
}
