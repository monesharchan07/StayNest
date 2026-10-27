import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBookingsByUser, cancelBooking } from '../services/bookingService';
import { processPayment } from '../services/paymentService';
import { createReview } from '../services/reviewService';
import {
  formatCurrency,
  formatDate,
  getBookingStatusClass,
  getPaymentStatusClass,
} from '../utils/helpers';
import './MyBookingsPage.css';

export default function MyBookingsPage() {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [reviewModalBooking, setReviewModalBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Payment modal state for PENDING bookings
  const [payModalBooking, setPayModalBooking] = useState(null);
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState('UPI');
  const [payingPending, setPayingPending] = useState(false);
  const [pendingPayError, setPendingPayError] = useState('');

  // Cancellation state
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await getBookingsByUser();
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [currentUser]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? Dates will be freed up in the database.')) {
      return;
    }
    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId);
      await fetchBookings();
    } catch (err) {
      alert(err.message || 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleOpenPayModal = (booking) => {
    setPayModalBooking(booking);
    setPendingPaymentMethod('UPI');
    setPendingPayError('');
  };

  const handleProcessPendingPayment = async (e) => {
    e.preventDefault();
    if (!payModalBooking) return;
    setPayingPending(true);
    setPendingPayError('');
    try {
      await processPayment(payModalBooking.id, pendingPaymentMethod);
      setPayModalBooking(null);
      await fetchBookings();
    } catch (err) {
      setPendingPayError(err.message || 'Payment failed. Please try again.');
    } finally {
      setPayingPending(false);
    }
  };

  const handleOpenReview = (booking) => {
    setReviewModalBooking(booking);
    setReviewRating(5);
    setReviewComment('');
    setReviewError('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    setReviewError('');
    try {
      await createReview({
        bookingId: reviewModalBooking.id,
        rating: reviewRating,
        comment: reviewComment,
      });

      // Update local state to mark reviewed
      setBookings((prev) =>
        prev.map((b) => (b.id === reviewModalBooking.id ? { ...b, hasReview: true } : b))
      );
      setReviewModalBooking(null);
      setReviewComment('');
      alert('Thank you! Your review has been submitted.');
      await fetchBookings();
    } catch (err) {
      setReviewError(err.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="staynest-bookings-page page-content">
      <div className="container">
        <div className="bookings-header">
          <div>
            <h1 className="page-heading">My Reservations</h1>
            <p className="page-sub">
              Logged in as <strong>{currentUser?.name}</strong> • Booking history from database
            </p>
          </div>
          <Link to="/search" className="btn btn-primary">
            Explore More Stays
          </Link>
        </div>

        {loading ? (
          <div className="bookings-loading-list">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="booking-skeleton-card"></div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-bookings-box card">
            <div className="empty-calendar-icon">📅</div>
            <h2>No trips booked... yet!</h2>
            <p>Time to dust off your bags and start planning your next great getaway.</p>
            <Link to="/search" className="btn btn-primary">
              Start Searching
            </Link>
          </div>
        ) : (
          <div className="bookings-list-grid">
            {bookings.map((b) => (
              <div key={b.id} className="booking-card-item card">
                <div className="booking-item-media">
                  <img src={b.propertyImage} alt={b.propertyName} className="b-img" />
                  <span className={`booking-status-tag badge ${getBookingStatusClass(b.status)}`}>
                    {b.status}
                  </span>
                </div>

                <div className="booking-item-body">
                  <div className="b-header-line">
                    <span className="b-city">📍 {b.city}</span>
                    <span className="b-id">Booking #{b.id}</span>
                  </div>

                  <h3 className="b-property-name">
                    <Link to={`/property/${b.propertyId}`}>{b.propertyName}</Link>
                  </h3>

                  <div className="b-dates-row">
                    <div className="date-block">
                      <span className="date-label">Check-in</span>
                      <span className="date-val">{formatDate(b.checkIn)}</span>
                    </div>
                    <span className="arrow-sep">→</span>
                    <div className="date-block">
                      <span className="date-label">Check-out</span>
                      <span className="date-val">{formatDate(b.checkOut)}</span>
                    </div>
                    <span className="nights-pill">
                      {b.numberOfNights} {b.numberOfNights === 1 ? 'night' : 'nights'}
                    </span>
                  </div>

                  <div className="b-details-grid">
                    <div>
                      <span className="detail-label">Guests:</span>
                      <span className="detail-value">{b.guests}</span>
                    </div>
                    <div>
                      <span className="detail-label">Total Amount:</span>
                      <span className="detail-value font-bold">{formatCurrency(b.totalAmount)}</span>
                    </div>
                    {b.payment && (
                      <div className="payment-chip">
                        <span>Payment: <strong>{b.payment.paymentMethod}</strong></span>
                        <span className={`badge ${getPaymentStatusClass(b.payment.status)}`}>
                          {b.payment.status}
                        </span>
                        {b.payment.transactionId && (
                          <span className="text-mono" style={{ fontSize: '0.75rem', opacity: 0.85, marginLeft: '6px' }}>
                            ({b.payment.transactionId})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="b-actions-row">
                    <Link to={`/property/${b.propertyId}`} className="btn btn-sm btn-secondary">
                      View Property
                    </Link>

                    {/* Pay button for PENDING booking */}
                    {b.status === 'PENDING' && (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary pay-now-btn"
                        onClick={() => handleOpenPayModal(b)}
                      >
                        💳 Pay Now
                      </button>
                    )}

                    {/* Cancel button if CONFIRMED or PENDING */}
                    {(b.status === 'CONFIRMED' || b.status === 'PENDING') && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline cancel-btn"
                        disabled={cancellingId === b.id}
                        onClick={() => handleCancel(b.id)}
                      >
                        {cancellingId === b.id ? 'Cancelling...' : 'Cancel Booking'}
                      </button>
                    )}

                    {/* Review Button: only allowed for COMPLETED bookings */}
                    {b.status === 'COMPLETED' && !b.hasReview && (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary review-btn"
                        onClick={() => handleOpenReview(b)}
                      >
                        ★ Write a Review
                      </button>
                    )}

                    {b.status === 'COMPLETED' && b.hasReview && (
                      <span className="badge badge-success">✓ Reviewed</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Submission Modal (Business Rule #13: 1 review per completed booking, rating 1-5) */}
      {reviewModalBooking && (
        <div className="modal-overlay">
          <div className="modal-card card">
            <h3 className="modal-title">Rate & Review Stay</h3>
            <p className="modal-subtitle">
              How was your experience at <strong>{reviewModalBooking.propertyName}</strong>?
            </p>

            {reviewError && <div className="auth-error-banner">{reviewError}</div>}

            <form onSubmit={handleSubmitReview}>
              <div className="form-group">
                <label className="form-label">Rating (1 to 5 Stars)</label>
                <div className="star-picker-row">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-pick-btn ${star <= reviewRating ? 'active' : ''}`}
                      onClick={() => setReviewRating(star)}
                    >
                      ★
                    </button>
                  ))}
                  <span className="rating-label-num">{reviewRating} / 5</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Your Review Comment (Optional)</label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Share details of your experience: comfort, cleanliness, host hospitality... (optional)"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
              </div>

              <div className="modal-footer-buttons">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setReviewModalBooking(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingReview}
                >
                  {submittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Payment Modal for PENDING bookings */}
      {payModalBooking && (
        <div className="modal-overlay">
          <div className="modal-card card">
            <h3 className="modal-title">Complete Payment</h3>
            <p className="modal-subtitle">
              Booking <strong>#{payModalBooking.id}</strong> at <strong>{payModalBooking.propertyName}</strong>
            </p>

            {pendingPayError && <div className="auth-error-banner">{pendingPayError}</div>}

            <form onSubmit={handleProcessPendingPayment}>
              <div className="form-group">
                <label className="form-label">Total Amount Due</label>
                <div className="font-bold text-teal" style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
                  {formatCurrency(payModalBooking.totalAmount)}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Select Payment Method</label>
                <select
                  className="form-input"
                  value={pendingPaymentMethod}
                  onChange={(e) => setPendingPaymentMethod(e.target.value)}
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="NET_BANKING">Net Banking (HDFC / SBI / ICICI)</option>
                </select>
              </div>

              <div className="modal-footer-buttons">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPayModalBooking(null)}
                  disabled={payingPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={payingPending}
                >
                  {payingPending ? 'Processing...' : `Pay ${formatCurrency(payModalBooking.totalAmount)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
