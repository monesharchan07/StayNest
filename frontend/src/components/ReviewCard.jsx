import React from 'react';
import { formatDate } from '../utils/helpers';
import './ReviewCard.css';

export default function ReviewCard({ review }) {
  return (
    <div className="staynest-review-card">
      <div className="review-user-row">
        <img
          src={review.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
          alt={review.userName}
          className="reviewer-avatar"
        />
        <div className="reviewer-meta">
          <h4 className="reviewer-name">{review.userName}</h4>
          <span className="review-date">{formatDate(review.createdAt)}</span>
        </div>
      </div>

      <div className="review-rating-stars">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={`star ${i < review.rating ? 'filled' : 'empty'}`}
          >
            ★
          </span>
        ))}
      </div>

      <p className="review-comment-text">{review.comment}</p>
    </div>
  );
}
