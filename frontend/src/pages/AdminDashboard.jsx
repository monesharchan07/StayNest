import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getAdminDashboard,
  getAdminUsers,
  getAdminProperties,
  updatePropertyStatus,
  getAdminBookings,
  getAdminPayments,
  getAdminReviews,
} from '../services/adminService';
import {
  formatCurrency,
  formatDate,
  getPropertyStatusClass,
  getBookingStatusClass,
  getPaymentStatusClass,
} from '../utils/helpers';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [dashboardStats, setDashboardStats] = useState(null);
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);

  // Filters
  const [propertyStatusFilter, setPropertyStatusFilter] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [adminTab, setAdminTab] = useState('overview');

  // Feedback state
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setActionError('');
    try {
      const [stats, p, u, b, pay, rev] = await Promise.all([
        getAdminDashboard(),
        getAdminProperties(propertyStatusFilter),
        getAdminUsers(userRoleFilter),
        getAdminBookings(bookingStatusFilter),
        getAdminPayments(paymentStatusFilter),
        getAdminReviews(),
      ]);
      setDashboardStats(stats);
      setProperties(p);
      setUsers(u);
      setBookings(b);
      setPayments(pay);
      setReviews(rev.reviews || []);
      setReviewSummary(rev.summary || null);
      setUnauthorized(false);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        setUnauthorized(true);
      } else {
        setActionError(err.message || 'Failed to fetch admin data from server.');
      }
    } finally {
      setLoading(false);
    }
  }, [propertyStatusFilter, userRoleFilter, bookingStatusFilter, paymentStatusFilter]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleApproveProperty = async (propId) => {
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');
    try {
      await updatePropertyStatus(propId, 'ACTIVE');
      setActionSuccess(`Property #${propId} approved and activated successfully.`);
      await loadAdminData();
    } catch (err) {
      setActionError(err.message || 'Failed to approve property.');
    } finally {
      setActionLoading(false);
    }
  };

  // Unauthorized state (non-admin or expired session)
  if (unauthorized || (currentUser && currentUser.role !== 'ADMIN')) {
    return (
      <div className="staynest-admin-dashboard page-content">
        <div className="container">
          <div
            className="empty-admin-box card"
            style={{
              textAlign: 'center',
              padding: '48px 24px',
              maxWidth: '600px',
              margin: '40px auto',
              background: 'var(--color-surface, #fff)',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
            }}
          >
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🛡️</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>
              Administrator Access Required
            </h2>
            <p style={{ color: 'var(--color-text-secondary, #666)', marginBottom: '24px' }}>
              {unauthorized
                ? 'Your administrator session is either invalid, expired, or you do not have permission to access system governance.'
                : 'You must be authenticated as an authorized system ADMINISTRATOR to view platform controls.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link to="/login" className="btn btn-primary">
                Log In as Admin
              </Link>
              <Link to="/" className="btn btn-secondary">
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Initial loading state
  if (loading && !dashboardStats) {
    return (
      <div className="staynest-admin-dashboard page-content">
        <div className="container" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)' }}>
            Loading platform governance & database analytics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="staynest-admin-dashboard page-content">
      <div className="container">
        {/* Admin Header */}
        <div className="admin-header">
          <div>
            <div className="admin-pill-tag">
              <span className="badge badge-error">Administrator Access</span>
              <span className="text-secondary">Logged in as {currentUser?.name}</span>
            </div>
            <h1 className="admin-title">Platform Governance & Database Control</h1>
            <p className="admin-subtitle">
              System administration interface for USERS, PROPERTY, BOOKING, PAYMENT, and REVIEW entities.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadAdminData}
            disabled={loading || actionLoading}
          >
            ↻ Refresh DB Data
          </button>
        </div>

        {/* Global Statistics Cards (Real Metrics from Backend) */}
        <div className="admin-stats-grid">
          <div className="stat-card card">
            <div className="stat-icon-wrapper gross-vol">₹</div>
            <div className="stat-content">
              <span className="stat-label">Gross Transaction Volume</span>
              <span className="stat-value">
                {formatCurrency(dashboardStats?.payments?.successfulRevenue ?? 0)}
              </span>
              <span className="stat-sub">
                {dashboardStats?.payments?.successfulCount ?? 0} successful payments • Fee est.{' '}
                {formatCurrency(Math.round((dashboardStats?.payments?.successfulRevenue ?? 0) * 0.1))}
              </span>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon-wrapper users">👥</div>
            <div className="stat-content">
              <span className="stat-label">Registered Users</span>
              <span className="stat-value">{dashboardStats?.users?.total ?? users.length}</span>
              <span className="stat-sub">
                {dashboardStats?.users?.hosts ?? 0} Hosts, {dashboardStats?.users?.guests ?? 0} Guests,{' '}
                {dashboardStats?.users?.admins ?? 0} Admins
              </span>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon-wrapper properties">🏢</div>
            <div className="stat-content">
              <span className="stat-label">Managed Properties</span>
              <span className="stat-value">
                {dashboardStats?.properties?.total ?? properties.length}
              </span>
              <span className="stat-sub">
                {dashboardStats?.properties?.active ?? 0} Active,{' '}
                {dashboardStats?.properties?.pending ?? 0} Pending approval
              </span>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon-wrapper bookings">📑</div>
            <div className="stat-content">
              <span className="stat-label">Bookings & Reviews</span>
              <span className="stat-value">
                {dashboardStats?.bookings?.total ?? bookings.length}
              </span>
              <span className="stat-sub">
                {(dashboardStats?.bookings?.confirmed ?? 0) + (dashboardStats?.bookings?.completed ?? 0)}{' '}
                Confirmed/Completed • ★{' '}
                {dashboardStats?.reviews?.averageRating !== null &&
                dashboardStats?.reviews?.averageRating !== undefined
                  ? Number(dashboardStats.reviews.averageRating).toFixed(2)
                  : '0.00'}{' '}
                ({dashboardStats?.reviews?.total ?? 0} reviews)
              </span>
            </div>
          </div>
        </div>

        {/* Feedback Banners */}
        {actionSuccess && (
          <div
            className="admin-success-banner"
            style={{
              marginBottom: '1.5rem',
              padding: '12px 16px',
              background: '#D1FAE5',
              color: '#065F46',
              borderRadius: '8px',
              border: '1px solid #6EE7B7',
            }}
          >
            ✓ {actionSuccess}
          </div>
        )}

        {actionError && (
          <div
            className="admin-error-banner"
            style={{
              marginBottom: '1.5rem',
              padding: '12px 16px',
              background: '#FEE2E2',
              color: '#991B1B',
              borderRadius: '8px',
              border: '1px solid #F87171',
            }}
          >
            ⚠️ {actionError}
          </div>
        )}

        {/* Tabs */}
        <div className="admin-tabs-bar">
          <button
            type="button"
            className={`admin-tab-btn ${adminTab === 'overview' ? 'active' : ''}`}
            onClick={() => setAdminTab('overview')}
          >
            Properties Governance ({properties.length})
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${adminTab === 'users' ? 'active' : ''}`}
            onClick={() => setAdminTab('users')}
          >
            Users Registry ({users.length})
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${adminTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setAdminTab('bookings')}
          >
            Bookings Registry ({bookings.length})
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${adminTab === 'payments' ? 'active' : ''}`}
            onClick={() => setAdminTab('payments')}
          >
            Payments Registry ({payments.length})
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${adminTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setAdminTab('reviews')}
          >
            Reviews Moderation ({reviews.length})
          </button>
        </div>

        {/* Tab 1: Properties Governance */}
        {adminTab === 'overview' && (
          <div className="admin-tab-panel">
            <div className="admin-table-card card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: 'var(--space-md)',
                }}
              >
                <div className="table-header-desc" style={{ marginBottom: 0 }}>
                  <h3>PROPERTY Entity Table</h3>
                  <p>Admins can review pending properties and approve them to ACTIVE platform status.</p>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    Filter:
                  </span>
                  {['', 'PENDING', 'ACTIVE', 'INACTIVE'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      className={`btn btn-sm ${propertyStatusFilter === st ? 'btn-primary' : 'btn-outline'}`}
                      style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                      onClick={() => setPropertyStatusFilter(st)}
                    >
                      {st === '' ? 'All' : st}
                    </button>
                  ))}
                </div>
              </div>

              {properties.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-secondary)' }}>
                  <p>No properties found matching this criteria.</p>
                </div>
              ) : (
                <div className="table-responsive-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Property Name</th>
                        <th>Host</th>
                        <th>Location</th>
                        <th>Type</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {properties.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <strong>#{p.id}</strong>
                          </td>
                          <td className="prop-name-text" title={p.name}>
                            <Link to={`/property/${p.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                              {p.name}
                            </Link>
                          </td>
                          <td>{p.hostName}</td>
                          <td>
                            {p.location?.city}, {p.location?.state}
                          </td>
                          <td>
                            <span className="badge badge-neutral">{p.propertyType}</span>
                          </td>
                          <td className="font-bold">{formatCurrency(p.pricePerNight)}</td>
                          <td>
                            <span className={`badge ${getPropertyStatusClass(p.status)}`}>
                              {p.status}
                            </span>
                          </td>
                          <td>
                            {p.status === 'PENDING' ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                onClick={() => handleApproveProperty(p.id)}
                                disabled={actionLoading}
                                title="Approve and activate this pending listing"
                              >
                                Approve & Activate
                              </button>
                            ) : p.status === 'ACTIVE' ? (
                              <span className="badge badge-success" style={{ opacity: 0.9 }}>
                                ✓ Active
                              </span>
                            ) : (
                              <span className="badge badge-neutral" style={{ opacity: 0.8 }}>
                                Inactive
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Users Registry */}
        {adminTab === 'users' && (
          <div className="admin-tab-panel">
            <div className="admin-table-card card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: 'var(--space-md)',
                }}
              >
                <div className="table-header-desc" style={{ marginBottom: 0 }}>
                  <h3>USERS Entity Registry</h3>
                  <p>Single USERS table distinguished by Role column (GUEST, HOST, ADMIN).</p>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    Filter Role:
                  </span>
                  {['', 'GUEST', 'HOST', 'ADMIN'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`btn btn-sm ${userRoleFilter === r ? 'btn-primary' : 'btn-outline'}`}
                      style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                      onClick={() => setUserRoleFilter(r)}
                    >
                      {r === '' ? 'All' : r}
                    </button>
                  ))}
                </div>
              </div>

              {users.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-secondary)' }}>
                  <p>No users found matching this filter.</p>
                </div>
              ) : (
                <div className="table-responsive-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>Full Name</th>
                        <th>Email (Unique)</th>
                        <th>Role</th>
                        <th>Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td>
                            <strong>#{u.id}</strong>
                          </td>
                          <td className="user-name-cell">
                            <div className="user-thumb placeholder">
                              {u.name?.[0] ? u.name[0].toUpperCase() : 'U'}
                            </div>
                            <span>{u.name}</span>
                          </td>
                          <td className="email-cell">{u.email}</td>
                          <td>
                            <span
                              className={`badge ${
                                u.role === 'ADMIN'
                                  ? 'badge-error'
                                  : u.role === 'HOST'
                                  ? 'badge-warning'
                                  : 'badge-info'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td>{formatDate(u.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Bookings Registry */}
        {adminTab === 'bookings' && (
          <div className="admin-tab-panel">
            <div className="admin-table-card card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: 'var(--space-md)',
                }}
              >
                <div className="table-header-desc" style={{ marginBottom: 0 }}>
                  <h3>BOOKING Platform Registry</h3>
                  <p>System-wide reservations across all properties with authoritative guest and host links.</p>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    Filter Status:
                  </span>
                  {['', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      className={`btn btn-sm ${bookingStatusFilter === st ? 'btn-primary' : 'btn-outline'}`}
                      style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                      onClick={() => setBookingStatusFilter(st)}
                    >
                      {st === '' ? 'All' : st}
                    </button>
                  ))}
                </div>
              </div>

              {bookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-secondary)' }}>
                  <p>No bookings found matching this filter.</p>
                </div>
              ) : (
                <div className="table-responsive-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Booking ID</th>
                        <th>Property</th>
                        <th>Guest</th>
                        <th>Host</th>
                        <th>Dates</th>
                        <th>Nights</th>
                        <th>Guests</th>
                        <th>Total Amount</th>
                        <th>Booking Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id}>
                          <td>
                            <strong>#{b.id}</strong>
                          </td>
                          <td className="prop-name-text" title={b.propertyName}>
                            {b.propertyName}
                          </td>
                          <td>
                            <strong>{b.guestName}</strong>
                          </td>
                          <td>{b.hostName}</td>
                          <td>
                            {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                          </td>
                          <td>{b.numberOfNights}</td>
                          <td>{b.guests}</td>
                          <td className="font-bold text-teal">{formatCurrency(b.totalAmount)}</td>
                          <td>
                            <span className={`badge ${getBookingStatusClass(b.status)}`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Payments Registry */}
        {adminTab === 'payments' && (
          <div className="admin-tab-panel">
            <div className="admin-table-card card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: 'var(--space-md)',
                }}
              >
                <div className="table-header-desc" style={{ marginBottom: 0 }}>
                  <h3>PAYMENT Transaction Records</h3>
                  <p>Authoritative financial audit log linked to corresponding booking reservations.</p>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    Filter Status:
                  </span>
                  {['', 'SUCCESS', 'PENDING', 'FAILED'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      className={`btn btn-sm ${paymentStatusFilter === st ? 'btn-primary' : 'btn-outline'}`}
                      style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                      onClick={() => setPaymentStatusFilter(st)}
                    >
                      {st === '' ? 'All' : st}
                    </button>
                  ))}
                </div>
              </div>

              {payments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-secondary)' }}>
                  <p>No payment records found matching this filter.</p>
                </div>
              ) : (
                <div className="table-responsive-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Payment ID</th>
                        <th>Booking ID</th>
                        <th>Booking State</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Payment Status</th>
                        <th>Date & Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((pay) => (
                        <tr key={pay.id}>
                          <td>
                            <strong>#{pay.id}</strong>
                          </td>
                          <td>
                            <strong>#{pay.bookingId}</strong>
                          </td>
                          <td>
                            <span className={`badge ${getBookingStatusClass(pay.bookingStatus)}`}>
                              {pay.bookingStatus}
                            </span>
                          </td>
                          <td className="font-bold text-teal">{formatCurrency(pay.amount)}</td>
                          <td>
                            <span className="badge badge-neutral">{pay.paymentMethod}</span>
                          </td>
                          <td>
                            <span className={`badge ${getPaymentStatusClass(pay.status)}`}>
                              {pay.status}
                            </span>
                          </td>
                          <td>{formatDate(pay.paymentDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Reviews Moderation */}
        {adminTab === 'reviews' && (
          <div className="admin-tab-panel">
            <div className="admin-table-card card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: 'var(--space-md)',
                }}
              >
                <div className="table-header-desc" style={{ marginBottom: 0 }}>
                  <h3>REVIEWS Platform Moderation</h3>
                  <p>
                    Verified guest reviews for properties. Average platform rating:{' '}
                    <strong>
                      ★{' '}
                      {reviewSummary?.averageRating !== null && reviewSummary?.averageRating !== undefined
                        ? Number(reviewSummary.averageRating).toFixed(2)
                        : '0.00'}
                    </strong>{' '}
                    across {reviewSummary?.totalReviews ?? reviews.length} reviews.
                  </p>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-secondary)' }}>
                  <p>No reviews found on the platform yet.</p>
                </div>
              ) : (
                <div className="table-responsive-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Review ID</th>
                        <th>Property</th>
                        <th>Reviewer</th>
                        <th>Rating</th>
                        <th>Comment</th>
                        <th>Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviews.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <strong>#{r.id}</strong>
                          </td>
                          <td className="prop-name-text" title={r.propertyName}>
                            <Link to={`/property/${r.propertyId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                              {r.propertyName}
                            </Link>
                          </td>
                          <td>
                            <strong>{r.reviewerName}</strong>
                          </td>
                          <td>
                            <span style={{ color: '#F59E0B', fontWeight: 600 }}>
                              {'★'.repeat(r.rating)}
                              {'☆'.repeat(Math.max(0, 5 - r.rating))}
                            </span>{' '}
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                              ({r.rating}/5)
                            </span>
                          </td>
                          <td style={{ maxWidth: '300px' }}>
                            <span style={{ fontStyle: 'italic' }}>
                              "{r.comment.length > 100 ? `${r.comment.slice(0, 100)}...` : r.comment}"
                            </span>
                          </td>
                          <td>{formatDate(r.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
