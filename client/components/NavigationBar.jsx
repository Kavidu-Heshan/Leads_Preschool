// Navigationbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../css/Navigationbar.css';

const Navigationbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Check if user is logged in and get user info
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userRole = localStorage.getItem('userRole');
  const userName = localStorage.getItem('userName') || 'User';
  const isAdmin = userRole === 'admin' || localStorage.getItem('isAdmin') === 'true';

  // Navigation items based on role
  const navItems = [
    { path: '/', label: 'Home', icon: '🏠', requiresAuth: false },
    { path: '/about', label: 'About', icon: '📖', requiresAuth: false },
    { path: '/contact', label: 'Contact', icon: '📞', requiresAuth: false },
    { path: '/contact-form', label: 'Message Us', icon: '💬', requiresAuth: false }
  ];

  // Admin-only navigation items
  const adminNavItems = [
    { path: '/admin-add-child', label: 'Child Management', icon: '👧', requiresAuth: true },
    { path: '/admin-teacher-management', label: 'Teacher Management', icon: '👩‍🏫', requiresAuth: true },
    { path: '/admin-daycare-dashboard', label: 'Daycare Overview', icon: '🏫', requiresAuth: true },
    { path: '/admin-event-management', label: 'Event Management', icon: '📅', requiresAuth: true },
    { path: '/event-photo-upload', label: 'Photo Gallery', icon: '📸', requiresAuth: true },
    { path: '/admin-message', label: 'Messages', icon: '💬', requiresAuth: true }
  ];

  // Parent navigation items (if needed)
  const parentNavItems = [
    { path: '/parent-dashboard', label: 'Dashboard', icon: '📊', requiresAuth: true },
    { path: '/parent-messages', label: 'Messages', icon: '💬', requiresAuth: true },
    { path: '/parent-events', label: 'Events', icon: '📅', requiresAuth: true },
    { path: '/parent-gallery', label: 'Gallery', icon: '📸', requiresAuth: true }
  ];

  // Combine navigation items based on role
  let displayedNavItems = [...navItems];
  
  if (isLoggedIn) {
    if (isAdmin) {
      displayedNavItems = [...displayedNavItems, ...adminNavItems];
    } else if (userRole === 'parent') {
      displayedNavItems = [...displayedNavItems, ...parentNavItems];
    }
  }

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isMobileMenuOpen && !e.target.closest('.navbar')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('isAdmin');
    window.location.href = '/';
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo Section */}
        <Link to="/" className="navbar-logo animate-fade-in">
          <div className="logo-icon">
            <span className="logo-emoji">🌿</span>
            <span className="logo-emoji-second">🍃</span>
          </div>
          <div className="logo-text">
            <span className="logo-title">Little Sprouts</span>
            <span className="logo-subtitle">Preschool</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-menu desktop-menu">
          {displayedNavItems.map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'active' : ''} animate-slide-down`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {isActive(item.path) && <span className="nav-indicator"></span>}
            </Link>
          ))}
        </div>

        {/* Auth Section */}
        <div className="navbar-auth animate-fade-in">
          {isLoggedIn ? (
            <div className="user-menu">
              <div className="user-avatar">
                <span className="avatar-icon">
                  {userName.charAt(0).toUpperCase()}
                </span>
                <div className="avatar-ring"></div>
              </div>
              <div className="user-dropdown">
                <div className="user-info">
                  <span className="user-name">{userName}</span>
                  <span className="user-role-badge">
                    {isAdmin ? 'Admin' : userRole === 'parent' ? 'Parent' : 'User'}
                  </span>
                </div>
                <Link to="/profile" className="dropdown-item">
                  <span>👤</span> Profile
                </Link>
                <Link to="/settings" className="dropdown-item">
                  <span>⚙️</span> Settings
                </Link>
                <button onClick={handleLogout} className="dropdown-item logout-btn">
                  <span>🚪</span> Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="auth-btn login-btn">
                <span>🔑</span> Login
              </Link>
              <Link to="/register" className="auth-btn register-btn">
                <span>📝</span> Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className={`mobile-menu-btn ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className="menu-icon"></span>
          <span className="menu-icon"></span>
          <span className="menu-icon"></span>
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          {isLoggedIn ? (
            <div className="mobile-user-info">
              <div className="mobile-user-avatar">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="mobile-user-details">
                <span className="mobile-user-name">{userName}</span>
                <span className="mobile-user-role">
                  {isAdmin ? 'Administrator' : userRole === 'parent' ? 'Parent' : 'User'}
                </span>
              </div>
            </div>
          ) : (
            <div className="mobile-auth-buttons">
              <Link to="/login" className="mobile-login-btn" onClick={() => setIsMobileMenuOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="mobile-register-btn" onClick={() => setIsMobileMenuOpen(false)}>
                Register
              </Link>
            </div>
          )}
        </div>
        
        <div className="mobile-menu-items">
          {displayedNavItems.map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-nav-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              <span className="mobile-nav-icon">{item.icon}</span>
              <span className="mobile-nav-label">{item.label}</span>
              {isActive(item.path) && <span className="mobile-active-indicator"></span>}
            </Link>
          ))}
        </div>
        
        {isLoggedIn && (
          <div className="mobile-menu-footer">
            <button onClick={handleLogout} className="mobile-logout-btn">
              <span>🚪</span> Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigationbar;