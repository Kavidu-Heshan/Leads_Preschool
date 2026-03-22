// AdminHome.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../css/AdminHome.css';
import NavigationBar from '../components/AdminNavbar';

const AdminHome = () => {
  // State for dashboard data
  const [stats, setStats] = useState({
    totalChildren: 0,
    totalTeachers: 0,
    todayEvents: 0,
    upcomingEvents: 0,
    pendingMessages: 0,
    daycarePresent: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Get admin info from localStorage
  const adminName = localStorage.getItem('adminName') || 'Administrator';
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Dashboard cards data
  const dashboardCards = [
    {
      id: 1,
      title: 'Child Management',
      description: 'Register and manage children profiles, view registered children',
      icon: '👧',
      path: '/adminaddchild',
      color: '#4caf50',
      bgColor: 'rgba(76, 175, 80, 0.1)'
    },
    {
      id: 2,
      title: 'Teacher Management',
      description: 'Manage teacher profiles, assign classes, track attendance',
      icon: '👩‍🏫',
      path: '/adminteachermanagement',
      color: '#8bc34a',
      bgColor: 'rgba(139, 195, 74, 0.1)'
    },
    {
      id: 3,
      title: 'Daycare Overview',
      description: 'Track daycare attendance and manage student presence',
      icon: '🏫',
      path: '/admindaycaredashboard',
      color: '#66bb6a',
      bgColor: 'rgba(102, 187, 106, 0.1)'
    },
    {
      id: 4,
      title: 'Event Management',
      description: 'Create, edit, and manage school events and activities',
      icon: '📅',
      path: '/admineditevent',
      color: '#43a047',
      bgColor: 'rgba(67, 160, 71, 0.1)'
    },
    {
      id: 5,
      title: 'Event Photo Gallery',
      description: 'Upload and manage photos from school events',
      icon: '📸',
      path: '/uploadPhoto',
      color: '#2e7d32',
      bgColor: 'rgba(46, 125, 50, 0.1)'
    },
    {
      id: 6,
      title: 'Message Center',
      description: 'View and respond to messages from parents and visitors',
      icon: '💬',
      path: '/adminmessage',
      color: '#689f38',
      bgColor: 'rgba(104, 159, 56, 0.1)'
    },
    {
      id: 7,
      title: 'Create Event',
      description: 'Quickly create new school events and activities',
      icon: '✏️',
      path: '/adminevent',
      color: '#558b2f',
      bgColor: 'rgba(85, 139, 47, 0.1)'
    }
  ];

  // Fetch dashboard data from API
  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 5 minutes
    const intervalId = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch children count
      const childrenRes = await axios.get('http://localhost:3002/children');
      const totalChildren = childrenRes.data.length;

      // Fetch teachers count
      const teachersRes = await axios.get('http://localhost:3002/teachers');
      const totalTeachers = teachersRes.data.length;

      // Fetch events stats
      const eventsStatsRes = await axios.get('http://localhost:3002/events/stats/summary');
      const { today, upcoming } = eventsStatsRes.data;

      // Fetch messages count
      const messagesRes = await axios.get('http://localhost:3002/messages');
      const pendingMessages = messagesRes.data.filter(m => m.status === 'pending').length;

      // Fetch daycare present today
      const daycareRes = await axios.get('http://localhost:3002/daycare/today');
      const daycarePresent = daycareRes.data.length;

      setStats({
        totalChildren,
        totalTeachers,
        todayEvents: today || 0,
        upcomingEvents: upcoming || 0,
        pendingMessages,
        daycarePresent
      });

      // Fetch upcoming events for display
      const upcomingEventsRes = await axios.get('http://localhost:3002/events/upcoming/list');
      setUpcomingEvents(upcomingEventsRes.data.slice(0, 5));

      // Generate recent activities (mix of real and simulated data)
      const activities = [];
      
      // Add real activities based on data
      if (totalChildren > 0) {
        activities.push({
          id: 1,
          action: `${totalChildren} children registered in system`,
          user: 'System',
          time: 'Today',
          icon: '👶',
          type: 'info'
        });
      }
      
      if (today > 0) {
        activities.push({
          id: 2,
          action: `${today} event${today > 1 ? 's are' : ' is'} happening today`,
          user: 'System',
          time: 'Today',
          icon: '📅',
          type: 'event'
        });
      }
      
      if (pendingMessages > 0) {
        activities.push({
          id: 3,
          action: `${pendingMessages} pending message${pendingMessages > 1 ? 's' : ''} to review`,
          user: 'System',
          time: 'Today',
          icon: '💬',
          type: 'message'
        });
      }
      
      if (daycarePresent > 0) {
        activities.push({
          id: 4,
          action: `${daycarePresent} child${daycarePresent > 1 ? 'ren are' : ' is'} present at daycare today`,
          user: 'System',
          time: 'Today',
          icon: '🏫',
          type: 'info'
        });
      }
      
      setRecentActivities(activities);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.getTime() === today.getTime()) {
      return 'Today';
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const formatEventTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Quick Stats data
  const quickStats = [
    { 
      label: 'Total Children', 
      value: stats.totalChildren, 
      icon: '👧', 
      trend: '+12%', 
      trendUp: true,
      color: '#4caf50'
    },
    { 
      label: 'Total Teachers', 
      value: stats.totalTeachers, 
      icon: '👩‍🏫', 
      trend: '+2', 
      trendUp: true,
      color: '#8bc34a'
    },
    { 
      label: 'Today\'s Events', 
      value: stats.todayEvents, 
      icon: '📅', 
      trend: stats.todayEvents > 0 ? `${stats.todayEvents} today` : 'No events',
      trendUp: stats.todayEvents > 0,
      color: '#ff9800'
    },
    { 
      label: 'Upcoming Events', 
      value: stats.upcomingEvents, 
      icon: '⏳', 
      trend: `${stats.upcomingEvents} upcoming`,
      trendUp: stats.upcomingEvents > 0,
      color: '#2196f3'
    },
    { 
      label: 'Pending Messages', 
      value: stats.pendingMessages, 
      icon: '💬', 
      trend: stats.pendingMessages > 0 ? 'Needs attention' : 'All resolved',
      trendUp: stats.pendingMessages === 0,
      color: '#f44336'
    },
    { 
      label: 'Daycare Present', 
      value: `${stats.daycarePresent}/5`, 
      icon: '🏫', 
      trend: stats.daycarePresent >= 5 ? 'Full capacity' : `${5 - stats.daycarePresent} spots left`,
      trendUp: stats.daycarePresent < 5,
      color: '#9c27b0'
    }
  ];

  return (
    <>
      {/* CHANGE 2: Render the NavigationBar component */}
      <NavigationBar />
      
      {/* CHANGE 3: Added inline style padding to push the content down 
        so it doesn't get hidden behind the fixed NavigationBar 
      */}
    <div className="admin-home">
      {/* Nature Background with animated elements */}
      <div className="nature-bg">
        <div className="leaf leaf-1">🌿</div>
        <div className="leaf leaf-2">🍃</div>
        <div className="leaf leaf-3">🌱</div>
        <div className="leaf leaf-4">🌿</div>
        <div className="leaf leaf-5">🍂</div>
        <div className="leaf leaf-6">🍃</div>
        <div className="leaf leaf-7">🌿</div>
        <div className="leaf leaf-8">🍃</div>
        <div className="flower flower-1">🌸</div>
        <div className="flower flower-2">🌻</div>
        <div className="flower flower-3">🌼</div>
        <div className="flower flower-4">🌺</div>
      </div>

      {/* Floating decorative circles */}
      <div className="floating-circle circle-1"></div>
      <div className="floating-circle circle-2"></div>
      <div className="floating-circle circle-3"></div>
      <div className="floating-circle circle-4"></div>
      <div className="floating-circle circle-5"></div>

      <div className="admin-content">
        {/* Welcome Section */}
        <div className="welcome-section animate-slide-down">
          <div className="welcome-header">
            <div className="welcome-icon-wrapper">
              <div className="welcome-icon">
                <span className="welcome-emoji">👋</span>
              </div>
              <div className="pulse-ring"></div>
            </div>
            <div className="welcome-text">
              <h1>Welcome back, {adminName}!</h1>
              <p className="welcome-date">{currentDate}</p>
              <p className="welcome-message">
                Manage your preschool with ease. Here's your dashboard overview.
              </p>
            </div>
            <div className="welcome-stats">
              <div className="mini-stat">
                <span className="mini-stat-value">{new Date().getHours() < 12 ? '🌅' : new Date().getHours() < 18 ? '☀️' : '🌙'}</span>
                <span className="mini-stat-label">
                  {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-message animate-fade-in">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button className="error-close" onClick={() => setError('')}>✕</button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading dashboard data...</p>
          </div>
        ) : (
          <>
            {/* Quick Stats Cards */}
            <div className="stats-section">
              <h2 className="section-title animate-fade-in">Quick Overview</h2>
              <div className="stats-grid">
                {quickStats.map((stat, index) => (
                  <div 
                    key={stat.label} 
                    className="stat-card animate-scale-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="stat-icon-wrapper" style={{ backgroundColor: `${stat.color}15` }}>
                      <span className="stat-icon">{stat.icon}</span>
                    </div>
                    <div className="stat-info">
                      <h3 className="stat-value">{stat.value}</h3>
                      <p className="stat-label">{stat.label}</p>
                    </div>
                    <div className={`stat-trend ${stat.trendUp ? 'trend-up' : 'trend-down'}`}>
                      {stat.trend}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Dashboard Cards */}
            <div className="dashboard-section">
              <h2 className="section-title animate-fade-in">Management Tools</h2>
              <div className="dashboard-grid">
                {dashboardCards.map((card, index) => (
                  <Link 
                    to={card.path} 
                    key={card.id}
                    className="dashboard-card animate-scale-up"
                    style={{ 
                      animationDelay: `${index * 0.03}s`,
                      borderBottomColor: card.color
                    }}
                  >
                    <div className="card-icon-wrapper" style={{ backgroundColor: card.bgColor }}>
                      <span className="card-icon" style={{ color: card.color }}>{card.icon}</span>
                    </div>
                    <div className="card-content">
                      <h3 className="card-title">{card.title}</h3>
                      <p className="card-description">{card.description}</p>
                    </div>
                    <div className="card-arrow">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Insights Section - Recent Activities & Upcoming Events */}
            <div className="insights-section">
              <div className="insights-grid">
                {/* Recent Activities */}
                <div className="insight-card activities-card animate-slide-up">
                  <div className="card-header">
                    <h3 className="insight-title">
                      <span className="title-icon">📋</span>
                      Recent Activities
                    </h3>
                    <button className="refresh-btn" onClick={fetchDashboardData} title="Refresh">
                      🔄
                    </button>
                  </div>
                  <div className="activities-list">
                    {recentActivities.length === 0 ? (
                      <div className="empty-activities">
                        <span className="empty-icon">📭</span>
                        <p>No recent activities</p>
                      </div>
                    ) : (
                      recentActivities.map((activity, index) => (
                        <div 
                          key={activity.id} 
                          className="activity-item"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className={`activity-icon ${activity.type}`}>
                            {activity.icon}
                          </div>
                          <div className="activity-details">
                            <p className="activity-action">{activity.action}</p>
                            <div className="activity-meta">
                              <span className="activity-user">{activity.user}</span>
                              <span className="activity-time">{activity.time}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Upcoming Events */}
                <div className="insight-card events-card animate-slide-up">
                  <div className="card-header">
                    <h3 className="insight-title">
                      <span className="title-icon">⏰</span>
                      Upcoming Events
                    </h3>
                    <Link to="/admineditevent" className="view-all-link">View All →</Link>
                  </div>
                  <div className="events-list">
                    {upcomingEvents.length === 0 ? (
                      <div className="empty-events">
                        <span className="empty-icon">📅</span>
                        <p>No upcoming events</p>
                        <Link to="/adminevent" className="create-event-link">Create your first event</Link>
                      </div>
                    ) : (
                      upcomingEvents.map((event, index) => (
                        <div 
                          key={event.eventId || index} 
                          className="event-item"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="event-date-badge">
                            <span className="event-day">{formatEventDate(event.eventDate)}</span>
                          </div>
                          <div className="event-details">
                            <p className="event-name">{event.eventName}</p>
                            <p className="event-time">
                              {formatEventTime(event.eventTime)}
                              {event.endTime && ` - ${formatEventTime(event.endTime)}`}
                            </p>
                            <p className="event-venue">{event.venue}</p>
                          </div>
                          <div className="event-icon">{event.eventType === 'Cultural' ? '🎭' : event.eventType === 'Sports' ? '⚽' : '📅'}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Section */}
            <div className="quick-actions-section">
              <h2 className="section-title animate-fade-in">Quick Actions</h2>
              <div className="quick-actions-grid">
                <Link to="/adminaddchild" className="quick-action-btn animate-pulse-hover">
                  <span className="action-icon">👧</span>
                  <span>Add Child</span>
                </Link>
                <Link to="/adminteachermanagement" className="quick-action-btn animate-pulse-hover">
                  <span className="action-icon">👩‍🏫</span>
                  <span>Add Teacher</span>
                </Link>
                <Link to="/adminevent" className="quick-action-btn animate-pulse-hover">
                  <span className="action-icon">📅</span>
                  <span>Create Event</span>
                </Link>
                <Link to="/uploadPhoto" className="quick-action-btn animate-pulse-hover">
                  <span className="action-icon">📸</span>
                  <span>Upload Photos</span>
                </Link>
                <Link to="/adminmessage" className="quick-action-btn animate-pulse-hover">
                  <span className="action-icon">💬</span>
                  <span>View Messages</span>
                </Link>
                <Link to="/admindaycaredashboard" className="quick-action-btn animate-pulse-hover">
                  <span className="action-icon">🏫</span>
                  <span>Daycare Report</span>
                </Link>
              </div>
            </div>

            {/* System Status Footer */}
            <div className="system-status">
              <div className="status-indicator">
                <span className="status-dot green"></span>
                <span>System Online</span>
              </div>
              <div className="last-updated">
                <span className="update-icon">🔄</span>
                Last updated: {new Date().toLocaleTimeString()}
              </div>
              <div className="auto-refresh">
                <span className="refresh-dot"></span>
                Auto-refreshes every 5 minutes
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    </>
  );
};

export default AdminHome;