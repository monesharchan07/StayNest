/**
 * Review Service - Real API integration layer
 * Connects to StayNest PHP backend review endpoints:
 *
 *   POST /api/reviews/create.php
 *   GET  /api/reviews/property.php?property_id={property_id}
 *
 * Security and business rules:
 *  - Authenticated GUEST only for review creation.
 *  - Guest must own the booking, and booking must be COMPLETED.
 *  - At most 1 review per booking.
 *  - Rating must be an integer between 1 and 5.
 *  - Comment is optional (omitted if empty or whitespace).
 *  - user_id is never sent from frontend (derived from session).
 *  - Always use credentials: "include".
 */

const API_BASE = 'http://localhost:8099';

/**
 * Get public reviews and summary for an active property.
 *
 * GET /api/reviews/property.php?property_id={propertyId}
 *
 * Success response json.data:
 *   property_id  {number}
 *   summary      { review_count: number, average_rating: number|null }
 *   reviews      {Array<{ review_id, rating, comment, created_at, reviewer_name }>}
 *
 * @param {number|string} propertyId
 * @returns {Promise<Array>} array of normalized reviews with attached summary
 */
export async function getReviewsByProperty(propertyId) {
  const res = await fetch(`${API_BASE}/api/reviews/property.php?property_id=${encodeURIComponent(propertyId)}`, {
    method: 'GET',
    credentials: 'include',
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    if (res.status === 404) {
      const emptyList = [];
      emptyList.summary = { reviewCount: 0, averageRating: 0 };
      emptyList.reviewCount = 0;
      emptyList.averageRating = 0;
      return emptyList;
    }
    throw new Error(json.message || 'Failed to load reviews.');
  }

  const rawReviews = json.data?.reviews || [];
  const normalizedReviews = rawReviews.map((r) => ({
    id: r.review_id,
    reviewId: r.review_id,
    rating: Number(r.rating),
    comment: r.comment || '',
    createdAt: r.created_at,
    userName: r.reviewer_name || 'Guest',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
  }));

  const summary = {
    reviewCount: Number(json.data?.summary?.review_count ?? normalizedReviews.length),
    averageRating: json.data?.summary?.average_rating !== null && json.data?.summary?.average_rating !== undefined
      ? Number(json.data.summary.average_rating)
      : 0,
  };

  normalizedReviews.summary = summary;
  normalizedReviews.reviewCount = summary.reviewCount;
  normalizedReviews.averageRating = summary.averageRating;

  return normalizedReviews;
}

/**
 * Submit a review for an eligible COMPLETED booking.
 *
 * POST /api/reviews/create.php
 *
 * Request body (backend strictly accepts booking_id, rating, and optional comment):
 *   booking_id {number}
 *   rating     {number}  (1-5)
 *   comment    {string}  (optional)
 *
 * Security rules:
 *   - NEVER send user_id (derived server-side from session)
 *   - NEVER send property_id (derived server-side from booking)
 *   - Credentials MUST be "include"
 *
 * @param {object} param
 * @param {number|string} param.bookingId
 * @param {number} param.rating
 * @param {string} [param.comment]
 * @returns {Promise<object>} normalized review result
 */
export async function createReview({ bookingId, rating, comment }) {
  if (!bookingId) {
    throw new Error('Booking ID is required to submit a review.');
  }

  const parsedRating = Number(rating);
  if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
    throw new Error('Rating must be an integer between 1 and 5.');
  }

  const body = {
    booking_id: Number(bookingId),
    rating: parsedRating,
  };

  // Only include comment if supplied and non-empty (backend rejects empty string "")
  if (typeof comment === 'string' && comment.trim().length > 0) {
    body.comment = comment.trim();
  }

  const res = await fetch(`${API_BASE}/api/reviews/create.php`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to submit review.');
  }

  const raw = json.data;
  return {
    id: raw.review_id,
    reviewId: raw.review_id,
    bookingId: raw.booking_id,
    propertyId: raw.property_id,
    rating: raw.rating,
    comment: raw.comment,
    createdAt: raw.created_at,
  };
}
