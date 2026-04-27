/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/EventPhotoUpload.css";
import NavigationBar from "../components/AdminNavbar";

const EventPhotoUpload = () => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedEventName, setSelectedEventName] = useState("");
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("upload"); // upload or gallery
  const [eventPhotos, setEventPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Form data for photo upload
  const [formData, setFormData] = useState({
    eventId: "",
    eventName: "",
    photoCaption: "",
    tags: ""
  });

  useEffect(() => {
    fetchEvents();
    fetchAllPhotos();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get("https://leadspreschool-production.up.railway.app/events");
      // Filter ONLY past (Completed) events
      const filteredEvents = response.data.filter(
        event => event.status === "Completed"
      );
      setEvents(filteredEvents);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load events");
    }
  };

  const fetchAllPhotos = async () => {
    try {
      const response = await axios.get("https://leadspreschool-production.up.railway.app/event-photos");
      setEventPhotos(response.data);
    } catch (err) {
      console.error("Error fetching photos:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventPhotos = async (eventId) => {
    try {
      const response = await axios.get(`https://leadspreschool-production.up.railway.app/event-photos/event/${eventId}`);
      setEventPhotos(response.data);
    } catch (err) {
      console.error("Error fetching event photos:", err);
    }
  };

  const handleEventSelect = (e) => {
    const eventId = e.target.value;
    const event = events.find(ev => ev.eventId === eventId);
    
    setSelectedEventId(eventId);
    setSelectedEventName(event ? event.eventName : "");
    
    setFormData({
      ...formData,
      eventId: eventId,
      eventName: event ? event.eventName : ""
    });
    
    // Fetch photos for the selected event
    if (eventId) {
      fetchEventPhotos(eventId);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setPhotos(files);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedEventId) {
      setError("Please select an event");
      return;
    }

    if (photos.length === 0) {
      setError("Please select at least one photo");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    const formDataToSend = new FormData();
    formDataToSend.append("eventId", formData.eventId);
    formDataToSend.append("eventName", formData.eventName);
    formDataToSend.append("photoCaption", formData.photoCaption);
    formDataToSend.append("tags", formData.tags);
    
    photos.forEach(photo => {
      formDataToSend.append("photos", photo);
    });

    try {
      const response = await axios.post("https://leadspreschool-production.up.railway.app/event-photos/upload", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      if (response.data.success) {
        setSuccess(`Successfully uploaded ${response.data.uploadedCount} photos!`);
        setPhotos([]);
        setFormData({
          ...formData,
          photoCaption: "",
          tags: ""
        });
        // Refresh photos
        if (selectedEventId) {
          fetchEventPhotos(selectedEventId);
        } else {
          fetchAllPhotos();
        }
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.error || "Failed to upload photos");
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (window.confirm("Are you sure you want to delete this photo?")) {
      try {
        const response = await axios.delete(`https://leadspreschool-production.up.railway.app/event-photos/${photoId}`);
        if (response.data.success) {
          setSuccess("Photo deleted successfully!");
          // Refresh photos
          if (selectedEventId) {
            fetchEventPhotos(selectedEventId);
          } else {
            fetchAllPhotos();
          }
          setTimeout(() => setSuccess(""), 3000);
        }
      } catch (err) {
        console.error("Failed to delete photo", err);
        setError("Failed to delete photo");
      }
    }
  };

  const handleSetFeatured = async (photoId) => {
    try {
      const response = await axios.patch(`https://leadspreschool-production.up.railway.app/event-photos/${photoId}/featured`);
      if (response.data.success) {
        setSuccess("Photo set as featured!");
        if (selectedEventId) {
          fetchEventPhotos(selectedEventId);
        } else {
          fetchAllPhotos();
        }
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Failed to set featured photo", err);
      setError("Failed to set featured photo");
    }
  };

  const filteredPhotos = eventPhotos.filter(photo =>
    photo.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    photo.photoCaption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (photo.tags && photo.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="event-photo-wrapper">
      <NavigationBar />
      <div className="event-photo-container">
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

        <div className="photo-content">
          <div className="header-section">
            <div className="header-icon">
              <span className="header-emoji">📸</span>
            </div>
            <h1>Event Photo Gallery</h1>
            <p className="header-subtitle">Upload and manage photos from school events</p>
          </div>

          {/* Tabs */}
          <div className="tabs-section">
            <button
              className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              <span>📤</span> Upload Photos
            </button>
            <button
              className={`tab ${activeTab === 'gallery' ? 'active' : ''}`}
              onClick={() => setActiveTab('gallery')}
            >
              <span>🖼️</span> Photo Gallery
            </button>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span> {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              <span className="success-icon">✓</span> {success}
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="upload-section">
              <div className="form-card">
                <h2>Upload Event Photos</h2>
                
                <form onSubmit={handleUpload} className="upload-form">
                  <div className="form-group">
                    <label>Select Event *</label>
                    <select
                      value={selectedEventId}
                      onChange={handleEventSelect}
                      required
                      className="event-select"
                    >
                      <option value="">-- Choose an event --</option>
                      {events.map(event => (
                        <option key={event.eventId} value={event.eventId}>
                          {event.eventName} (ID: {event.eventId}) - {new Date(event.eventDate).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                    {selectedEventId && (
                      <small className="selected-event-info">
                        Selected Event ID: {selectedEventId} | Name: {selectedEventName}
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Photo Caption (Optional)</label>
                    <input
                      type="text"
                      name="photoCaption"
                      value={formData.photoCaption}
                      onChange={handleInputChange}
                      placeholder="e.g., Annual Day Celebration"
                      className="caption-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Tags (Optional, comma separated)</label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      placeholder="e.g., performance, award, cultural"
                      className="tags-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Select Photos *</label>
                    <div className="file-upload-area">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="file-input"
                        id="photo-upload"
                      />
                      <label htmlFor="photo-upload" className="file-label">
                        <span className="upload-icon">📷</span>
                        <span>Click to select photos</span>
                        <small>Supports: JPG, PNG, GIF (Max 5MB each)</small>
                      </label>
                    </div>
                    {photos.length > 0 && (
                      <div className="selected-photos">
                        <h4>Selected Photos: {photos.length}</h4>
                        <div className="photo-preview-grid">
                          {photos.map((photo, index) => (
                            <div key={index} className="photo-preview-item">
                              <img
                                src={URL.createObjectURL(photo)}
                                alt={`Preview ${index + 1}`}
                                className="preview-image"
                              />
                              <span className="preview-name">{photo.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="upload-button"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <span className="spinner-small"></span>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <span className="button-icon">📤</span>
                        Upload Photos
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Gallery Tab */}
          {activeTab === 'gallery' && (
            <div className="gallery-section">
              <div className="gallery-header">
                <h2>Event Photo Gallery</h2>
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="🔍 Search by event, caption, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>

              {loading ? (
                <div className="loading-spinner">Loading photos...</div>
              ) : filteredPhotos.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📸</div>
                  <h3>No Photos Found</h3>
                  <p>Upload photos to create a beautiful gallery</p>
                </div>
              ) : (
                <div className="photo-gallery-grid">
                  {filteredPhotos.map((photo) => (
                    <div key={photo.photoId} className="gallery-item">
                      <div className="photo-card">
                        <div className="photo-image-container">
                          <img
                            src={photo.photoUrl}
                            alt={photo.photoCaption || photo.eventName}
                            className="gallery-image"
                            onClick={() => setSelectedPhoto(photo)}
                          />
                          {photo.isFeatured && (
                            <div className="featured-badge">
                              <span>⭐ Featured</span>
                            </div>
                          )}
                        </div>
                        <div className="photo-info">
                          <h4>
                            {photo.eventName}
                            <span className="event-id-badge">ID: {photo.eventId}</span>
                          </h4>
                          {photo.photoCaption && (
                            <p className="photo-caption">{photo.photoCaption}</p>
                          )}
                          {photo.tags && photo.tags.length > 0 && (
                            <div className="photo-tags">
                              {photo.tags.map((tag, idx) => (
                                <span key={idx} className="tag">#{tag}</span>
                              ))}
                            </div>
                          )}
                          <div className="photo-meta">
                            <span>📅 {formatDate(photo.uploadedAt)}</span>
                            <span>👤 {photo.uploadedByName}</span>
                          </div>
                          <div className="photo-actions">
                            <button
                              className="action-btn delete"
                              onClick={() => handleDeletePhoto(photo.photoId)}
                              title="Delete photo"
                            >
                              🗑️
                            </button>
                            {!photo.isFeatured && (
                              <button
                                className="action-btn featured"
                                onClick={() => handleSetFeatured(photo.photoId)}
                                title="Set as featured"
                              >
                                ⭐
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Lightbox Modal */}
              {selectedPhoto && (
                <div className="lightbox-overlay" onClick={() => setSelectedPhoto(null)}>
                  <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                    <button className="lightbox-close" onClick={() => setSelectedPhoto(null)}>
                      ✕
                    </button>
                    <img
                      src={selectedPhoto.photoUrl}
                      alt={selectedPhoto.photoCaption || selectedPhoto.eventName}
                      className="lightbox-image"
                    />
                    <div className="lightbox-info">
                      <h3>
                        {selectedPhoto.eventName}
                        <span className="event-id-badge">Event ID: {selectedPhoto.eventId}</span>
                      </h3>
                      <p>{selectedPhoto.photoCaption}</p>
                      <div className="lightbox-meta">
                        <span>📅 {formatDate(selectedPhoto.uploadedAt)}</span>
                        <span>👤 {selectedPhoto.uploadedByName}</span>
                      </div>
                      {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                        <div className="lightbox-tags">
                          {selectedPhoto.tags.map((tag, idx) => (
                            <span key={idx} className="tag">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventPhotoUpload;