// NavigationBar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../css/AdminNavbar.css';

const UserNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Handle scroll effect
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    // Clear admin session
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminName');
    localStorage.removeItem('adminRole');
    localStorage.removeItem('adminId');
    
    // Redirect to login page
    navigate('/childenroll');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // Prevent body scroll when menu is open
    if (!isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    document.body.style.overflow = 'auto';
  };

  const navItems = [
    { path: '/userhome', name: 'Home Page', icon: '📊' },
    // { path: '/adminaddchild', name: 'Add Child', icon: '👶' },
    { path: '/teacher', name: 'Teachers', icon: '👩‍🏫' },
    { path: '/addDaycare', name: 'Daycare', icon: '🧸' },
    { path: '/userevent', name: 'Events', icon: '📅' },
    { path: '/message', name: 'Messages', icon: '💬' }
    // { path: '/photo', name: 'Gallery', icon: '🖼️' }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      <nav className={`navigation-bar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          {/* Logo Section */}
          <Link to="/childdashboard" className="nav-logo" onClick={closeMobileMenu}>
            <div className="logo-icon">
              <span>🏫</span>
            </div>
            <div className="logo-text">
              <span className="logo-title">Leads Preschool</span>
              {/* <span className="logo-subtitle">Management System</span> */}
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`}>
            
            {/* Mobile Menu Close Button (Header removed) */}
            <div className="mobile-menu-header" style={{ justifyContent: 'flex-end', padding: '15px' }}>
              <button className="mobile-close-btn" onClick={closeMobileMenu}>
                ✕
              </button>
            </div>

            {/* Navigation Items */}
            <ul className="nav-items">
              {navItems.map((item, index) => (
                <li key={item.path} className="nav-item">
                  <Link
                    to={item.path}
                    className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                    onClick={closeMobileMenu}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-name">{item.name}</span>
                    {isActive(item.path) && <span className="active-dot"></span>}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Mobile Logout Button */}
            <div className="mobile-logout">
              <button onClick={handleLogout} className="mobile-logout-btn">
                <span>🚪</span>
                Logout
              </button>
            </div>
          </div>

          {/* Desktop Logout Button (Replaced Profile Dropdown) */}
          <div className="nav-profile">
             <button onClick={handleLogout} className="desktop-logout-btn" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: '#ffebee',
                border: '1px solid #ffcdd2',
                borderRadius: '8px',
                color: '#d32f2f',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
             }}>
                <span>🚪</span>
                Logout
             </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className={`mobile-menu-btn ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={closeMobileMenu}></div>
      )}
    </>
  );
};

export default UserNavbar;