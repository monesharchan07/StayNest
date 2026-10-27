/**
 * Host Service - API integration layer
 * Connects to StayNest PHP backend host endpoints:
 *
 *   GET  /api/host/dashboard.php
 *   GET  /api/host/properties.php
 *   GET  /api/host/bookings.php
 *   POST /api/host/update-booking-status.php
 *
 * Security and role rules:
 *  - Authenticated HOST only.
 *  - All endpoints derive the host_id strictly from the authenticated PHP session.
 *  - Always use credentials: "include".
 *  - Allowed booking status transition: PENDING -> CONFIRMED -> COMPLETED.
 */

import { normalizeProperty } from './propertyService';

const API_BASE = 'http://localhost:8099';

/**
 * Helper to make authenticated host requests
 */
async function hostFetch(url, options = {}) {
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
    const error = new Error(json.message || 'Request failed.');
    error.status = res.status;
    error.payload = json;
    throw error;
  }

  return json;
}

/**
 * Fetch dashboard aggregate statistics for the authenticated host.
 *
 * GET /api/host/dashboard.php
 *
 * @returns {Promise<object>} normalized host dashboard metrics
 */
export async function getHostDashboard() {
  const json = await hostFetch('/api/host/dashboard.php', { method: 'GET' });
  const d = json.data || {};

  return {
    properties: {
      total: Number(d.properties?.total ?? 0),
      active: Number(d.properties?.active ?? 0),
      pending: Number(d.properties?.pending ?? 0),
    },
    bookings: {
      total: Number(d.bookings?.total ?? 0),
      pending: Number(d.bookings?.pending ?? 0),
      confirmed: Number(d.bookings?.confirmed ?? 0),
      completed: Number(d.bookings?.completed ?? 0),
      cancelled: Number(d.bookings?.cancelled ?? 0),
    },
    totalRevenue: Number(d.total_revenue ?? 0),
    reviews: {
      total: Number(d.reviews?.total ?? 0),
      averageRating:
        d.reviews?.average_rating !== null && d.reviews?.average_rating !== undefined
          ? Number(d.reviews.average_rating)
          : 0,
    },
  };
}

/**
 * Fetch properties owned by the authenticated host.
 *
 * GET /api/host/properties.php
 *
 * @param {number|string} [propertyId]
 * @returns {Promise<Array>} array of normalized properties
 */
export async function getHostProperties(propertyId = null) {
  const query = propertyId ? `?property_id=${encodeURIComponent(propertyId)}` : '';
  const json = await hostFetch(`/api/host/properties.php${query}`, { method: 'GET' });
  const rawList = json.data?.properties || [];

  return rawList.map((p) => {
    const norm = normalizeProperty(p);
    return {
      ...norm,
      bookingCount: Number(p.booking_count ?? 0),
      reviewCount: Number(p.review_summary?.review_count ?? norm.reviewCount ?? 0),
      averageRating:
        p.review_summary?.average_rating !== null && p.review_summary?.average_rating !== undefined
          ? Number(p.review_summary.average_rating)
          : norm.averageRating,
    };
  });
}

/**
 * Fetch bookings received for properties owned by the authenticated host.
 *
 * GET /api/host/bookings.php?status={status}
 *
 * @param {string} [statusFilter] - Optional: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
 * @returns {Promise<Array>} array of normalized host bookings
 */
export async function getHostBookings(statusFilter = '') {
  const query = statusFilter ? `?status=${encodeURIComponent(statusFilter.toUpperCase())}` : '';
  const json = await hostFetch(`/api/host/bookings.php${query}`, { method: 'GET' });
  const rawList = json.data?.bookings || [];

  return rawList.map((b) => ({
    id: Number(b.booking_id),
    bookingId: Number(b.booking_id),
    propertyId: Number(b.property_id),
    propertyName: b.property_title || '',
    guestName: b.guest_name || 'Guest',
    checkIn: b.check_in,
    checkOut: b.check_out,
    guests: Number(b.guests),
    numberOfNights: Number(b.nights),
    totalAmount: Number(b.total_amount),
    status: b.booking_status,
    createdAt: b.created_at,
  }));
}

/**
 * Update a booking status for a property owned by the authenticated host.
 *
 * POST /api/host/update-booking-status.php
 * Supported workflow: PENDING -> CONFIRMED -> COMPLETED
 *
 * @param {number|string} bookingId
 * @param {string} targetStatus - 'CONFIRMED' | 'COMPLETED'
 * @returns {Promise<object>}
 */
export async function updateBookingStatus(bookingId, targetStatus) {
  if (!bookingId) {
    throw new Error('Booking ID is required.');
  }

  const status = String(targetStatus).toUpperCase();
  const allowed = ['CONFIRMED', 'COMPLETED'];
  if (!allowed.includes(status)) {
    throw new Error(`Invalid host status update. Allowed targets: ${allowed.join(', ')}.`);
  }

  const json = await hostFetch('/api/host/update-booking-status.php', {
    method: 'POST',
    body: JSON.stringify({
      booking_id: Number(bookingId),
      status,
    }),
  });

  return json.data;
}
