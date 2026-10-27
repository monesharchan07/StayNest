import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/FormField';
import './AuthPages.css';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const redirectPath = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const user = await login(email, password);
      if (user.role === 'HOST') {
        navigate('/host/dashboard');
      } else if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate(redirectPath);
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in.');
    }
  };

  // Quick fill demo helper
  const handleQuickDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
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
          <h1 className="auth-title">Welcome to StayNest</h1>
          <p className="auth-subtitle">Sign in to your account or test with demo roles</p>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <FormField
            label="Email Address"
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          <FormField
            label="Password"
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Fast Login Pills for College Evaluation */}
        <div className="demo-accounts-box">
          <div className="demo-box-title">⚡ Quick College Demo Accounts</div>
          <p className="demo-box-sub">Click any persona to auto-fill credentials:</p>
          <div className="demo-buttons-list">
            <button
              type="button"
              className="demo-pill-btn"
              onClick={() => handleQuickDemo('arjun@example.com', 'guest123')}
            >
              <span>🧳 Guest</span>
              <span className="demo-email">arjun@example.com</span>
            </button>
            <button
              type="button"
              className="demo-pill-btn"
              onClick={() => handleQuickDemo('priya@example.com', 'host123')}
            >
              <span>🏡 Host</span>
              <span className="demo-email">priya@example.com</span>
            </button>
            <button
              type="button"
              className="demo-pill-btn"
              onClick={() => handleQuickDemo('admin@staynest.com', 'admin123')}
            >
              <span>🛡️ Admin</span>
              <span className="demo-email">admin@staynest.com</span>
            </button>
          </div>
        </div>

        <div className="auth-footer-prompt">
          <span>Don't have an account? </span>
          <Link to="/register" className="auth-link">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
