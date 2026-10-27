import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getHostDashboard,
  getHostProperties,
  getHostBookings,
  updateBookingStatus,
} from '../services/hostService';
import { updateProperty, deleteProperty } from '../services/propertyService';
import {
  formatCurrency,
  formatDate,
  getPropertyStatusClass,
  getBookingStatusClass,
} from '../utils/helpers';
import './HostDashboard.css';

export default function HostDashboard() {
  const { currentUser } = useAuth();
  const [dashboardStats, setDashboardStats] = useState(null);
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [activeTab, setActiveTab] = useState('properties');

  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Property edit modal state
  const [editingProperty, setEditingProperty] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    propertyType: 'Villa',
    pricePerNight: '',
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    description: '',
  });

  const loadHostData = useCallback(async () => {
    setLoading(true);
    setActionError('');
    try {
      const [stats, hostProps, hostBookings] = await Promise.all([
        getHostDashboard(),
        getHostProperties(),
        getHostBookings(bookingStatusFilter),
      ]);
      setDashboardStats(stats);
      setProperties(hostProps);
      setBookings(hostBookings);
      setUnauthorized(false);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        setUnauthorized(true);
      } else {
        setActionError(err.message || 'Failed to load host dashboard data.');
      }
    } finally {
      setLoading(false);
    }
  }, [bookingStatusFilter]);

  useEffect(() => {
    loadHostData();
  }, [loadHostData]);

  const handleEditClick = (p) => {
    setActionError('');
    setActionSuccess('');
    setEditingProperty(p);
    setEditFormData({
      name: p.name || '',
      propertyType: p.propertyType || 'Apartment',
      pricePerNight: p.pricePerNight || '',
      maxGuests: p.maxGuests || 2,
      bedrooms: p.bedrooms || 1,
      bathrooms: p.bathrooms || 1,
      description: p.description || '',
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingProperty) return;
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');
    try {
      await updateProperty(editingProperty.id, editFormData);
      setActionSuccess(`Property "${editFormData.name}" updated successfully.`);
      setEditingProperty(null);
      await loadHostData();
    } catch (err) {
      setActionError(err.message || 'Failed to update property.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = async (p) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${p.name}"?`)) {
      return;
    }
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');
    try {
      await deleteProperty(p.id);
      setActionSuccess(`Property "${p.name}" deleted successfully.`);
      await loadHostData();
    } catch (err) {
      setActionError(err.message || 'Failed to delete property.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, targetStatus) => {
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');
    try {
      await updateBookingStatus(bookingId, targetStatus);
      setActionSuccess(`Booking #${bookingId} status updated to ${targetStatus}.`);
      await loadHostData();
    } catch (err) {
      setActionError(err.message || 'Failed to update booking status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Unauthorized state (non-host access)
  if (unauthorized || (currentUser && currentUser.role !== 'HOST')) {
    return (
      <div className="staynest-host-dashboard page-content">
        <div className="container">
          <div
            className="empty-host-box card"
            style={{ textAlign: 'center', padding: '48px 24px', maxWidth: '600px', margin: '40px auto' }}
          >
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🔒</span>
            <h2>Host Access Required</h2>
            <p style={{ color: 'var(--color-text-secondary, #666)', marginBottom: '24px' }}>
              You must be logged in as an authorized HOST to access host operations and property analytics.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link to="/login" className="btn btn-primary">
                Log In as Host
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
      <div className="staynest-host-dashboard page-content">
        <div className="container" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)' }}>
            Loading host operations & analytics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="staynest-host-dashboard page-content">
      <div className="container">
        {/* Host Header */}
        <div className="host-dash-header">
          <div>
            <div className="host-badge-row">
              <span className="badge badge-info">Host Portal</span>
              <span className="text-secondary">Logged in as {currentUser?.name}</span>
            </div>
            <h1 className="host-dash-title">Host Operations & Analytics</h1>
          </div>
          <Link to="/host/properties/new" className="btn btn-primary btn-lg">
            <span>+ Add New Listing</span>
          </Link>
        </div>

        {/* Real Statistics Grid from Backend */}
        <div className="host-stats-grid">
          <div className="stat-card card">
            <div className="stat-icon-wrapper revenue">₹</div>
            <div className="stat-content">
              <span className="stat-label">Net Host Revenue</span>
              <span className="stat-value">
                {formatCurrency(dashboardStats?.totalRevenue ?? 0)}
              </span>
              <span className="stat-sub">From successful booking payments</span>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon-wrapper listings">🏡</div>
            <div className="stat-content">
              <span className="stat-label">Total Listings</span>
              <span className="stat-value">{dashboardStats?.properties?.total ?? properties.length}</span>
              <span className="stat-sub">
                {dashboardStats?.properties?.active ?? properties.filter((p) => p.status === 'ACTIVE').length} Active on platform
              </span>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon-wrapper bookings">🗓️</div>
            <div className="stat-content">
              <span className="stat-label">Reservations</span>
              <span className="stat-value">{dashboardStats?.bookings?.total ?? bookings.length}</span>
              <span className="stat-sub">
                {(dashboardStats?.bookings?.confirmed ?? 0) + (dashboardStats?.bookings?.completed ?? 0)} confirmed/completed
                {dashboardStats?.bookings?.pending > 0 ? ` (${dashboardStats.bookings.pending} pending)` : ''}
              </span>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon-wrapper rating">★</div>
            <div className="stat-content">
              <span className="stat-label">Portfolio Rating</span>
              <span className="stat-value">
                {dashboardStats?.reviews?.averageRating > 0
                  ? dashboardStats.reviews.averageRating.toFixed(2)
                  : '0.00'}
              </span>
              <span className="stat-sub">
                Across {dashboardStats?.reviews?.total ?? 0} guest review{dashboardStats?.reviews?.total === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>

        {/* Feedback Banners */}
        {actionSuccess && (
          <div
            className="host-success-banner"
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
            className="host-error-banner"
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

        {/* Tab Navigation */}
        <div className="host-tabs-bar">
          <button
            type="button"
            className={`host-tab-btn ${activeTab === 'properties' ? 'active' : ''}`}
            onClick={() => setActiveTab('properties')}
          >
            My Properties ({properties.length})
          </button>
          <button
            type="button"
            className={`host-tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            Received Bookings ({bookings.length})
          </button>
        </div>

        {/* Tab 1: Properties Table */}
        {activeTab === 'properties' && (
          <div className="host-tab-content">
            {properties.length === 0 ? (
              <div className="empty-host-box card">
                <h3>No properties listed yet</h3>
                <p>Start monetizing your home or vacation villa today.</p>
                <Link to="/host/properties/new" className="btn btn-primary">
                  Create First Listing
                </Link>
              </div>
            ) : (
              <div className="host-properties-table-card card">
                <table className="host-table">
                  <thead>
                    <tr>
                      <th>Property</th>
                      <th>Location</th>
                      <th>Type</th>
                      <th>Price / Night</th>
                      <th>Capacity</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((p) => (
                      <tr key={p.id}>
                        <td className="prop-name-cell">
                          <img
                            src={
                              p.images?.[0]?.url ||
                              'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=100'
                            }
                            alt={p.name}
                            className="prop-thumb"
                          />
                          <div>
                            <div className="prop-title-text">{p.name}</div>
                            <div className="prop-rating-sub">
                              ★ {p.averageRating ? p.averageRating.toFixed(2) : 'New'}
                            </div>
                          </div>
                        </td>
                        <td>
                          {p.location?.city}, {p.location?.state}
                        </td>
                        <td>
                          <span className="badge badge-neutral">{p.propertyType}</span>
                        </td>
                        <td className="font-bold">{formatCurrency(p.pricePerNight)}</td>
                        <td>{p.maxGuests} guests</td>
                        <td>
                          <span className={`badge ${getPropertyStatusClass(p.status)}`}>
                            {p.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <Link to={`/property/${p.id}`} className="btn btn-sm btn-outline">
                              View
                            </Link>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleEditClick(p)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm"
                              style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5' }}
                              onClick={() => handleDeleteClick(p)}
                              disabled={actionLoading}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Edit Property Modal */}
        {editingProperty && (
          <div
            className="gallery-lightbox-modal"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div
              className="card"
              style={{
                maxWidth: '600px',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto',
                background: 'var(--color-surface, #fff)',
                padding: '24px',
                borderRadius: '12px',
                zIndex: 1100,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  Edit Property #{editingProperty.id}
                </h2>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                  onClick={() => setEditingProperty(null)}
                >
                  ✕
                </button>
              </div>

              {actionError && (
                <div
                  style={{
                    marginBottom: '12px',
                    padding: '8px 12px',
                    background: '#FEE2E2',
                    color: '#991B1B',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                >
                  {actionError}
                </div>
              )}

              <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                    Property Title
                  </label>
                  <input
                    type="text"
                    className="search-input"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                      Property Type
                    </label>
                    <select
                      className="search-input"
                      value={editFormData.propertyType}
                      onChange={(e) => setEditFormData({ ...editFormData, propertyType: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                      }}
                    >
                      <option value="Apartment">Apartment</option>
                      <option value="House">House</option>
                      <option value="Villa">Villa</option>
                      <option value="Cottage">Cottage</option>
                      <option value="Room">Room</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                      Price Per Night (₹)
                    </label>
                    <input
                      type="number"
                      className="search-input"
                      value={editFormData.pricePerNight}
                      onChange={(e) => setEditFormData({ ...editFormData, pricePerNight: e.target.value })}
                      required
                      min="1"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                      Max Guests
                    </label>
                    <input
                      type="number"
                      className="search-input"
                      value={editFormData.maxGuests}
                      onChange={(e) => setEditFormData({ ...editFormData, maxGuests: e.target.value })}
                      required
                      min="1"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      className="search-input"
                      value={editFormData.bedrooms}
                      onChange={(e) => setEditFormData({ ...editFormData, bedrooms: e.target.value })}
                      min="1"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      className="search-input"
                      value={editFormData.bathrooms}
                      onChange={(e) => setEditFormData({ ...editFormData, bathrooms: e.target.value })}
                      min="1"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                    Description
                  </label>
                  <textarea
                    rows={3}
                    className="search-input"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditingProperty(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Bookings */}
        {activeTab === 'bookings' && (
          <div className="host-tab-content">
            {/* Status Filter Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Filter Status:</span>
                {['', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`btn btn-sm ${bookingStatusFilter === st ? 'btn-primary' : 'btn-outline'}`}
                    style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                    onClick={() => setBookingStatusFilter(st)}
                  >
                    {st === '' ? 'All' : st}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Showing {bookings.length} reservation{bookings.length === 1 ? '' : 's'}
              </span>
            </div>

            {bookings.length === 0 ? (
              <div className="empty-host-box card">
                <h3>No guest reservations {bookingStatusFilter ? `with status "${bookingStatusFilter}"` : 'yet'}</h3>
                <p>When travelers reserve your properties, their details will display here.</p>
              </div>
            ) : (
              <div className="host-properties-table-card card">
                <table className="host-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Property</th>
                      <th>Guest</th>
                      <th>Dates</th>
                      <th>Nights</th>
                      <th>Guests</th>
                      <th>Total Payout</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <strong>#{b.id}</strong>
                        </td>
                        <td>{b.propertyName}</td>
                        <td><strong>{b.guestName}</strong></td>
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
                        <td>
                          {b.status === 'PENDING' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              disabled={actionLoading}
                              onClick={() => handleUpdateBookingStatus(b.id, 'CONFIRMED')}
                              title="Advance status from PENDING to CONFIRMED"
                            >
                              Confirm
                            </button>
                          )}
                          {b.status === 'CONFIRMED' && (
                            <button
                              type="button"
                              className="btn btn-sm"
                              style={{ background: '#10B981', color: '#fff', border: '1px solid #059669' }}
                              disabled={actionLoading}
                              onClick={() => handleUpdateBookingStatus(b.id, 'COMPLETED')}
                              title="Advance status from CONFIRMED to COMPLETED"
                            >
                              Complete Stay
                            </button>
                          )}
                          {b.status === 'COMPLETED' && (
                            <span className="badge badge-success" style={{ opacity: 0.85 }}>✓ Completed</span>
                          )}
                          {b.status === 'CANCELLED' && (
                            <span className="badge badge-neutral" style={{ opacity: 0.85 }}>Cancelled</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
