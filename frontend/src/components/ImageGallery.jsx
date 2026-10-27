import React, { useState } from 'react';
import './ImageGallery.css';

export default function ImageGallery({ images = [], propertyName = '' }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return <div className="no-images-placeholder">No photos available</div>;
  }

  const primaryImage = images.find((img) => img.isPrimary) || images[0];
  const sideImages = images.filter((img) => img.id !== primaryImage.id).slice(0, 4);

  const openLightbox = (index) => {
    setActiveImageIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="staynest-gallery-section">
      <div className="gallery-mosaic-grid">
        {/* Large Primary Image */}
        <div
          className="gallery-primary-box"
          onClick={() => openLightbox(0)}
        >
          <img
            src={primaryImage.url}
            alt={primaryImage.caption || propertyName}
            className="gallery-img primary-img"
          />
        </div>

        {/* 4 Supporting Photos */}
        <div className="gallery-secondary-grid">
          {sideImages.map((img, idx) => (
            <div
              key={img.id || idx}
              className="gallery-thumb-box"
              onClick={() => openLightbox(idx + 1)}
            >
              <img
                src={img.url}
                alt={img.caption || `${propertyName} photo ${idx + 2}`}
                className="gallery-img thumb-img"
              />
              {idx === 3 && images.length > 5 && (
                <div className="more-photos-overlay">
                  <span>+{images.length - 5} more photos</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* View all photos button */}
        <button
          type="button"
          className="btn-view-all-photos"
          onClick={() => openLightbox(0)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <span>Show all {images.length} photos</span>
        </button>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="gallery-lightbox-modal">
          <button
            type="button"
            className="lightbox-close-btn"
            onClick={() => setLightboxOpen(false)}
          >
            ✕ Close
          </button>

          <div className="lightbox-content">
            <button
              type="button"
              className="lightbox-nav-btn prev"
              onClick={() =>
                setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
              }
            >
              ‹
            </button>

            <div className="lightbox-main-view">
              <img
                src={images[activeImageIndex]?.url}
                alt={images[activeImageIndex]?.caption || propertyName}
                className="lightbox-image"
              />
              <div className="lightbox-caption">
                <span>{images[activeImageIndex]?.caption || propertyName}</span>
                <span className="lightbox-counter">
                  {activeImageIndex + 1} / {images.length}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="lightbox-nav-btn next"
              onClick={() =>
                setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
              }
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
