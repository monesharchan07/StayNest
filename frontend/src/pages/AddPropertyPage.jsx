import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createProperty } from '../services/propertyService';
import { amenities as allAmenities } from '../data/amenities';
import FormField from '../components/FormField';
import './AddPropertyPage.css';

export default function AddPropertyPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState('Villa');
  const [pricePerNight, setPricePerNight] = useState('');
  const [maxGuests, setMaxGuests] = useState('4');
  const [bedrooms, setBedrooms] = useState('2');
  const [bathrooms, setBathrooms] = useState('2');

  // Location fields (LOCATION entity in MySQL)
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');

  // Amenities
  const [selectedAmenities, setSelectedAmenities] = useState([1, 2, 3, 8]);

  // Images
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&auto=format&fit=crop&q=80'
  );

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleAmenityToggle = (id) => {
    if (selectedAmenities.includes(id)) {
      setSelectedAmenities(selectedAmenities.filter((aid) => aid !== id));
    } else {
      setSelectedAmenities([...selectedAmenities, id]);
    }
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Property title is required.';
    if (!description.trim() || description.length < 20) {
      errs.description = 'Description should be at least 20 characters.';
    }
    if (!pricePerNight || Number(pricePerNight) <= 0) {
      errs.pricePerNight = 'Price per night must be a positive number.';
    }
    if (!maxGuests || Number(maxGuests) < 1) {
      errs.maxGuests = 'Max guests must be at least 1.';
    }
    if (Number(bedrooms) < 0) errs.bedrooms = 'Bedrooms cannot be negative.';
    if (Number(bathrooms) < 0) errs.bathrooms = 'Bathrooms cannot be negative.';
    if (!address.trim()) errs.address = 'Street address is required.';
    if (!city.trim()) errs.city = 'City is required.';
    if (!state.trim()) errs.state = 'State is required.';
    if (!imageUrl.trim()) errs.imageUrl = 'Primary photo URL is required.';

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      await createProperty(
        {
          name,
          description,
          propertyType,
          pricePerNight,
          maxGuests,
          bedrooms,
          bathrooms,
          address,
          city,
          state,
          country,
          amenityIds: selectedAmenities,
          images: [{ url: imageUrl, caption: 'Main view' }],
        },
        currentUser || { id: 2, name: 'Priya Sharma' }
      );

      navigate('/host/dashboard');
    } catch (err) {
      alert(err.message || 'Failed to list property.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="staynest-add-property-page page-content">
      <div className="container add-prop-container">
        {/* Header */}
        <div className="add-prop-header">
          <Link to="/host/dashboard" className="back-link">
            ← Back to Host Dashboard
          </Link>
          <h1 className="add-prop-title">List a New Accommodation</h1>
          <p className="add-prop-sub">
            Fill in the details to create a new property record in the MySQL database.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="add-prop-form card">
          {/* Section 1: Core Property Details */}
          <div className="form-section-block">
            <h2 className="section-block-title">1. Basic Information</h2>

            <FormField
              label="Property Title"
              id="prop-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Palm Grove Villa with Infinity Pool"
              error={errors.name}
              required
            />

            <div className="form-row-2">
              <FormField
                label="Property Type"
                id="prop-type"
                type="select"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                options={[
                  { value: 'Villa', label: 'Villa' },
                  { value: 'Apartment', label: 'Apartment' },
                  { value: 'Cottage', label: 'Cottage' },
                  { value: 'House', label: 'House' },
                  { value: 'Room', label: 'Room / Suite' },
                ]}
                required
              />

              <FormField
                label="Price per Night (₹)"
                id="prop-price"
                type="number"
                value={pricePerNight}
                onChange={(e) => setPricePerNight(e.target.value)}
                placeholder="e.g. 5500"
                error={errors.pricePerNight}
                helpText="Business Rule: Price per night must be positive."
                required
              />
            </div>

            <FormField
              label="Description"
              id="prop-desc"
              type="textarea"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what makes your stay unique: views, nearby beaches, decor, kitchen facilities..."
              error={errors.description}
              required
            />

            <div className="form-row-3">
              <FormField
                label="Max Guests"
                id="prop-guests"
                type="number"
                value={maxGuests}
                onChange={(e) => setMaxGuests(e.target.value)}
                error={errors.maxGuests}
                required
              />
              <FormField
                label="Bedrooms"
                id="prop-beds"
                type="number"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                error={errors.bedrooms}
                required
              />
              <FormField
                label="Bathrooms"
                id="prop-baths"
                type="number"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                error={errors.bathrooms}
                required
              />
            </div>
          </div>

          <div className="form-section-divider"></div>

          {/* Section 2: Location Information */}
          <div className="form-section-block">
            <h2 className="section-block-title">2. Location Details (LOCATION Entity)</h2>

            <FormField
              label="Street Address"
              id="prop-addr"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 12 Fort Aguada Road, Candolim"
              error={errors.address}
              required
            />

            <div className="form-row-3">
              <FormField
                label="City"
                id="prop-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Goa"
                error={errors.city}
                required
              />
              <FormField
                label="State"
                id="prop-state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Goa"
                error={errors.state}
                required
              />
              <FormField
                label="Country"
                id="prop-country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-section-divider"></div>

          {/* Section 3: Amenities Multi-Select (M:N Relationship) */}
          <div className="form-section-block">
            <h2 className="section-block-title">3. Amenities Offered (PROPERTY_AMENITY)</h2>
            <p className="section-block-sub">
              Select all amenities your property offers to travelers:
            </p>
            <div className="amenities-selection-grid">
              {allAmenities.map((a) => {
                const isSelected = selectedAmenities.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    className={`amenity-choice-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleAmenityToggle(a.id)}
                  >
                    <span className="amenity-choice-icon">{a.icon}</span>
                    <span className="amenity-choice-name">{a.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-section-divider"></div>

          {/* Section 4: Primary Image */}
          <div className="form-section-block">
            <h2 className="section-block-title">4. Photos (PROPERTY_IMAGE Entity)</h2>
            <FormField
              label="Primary Image URL"
              id="prop-img"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              error={errors.imageUrl}
              helpText="Paste a high-resolution Unsplash photo URL"
              required
            />

            {imageUrl && (
              <div className="image-preview-box">
                <span className="preview-label">Live Photo Preview:</span>
                <img src={imageUrl} alt="Property preview" className="preview-img" />
              </div>
            )}
          </div>

          <div className="form-footer-actions">
            <Link to="/host/dashboard" className="btn btn-secondary btn-lg">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
            >
              {loading ? 'Submitting Property...' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
