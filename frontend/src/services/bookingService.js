/**
 * Booking Service - Real API integration layer
 * Connects to StayNest PHP backend booking endpoints:
 * - POST /api/bookings/create.php
 * - GET  /api/bookings/my-bookings.php
 * - GET  /api/bookings/details.php?id={booking_id}
 * - POST /api/bookings/cancel.php?id={booking_id}
 *
 * All responses are normalized to the frontend field-name conventions
 * used throughout the existing UI (camelCase).
 */

import { getHostBookings } from './hostService';
import { getAdminBookings } from './adminService';

const API_BASE = 'http://localhost:8099';

/**
 * Normalize a raw booking object from the API into the shape
 * expected by the existing UI components.
 *
 * API fields       →  UI fields
 * booking_id       →  id
 * booking_status   →  status
 * check_in         →  checkIn
 * check_out        →  checkOut
 * nights           →  numberOfNights
 * total_amount     →  totalAmount
 * property_name    →  propertyName
 * property_id      →  propertyId
 * location.city    →  city
 */
function normalizeBooking(raw) {
  return {
    id: raw.booking_id,
    bookingId: raw.booking_id,
    userId: raw.user_id,
    propertyId: raw.property_id ?? raw.property?.property_id,
    propertyName: raw.property_name ?? raw.property?.property_name,
    propertyImage:
      raw.property_image ||
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400',
    city: raw.location?.city || '',
    checkIn: raw.check_in,
    checkOut: raw.check_out,
    guests: raw.guests,
    numberOfNights: raw.nights,
    pricePerNight: raw.price_per_night ?? raw.property?.price_per_night,
    totalAmount: raw.total_amount,
    status: raw.booking_status,
    payment: raw.payment
      ? {
          id: raw.payment.payment_id,
          paymentMethod: raw.payment.payment_method,
          status: raw.payment.payment_status,
          transactionId: raw.payment.transaction_id || null,
        }
      : null,
    hasReview: raw.has_review || false,
    property: raw.property || null,
    location: raw.location || null,
  };
}

/**
 * Get all bookings for the currently authenticated guest.
 * Calls GET /api/bookings/my-bookings.php (session-based auth).
 */
export async function getBookingsByUser() {
  const res = await fetch(`${API_BASE}/api/bookings/my-bookings.php`, {
    method: 'GET',
    credentials: 'include',
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to load bookings.');
  }

  const bookings = json.data?.bookings || [];
  return bookings.map(normalizeBooking);
}

/**
 * Get booking details by ID.
 * Calls GET /api/bookings/details.php?id={bookingId}
 */
export async function getBookingById(bookingId) {
  const res = await fetch(`${API_BASE}/api/bookings/details.php?id=${bookingId}`, {
    method: 'GET',
    credentials: 'include',
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to load booking details.');
  }

  return normalizeBooking(json.data.booking);
}

/**
 * Create a new booking.
 * Calls POST /api/bookings/create.php
 *
 * Returns a PENDING booking — payment must be processed separately via
 * paymentService.processPayment() which will confirm it to CONFIRMED.
 * The backend calculates total_amount server-side; never trust client amount.
 */
export async function createBooking({
  user,
  property,
  checkIn,
  checkOut,
  guests,
}) {
  const res = await fetch(`${API_BASE}/api/bookings/create.php`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      property_id: property.id,
      check_in: checkIn,
      check_out: checkOut,
      guests: Number(guests),
    }),
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to create booking.');
  }

  const raw = json.data;

  // Normalize create response; enrich with property data available on the client.
  // status will be "PENDING" — payment has not been processed yet.
  return {
    id: raw.booking_id,
    bookingId: raw.booking_id,
    propertyId: raw.property_id ?? property.id,
    propertyName: property.name,
    propertyImage:
      property.images?.[0]?.url ||
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400',
    city: property.location?.city || '',
    checkIn: raw.check_in,
    checkOut: raw.check_out,
    guests: raw.guests,
    numberOfNights: raw.nights,
    pricePerNight: property.pricePerNight,
    totalAmount: raw.total_amount,
    status: raw.booking_status, // "PENDING"
    payment: null,              // populated after processPayment() succeeds
    hasReview: false,
  };
}

/**
 * Cancel a booking.
 * Calls POST /api/bookings/cancel.php?id={bookingId}
 */
export async function cancelBooking(bookingId) {
  const res = await fetch(`${API_BASE}/api/bookings/cancel.php?id=${bookingId}`, {
    method: 'POST',
    credentials: 'include',
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to cancel booking.');
  }

  return json.data;
}

/**
 * Get all bookings for properties owned by a host.
 * Calls GET /api/host/bookings.php
 */
export async function getBookingsByHost(statusFilter = '') {
  return getHostBookings(statusFilter);
}

/**
 * Get all bookings (Admin view).
 * Calls GET /api/admin/bookings.php
 */
export async function getAllBookingsAdmin(statusFilter = '') {
  return getAdminBookings(statusFilter);
}
