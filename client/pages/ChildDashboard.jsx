import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/ChildDashboard.css'; 

const ChildDashboard = () => {
  const navigate = useNavigate();

  // Function to handle the navigation when the card is clicked
  const handleEditProfileClick = () => {
    navigate('/studentprofileform');
  };

  const handleProfileManagementClick = () => {
    navigate('/studentprofileManagement');
  };

  return (
    <div className="dashboard-container">
      <div className="nature-bg">
        <div className="leaf leaf-1">🌿</div>
        <div className="leaf leaf-2">🍃</div>
        <div className="leaf leaf-3">🌱</div>
        <div className="leaf leaf-4">🌿</div>
        <div className="leaf leaf-5">🍂</div>
        <div className="leaf leaf-6">🍃</div>
        <div className="leaf leaf-7">🌱</div>
        <div className="leaf leaf-8">🌿</div>
      </div>

      <div className="floating-circle circle-1"></div>
      <div className="floating-circle circle-2"></div>
      <div className="floating-circle circle-3"></div>

      <div className="dashboard-content">
        <div className="welcome-section">
          <div className="welcome-icon">
            <span className="welcome-emoji">🌱</span>
          </div>
          <h1>Welcome to Your Dashboard!</h1>
          <p className="welcome-subtitle">
            Your journey of learning and growth starts here
          </p>
        </div>

        <div className="cards-grid">
          {/* Edit Profile Card */}
          <div 
            className="dashboard-card" 
            onClick={handleEditProfileClick}
            onKeyPress={(e) => e.key === 'Enter' && handleEditProfileClick()}
            role="button"
            tabIndex={0}
          >
            <div className="card-glow"></div>
            <div className="card-icon-wrapper">
              <span className="card-icon">👤</span>
            </div>
            <h3 className="card-title">Edit Profile</h3>
            <p className="card-description">
              Update your personal details, emergency contacts, and medical information
            </p>
            <span className="card-badge">
              <span>✏️</span> Click to edit
            </span>
          </div>

          {/* Profile Management Card */}
          <div 
            className="dashboard-card" 
            onClick={handleProfileManagementClick}
            onKeyPress={(e) => e.key === 'Enter' && handleProfileManagementClick()}
            role="button"
            tabIndex={0}
          >
            <div className="card-glow"></div>
            <div className="card-icon-wrapper">
              <span className="card-icon">📋</span>
            </div>
            <h3 className="card-title">Profile Management</h3>
            <p className="card-description">
              View and manage all your profile information in one place
            </p>
            <span className="card-badge">
              <span>📊</span> Manage profile
            </span>
          </div>

          {/* Placeholder for future features */}
          <div className="dashboard-card card-placeholder">
            <div className="card-icon-wrapper" style={{ background: '#A5D6A7' }}>
              <span className="card-icon">🔜</span>
            </div>
            <h3 className="card-title">More Features</h3>
            <p className="card-description">
              Attendance tracking, grades, and more coming soon!
            </p>
            <span className="card-badge" style={{ background: '#F1F8E9' }}>
              <span>⏳</span> Coming soon
            </span>
          </div>
        </div>

        <div className="decorative-line"></div>

        <div className="quote-container">
          <p className="quote-text">
            "Education is the most powerful weapon which you can use to change the world."
          </p>
          <p className="quote-author">- Nelson Mandela</p>
        </div>

        <div className="dashboard-footer">
          <div className="footer-decoration">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
          <p className="footer-text">
            <span>🌿</span> Growing together, learning forever <span>🌿</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChildDashboard;