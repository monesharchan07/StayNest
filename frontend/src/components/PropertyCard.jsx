import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/helpers';
import './PropertyCard.css';

export default function PropertyCard({ property }) {
  const [isFavorite, setIsFavorite] = useState(false);

  const primaryImage =
    property.images?.find((img) => img.isPrimary)?.url ||
    property.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800';

  const toggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  return (
    <div className="staynest-property-card">
      <Link to={`/property/${property.id}`} className="card-link-wrapper">
        {/* Media Container */}
        <div className="card-media-wrapper">
          <img
            src={primaryImage}
            alt={property.name}
            className="card-image"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src =
                'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop&q=80';
            }}
          />
          <div className="card-type-tag">{property.propertyType}</div>
          <button
            type="button"
            className={`card-wishlist-btn ${isFavorite ? 'favorited' : ''}`}
            onClick={toggleFavorite}
            aria-label="Save to favorites"
          >
            <svg
              viewBox="0 0 24 24"
              fill={isFavorite ? '#EF4444' : 'rgba(0, 0, 0, 0.45)'}
              stroke="white"
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>

        {/* Info Content */}
        <div className="card-info">
          <div className="card-header-row">
            <span className="card-location">
              {property.location?.city}, {property.location?.state}
            </span>
            <div className="card-rating">
              <span className="card-star">★</span>
              <span className="card-rating-num">
                {property.averageRating > 0 ? property.averageRating.toFixed(2) : 'New'}
              </span>
              {property.reviewCount > 0 && (
                <span className="card-reviews">({property.reviewCount})</span>
              )}
            </div>
          </div>

          <h3 className="card-title">{property.name}</h3>

          <div className="card-specs">
            <span>{property.maxGuests} guests</span>
            <span className="spec-dot">•</span>
            <span>{property.bedrooms} bed</span>
            <span className="spec-dot">•</span>
            <span>{property.bathrooms} bath</span>
          </div>

          <div className="card-footer-price">
            <span className="price-amount">{formatCurrency(property.pricePerNight)}</span>
            <span className="price-period"> / night</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
