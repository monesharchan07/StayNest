import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ImageGallery from '../components/ImageGallery';
import BookingCard from '../components/BookingCard';
import ReviewCard from '../components/ReviewCard';
import { getPropertyById } from '../services/propertyService';
import { getReviewsByProperty } from '../services/reviewService';
import './PropertyPage.css';

export default function PropertyPage() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadPropertyData() {
      setLoading(true);
      try {
        const prop = await getPropertyById(id);
        if (!prop) {
          setError('Property not found');
          return;
        }
        setProperty(prop);

        const revs = await getReviewsByProperty(id);
        setReviews(revs);
        if (revs?.summary) {
          setProperty((prev) => ({
            ...prev,
            averageRating: revs.summary.averageRating > 0 ? revs.summary.averageRating : prev.averageRating,
            reviewCount: revs.summary.reviewCount ?? prev.reviewCount,
          }));
        }
      } catch (err) {
        setError('Error loading property details.');
      } finally {
        setLoading(false);
      }
    }
    loadPropertyData();
  }, [id]);

  if (loading) {
    return (
      <div className="container property-loading-container">
        <div className="loading-spinner"></div>
        <p>Loading stay details...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="container property-error-container">
        <h2>{error || 'Stay not found'}</h2>
        <p>The property you are looking for might be unavailable or removed.</p>
        <Link to="/search" className="btn btn-primary">
          Back to all stays
        </Link>
      </div>
    );
  }

  return (
    <div className="staynest-property-page">
      <div className="container">
        {/* Breadcrumb Navigation */}
        <nav className="property-breadcrumbs">
          <Link to="/">Home</Link>
          <span className="crumb-sep">/</span>
          <Link to={`/search?destination=${property.location?.city}`}>{property.location?.city}</Link>
          <span className="crumb-sep">/</span>
          <span className="current-crumb">{property.name}</span>
        </nav>

        {/* Title Header */}
        <div className="property-title-header">
          <h1 className="property-page-title">{property.name}</h1>
          <div className="property-meta-row">
            <div className="meta-left">
              <span className="meta-star">★</span>
              <span className="meta-rating">
                {property.averageRating > 0 ? property.averageRating.toFixed(2) : 'New'}
              </span>
              <span className="meta-dot">·</span>
              <span className="meta-reviews">{reviews.length} reviews</span>
              <span className="meta-dot">·</span>
              <span className="meta-location">
                📍 {property.location?.address}, {property.location?.city}, {property.location?.state}
              </span>
            </div>

            <div className="meta-badges">
              <span className="badge badge-info">{property.propertyType}</span>
              <span className="badge badge-success">{property.status}</span>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <ImageGallery images={property.images} propertyName={property.name} />

        {/* Main Content Layout: Details + Sticky Booking Card */}
        <div className="property-layout-grid">
          {/* Left Details Column */}
          <div className="property-details-col">
            {/* Host Info Box */}
            <div className="host-intro-card">
              <div className="host-info-text">
                <h2 className="host-title">Hosted by {property.hostName}</h2>
                <div className="property-stats-pills">
                  <span>{property.maxGuests} guests maximum</span>
                  <span className="dot">•</span>
                  <span>{property.bedrooms} bedrooms</span>
                  <span className="dot">•</span>
                  <span>{property.bathrooms} bathrooms</span>
                </div>
              </div>
              <img
                src={property.hostAvatar}
                alt={property.hostName}
                className="host-avatar-large"
              />
            </div>

            <div className="details-divider"></div>

            {/* Highlights */}
            <div className="property-highlights">
              <div className="highlight-item">
                <span className="highlight-icon">✨</span>
                <div>
                  <div className="highlight-title">Dedicated workspace & fast WiFi</div>
                  <div className="highlight-desc">Verified for comfortable remote working.</div>
                </div>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🏊</span>
                <div>
                  <div className="highlight-title">Curated guest amenities</div>
                  <div className="highlight-desc">Selected according to StayNest hospitality standards.</div>
                </div>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🛡️</span>
                <div>
                  <div className="highlight-title">MySQL Transaction Protection</div>
                  <div className="highlight-desc">Atomic booking and payment guarantees rollbacks on failures.</div>
                </div>
              </div>
            </div>

            <div className="details-divider"></div>

            {/* Description */}
            <div className="property-section">
              <h3 className="section-heading">About this space</h3>
              <p className="property-description-body">{property.description}</p>
            </div>

            <div className="details-divider"></div>

            {/* Amenities Grid */}
            <div className="property-section">
              <h3 className="section-heading">What this place offers</h3>
              <div className="amenities-feature-grid">
                {property.amenities?.map((amenity) => (
                  <div key={amenity.id} className="amenity-feature-item">
                    <span className="amenity-icon-box">{amenity.icon}</span>
                    <div>
                      <div className="amenity-item-name">{amenity.name}</div>
                      <div className="amenity-item-desc">{amenity.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="details-divider"></div>

            {/* Location & Map Context */}
            <div className="property-section">
              <h3 className="section-heading">Where you will be</h3>
              <div className="location-info-card">
                <div className="location-icon-pin">📍</div>
                <div>
                  <div className="location-name">{property.location?.address}</div>
                  <div className="location-sub">
                    {property.location?.city}, {property.location?.state}, {property.location?.country}
                  </div>
                  <div className="location-coords">
                    GPS Coordinates: {property.location?.latitude}° N, {property.location?.longitude}° E
                  </div>
                </div>
              </div>
            </div>

            <div className="details-divider"></div>

            {/* Reviews Section */}
            <div className="property-section reviews-section-wrapper">
              <div className="reviews-header-row">
                <div className="reviews-title-block">
                  <h3 className="section-heading">
                    ★ {property.averageRating > 0 ? property.averageRating.toFixed(2) : 'No reviews yet'}
                    {reviews.length > 0 && ` • ${reviews.length} reviews`}
                  </h3>
                  <p className="reviews-sub-note">
                    Business Rule: Only guests with valid, completed bookings can submit reviews.
                  </p>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="no-reviews-box">
                  <p>No reviews yet for this listing. Be among the first to stay and share your experience!</p>
                </div>
              ) : (
                <div className="reviews-cards-grid">
                  {reviews.map((rev) => (
                    <ReviewCard key={rev.id} review={rev} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sticky Booking Column */}
          <div className="property-booking-col">
            <BookingCard property={property} />
          </div>
        </div>
      </div>
    </div>
  );
}
