/**
 * Helper utilities for StayNest
 */

/**
 * Format a number as Indian Rupee currency
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a date as input value (YYYY-MM-DD)
 */
export function toInputDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Calculate number of nights between two dates
 */
export function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end - start;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Calculate booking total: nights × price + service fee
 * Service fee is 10% of the base total
 */
export function calculateBookingTotal(pricePerNight, nights) {
  const baseTotal = pricePerNight * nights;
  const serviceFee = Math.round(baseTotal * 0.10);
  return {
    baseTotal,
    serviceFee,
    total: baseTotal + serviceFee,
    nights,
  };
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function getToday() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get tomorrow's date as YYYY-MM-DD
 */
export function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

/**
 * Generate star display from a rating number
 */
export function getStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return { full, half, empty };
}

/**
 * Truncate text to a maximum length
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}

/**
 * Get booking status badge class
 */
export function getBookingStatusClass(status) {
  const map = {
    PENDING: 'badge-warning',
    CONFIRMED: 'badge-info',
    CANCELLED: 'badge-error',
    COMPLETED: 'badge-success',
  };
  return map[status] || 'badge-neutral';
}

/**
 * Get payment status badge class
 */
export function getPaymentStatusClass(status) {
  const map = {
    SUCCESS: 'badge-success',
    FAILED: 'badge-error',
    PENDING: 'badge-warning',
  };
  return map[status] || 'badge-neutral';
}

/**
 * Get property status badge class
 */
export function getPropertyStatusClass(status) {
  const map = {
    ACTIVE: 'badge-success',
    INACTIVE: 'badge-error',
    PENDING: 'badge-warning',
  };
  return map[status] || 'badge-neutral';
}

/**
 * Simple email validation
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Simple phone validation (Indian 10-digit)
 */
export function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

/**
 * Generate a simple unique ID (for mock purposes only)
 */
export function generateId() {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}
