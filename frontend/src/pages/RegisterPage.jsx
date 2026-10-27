import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/FormField';
import { isValidEmail, isValidPhone } from '../utils/helpers';
import './AuthPages.css';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('GUEST');

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Full name is required.';
    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!isValidEmail(email)) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!phone.trim()) {
      errs.phone = 'Phone number is required.';
    } else if (!isValidPhone(phone)) {
      errs.phone = 'Enter a valid 10-digit Indian phone number.';
    }
    if (!password || password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    try {
      const newUser = await register({ name, email, phone, role, password });
      if (newUser.role === 'HOST') {
        navigate('/host/dashboard');
      } else {
        navigate('/search');
      }
    } catch (err) {
      setGlobalError(err.message || 'Registration failed.');
    }
  };

  return (
    <div className="staynest-auth-page">
      <div className="auth-card card">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Join StayNest as a guest or list your own properties as a host</p>
        </div>

        {globalError && <div className="auth-error-banner">{globalError}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Role Selection */}
          <div className="form-group">
            <label className="form-label">I want to register as</label>
            <div className="role-selector-radios">
              <label className={`role-radio-card ${role === 'GUEST' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="userRole"
                  value="GUEST"
                  checked={role === 'GUEST'}
                  onChange={() => setRole('GUEST')}
                />
                <div className="role-radio-content">
                  <span className="role-radio-icon">🧳</span>
                  <div>
                    <div className="role-radio-title">Guest</div>
                    <div className="role-radio-desc">Book vacation stays</div>
                  </div>
                </div>
              </label>

              <label className={`role-radio-card ${role === 'HOST' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="userRole"
                  value="HOST"
                  checked={role === 'HOST'}
                  onChange={() => setRole('HOST')}
                />
                <div className="role-radio-content">
                  <span className="role-radio-icon">🏡</span>
                  <div>
                    <div className="role-radio-title">Host</div>
                    <div className="role-radio-desc">List accommodations</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <FormField
            label="Full Name"
            id="reg-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rahul Sharma"
            error={errors.name}
            required
          />

          <FormField
            label="Email Address (Unique)"
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            error={errors.email}
            required
          />

          <FormField
            label="Phone Number"
            id="reg-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10-digit mobile number"
            error={errors.phone}
            required
          />

          <FormField
            label="Password"
            id="reg-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            error={errors.password}
            helpText="Passwords will be hashed in the MySQL backend."
            required
          />

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            {loading ? 'Creating account...' : `Sign Up as ${role}`}
          </button>
        </form>

        <div className="auth-footer-prompt">
          <span>Already have an account? </span>
          <Link to="/login" className="auth-link">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
