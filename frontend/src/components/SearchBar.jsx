import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToday, getTomorrow } from '../utils/helpers';
import './SearchBar.css';

export default function SearchBar({ initialValues = {}, compact = false }) {
  const navigate = useNavigate();

  const [destination, setDestination] = useState(initialValues.destination || '');
  const [checkIn, setCheckIn] = useState(initialValues.checkIn || '');
  const [checkOut, setCheckOut] = useState(initialValues.checkOut || '');
  const [guests, setGuests] = useState(Number(initialValues.guests) || 1);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);

  const guestPickerRef = useRef(null);
  const destRef = useRef(null);

  const popularDestinations = [
    { city: 'Goa', tag: 'Beachfront villas' },
    { city: 'Manali', tag: 'Himalayan chalets' },
    { city: 'Bengaluru', tag: 'Cyber lofts' },
    { city: 'Udaipur', tag: 'Heritage havelis' },
    { city: 'Coorg', tag: 'Coffee plantations' },
    { city: 'Mumbai', tag: 'Sea-facing penthouses' },
  ];

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (guestPickerRef.current && !guestPickerRef.current.contains(event.target)) {
        setShowGuestPicker(false);
      }
      if (destRef.current && !destRef.current.contains(event.target)) {
        setShowDestSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.set('destination', destination.trim());
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests > 1) params.set('guests', guests.toString());

    navigate(`/search?${params.toString()}`);
  };

  return (
    <form className={`staynest-search-bar ${compact ? 'compact-bar' : ''}`} onSubmit={handleSearch}>
      {/* Destination Field */}
      <div className="search-field destination-field" ref={destRef}>
        <label className="search-label">Where</label>
        <input
          type="text"
          className="search-input"
          placeholder="Search destinations"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          onFocus={() => setShowDestSuggestions(true)}
        />
        {showDestSuggestions && (
          <div className="search-suggestions-popover">
            <div className="suggestions-header">Popular destinations</div>
            {popularDestinations.map((d) => (
              <button
                key={d.city}
                type="button"
                className="suggestion-item"
                onClick={() => {
                  setDestination(d.city);
                  setShowDestSuggestions(false);
                }}
              >
                <span className="suggestion-icon">📍</span>
                <div>
                  <div className="suggestion-city">{d.city}</div>
                  <div className="suggestion-tag">{d.tag}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="search-divider"></div>

      {/* Check In Date */}
      <div className="search-field date-field">
        <label className="search-label">Check in</label>
        <input
          type="date"
          className="search-input date-input"
          value={checkIn}
          min={getToday()}
          onChange={(e) => {
            setCheckIn(e.target.value);
            // If checkout is before new checkin, reset it
            if (checkOut && e.target.value >= checkOut) {
              setCheckOut('');
            }
          }}
        />
      </div>

      <div className="search-divider"></div>

      {/* Check Out Date */}
      <div className="search-field date-field">
        <label className="search-label">Check out</label>
        <input
          type="date"
          className="search-input date-input"
          value={checkOut}
          min={checkIn || getTomorrow()}
          onChange={(e) => setCheckOut(e.target.value)}
        />
      </div>

      <div className="search-divider"></div>

      {/* Guests Selector */}
      <div className="search-field guests-field" ref={guestPickerRef}>
        <label className="search-label">Who</label>
        <div
          className="search-input guests-display"
          onClick={() => setShowGuestPicker(!showGuestPicker)}
        >
          {guests === 1 ? '1 guest' : `${guests} guests`}
        </div>

        {showGuestPicker && (
          <div className="guests-popover">
            <div className="guest-row">
              <div>
                <div className="guest-type-title">Total Guests</div>
                <div className="guest-type-sub">Ages 2 and above</div>
              </div>
              <div className="counter-controls">
                <button
                  type="button"
                  className="counter-btn"
                  disabled={guests <= 1}
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                >
                  -
                </button>
                <span className="counter-value">{guests}</span>
                <button
                  type="button"
                  className="counter-btn"
                  disabled={guests >= 16}
                  onClick={() => setGuests(Math.min(16, guests + 1))}
                >
                  +
                </button>
              </div>
            </div>
            <div className="guest-popover-footer">
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => setShowGuestPicker(false)}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="search-action">
        <button type="submit" className="search-submit-btn" aria-label="Search accommodations">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {!compact && <span className="search-btn-text">Search</span>}
        </button>
      </div>
    </form>
  );
}
