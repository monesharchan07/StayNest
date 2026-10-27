/**
 * Admin Service - Real API integration layer
 * Connects to StayNest PHP backend admin endpoints:
 *
 *   GET  /api/admin/dashboard.php
 *   GET  /api/admin/users.php?role={role}
 *   GET  /api/admin/properties.php?status={status}
 *   POST /api/admin/update-property-status.php
 *   GET  /api/admin/bookings.php?status={status}
 *   GET  /api/admin/payments.php?payment_status={status}
 *   GET  /api/admin/reviews.php
 *
 * Security and role rules:
 *  - Authenticated ADMIN only.
 *  - Authoritative check is performed server-side by the PHP session.
 *  - All requests use credentials: "include".
 *  - Only safe fields are returned and normalized; no passwords, hashes, or payment secrets.
 */

const API_BASE = 'http://localhost:8099';

/**
 * Helper to make authenticated admin requests
 */
async function adminFetch(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    throw new Error('Invalid response from server.');
  }

  if (!res.ok || !json.success) {
    const error = new Error(json.message || 'Admin request failed.');
    error.status = res.status;
    error.payload = json;
    throw error;
  }

  return json;
}

/**
 * Fetch platform overview statistics
 *
 * GET /api/admin/dashboard.php
 *
 * @returns {Promise<object>} normalized admin dashboard metrics
 */
export async function getAdminDashboard() {
  const json = await adminFetch('/api/admin/dashboard.php', { method: 'GET' });
  const d = json.data || {};

  return {
    users: {
      total: Number(d.users?.total ?? 0),
      guests: Number(d.users?.guests ?? 0),
      hosts: Number(d.users?.hosts ?? 0),
      admins: Number(d.users?.admins ?? 0),
    },
    properties: {
      total: Number(d.properties?.total ?? 0),
      pending: Number(d.properties?.pending ?? 0),
      active: Number(d.properties?.active ?? 0),
    },
    bookings: {
      total: Number(d.bookings?.total ?? 0),
      pending: Number(d.bookings?.pending ?? 0),
      confirmed: Number(d.bookings?.confirmed ?? 0),
      completed: Number(d.bookings?.completed ?? 0),
      cancelled: Number(d.bookings?.cancelled ?? 0),
    },
    payments: {
      successfulCount: Number(d.payments?.successful_count ?? 0),
      successfulRevenue: Number(d.payments?.successful_revenue ?? 0),
    },
    reviews: {
      total: Number(d.reviews?.total ?? 0),
      averageRating:
        d.reviews?.average_rating !== null && d.reviews?.average_rating !== undefined
          ? Number(d.reviews.average_rating)
          : null,
    },
  };
}

/**
 * Fetch all registered users
 *
 * GET /api/admin/users.php?role={role}
 *
 * @param {string} [roleFilter] - Optional: 'GUEST' | 'HOST' | 'ADMIN'
 * @returns {Promise<Array>} array of normalized safe user objects
 */
export async function getAdminUsers(roleFilter = '') {
  const query = roleFilter ? `?role=${encodeURIComponent(roleFilter.toUpperCase())}` : '';
  const json = await adminFetch(`/api/admin/users.php${query}`, { method: 'GET' });
  const rawList = json.data?.users || [];

  return rawList.map((u) => ({
    id: Number(u.user_id),
    userId: Number(u.user_id),
    name: u.name || '',
    email: u.email || '',
    role: u.role || 'GUEST',
    createdAt: u.created_at || '',
  }));
}

/**
 * Fetch all properties across the platform
 *
 * GET /api/admin/properties.php?status={status}
 *
 * @param {string} [statusFilter] - Optional: 'PENDING' | 'ACTIVE' | 'INACTIVE'
 * @returns {Promise<Array>} array of normalized properties
 */
export async function getAdminProperties(statusFilter = '') {
  const query = statusFilter ? `?status=${encodeURIComponent(statusFilter.toUpperCase())}` : '';
  const json = await adminFetch(`/api/admin/properties.php${query}`, { method: 'GET' });
  const rawList = json.data?.properties || [];

  return rawList.map((p) => ({
    id: Number(p.property_id),
    propertyId: Number(p.property_id),
    name: p.title || '',
    title: p.title || '',
    propertyType: p.property_type || 'Apartment',
    pricePerNight: Number(p.price_per_night ?? 0),
    maxGuests: Number(p.max_guests ?? 1),
    location: p.location || null,
    hostName: p.host_name || 'Host',
    status: p.status || 'PENDING',
    createdAt: p.created_at || '',
    bookingCount: Number(p.booking_count ?? 0),
    reviewCount: Number(p.review_summary?.review_count ?? 0),
    averageRating:
      p.review_summary?.average_rating !== null && p.review_summary?.average_rating !== undefined
        ? Number(p.review_summary.average_rating)
        : null,
  }));
}

