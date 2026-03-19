import React, { useState, useEffect } from 'react';
import '../css/AdminEventManagement.css';

const AdminEventManagement = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [events, setEvents] = useState([]);
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
  const [editingEvent, setEditingEvent] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Form state
  const [formData, setFormData] = useState({
    eventId: '',
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
    status: 'Upcoming',
    createdBy: ''
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState({});

  // Get admin info from localStorage
  const adminId = localStorage.getItem('adminId') || 'ADMIN001';
  const adminName = localStorage.getItem('adminName') || 'Administrator';

  // Fetch events on component mount
  useEffect(() => {
    fetchAllEvents();
    
    // Auto-refresh every 5 minutes
    const intervalId = setInterval(() => {
      fetchAllEvents();
      setLastUpdated(new Date());
    }, 300000);

    return () => clearInterval(intervalId);
  }, []);

  // Fetch events when filters change
  useEffect(() => {
    if (!loading) {
      fetchAllEvents();
    }
  }, [activeTab, filterType]);

  const fetchAllEvents = async () => {
    setLoading(true);
    try {
      // Fetch statistics
      const statsRes = await fetch('http://localhost:3002/events/stats/summary');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch events based on active tab
      let url = 'http://localhost:3002/events';
      if (activeTab === 'upcoming') {
        url = 'http://localhost:3002/events/upcoming/list';
      } else if (activeTab === 'today') {
        url = 'http://localhost:3002/events/today/list';
      } else if (activeTab === 'past') {
        url = 'http://localhost:3002/events/past/list';
      } else if (activeTab === 'all' && filterType) {
        url = `http://localhost:3002/events?type=${filterType}`;
      }

      const eventsRes = await fetch(url);
      const eventsData = await eventsRes.json();
      
      setEvents(Array.isArray(eventsData) ? eventsData : []);
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
      
      if (formData.status === 'Upcoming' && eventDate < today && !editingEvent) {
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

  const resetForm = () => {
    setFormData({
      eventId: '',
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
      status: 'Upcoming',
      createdBy: ''
    });
    setFormErrors({});
    setEditingEvent(null);
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      eventId: event.eventId || '',
      eventName: event.eventName || '',
      eventType: event.eventType || 'Cultural',
      description: event.description || '',
      eventDate: event.eventDate ? event.eventDate.split('T')[0] : '',
      eventTime: event.eventTime || '',
      endTime: event.endTime || '',
      venue: event.venue || '',
      organizer: event.organizer || '',
      contactPerson: event.contactPerson || '',
      contactPhone: event.contactPhone || '',
      contactEmail: event.contactEmail || '',
      targetAudience: event.targetAudience || 'All',
      maxAttendees: event.maxAttendees || '',
      registrationRequired: event.registrationRequired || false,
      registrationDeadline: event.registrationDeadline ? event.registrationDeadline.split('T')[0] : '',
      status: event.status || 'Upcoming',
      createdBy: event.createdBy || adminId
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (event) => {
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;

    try {
      const response = await fetch(`http://localhost:3002/events/${eventToDelete.eventId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Event deleted successfully!');
        setShowDeleteModal(false);
        setEventToDelete(null);
        fetchAllEvents();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to delete event');
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError('Failed to connect to server');
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
      const url = editingEvent 
        ? `http://localhost:3002/events/${editingEvent.eventId}`
        : 'http://localhost:3002/events';
      
      const method = editingEvent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
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
        setSuccess(editingEvent ? 'Event updated successfully!' : 'Event created successfully!');
        resetForm();
        setShowForm(false);
        fetchAllEvents();
        setLastUpdated(new Date());
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || `Failed to ${editingEvent ? 'update' : 'create'} event`);
      }
    } catch (err) {
      console.error("Submission error:", err);
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

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.venue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.organizer?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="admin-event-container">
      {/* Decorative Elements */}
      <div className="admin-decor">
        <div className="decor-circle circle-1"></div>
        <div className="decor-circle circle-2"></div>
        <div className="decor-circle circle-3"></div>
        <div className="decor-leaf leaf-1">📅</div>
        <div className="decor-leaf leaf-2">🎪</div>
        <div className="decor-leaf leaf-3">📋</div>
      </div>

      <div className="admin-content">
        {/* Header */}
        <div className="admin-header">
          <div className="header-left">
            <div className="admin-avatar">
              <span className="avatar-icon">👤</span>
            </div>
            <div className="admin-info">
              <h1 className="admin-title">Event Management</h1>
              <p className="admin-subtitle">Welcome back, {adminName}</p>
              <div className="admin-badge">
                <span className="badge-dot"></span>
                Administrator
              </div>
            </div>
          </div>
          <div className="header-right">
            <div className="last-updated">
              <span className="update-icon">🔄</span>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-cards">
          <div className="stat-card total">
            <div className="stat-icon">📊</div>
            <div className="stat-details">
              <span className="stat-label">Total Events</span>
              <span className="stat-value">{stats.total}</span>
            </div>
          </div>
          <div className="stat-card upcoming">
            <div className="stat-icon">⏳</div>
            <div className="stat-details">
              <span className="stat-label">Upcoming</span>
              <span className="stat-value">{stats.upcoming}</span>
            </div>
          </div>
          <div className="stat-card today">
            <div className="stat-icon">🔴</div>
            <div className="stat-details">
              <span className="stat-label">Today</span>
              <span className="stat-value">{stats.today}</span>
              {stats.ongoing > 0 && (
                <span className="stat-badge">{stats.ongoing} ongoing</span>
              )}
            </div>
          </div>
          <div className="stat-card past">
            <div className="stat-icon">✅</div>
            <div className="stat-details">
              <span className="stat-label">Completed</span>
              <span className="stat-value">{stats.past}</span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="action-bar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-box">
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="">All Types</option>
              <option value="Cultural">Cultural</option>
              <option value="Sports">Sports</option>
              <option value="Educational">Educational</option>
              <option value="Parent-Teacher">Parent-Teacher</option>
              <option value="Holiday">Holiday</option>
              <option value="Workshop">Workshop</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <button 
            className="create-button"
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
          >
            <span className="button-icon">{showForm ? '✕' : '+'}</span>
            {showForm ? 'Close Form' : 'Create New Event'}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="message error">
            <span className="message-icon">⚠️</span>
            <span className="message-text">{error}</span>
            <button className="message-close" onClick={() => setError('')}>✕</button>
          </div>
        )}
        
        {success && (
          <div className="message success">
            <span className="message-icon">✅</span>
            <span className="message-text">{success}</span>
            <button className="message-close" onClick={() => setSuccess('')}>✕</button>
          </div>
        )}

        {/* Event Form */}
        {showForm && (
          <div className="form-card">
            <h2 className="form-title">
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </h2>
            
            <form onSubmit={handleSubmit} className="event-form">
              <div className="form-grid">
                <div className="form-group full-width">
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

                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange}>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

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

                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Enter event description"
                  ></textarea>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn" disabled={formLoading}>
                  {formLoading ? (
                    <>
                      <span className="spinner"></span>
                      {editingEvent ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingEvent ? 'Update Event' : 'Create Event'
                  )}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs-container">
          <button
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <span className="tab-icon">📋</span>
            All Events
            <span className="tab-count">{stats.total}</span>
          </button>
          <button
            className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            <span className="tab-icon">⏳</span>
            Upcoming
            <span className="tab-count">{stats.upcoming}</span>
          </button>
          <button
            className={`tab ${activeTab === 'today' ? 'active' : ''}`}
            onClick={() => setActiveTab('today')}
          >
            <span className="tab-icon">🔴</span>
            Today
            <span className="tab-count highlight">{stats.today}</span>
          </button>
          <button
            className={`tab ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            <span className="tab-icon">✅</span>
            Past
            <span className="tab-count">{stats.past}</span>
          </button>
        </div>

        {/* Events Table */}
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading events...</p>
            </div>
          ) : (
            <table className="events-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Venue</th>
                  <th>Organizer</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="no-data">
                      <span className="no-data-icon">📭</span>
                      <p>No events found</p>
                      <button className="create-first-btn" onClick={() => setShowForm(true)}>
                        Create your first event
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((event) => (
                    <tr key={event.eventId || event._id}>
                      <td className="event-name-cell">
                        <strong>{event.eventName}</strong>
                        {event.description && (
                          <small className="event-description-preview">
                            {event.description.substring(0, 30)}...
                          </small>
                        )}
                      </td>
                      <td>
                        <span className={`event-type-badge ${event.eventType?.toLowerCase()}`}>
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
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(event.status)}`}>
                          {event.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn edit"
                            onClick={() => handleEdit(event)}
                            title="Edit event"
                          >
                            ✏️
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => handleDelete(event)}
                            title="Delete event"
                          >
                            🗑️
                          </button>
                          <button
                            className="action-btn view"
                            onClick={() => window.open(`/event/${event.eventId}`, '_blank')}
                            title="View details"
                          >
                            👁️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary Footer */}
        <div className="table-footer">
          <div className="footer-info">
            Showing {filteredEvents.length} of {events.length} events
          </div>
          <div className="footer-actions">
            <button className="export-btn" onClick={() => {
              // Export functionality
              const csvContent = [
                ['Event Name', 'Type', 'Date', 'Time', 'Venue', 'Organizer', 'Status'],
                ...filteredEvents.map(e => [
                  e.eventName,
                  e.eventType,
                  new Date(e.eventDate).toLocaleDateString(),
                  e.eventTime,
                  e.venue,
                  e.organizer,
                  e.status
                ])
              ].map(row => row.join(',')).join('\n');
              
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `events_${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
            }}>
              📥 Export to CSV
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Delete Event</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this event?</p>
              <p className="event-name">{eventToDelete?.eventName}</p>
              <p className="warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="delete-btn" onClick={confirmDelete}>
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEventManagement;