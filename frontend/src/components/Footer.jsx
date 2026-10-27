import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="staynest-footer">
      <div className="container footer-content">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-col brand-col">
            <div className="footer-brand">
              <div className="brand-logo-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <span className="brand-name">
                Stay<span className="brand-name-accent">Nest</span>
              </span>
            </div>
            <p className="footer-tagline">
              Comfortable, authentic stays and vacation homes. Built with React and designed for database systems demonstrations.
            </p>
            <div className="project-badge">
              <span>Database Systems (BACSE202) Mini-Project</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-heading">Explore</h4>
            <ul className="footer-links">
              <li><Link to="/">Featured Destinations</Link></li>
              <li><Link to="/search">All Properties</Link></li>
              <li><Link to="/search?propertyType=Villa">Luxury Villas</Link></li>
              <li><Link to="/search?propertyType=Cottage">Heritage Cottages</Link></li>
              <li><Link to="/search?propertyType=Apartment">City Lofts</Link></li>
            </ul>
          </div>

          {/* Hosting */}
          <div className="footer-col">
            <h4 className="footer-heading">Hosting</h4>
            <ul className="footer-links">
              <li><Link to="/host/properties/new">List your home</Link></li>
              <li><Link to="/host/dashboard">Host Dashboard</Link></li>
              <li><Link to="/login">Host Sign In</Link></li>
              <li><span className="text-muted">Host Community Guidelines</span></li>
            </ul>
          </div>

          {/* System Schema & Tech */}
          <div className="footer-col">
            <h4 className="footer-heading">DBMS Architecture</h4>
            <ul className="footer-links">
              <li><Link to="/admin/dashboard">Admin Overview</Link></li>
              <li><span className="text-muted">MySQL 8.0 Relational DB</span></li>
              <li><span className="text-muted">9 Major Entities (3NF)</span></li>
              <li><span className="text-muted">Atomic Booking Transactions</span></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copy">
            © {new Date().getFullYear()} StayNest, Inc. • College Mini-Project Demonstration
          </div>
          <div className="footer-legal-links">
            <span className="legal-pill">Guest</span>
            <span className="legal-pill">Host</span>
            <span className="legal-pill">Admin</span>
            <span className="legal-pill">MySQL Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
