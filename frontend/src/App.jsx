import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import PropertyPage from './pages/PropertyPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MyBookingsPage from './pages/MyBookingsPage';
import HostDashboard from './pages/HostDashboard';
import AddPropertyPage from './pages/AddPropertyPage';
import AdminDashboard from './pages/AdminDashboard';

// Auto scroll-to-top helper on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/property/:id" element={<PropertyPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/host/dashboard" element={<HostDashboard />} />
          <Route path="/host/properties/new" element={<AddPropertyPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          {/* Fallback route */}
          <Route path="*" element={<HomePage />} />
        </Routes>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}
