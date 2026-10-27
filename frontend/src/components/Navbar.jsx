import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { currentUser, logout, switchRole } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
        setRoleSwitcherOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMenuOpen(false);
    setRoleSwitcherOpen(false);
  }, [location.pathname]);

  return (
    <header className="staynest-navbar">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand">
          <div className="brand-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="brand-name">
            Stay<span className="brand-name-accent">Nest</span>
          </span>
        </Link>

        {/* Center Navigation Links */}
        <nav className="navbar-center-nav">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Explore
          </Link>
          <Link to="/search" className={`nav-link ${location.pathname === '/search' ? 'active' : ''}`}>
            All Stays
          </Link>
          {currentUser?.role === 'HOST' && (
            <Link to="/host/dashboard" className={`nav-link ${location.pathname.startsWith('/host') ? 'active' : ''}`}>
              Host Center
            </Link>
          )}
          {currentUser?.role === 'ADMIN' && (
            <Link to="/admin/dashboard" className={`nav-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`}>
              Admin Panel
            </Link>
          )}
        </nav>

        {/* Right Section: Role Switcher Demo Pill & User Menu */}
        <div className="navbar-right" ref={menuRef}>
          {/* Quick Demo Switcher Pill */}
          <div className="role-demo-badge" onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}>
            <span className="demo-dot"></span>
            <span className="role-label">Role: <strong>{currentUser?.role || 'GUEST'}</strong></span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 9 6 6 6-6" />
            </svg>

            {roleSwitcherOpen && (
              <div className="role-dropdown-menu">
                <div className="role-dropdown-header">Demo Role Switcher</div>
                <button
                  type="button"
                  className={`role-item ${currentUser?.role === 'GUEST' ? 'selected' : ''}`}
                  onClick={(e) => { e.stopPropagation(); switchRole('GUEST'); setRoleSwitcherOpen(false); }}
                >
                  <span className="role-item-icon">🧳</span>
                  <div>
                    <div className="role-item-title">Guest (Arjun Mehta)</div>
                    <div className="role-item-sub">Book stays & view reservations</div>
                  </div>
                </button>
                <button
                  type="button"
                  className={`role-item ${currentUser?.role === 'HOST' ? 'selected' : ''}`}
                  onClick={(e) => { e.stopPropagation(); switchRole('HOST'); setRoleSwitcherOpen(false); }}
                >
                  <span className="role-item-icon">🏡</span>
                  <div>
                    <div className="role-item-title">Host (Priya Sharma)</div>
                    <div className="role-item-sub">Manage listings & view earnings</div>
                  </div>
                </button>
                <button
                  type="button"
                  className={`role-item ${currentUser?.role === 'ADMIN' ? 'selected' : ''}`}
                  onClick={(e) => { e.stopPropagation(); switchRole('ADMIN'); setRoleSwitcherOpen(false); }}
                >
                  <span className="role-item-icon">⚡</span>
                  <div>
                    <div className="role-item-title">Administrator</div>
                    <div className="role-item-sub">System stats, properties & users</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* User Profile Button */}
          <button
            type="button"
            className="user-menu-trigger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="User navigation menu"
          >
            <div className="menu-hamburger-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </div>
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} className="user-avatar-img" />
            ) : (
              <div className="user-avatar-placeholder">
                {currentUser?.name?.[0] || 'U'}
              </div>
            )}
          </button>

          {/* User Dropdown Menu */}
          {menuOpen && (
            <div className="user-dropdown-card">
              <div className="dropdown-user-info">
                <div className="dropdown-user-name">{currentUser?.name}</div>
                <div className="dropdown-user-email">{currentUser?.email}</div>
                <span className="badge badge-info" style={{ marginTop: '4px' }}>{currentUser?.role}</span>
              </div>
              <div className="dropdown-divider"></div>

              <Link to="/my-bookings" className="dropdown-link">
                <span>🗓️ My Bookings</span>
              </Link>

              {currentUser?.role === 'HOST' && (
                <>
                  <Link to="/host/dashboard" className="dropdown-link">
                    <span>📊 Host Dashboard</span>
                  </Link>
                  <Link to="/host/properties/new" className="dropdown-link">
                    <span>➕ Add New Property</span>
                  </Link>
                </>
              )}

              {currentUser?.role === 'ADMIN' && (
                <Link to="/admin/dashboard" className="dropdown-link">
                  <span>🛡️ Admin Dashboard</span>
                </Link>
              )}

              <div className="dropdown-divider"></div>
              <Link to="/login" className="dropdown-link">
                <span>Sign in with another account</span>
              </Link>
              <Link to="/register" className="dropdown-link">
                <span>Register new user</span>
              </Link>
              <button
                type="button"
                className="dropdown-link logout-btn"
                onClick={() => { logout(); navigate('/'); }}
              >
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
