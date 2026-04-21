import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../css/AdminNavbar.css';

const NavigationBar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // FIX: Use lazy initialization to read from localStorage immediately
  // This prevents the cascading render error and removes the need for the useEffect
  // eslint-disable-next-line no-unused-vars
  const [adminInfo, setAdminInfo] = useState(() => {
    try {
      const storedAdmin = localStorage.getItem('adminInfo');
      return storedAdmin ? JSON.parse(storedAdmin) : null;
    } catch (e) {
      console.error('Error parsing admin info:', e);
      return null;
    }
  });
  
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
    localStorage.removeItem('adminInfo');
    
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
    { path: '/adminhome', name: 'Dashboard', icon: '📊' },
    { path: '/adminaddchild', name: 'Add Child', icon: '👶' },
    { path: '/adminteachermanagement', name: 'Teachers', icon: '👩‍🏫' },
    { path: '/admindaycaredashboard', name: 'Daycare', icon: '🧸' },
    { path: '/admineditevent', name: 'Events', icon: '📅' },
    { path: '/adminmessage', name: 'Messages', icon: '💬' },
    { path: '/uploadPhoto', name: 'Gallery', icon: '🖼️' },
    { path: '/adminworksheetupload', name: 'Upload worksheet', icon: '📱' },
    { path: '/adminStudentManagement', name: 'Students', icon: '👥' },
    { path: '/qrscanner', name: 'Attendance', icon: '🌱' },
    { path: '/qrcodegenerator', name: 'QR Codes', icon: '📱' }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Get admin initials for avatar
  const getInitials = () => {
    if (adminInfo?.name) {
      return adminInfo.name.charAt(0).toUpperCase();
    }
    return 'A';
  };

  return (
    <>
      <nav className={`navigation-bar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          {/* Logo Section */}
          <Link to="/adminhome" className="nav-logo" onClick={closeMobileMenu}>
            <div className="logo-icon">
              <span>🏫</span>
            </div>
            <div className="logo-text">
              <span className="logo-title">Preschool Admin</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`}>
            
            {/* Mobile Menu Header */}
            <div className="mobile-menu-header">
              <div className="mobile-user-info">
                <div className="mobile-avatar">
                  {getInitials()}
                </div>
                <div className="mobile-user-details">
                  <span className="mobile-user-name">{adminInfo?.name || 'Admin'}</span>
                  <span className="mobile-user-role">{adminInfo?.role || 'Administrator'}</span>
                </div>
              </div>
              <button className="mobile-close-btn" onClick={closeMobileMenu} aria-label="Close menu">
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

          {/* Desktop Profile Section */}
          <div className="nav-profile">
            <div className="profile-dropdown">
              <button className="profile-btn" aria-label="Profile menu">
                <div className="profile-avatar">
                  {getInitials()}
                </div>
                <div className="profile-info">
                  <span className="profile-name">{adminInfo?.name || 'Admin'}</span>
                  <span className="profile-role">{adminInfo?.role || 'Administrator'}</span>
                </div>
                <span className="dropdown-arrow">▼</span>
              </button>
              <div className="dropdown-content">
                <div className="dropdown-divider"></div>
                <button onClick={handleLogout} className="dropdown-item logout">
                  <span>🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            </div>
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

export default NavigationBar;