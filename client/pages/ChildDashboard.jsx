// ChildDashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/ChildDashboard.css';

const ChildDashboard = () => {
  const navigate = useNavigate();

  // Navigation handlers
  const handleChildEnroll = () => {
    navigate('/childenroll');
  };

  const handleProfileManagement = () => {
    navigate('/studentprofileManagement');
  };

  const handleUserEvents = () => {
    navigate('/userevent');
  };

  const handleTeacherDirectory = () => {
    navigate('/teacher');
  };

  const handleAddDaycare = () => {
    navigate('/addDaycare');
  };

  const handleMessage = () => {
    navigate('/message');
  };

  const cards = [
    {
      id: 1,
      title: "Child Enrollment",
      description: "Register your child for preschool programs and secure their spot",
      icon: "👶",
      color: "#4CAF50",
      bgColor: "#E8F5E9",
      path: "/childenroll",
      onClick: handleChildEnroll,
      badge: "Enroll now",
      badgeIcon: "✨"
    },
    {
      id: 2,
      title: "Profile Management",
      description: "View and manage all your profile information in one place",
      icon: "📋",
      color: "#2196F3",
      bgColor: "#E3F2FD",
      path: "/studentprofileManagement",
      onClick: handleProfileManagement,
      badge: "Manage",
      badgeIcon: "📊"
    },
    {
      id: 3,
      title: "Events & Activities",
      description: "Discover upcoming events, workshops, and special activities",
      icon: "📅",
      color: "#FF9800",
      bgColor: "#FFF3E0",
      path: "/userevent",
      onClick: handleUserEvents,
      badge: "View events",
      badgeIcon: "🎉"
    },
    {
      id: 4,
      title: "Teacher Directory",
      description: "Meet our dedicated teachers and learn about their qualifications",
      icon: "👩‍🏫",
      color: "#9C27B0",
      bgColor: "#F3E5F5",
      path: "/teacher",
      onClick: handleTeacherDirectory,
      badge: "Meet teachers",
      badgeIcon: "⭐"
    },
    {
      id: 5,
      title: "Daycare Registration",
      description: "Register for daycare facilities and manage attendance",
      icon: "🧸",
      color: "#00BCD4",
      bgColor: "#E0F7FA",
      path: "/addDaycare",
      onClick: handleAddDaycare,
      badge: "Register",
      badgeIcon: "🏃"
    },
    {
      id: 6,
      title: "Messages & Notifications",
      description: "View important updates, announcements, and messages",
      icon: "💬",
      color: "#F44336",
      bgColor: "#FFEBEE",
      path: "/message",
      onClick: handleMessage,
      badge: "Check messages",
      badgeIcon: "🔔"
    }
  ];

  return (
    <div className="dashboard-container">
      {/* Nature Background Elements */}
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

      {/* Floating Circles */}
      <div className="floating-circle circle-1"></div>
      <div className="floating-circle circle-2"></div>
      <div className="floating-circle circle-3"></div>

      <div className="dashboard-content">
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-icon">
            <span className="welcome-emoji">🌱</span>
          </div>
          <h1>Welcome to Your Dashboard!</h1>
          <p className="welcome-subtitle">
            Your journey of learning and growth starts here
          </p>
        </div>

        {/* Cards Grid */}
        <div className="cards-grid">
          {cards.map((card, index) => (
            <div 
              key={card.id}
              className="dashboard-card"
              onClick={card.onClick}
              onKeyPress={(e) => e.key === 'Enter' && card.onClick()}
              role="button"
              tabIndex={0}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="card-glow"></div>
              <div 
                className="card-icon-wrapper"
                style={{ background: card.bgColor }}
              >
                <span className="card-icon" style={{ color: card.color }}>
                  {card.icon}
                </span>
              </div>
              <h3 className="card-title">{card.title}</h3>
              <p className="card-description">{card.description}</p>
              <span className="card-badge">
                <span>{card.badgeIcon}</span> {card.badge}
              </span>
            </div>
          ))}
        </div>

        <div className="decorative-line"></div>

        {/* Quote Section */}
        <div className="quote-container">
          <p className="quote-text">
            "Education is the most powerful weapon which you can use to change the world."
          </p>
          <p className="quote-author">- Nelson Mandela</p>
        </div>

        {/* Footer */}
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