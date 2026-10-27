import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import PropertyCard from '../components/PropertyCard';
import { searchProperties } from '../services/propertyService';
import './SearchPage.css';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recommended');

  // Filter state synced with searchParams
  const [filters, setFilters] = useState({
    destination: searchParams.get('destination') || '',
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: searchParams.get('guests') || '',
    propertyType: searchParams.get('propertyType') || 'ALL',
    minPrice: '',
    maxPrice: '',
    minRating: 0,
    amenities: [],
  });

  // Sync when searchParams change (e.g. from SearchBar)
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      destination: searchParams.get('destination') || '',
      checkIn: searchParams.get('checkIn') || '',
      checkOut: searchParams.get('checkOut') || '',
      guests: searchParams.get('guests') || '',
      propertyType: searchParams.get('propertyType') || prev.propertyType || 'ALL',
    }));
  }, [searchParams]);

  // Load properties based on filters + sorting
  useEffect(() => {
    async function fetchResults() {
      setLoading(true);
      try {
        const results = await searchProperties({ ...filters, sortBy });
        setProperties(results);
      } catch (err) {
        console.error('Failed to load search properties', err);
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [filters, sortBy]);

  const handleResetFilters = () => {
    setFilters({
      destination: '',
      checkIn: '',
      checkOut: '',
      guests: '',
      propertyType: 'ALL',
      minPrice: '',
      maxPrice: '',
      minRating: 0,
      amenities: [],
    });
    setSearchParams({});
  };

  return (
    <div className="staynest-search-page">
      {/* Top Search Header */}
      <div className="search-page-header">
        <div className="container">
          <SearchBar
            compact
            initialValues={{
              destination: filters.destination,
              checkIn: filters.checkIn,
              checkOut: filters.checkOut,
              guests: filters.guests,
            }}
          />
        </div>
      </div>

      <div className="container search-main-container">
        {/* Left Filter Sidebar */}
        <aside className="search-sidebar">
          <FilterPanel
            filters={filters}
            onFilterChange={setFilters}
            onResetFilters={handleResetFilters}
            totalResults={properties.length}
          />
        </aside>

        {/* Right Search Content */}
        <main className="search-results-area">
          {/* Results Summary & Sort Controls */}
          <div className="results-top-bar">
            <div>
              <h1 className="results-heading">
                {filters.destination ? `Stays in ${filters.destination}` : 'All Stays'}
              </h1>
              <p className="results-subtext">
                {properties.length} {properties.length === 1 ? 'property' : 'properties'} found
                {filters.checkIn && filters.checkOut && ` • ${filters.checkIn} to ${filters.checkOut}`}
                {filters.guests && ` • ${filters.guests} guests`}
              </p>
            </div>

            <div className="sort-control">
              <label htmlFor="sort-select" className="sort-label">Sort by:</label>
              <select
                id="sort-select"
                className="sort-dropdown"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="recommended">Recommended</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating_desc">Highest Rated</option>
                <option value="newest">Newest Listed</option>
              </select>
            </div>
          </div>

          {/* Results Grid */}
          {loading ? (
            <div className="search-grid-loading">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="property-skeleton-card">
                  <div className="skeleton-media"></div>
                  <div className="skeleton-text title"></div>
                  <div className="skeleton-text sub"></div>
                </div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="no-search-results">
              <div className="no-results-icon">🔍</div>
              <h2>No exact matches found</h2>
              <p>
                Try widening your price range, removing some amenities, or searching for nearby cities like Goa, Manali, or Bengaluru.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleResetFilters}
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="search-properties-grid">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