/**
 * Approve a pending property listing
 *
 * POST /api/admin/update-property-status.php
 * Note: Valid transition enforced by backend is PENDING -> ACTIVE.
 *
 * @param {number|string} propertyId
 * @param {string} [targetStatus='ACTIVE']
 * @returns {Promise<object>}
 */
export async function updatePropertyStatus(propertyId, targetStatus = 'ACTIVE') {
  if (!propertyId) {
    throw new Error('Property ID is required.');
  }

  const json = await adminFetch('/api/admin/update-property-status.php', {
    method: 'POST',
    body: JSON.stringify({
      property_id: Number(propertyId),
      status: String(targetStatus).toUpperCase(),
    }),
  });

  return json.data;
}

/**
 * Fetch all bookings across the platform
 *
 * GET /api/admin/bookings.php?status={status}
 *
 * @param {string} [statusFilter] - Optional: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
 * @returns {Promise<Array>} array of normalized bookings
 */
export async function getAdminBookings(statusFilter = '') {
  const query = statusFilter ? `?status=${encodeURIComponent(statusFilter.toUpperCase())}` : '';
  const json = await adminFetch(`/api/admin/bookings.php${query}`, { method: 'GET' });
  const rawList = json.data?.bookings || [];

  return rawList.map((b) => ({
    id: Number(b.booking_id),
    bookingId: Number(b.booking_id),
    propertyId: Number(b.property_id),
    propertyName: b.property_title || '',
    guestName: b.guest_name || 'Guest',
    hostName: b.host_name || 'Host',
    checkIn: b.check_in,
    checkOut: b.check_out,
    guests: Number(b.guests ?? 1),
    numberOfNights: Number(b.nights ?? 1),
    totalAmount: Number(b.total_amount ?? 0),
    status: b.booking_status,
    createdAt: b.created_at,
  }));
}

/**
 * Fetch all payments across the platform
 *
 * GET /api/admin/payments.php?payment_status={status}
 *
 * @param {string} [paymentStatusFilter] - Optional: 'PENDING' | 'SUCCESS' | 'FAILED'
 * @returns {Promise<Array>} array of normalized payments
 */
export async function getAdminPayments(paymentStatusFilter = '') {
  const query = paymentStatusFilter
    ? `?payment_status=${encodeURIComponent(paymentStatusFilter.toUpperCase())}`
    : '';
  const json = await adminFetch(`/api/admin/payments.php${query}`, { method: 'GET' });
  const rawList = json.data?.payments || [];

  return rawList.map((pay) => ({
    id: Number(pay.payment_id),
    paymentId: Number(pay.payment_id),
    bookingId: Number(pay.booking_id),
    bookingStatus: pay.booking_status,
    amount: Number(pay.amount ?? 0),
    paymentMethod: pay.payment_method || 'CARD',
    status: pay.payment_status,
    paymentStatus: pay.payment_status,
    paymentDate: pay.payment_date,
  }));
}

/**
 * Fetch all reviews across the platform
 *
 * GET /api/admin/reviews.php
 *
 * @returns {Promise<object>} { summary: { totalReviews, averageRating }, reviews: Array }
 */
export async function getAdminReviews() {
  const json = await adminFetch('/api/admin/reviews.php', { method: 'GET' });
  const rawSummary = json.data?.summary || {};
  const rawReviews = json.data?.reviews || [];

  return {
    summary: {
      totalReviews: Number(rawSummary.total_reviews ?? 0),
      averageRating:
        rawSummary.average_rating !== null && rawSummary.average_rating !== undefined
          ? Number(rawSummary.average_rating)
          : null,
    },
    reviews: rawReviews.map((r) => ({
      id: Number(r.review_id),
      reviewId: Number(r.review_id),
      propertyId: Number(r.property_id),
      propertyName: r.property_title || '',
      reviewerName: r.reviewer_name || 'Guest',
      rating: Number(r.rating ?? 5),
      comment: r.comment || '',
      createdAt: r.created_at || '',
    })),
  };
}
