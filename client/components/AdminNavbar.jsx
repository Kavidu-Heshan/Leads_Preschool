import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../css/AdminNavbar.css';

const NavigationBar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (name, e) => {
    e.stopPropagation();
    if (window.innerWidth <= 768) {
      setOpenDropdown(openDropdown === name ? null : name);
    }
  };
  
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
    localStorage.removeItem('currentTeacher');
    sessionStorage.removeItem('currentTeacher');
    
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
    { 
      name: 'Academics', icon: '📚', 
      dropdown: [
        { path: '/announcements', name: 'Notice Board', icon: '📢' },
        { path: '/adminassignments', name: 'Assignments', icon: '📝' },
        { path: '/adminworksheetupload', name: 'Worksheets', icon: '📄' }
      ]
    },
    {
      name: 'Users', icon: '👥',
      dropdown: [
        { path: '/adminaddchild', name: 'Add Child', icon: '👶' },
        { path: '/adminStudentManagement', name: 'Students', icon: '🧑‍🎓' },
        { path: '/adminteachermanagement', name: 'Teachers', icon: '👩‍🏫' }
      ]
    },
    {
      name: 'Operations', icon: '⚙️',
      dropdown: [
        { path: '/qrscanner', name: 'Attendance', icon: '🌱' },
        { path: '/qrcodegenerator', name: 'QR Codes', icon: '📱' },
        { path: '/admindaycaredashboard', name: 'Daycare', icon: '🧸' }
      ]
    },
    {
      name: 'Media', icon: '🖼️',
      dropdown: [
        { path: '/admineditevent', name: 'Events', icon: '📅' },
        { path: '/uploadPhoto', name: 'Gallery', icon: '📸' },
        { path: '/adminmessage', name: 'Messages', icon: '💬' }
      ]
    }
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
            </div>

            {/* Navigation Items */}
            <ul className="nav-items">
              {navItems.map((item, index) => (
                <li key={item.name} className={`nav-item ${item.dropdown ? 'has-dropdown' : ''}`}>
                  {item.dropdown ? (
                    <>
                      <div 
                        className={`nav-link dropdown-trigger ${openDropdown === item.name ? 'mobile-open' : ''}`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                        onClick={(e) => toggleDropdown(item.name, e)}
                      >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-name">{item.name}</span>
                        <span className="dropdown-arrow-icon" style={{marginLeft: '4px', fontSize: '10px'}}>▼</span>
                      </div>
                      
                      <div className={`nav-dropdown-content ${openDropdown === item.name ? 'mobile-open' : ''}`}>
                        {item.dropdown.map(subItem => (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            className={`dropdown-item ${isActive(subItem.path) ? 'active' : ''}`}
                            onClick={closeMobileMenu}
                          >
                            <span className="nav-icon">{subItem.icon}</span>
                            <span className="nav-name">{subItem.name}</span>
                          </Link>
                        ))}
                      </div>
                    </>
                  ) : (
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
                  )}
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