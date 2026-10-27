import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import PropertyCard from '../components/PropertyCard';
import { getProperties, listProperties } from '../services/propertyService';
import './HomePage.css';

export default function HomePage() {
  const [properties, setProperties] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'ALL', label: 'All Stays', icon: '✨' },
    { id: 'Villa', label: 'Villas', icon: '🏖️' },
    { id: 'Apartment', label: 'Apartments', icon: '🏙️' },
    { id: 'Cottage', label: 'Cottages', icon: '🌲' },
    { id: 'House', label: 'Houses', icon: '🏡' },
    { id: 'Room', label: 'Heritage Rooms', icon: '🏰' },
  ];

  const featuredDestinations = [
    {
      name: 'Goa',
      state: 'Goa',
      count: 'Villas & Beach Stays',
      image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Manali',
      state: 'Himachal Pradesh',
      count: 'Pine Cottages & Peaks',
      image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Bengaluru',
      state: 'Karnataka',
      count: 'City Lofts & Studios',
      image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Udaipur',
      state: 'Rajasthan',
      count: 'Royal Havelis & Lakes',
      image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=600&auto=format&fit=crop&q=80',
    },
  ];

  useEffect(() => {
    async function loadProperties() {
      setLoading(true);
      try {
        const data = selectedCategory === 'ALL'
          ? await listProperties()
          : await getProperties({ propertyType: selectedCategory });
        setProperties(data);
      } catch (err) {
        console.error('Error loading properties', err);
      } finally {
        setLoading(false);
      }
    }
    loadProperties();
  }, [selectedCategory]);

  return (
    <div className="staynest-home-page">
      {/* Hero Section */}
      <section className="home-hero-section">
        <div className="container hero-container">
          <div className="hero-badge">
            <span>✨ Authentic stays across incredible India</span>
          </div>
          <h1 className="hero-title">
            Find your next memorable stay with <span className="brand-accent">StayNest</span>
          </h1>
          <p className="hero-subtitle">
            From secluded Himalayan chalets to private beachfront Goan villas, discover verified homes hosted with heart.
          </p>

          {/* Search Bar Component */}
          <div className="hero-search-wrapper">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="destinations-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Popular Destinations</h2>
              <p className="section-subtitle">Handpicked getaways loved by our community</p>
            </div>
            <Link to="/search" className="section-view-all">
              Explore all locations →
            </Link>
          </div>

          <div className="destinations-grid">
            {featuredDestinations.map((dest) => (
              <Link
                key={dest.name}
                to={`/search?destination=${dest.name}`}
                className="destination-card"
              >
                <img src={dest.image} alt={dest.name} className="destination-img" />
                <div className="destination-overlay">
                  <h3 className="dest-name">{dest.name}</h3>
                  <span className="dest-count">{dest.count}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Category Pills Bar */}
      <section className="categories-section">
        <div className="container">
          <div className="category-pills-bar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span className="cat-icon">{cat.icon}</span>
                <span className="cat-label">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Property Listings Grid */}
      <section className="properties-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">
                {selectedCategory === 'ALL' ? 'Featured Stays' : `${selectedCategory}s`}
              </h2>
              <p className="section-subtitle">
                {properties.length} active {properties.length === 1 ? 'property' : 'properties'} available
              </p>
            </div>
          </div>

          {loading ? (
            <div className="properties-loading-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="property-skeleton-card">
                  <div className="skeleton-media"></div>
                  <div className="skeleton-text title"></div>
                  <div className="skeleton-text sub"></div>
                </div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="empty-properties-box">
              <span className="empty-icon">🏡</span>
              <h3>No properties found</h3>
              <p>Try switching categories or exploring other destinations.</p>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setSelectedCategory('ALL')}
              >
                Show all stays
              </button>
            </div>
          ) : (
            <div className="properties-grid">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Host CTA Banner */}
      <section className="host-cta-section">
        <div className="container">
          <div className="host-cta-card">
            <div className="host-cta-content">
              <span className="host-cta-badge">Earn with StayNest</span>
              <h2 className="host-cta-title">Have a spare home or cottage?</h2>
              <p className="host-cta-desc">
                Join thousands of hosts welcoming travelers. Enjoy full pricing control, secure payments, and dedicated host support.
              </p>
              <div className="host-cta-buttons">
                <Link to="/host/properties/new" className="btn btn-primary btn-lg">
                  List Your Property
                </Link>
                <Link to="/host/dashboard" className="btn btn-secondary btn-lg">
                  Explore Host Dashboard
                </Link>
              </div>
            </div>
            <div className="host-cta-visual">
              <img
                src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop&q=80"
                alt="Host your property"
                className="host-cta-img"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
