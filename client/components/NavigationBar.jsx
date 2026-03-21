// NavigationBar.jsx
import React, { useState } from 'react';
import '../css/NavigationBar.css';

const NavigationBar = () => {
  const [activePage, setActivePage] = useState('home');

  const navItems = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'student', icon: '👨‍🎓', label: 'Student Profile' },
    { id: 'child', icon: '🧸', label: 'Child Dashboard' },
    { id: 'event', icon: '📅', label: 'User Event' },
    { id: 'teacher', icon: '👩‍🏫', label: 'Teacher Page' },
    { id: 'feedback', icon: '⭐', label: 'Feedback' }
  ];

  const handleNavClick = (pageId) => {
    setActivePage(pageId);
  };

  return (
    <nav className="navbar">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`nav-item ${activePage === item.id ? 'active' : ''}`}
          onClick={() => handleNavClick(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default NavigationBar;