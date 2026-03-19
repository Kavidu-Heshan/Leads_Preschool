import React, { useState, useEffect } from 'react';
import '../css/EventCreationPage.css';

const EventCreationPage = () => {
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
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Form state
  const [formData, setFormData] = useState({
    eventName: '',
    eventType: 'Cultural',
    description: '',
    eventDate: '',
    eventTime: '',
    endTime: '',
    venue: '',
    organizer: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    targetAudience: 'All',
    maxAttendees: '',
    registrationRequired: false,
    registrationDeadline: '',
    status: 'Upcoming'
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState({});

  // Get admin info from localStorage
  const adminId = localStorage.getItem('adminId') || 'ADMIN001';

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
      const statsRes = await fetch('http://localhost:3002/events/stats/summary');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch upcoming events (excluding today)
      const upcomingRes = await fetch('http://localhost:3002/events/upcoming/list');
      const upcomingData = await upcomingRes.json();

      // Fetch today's events
      const todayRes = await fetch('http://localhost:3002/events/today/list');
      const todayData = await todayRes.json();

      // Fetch past events
      const pastRes = await fetch('http://localhost:3002/events/past/list');
      const pastData = await pastRes.json();

      setEvents({
        upcoming: Array.isArray(upcomingData) ? upcomingData : [],
        today: Array.isArray(todayData) ? todayData : [],
        past: Array.isArray(pastData) ? pastData : []
      });
      
      setError('');
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validate event date
    if (formData.eventDate) {
      const eventDate = new Date(formData.eventDate);
      eventDate.setHours(0, 0, 0, 0);
      
      if (formData.status === 'Upcoming' && eventDate < today) {
        errors.eventDate = 'Upcoming event cannot have a past date';
      }
    }

    // Validate end time after start time
    if (formData.eventTime && formData.endTime) {
      if (formData.endTime <= formData.eventTime) {
        errors.endTime = 'End time must be after start time';
      }
    }

    // Validate registration deadline
    if (formData.registrationRequired && formData.registrationDeadline) {
      const deadline = new Date(formData.registrationDeadline);
      const eventDate = new Date(formData.eventDate);
      if (deadline > eventDate) {
        errors.registrationDeadline = 'Registration deadline must be on or before the event date';
      }
    }

    // Validate phone number if provided
    if (formData.contactPhone && !/^0\d{9}$/.test(formData.contactPhone)) {
      errors.contactPhone = 'Phone number must be 10 digits starting with 0';
    }

    // Validate email if provided
    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      errors.contactEmail = 'Please enter a valid email address';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setFormLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:3002/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          createdBy: adminId,
          maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Event created successfully!');
        // Reset form
        setFormData({
          eventName: '',
          eventType: 'Cultural',
          description: '',
          eventDate: '',
          eventTime: '',
          endTime: '',
          venue: '',
          organizer: '',
          contactPerson: '',
          contactPhone: '',
          contactEmail: '',
          targetAudience: 'All',
          maxAttendees: '',
          registrationRequired: false,
          registrationDeadline: '',
          status: 'Upcoming'
        });
        setFormErrors({});
        setShowForm(false);
        // Refresh events
        await fetchAllEvents();
        setLastUpdated(new Date());
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to create event');
      }
    } catch (err) {
      console.error("Connection error:", err);
      setError('Failed to connect to server');
    } finally {
      setFormLoading(false);
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

  const EventTable = ({ events, type }) => (
    <div className="table-container">
      <table className="event-table">
        <thead>
          <tr>
            <th>Event Name</th>
            <th>Type</th>
            <th>Date</th>
            <th>Time</th>
            <th>Venue</th>
            <th>Organizer</th>
            <th>Audience</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {events.length === 0 ? (
            <tr>
              <td colSpan="8" className="no-data">
                No {type} events found
              </td>
            </tr>
          ) : (
            events.map((event) => (
              <tr key={event.eventId || event._id} className={isEventOngoing(event) ? 'ongoing-row' : ''}>
                <td className="event-name">{event.eventName}</td>
                <td>
                  <span className={`event-type ${event.eventType?.toLowerCase()}`}>
                    {event.eventType}
                  </span>
                </td>
                <td>
                  {formatDate(event.eventDate)}
                  {formatDate(event.eventDate) === 'Today' && (
                    <span className="today-badge">🔴</span>
                  )}
                </td>
                <td>
                  {formatTime(event.eventTime)}
                  {event.endTime && ` - ${formatTime(event.endTime)}`}
                </td>
                <td>{event.venue}</td>
                <td>{event.organizer}</td>
                <td>{event.targetAudience}</td>
                <td>
                  <span className={`status-badge ${getStatusBadgeClass(event.status)}`}>
                    {event.status}
                    {isEventOngoing(event) && event.status === 'Upcoming' && ' → Ongoing'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="event-page-container">
      <div className="nature-bg">
        <div className="leaf leaf-1">🌿</div>
        <div className="leaf leaf-2">🍃</div>
        <div className="leaf leaf-3">🌱</div>
        <div className="leaf leaf-4">🌿</div>
        <div className="leaf leaf-5">🍂</div>
        <div className="leaf leaf-6">🍃</div>
      </div>

      <div className="floating-circle circle-1"></div>
      <div className="floating-circle circle-2"></div>
      <div className="floating-circle circle-3"></div>

      <div className="event-content">
        <div className="header-section">
          <div className="header-icon">
            <span className="header-emoji">📅</span>
          </div>
          <h1>Preschool Event Management</h1>
          <p className="header-subtitle">Create and manage all preschool events in one place</p>
          <div className="last-updated">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>

        {/* Create Event Button */}
        <div className="action-section">
          <button 
            className="create-event-btn"
            onClick={() => setShowForm(!showForm)}
          >
            <span className="btn-icon">{showForm ? '✕' : '+'}</span>
            {showForm ? 'Close Form' : 'Create New Event'}
          </button>
        </div>

        {/* Event Creation Form */}
        {showForm && (
          <div className="form-card">
            <h2>Create New Event</h2>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <form onSubmit={handleSubmit} className="event-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Event Name *</label>
                  <input
                    type="text"
                    name="eventName"
                    value={formData.eventName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter event name"
                    className={formErrors.eventName ? 'error' : ''}
                  />
                </div>

                <div className="form-group">
                  <label>Event Type *</label>
                  <select name="eventType" value={formData.eventType} onChange={handleInputChange} required>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Educational">Educational</option>
                    <option value="Parent-Teacher">Parent-Teacher</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Enter event description"
                ></textarea>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Event Date *</label>
                  <input
                    type="date"
                    name="eventDate"
                    value={formData.eventDate}
                    onChange={handleInputChange}
                    required
                    className={formErrors.eventDate ? 'error' : ''}
                  />
                  {formErrors.eventDate && (
                    <small className="error-text">{formErrors.eventDate}</small>
                  )}
                </div>

                <div className="form-group">
                  <label>Start Time *</label>
                  <input
                    type="time"
                    name="eventTime"
                    value={formData.eventTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className={formErrors.endTime ? 'error' : ''}
                  />
                  {formErrors.endTime && (
                    <small className="error-text">{formErrors.endTime}</small>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Venue *</label>
                  <input
                    type="text"
                    name="venue"
                    value={formData.venue}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter venue"
                  />
                </div>

                <div className="form-group">
                  <label>Organizer *</label>
                  <input
                    type="text"
                    name="organizer"
                    value={formData.organizer}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter organizer name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contact Person</label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    placeholder="Contact person name"
                  />
                </div>

                <div className="form-group">
                  <label>Contact Phone</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    placeholder="0771234567"
                    className={formErrors.contactPhone ? 'error' : ''}
                  />
                  {formErrors.contactPhone && (
                    <small className="error-text">{formErrors.contactPhone}</small>
                  )}
                </div>

                <div className="form-group">
                  <label>Contact Email</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    placeholder="contact@example.com"
                    className={formErrors.contactEmail ? 'error' : ''}
                  />
                  {formErrors.contactEmail && (
                    <small className="error-text">{formErrors.contactEmail}</small>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Target Audience</label>
                  <select name="targetAudience" value={formData.targetAudience} onChange={handleInputChange}>
                    <option value="All">All</option>
                    <option value="Students Only">Students Only</option>
                    <option value="Parents Only">Parents Only</option>
                    <option value="Teachers Only">Teachers Only</option>
                    <option value="Students & Parents">Students & Parents</option>
                    <option value="Staff Only">Staff Only</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Max Attendees</label>
                  <input
                    type="number"
                    name="maxAttendees"
                    value={formData.maxAttendees}
                    onChange={handleInputChange}
                    min="1"
                    placeholder="Unlimited if empty"
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange}>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="registrationRequired"
                      checked={formData.registrationRequired}
                      onChange={handleInputChange}
                    />
                    Registration Required
                  </label>
                </div>

                {formData.registrationRequired && (
                  <div className="form-group">
                    <label>Registration Deadline</label>
                    <input
                      type="date"
                      name="registrationDeadline"
                      value={formData.registrationDeadline}
                      onChange={handleInputChange}
                      className={formErrors.registrationDeadline ? 'error' : ''}
                    />
                    {formErrors.registrationDeadline && (
                      <small className="error-text">{formErrors.registrationDeadline}</small>
                    )}
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn" disabled={formLoading}>
                  {formLoading ? 'Creating...' : 'Create Event'}
                </button>
                <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabs for different event views */}
        <div className="tabs-section">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming Events
              {stats.upcoming > 0 && (
                <span className="tab-count">{stats.upcoming}</span>
              )}
            </button>
            <button
              className={`tab ${activeTab === 'today' ? 'active' : ''}`}
              onClick={() => setActiveTab('today')}
            >
              Today's Events
              {stats.today > 0 && (
                <span className="tab-count highlight">
                  {stats.today}
                  {stats.ongoing > 0 && ` (${stats.ongoing} ongoing)`}
                </span>
              )}
            </button>
            <button
              className={`tab ${activeTab === 'past' ? 'active' : ''}`}
              onClick={() => setActiveTab('past')}
            >
              Past Events
              {stats.past > 0 && (
                <span className="tab-count">{stats.past}</span>
              )}
            </button>
          </div>

          {/* Event Tables */}
          <div className="table-wrapper">
            {loading ? (
              <div className="loading-spinner">Loading events...</div>
            ) : (
              <>
                {activeTab === 'upcoming' && (
                  <EventTable events={events.upcoming} type="upcoming" />
                )}
                {activeTab === 'today' && (
                  <EventTable events={events.today} type="today's" />
                )}
                {activeTab === 'past' && (
                  <EventTable events={events.past} type="past" />
                )}
              </>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="summary-section">
          <div className="summary-card">
            <div className="summary-icon">📅</div>
            <div className="summary-content">
              <h3>Total Events</h3>
              <p className="summary-number">{stats.total}</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">⏳</div>
            <div className="summary-content">
              <h3>Upcoming</h3>
              <p className="summary-number">{stats.upcoming}</p>
            </div>
          </div>
          <div className="summary-card highlight">
            <div className="summary-icon">🔴</div>
            <div className="summary-content">
              <h3>Today</h3>
              <p className="summary-number">{stats.today}</p>
              {stats.ongoing > 0 && (
                <small className="ongoing-badge">{stats.ongoing} ongoing</small>
              )}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">✅</div>
            <div className="summary-content">
              <h3>Completed</h3>
              <p className="summary-number">{stats.past}</p>
            </div>
          </div>
        </div>

        {/* Auto-refresh indicator */}
        <div className="auto-refresh-indicator">
          <span className="refresh-dot"></span>
          Auto-updates every 5 minutes
        </div>
      </div>
    </div>
  );
};

export default EventCreationPage;