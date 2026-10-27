import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createBooking } from '../services/bookingService';
import { processPayment } from '../services/paymentService';
import {
  formatCurrency,
  calculateNights,
  calculateBookingTotal,
  getToday,
  getTomorrow,
} from '../utils/helpers';
import './BookingCard.css';

/**
 * BookingCard - Two-step booking + payment flow
 *
 * Step 1 — Reserve:
 *   User picks dates, guests, payment method → submits form →
 *   POST /api/bookings/create.php → booking created with status PENDING →
 *   "Pending Booking" modal shown with "Pay Now" button.
 *
 * Step 2 — Pay:
 *   User clicks "Pay Now" →
 *   POST /api/payments/process.php → payment recorded, booking → CONFIRMED →
 *   "Payment Confirmed" modal shown with real backend payment_id and status.
 */
export default function BookingCard({ property }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // ── Form state ──────────────────────────────────────────────────────────
  const [checkIn, setCheckIn] = useState(getToday());
  const [checkOut, setCheckOut] = useState(getTomorrow());
  const [guests, setGuests] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  // ── Step 1: Booking creation ─────────────────────────────────────────────
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [pendingBooking, setPendingBooking] = useState(null); // PENDING booking from API

  // ── Step 2: Payment processing ───────────────────────────────────────────
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentResult, setPaymentResult] = useState(null); // confirmed payment from API

  const nights = calculateNights(checkIn, checkOut);
  const { total, baseTotal, serviceFee } = calculateBookingTotal(property.pricePerNight, nights);

  // ── Step 1 handler ───────────────────────────────────────────────────────
  const handleReserve = async (e) => {
    e.preventDefault();
    setBookingError('');

    if (nights <= 0) {
      setBookingError('Check-out date must be later than check-in date.');
      return;
    }
    if (guests > property.maxGuests) {
      setBookingError(`Maximum guests allowed for this stay is ${property.maxGuests}.`);
      return;
    }

    setBookingLoading(true);
    try {
      const booking = await createBooking({
        user: currentUser,
        property,
        checkIn,
        checkOut,
        guests,
      });
      // booking.status === 'PENDING'; store chosen payment method alongside it
      setPendingBooking({ ...booking, chosenPaymentMethod: paymentMethod });
    } catch (err) {
      setBookingError(err.message || 'Failed to create booking. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  // ── Step 2 handler ───────────────────────────────────────────────────────
  const handlePayNow = async () => {
    if (!pendingBooking) return;
    setPaymentError('');
    setPaymentLoading(true);
    try {
      const result = await processPayment(
        pendingBooking.bookingId,
        pendingBooking.chosenPaymentMethod
      );
      // result contains real backend data: paymentId, paymentStatus, bookingStatus
      setPaymentResult(result);
      setPendingBooking(null); // close the pending modal
    } catch (err) {
      setPaymentError(err.message || 'Payment failed. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  // ── Cancel pending booking modal ─────────────────────────────────────────
  const handleClosePendingModal = () => {
    setPendingBooking(null);
    setPaymentError('');
  };

  // ── Close confirmed modal + go to bookings ───────────────────────────────
  const handleViewBookings = () => {
    setPaymentResult(null);
    navigate('/my-bookings');
  };

  return (
    <div className="staynest-booking-card card">
      {/* Price Header */}
      <div className="booking-card-header">
        <div className="booking-price-display">
          <span className="price-val">{formatCurrency(property.pricePerNight)}</span>
          <span className="price-unit"> / night</span>
        </div>
        <div className="booking-rating-display">
          <span className="star-icon">★</span>
          <span className="rating-score">
            {property.averageRating > 0 ? property.averageRating.toFixed(2) : 'New'}
          </span>
          {property.reviewCount > 0 && (
            <span className="review-count">({property.reviewCount})</span>
          )}
        </div>
      </div>

      {/* Date & Guest Form */}
      <form onSubmit={handleReserve} className="booking-form-box">
        <div className="booking-inputs-grid">
          <div className="booking-input-cell">
            <label className="cell-label">Check-in</label>
            <input
              type="date"
              className="cell-input"
              value={checkIn}
              min={getToday()}
              onChange={(e) => {
                setCheckIn(e.target.value);
                if (checkOut && e.target.value >= checkOut) {
                  setCheckOut('');
                }
              }}
              required
            />
          </div>

          <div className="booking-input-cell">
            <label className="cell-label">Check-out</label>
            <input
              type="date"
              className="cell-input"
              value={checkOut}
              min={checkIn || getTomorrow()}
              onChange={(e) => setCheckOut(e.target.value)}
              required
            />
          </div>

          <div className="booking-input-cell full-width">
            <label className="cell-label">Guests (Max: {property.maxGuests})</label>
            <select
              className="cell-select"
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
            >
              {Array.from({ length: property.maxGuests }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'Guest' : 'Guests'}
                </option>
              ))}
            </select>
          </div>

          <div className="booking-input-cell full-width">
            <label className="cell-label">Payment Method</label>
            <select
              className="cell-select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
              <option value="CARD">Debit / Credit Card</option>
              <option value="NET_BANKING">Net Banking (HDFC / SBI / ICICI)</option>
            </select>
          </div>
        </div>

        {bookingError && <div className="booking-error-banner">{bookingError}</div>}

        {/* Submit Reserve Button */}
        <button
          type="submit"
          className="btn btn-primary btn-full btn-lg reserve-btn"
          disabled={bookingLoading || nights <= 0}
        >
          {bookingLoading ? 'Creating Reservation...' : 'Reserve Now'}
        </button>

        <p className="no-charge-notice">
          ✨ Booking is recorded in the database. You will confirm and pay in the next step.
        </p>

        {/* Price Breakdown */}
        {nights > 0 && (
          <div className="price-breakdown-section">
            <div className="breakdown-row">
              <span>{formatCurrency(property.pricePerNight)} × {nights} {nights === 1 ? 'night' : 'nights'}</span>
              <span>{formatCurrency(baseTotal)}</span>
            </div>
            <div className="breakdown-row">
              <span>StayNest service fee (10%)</span>
              <span>{formatCurrency(serviceFee)}</span>
            </div>
            <div className="breakdown-divider"></div>
            <div className="breakdown-row total-row">
              <span>Total before taxes</span>
              <span className="total-val">{formatCurrency(total)}</span>
            </div>
          </div>
        )}
      </form>

      {/* ── Step 1 Modal: Booking PENDING — awaiting payment ── */}
      {pendingBooking && (
        <div className="booking-success-modal-overlay">
          <div className="booking-success-card">
            <div className="success-icon-badge" style={{ background: 'var(--warning, #f59e0b)' }}>⏳</div>
            <h3 className="success-title">Booking Created!</h3>
            <p className="success-subtitle">
              Your reservation is <strong>PENDING</strong>. Complete payment below to confirm it.
            </p>

            <div className="success-summary-box">
              <div className="summary-item">
                <span className="s-label">Booking ID:</span>
                <span className="s-val">#{pendingBooking.bookingId}</span>
              </div>
              <div className="summary-item">
                <span className="s-label">Property:</span>
                <span className="s-val">{pendingBooking.propertyName}</span>
              </div>
              <div className="summary-item">
                <span className="s-label">Dates:</span>
                <span className="s-val">
                  {pendingBooking.checkIn} → {pendingBooking.checkOut} ({pendingBooking.numberOfNights} nights)
                </span>
              </div>
              <div className="summary-item">
                <span className="s-label">Guests:</span>
                <span className="s-val">{pendingBooking.guests}</span>
              </div>
              <div className="summary-item">
                <span className="s-label">Amount Due:</span>
                <span className="s-val font-bold text-teal">{formatCurrency(pendingBooking.totalAmount)}</span>
              </div>
              <div className="summary-item">
                <span className="s-label">Payment via:</span>
                <span className="s-val">{pendingBooking.chosenPaymentMethod}</span>
              </div>
            </div>

            {paymentError && (
              <div className="booking-error-banner" style={{ marginTop: '12px' }}>
                {paymentError}
              </div>
            )}

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClosePendingModal}
                disabled={paymentLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePayNow}
                disabled={paymentLoading}
              >
                {paymentLoading ? 'Processing Payment...' : `Pay ${formatCurrency(pendingBooking.totalAmount)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2 Modal: Payment SUCCESS — booking CONFIRMED ── */}
      {paymentResult && (
        <div className="booking-success-modal-overlay">
          <div className="booking-success-card">
            <div className="success-icon-badge">✓</div>
            <h3 className="success-title">Payment Confirmed!</h3>
            <p className="success-subtitle">
              Your booking is now <strong>{paymentResult.bookingStatus}</strong>.
              Payment recorded successfully.
            </p>

            <div className="success-summary-box">
              <div className="summary-item">
                <span className="s-label">Payment ID:</span>
                <span className="s-val text-mono">#{paymentResult.paymentId}</span>
              </div>
              <div className="summary-item">
                <span className="s-label">Booking ID:</span>
                <span className="s-val">#{paymentResult.bookingId}</span>
              </div>
              <div className="summary-item">
                <span className="s-label">Amount Paid:</span>
                <span className="s-val font-bold text-teal">{formatCurrency(paymentResult.amount)}</span>
              </div>
              <div className="summary-item">
                <span className="s-label">Payment Method:</span>
                <span className="s-val">{paymentResult.paymentMethod}</span>
              </div>
              <div className="summary-item">
                <span className="s-label">Payment Status:</span>
                <span className="s-val">{paymentResult.paymentStatus}</span>
              </div>
              <div className="summary-item">
                <span className="s-label">Booking Status:</span>
                <span className="s-val">{paymentResult.bookingStatus}</span>
              </div>
              {paymentResult.transactionId && (
                <div className="summary-item">
                  <span className="s-label">Txn Reference:</span>
                  <span className="s-val text-mono">{paymentResult.transactionId}</span>
                </div>
              )}
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPaymentResult(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleViewBookings}
              >
                View My Bookings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
