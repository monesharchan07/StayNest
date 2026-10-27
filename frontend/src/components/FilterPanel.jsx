import React from 'react';
import { amenities as allAmenities } from '../data/amenities';
import './FilterPanel.css';

export default function FilterPanel({
  filters,
  onFilterChange,
  onResetFilters,
  totalResults = 0,
}) {
  const propertyTypes = ['ALL', 'Villa', 'Apartment', 'Cottage', 'House', 'Room'];

  const handleTypeSelect = (type) => {
    onFilterChange({ ...filters, propertyType: type });
  };

  const handlePriceChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const handleRatingChange = (rating) => {
    onFilterChange({ ...filters, minRating: rating });
  };

  const handleAmenityToggle = (amenityId) => {
    const current = filters.amenities || [];
    const exists = current.includes(amenityId);
    const updated = exists
      ? current.filter((id) => id !== amenityId)
      : [...current, amenityId];
    onFilterChange({ ...filters, amenities: updated });
  };

  return (
    <div className="staynest-filter-panel">
      {/* Header with Clear button */}
      <div className="filter-panel-header">
        <div className="filter-panel-title">
          <span>Filters</span>
          <span className="results-count-badge">{totalResults} stays</span>
        </div>
        <button
          type="button"
          className="btn-clear-filters"
          onClick={onResetFilters}
        >
          Reset all
        </button>
      </div>

      {/* Property Types */}
      <div className="filter-group">
        <label className="filter-group-label">Property Type</label>
        <div className="property-types-grid">
          {propertyTypes.map((type) => {
            const isSelected = (filters.propertyType || 'ALL') === type;
            return (
              <button
                key={type}
                type="button"
                className={`type-pill ${isSelected ? 'active' : ''}`}
                onClick={() => handleTypeSelect(type)}
              >
                {type === 'ALL' ? 'All Types' : type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div className="filter-group">
        <label className="filter-group-label">Price per night (₹)</label>
        <div className="price-inputs-row">
          <div className="price-input-box">
            <span className="price-prefix">₹</span>
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ''}
              onChange={(e) => handlePriceChange('minPrice', e.target.value)}
              className="price-num-input"
            />
          </div>
          <span className="price-dash">—</span>
          <div className="price-input-box">
            <span className="price-prefix">₹</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ''}
              onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
              className="price-num-input"
            />
          </div>
        </div>
      </div>

      {/* Rating */}
      <div className="filter-group">
        <label className="filter-group-label">Guest Rating</label>
        <div className="ratings-pill-row">
          {[
            { label: 'Any', value: 0 },
            { label: '4.0+ ★', value: 4.0 },
            { label: '4.5+ ★', value: 4.5 },
            { label: '4.8+ ★', value: 4.8 },
          ].map((r) => {
            const isSelected = Number(filters.minRating || 0) === r.value;
            return (
              <button
                key={r.label}
                type="button"
                className={`rating-pill ${isSelected ? 'active' : ''}`}
                onClick={() => handleRatingChange(r.value)}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Amenities Checkboxes */}
      <div className="filter-group">
        <label className="filter-group-label">Amenities</label>
        <div className="amenities-checkbox-grid">
          {allAmenities.slice(0, 10).map((a) => {
            const isChecked = (filters.amenities || []).includes(a.id);
            return (
              <label key={a.id} className="amenity-checkbox-label">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleAmenityToggle(a.id)}
                  className="amenity-checkbox"
                />
                <span className="amenity-name">
                  <span className="amenity-icon">{a.icon}</span> {a.name}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
