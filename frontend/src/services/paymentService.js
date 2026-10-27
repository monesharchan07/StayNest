/**
 * Payment Service - Real API integration layer
 * Connects to StayNest PHP backend payment endpoints:
 *
 *   POST /api/payments/process.php
 *   GET  /api/payments/details.php?id={payment_id}
 *
 * Security rules enforced here:
 *  - Never send user_id, host_id, or amount — backend is authoritative.
 *  - Never generate transaction IDs client-side.
 *  - Always use credentials: "include" for session-cookie auth.
 *  - transaction_id is NOT returned by the backend (intentionally excluded).
 */

const API_BASE = 'http://localhost:8099';

/**
 * Process a mock payment for an existing PENDING booking.
 *
 * POST /api/payments/process.php
 *
 * Request body (only these two fields — backend rejects extras):
 *   booking_id    {number}  — real booking_id from the create API
 *   payment_method {string} — one of: CARD | UPI | NET_BANKING
 *
 * Success response (json.data):
 *   payment_id      {number}
 *   booking_id      {number}
 *   amount          {number}  — authoritative amount from DB
 *   payment_method  {string}
 *   payment_status  {string}  — "SUCCESS"
 *   booking_status  {string}  — "CONFIRMED"
 *
 * @param {number} bookingId  — the booking_id returned by createBooking
 * @param {string} paymentMethod — CARD | UPI | NET_BANKING
 * @returns {Promise<object>} normalized payment result
 */
export async function processPayment(bookingId, paymentMethod) {
  const res = await fetch(`${API_BASE}/api/payments/process.php`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      booking_id: Number(bookingId),
      payment_method: paymentMethod,
    }),
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    // Surface the backend's specific error message to the UI
    throw new Error(json.message || 'Payment processing failed.');
  }

  const raw = json.data;

  // Normalize to camelCase for UI consumption
  return {
    paymentId: raw.payment_id,
    bookingId: raw.booking_id,
    amount: raw.amount,
    paymentMethod: raw.payment_method,
    paymentStatus: raw.payment_status,   // "SUCCESS"
    bookingStatus: raw.booking_status,   // "CONFIRMED"
    transactionId: raw.transaction_id || null,
  };
}

/**
 * Get payment details by payment_id or booking_id.
 *
 * GET /api/payments/details.php?id={id}
 *
 * Response (json.data.payment):
 *   payment_id      {number}
 *   amount          {number}
 *   payment_method  {string}
 *   payment_status  {string}
 *   payment_date    {string}
 *   transaction_id  {string|null}
 *   booking         {object}  — { booking_id, property_id, check_in, check_out, booking_status }
 *
 * @param {number} id - payment_id or booking_id
 * @returns {Promise<object>} normalized payment details
 */
export async function getPaymentDetails(id) {
  const res = await fetch(`${API_BASE}/api/payments/details.php?id=${id}`, {
    method: 'GET',
    credentials: 'include',
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to load payment details.');
  }

  const p = json.data.payment;

  return {
    paymentId: p.payment_id,
    amount: p.amount,
    paymentMethod: p.payment_method,
    paymentStatus: p.payment_status,
    paymentDate: p.payment_date,
    transactionId: p.transaction_id || null,
    booking: {
      bookingId: p.booking?.booking_id,
      propertyId: p.booking?.property_id,
      checkIn: p.booking?.check_in,
      checkOut: p.booking?.check_out,
      bookingStatus: p.booking?.booking_status,
    },
  };
}
