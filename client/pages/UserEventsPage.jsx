import React, { useState, useEffect } from 'react';
import "../css/UserEventsPage.css";
import UserNavbar from '../components/UserNavbar';

const UserEventsPage = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [events, setEvents] = useState({
    upcoming: [],
    today: [],
    past: []
  });
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    today: 0,
    past: 0,
    ongoing: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch events on component mount and set up auto-refresh
  useEffect(() => {
    fetchAllEvents();
    
    // Auto-refresh every 5 minutes (300000 ms)
    const intervalId = setInterval(() => {
      fetchAllEvents();
      setLastUpdated(new Date());
    }, 300000);

    return () => clearInterval(intervalId);
  }, []);

  // Refresh events when tab changes
  useEffect(() => {
    if (!loading) {
      fetchAllEvents();
    }
  }, [activeTab]);

  const fetchAllEvents = async () => {
    setLoading(true);
    try {
      // Fetch statistics first
      const statsRes = await fetch('https://leadspreschool-production.up.railway.app//events/stats/summary');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch upcoming events (excluding today)
      const upcomingRes = await fetch('https://leadspreschool-production.up.railway.app//events/upcoming/list');
      const upcomingData = await upcomingRes.json();

      // Fetch today's events
      const todayRes = await fetch('https://leadspreschool-production.up.railway.app//events/today/list');
      const todayData = await todayRes.json();

      // Fetch past events
      const pastRes = await fetch('https://leadspreschool-production.up.railway.app//events/past/list');
      const pastData = await pastRes.json();

      setEvents({
        upcoming: Array.isArray(upcomingData) ? upcomingData : [],
        today: Array.isArray(todayData) ? todayData : [],
        past: Array.isArray(pastData) ? pastData : []
      });
      
      setError('');
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
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
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const formatTime = (timeString) => {
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

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'Upcoming': return 'badge-upcoming';
      case 'Ongoing': return 'badge-ongoing';
      case 'Completed': return 'badge-completed';
      case 'Cancelled': return 'badge-cancelled';
      default: return '';
    }
  };

  const isEventOngoing = (event) => {
    if (event.status === 'Ongoing') return true;
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const eventDate = new Date(event.eventDate);
    eventDate.setHours(0, 0, 0, 0);
    
    return eventDate.getTime() === now.setHours(0, 0, 0, 0) &&
           event.eventTime <= currentTime &&
           (!event.endTime || event.endTime >= currentTime);
  };

  const EventCard = ({ event }) => (
    <div className={`event-card ${isEventOngoing(event) ? 'ongoing-card' : ''}`}>
      {/* Card Header with Gradient and Visual Flair */}
      <div className="event-card-header">
        <div className="event-type-icon">
          {event.eventType?.toLowerCase() === 'cultural' && '🎭'}
          {event.eventType?.toLowerCase() === 'sports' && '⚽'}
          {event.eventType?.toLowerCase() === 'educational' && '📚'}
          {event.eventType?.toLowerCase() === 'parent-teacher' && '👪'}
          {event.eventType?.toLowerCase() === 'holiday' && '🎉'}
          {!['cultural', 'sports', 'educational', 'parent-teacher', 'holiday'].includes(event.eventType?.toLowerCase()) && '📅'}
        </div>
        <div className="event-header-content">
          <h3 className="event-card-title">{event.eventName}</h3>
          <span className={`event-status-badge ${getStatusBadgeClass(event.status)}`}>
            {event.status}
            {isEventOngoing(event) && event.status === 'Upcoming' && ' → Ongoing'}
          </span>
        </div>
      </div>
      
      <div className="event-card-body">
        {/* Modern Date & Time Section */}
        <div className="event-datetime-section">
          <div className="event-date-box">
            <div className="date-day">
              {formatDate(event.eventDate) === 'Today' ? 'Today' : 
               formatDate(event.eventDate) === 'Tomorrow' ? 'Tomorrow' :
               new Date(event.eventDate).getDate()}
            </div>
            <div className="date-month">
              {formatDate(event.eventDate) !== 'Today' && formatDate(event.eventDate) !== 'Tomorrow' ? 
               new Date(event.eventDate).toLocaleString('default', { month: 'short' }) : ''}
            </div>
          </div>
          <div className="event-time-info">
            <div className="event-time">{formatTime(event.eventTime)}</div>
            {event.endTime && (
              <div className="event-end-time">to {formatTime(event.endTime)}</div>
            )}
          </div>
        </div>

        {/* Venue & Audience with Icons */}
        <div className="event-details-grid">
          <div className="event-detail">
            <span className="detail-icon">📍</span>
            <span className="detail-text">{event.venue}</span>
          </div>
          <div className="event-detail">
            <span className="detail-icon">👥</span>
            <span className="detail-text">{event.targetAudience || 'All'}</span>
          </div>
        </div>

        {/* Description with Gradient Border */}
        {event.description && (
          <div className="event-description">
            <p>{event.description}</p>
          </div>
        )}

        {/* Organizer with Avatar Style */}
        {event.organizer && (
          <div className="event-organizer">
            <div className="organizer-avatar">
              {event.organizer.charAt(0).toUpperCase()}
            </div>
            <div className="organizer-info">
              <span className="organizer-label">Organized by</span>
              <span className="organizer-name">{event.organizer}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer with Contact Info */}
      {(event.contactPerson || event.contactPhone || event.contactEmail) && (
        <div className="event-card-footer">
          <div className="contact-info">
            {event.contactPerson && (
              <div className="contact-item">
                <span className="contact-icon">👤</span>
                <span>{event.contactPerson}</span>
              </div>
            )}
            {event.contactPhone && (
              <div className="contact-item">
                <span className="contact-icon">📞</span>
                <span>{event.contactPhone}</span>
              </div>
            )}
            {event.contactEmail && (
              <div className="contact-item">
                <span className="contact-icon">✉️</span>
                <span>{event.contactEmail}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const EventsGrid = ({ events, type }) => (
    <div className="events-grid">
      {events.length === 0 ? (
        <div className="no-events-message">
          <span className="no-events-icon">📭</span>
          <p>No {type} events found</p>
          {type === 'upcoming' && (
            <small>Check back later for new events!</small>
          )}
        </div>
      ) : (
        events.map((event) => (
          <EventCard key={event.eventId || event._id} event={event} />
        ))
      )}
    </div>
  );

  return (
    <div className="user-events-page-wrapper">
      <UserNavbar />
      <div className="user-events-container">
        {/* Decorative elements */}
        <div className="nature-elements">
          <div className="leaf leaf-1">🌿</div>
          <div className="leaf leaf-2">🍃</div>
          <div className="leaf leaf-3">🌱</div>
          <div className="leaf leaf-4">🌸</div>
        </div>

        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>

        <div className="events-content">
          {/* Header Section */}
          <div className="events-header">
            <div className="header-icon-wrapper">
              <span className="header-icon">📅</span>
            </div>
            <h1 className="events-title">School Events Calendar</h1>
            <p className="events-subtitle">Stay updated with all preschool activities and events</p>
            
            {/* Last Updated */}
            <div className="last-updated-badge">
              <span className="update-icon">🔄</span>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <span className="stat-label">Total Events</span>
                <span className="stat-value">{stats.total}</span>
              </div>
            </div>
            
            <div className="stat-card upcoming">
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <span className="stat-label">Upcoming</span>
                <span className="stat-value">{stats.upcoming}</span>
              </div>
            </div>
            
            <div className="stat-card today">
              <div className="stat-icon">🔴</div>
              <div className="stat-info">
                <span className="stat-label">Today</span>
                <span className="stat-value">{stats.today}</span>
                {stats.ongoing > 0 && (
                  <span className="ongoing-indicator">{stats.ongoing} ongoing</span>
                )}
              </div>
            </div>
            
            <div className="stat-card completed">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <span className="stat-label">Completed</span>
                <span className="stat-value">{stats.past}</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-container">
              <span className="error-icon">⚠️</span>
              <p className="error-message">{error}</p>
              <button className="retry-button" onClick={fetchAllEvents}>
                Try Again
              </button>
            </div>
          )}

          {/* Tabs Navigation */}
          <div className="tabs-navigation">
            <button
              className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              <span className="tab-icon">⏳</span>
              <span className="tab-label">Upcoming</span>
              {stats.upcoming > 0 && (
                <span className="tab-count">{stats.upcoming}</span>
              )}
            </button>
            
            <button
              className={`tab-button ${activeTab === 'today' ? 'active' : ''}`}
              onClick={() => setActiveTab('today')}
            >
              <span className="tab-icon">🔴</span>
              <span className="tab-label">Today</span>
              {stats.today > 0 && (
                <span className="tab-count highlight">
                  {stats.today}
                  {stats.ongoing > 0 && ` (${stats.ongoing})`}
                </span>
              )}
            </button>
            
            <button
              className={`tab-button ${activeTab === 'past' ? 'active' : ''}`}
              onClick={() => setActiveTab('past')}
            >
              <span className="tab-icon">✅</span>
              <span className="tab-label">Past Events</span>
              {stats.past > 0 && (
                <span className="tab-count">{stats.past}</span>
              )}
            </button>
          </div>

          {/* Events Display */}
          <div className="events-display-area">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading events...</p>
              </div>
            ) : (
              <>
                {activeTab === 'upcoming' && (
                  <div className="tab-content">
                    <h2 className="tab-title">
                      <span className="title-icon">⏳</span>
                      Upcoming Events
                    </h2>
                    <EventsGrid events={events.upcoming} type="upcoming" />
                  </div>
                )}
                
                {activeTab === 'today' && (
                  <div className="tab-content">
                    <h2 className="tab-title">
                      <span className="title-icon">🔴</span>
                      Today's Events
                      {stats.ongoing > 0 && (
                        <span className="title-badge">{stats.ongoing} ongoing</span>
                      )}
                    </h2>
                    <EventsGrid events={events.today} type="today's" />
                  </div>
                )}
                
                {activeTab === 'past' && (
                  <div className="tab-content">
                    <h2 className="tab-title">
                      <span className="title-icon">✅</span>
                      Past Events
                    </h2>
                    <EventsGrid events={events.past} type="past" />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Auto-refresh Indicator */}
          <div className="auto-refresh-footer">
            <span className="refresh-indicator"></span>
            <span className="refresh-text">Auto-updates every 5 minutes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserEventsPage;