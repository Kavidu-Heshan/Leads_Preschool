/* eslint-disable react-hooks/immutability */
// PhotoDownload.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/PhotoDownload.css";
import UserNavbar from '../components/UserNavbar';

const PhotoDownload = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchPastEvents();
  }, []);

  const fetchPastEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get("https://leadspreschool-production.up.railway.app/events/past/list");
      setEvents(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching past events:", err);
      setError("Failed to load past events");
      setLoading(false);
    }
  };

  const fetchEventPhotos = async (event) => {
    try {
      setLoading(true);
      const response = await axios.get(`https://leadspreschool-production.up.railway.app/event-photos/event/${event.eventId}`);
      setPhotos(response.data);
      setSelectedEvent(event);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching event photos:", err);
      setError("Failed to load event photos");
      setLoading(false);
    }
  };

  const handleEventSelect = (event) => {
    if (selectedEvent && selectedEvent.eventId === event.eventId) {
      setSelectedEvent(null);
      setPhotos([]);
    } else {
      fetchEventPhotos(event);
    }
  };

  const handleBackToEvents = () => {
    setSelectedEvent(null);
    setPhotos([]);
    setSearchTerm("");
  };

  const downloadPhoto = async (photoUrl, photoName) => {
    try {
      setDownloading(true);
      const response = await axios.get(photoUrl, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: response.data.type });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // eslint-disable-next-line react-hooks/purity
      const fileName = photoName || `event-photo-${Date.now()}.jpg`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setDownloading(false);
    } catch (err) {
      console.error("Error downloading photo:", err);
      setError("Failed to download photo. Please try again.");
      setDownloading(false);
    }
  };

  const downloadAllPhotos = async () => {
    if (photos.length === 0) return;
    
    setDownloading(true);
    let downloadedCount = 0;
    
    for (let i = 0; i < photos.length; i++) {
      try {
        const photo = photos[i];
        const response = await axios.get(photo.photoUrl, {
          responseType: 'blob',
        });
        
        const blob = new Blob([response.data], { type: response.data.type });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const fileName = `${selectedEvent.eventName}_photo_${i + 1}.jpg`;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        downloadedCount++;
        
        // Small delay between downloads to prevent browser blocking
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`Error downloading photo ${i + 1}:`, err);
      }
    }
    
    setDownloading(false);
    alert(`Downloaded ${downloadedCount} out of ${photos.length} photos`);
  };

  const filteredPhotos = photos.filter(photo =>
    photo.photoCaption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (photo.tags && photo.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && !selectedEvent) {
    return (
      <>
        <UserNavbar />
        <div className="photo-download-wrapper">
          <div className="loading-container">
            <div className="loading-spinner-large"></div>
            <p>Loading past events...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <UserNavbar />
      <div className="photo-download-wrapper">
        <div className="photo-download-container">
          {/* Decorative Elements */}
          <div className="nature-bg-download">
            <div className="leaf-download leaf-1">🌿</div>
            <div className="leaf-download leaf-2">🍃</div>
            <div className="leaf-download leaf-3">🌱</div>
            <div className="leaf-download leaf-4">🌿</div>
          </div>
          <div className="floating-circle-download circle-1"></div>
          <div className="floating-circle-download circle-2"></div>
          <div className="floating-circle-download circle-3"></div>

          <div className="download-content">
            <div className="header-section-download">
              <div className="header-icon-download">
                <span className="header-emoji">📸</span>
              </div>
              <h1>Event Photo Gallery</h1>
              <p className="header-subtitle-download">
                Relive the memories from past events. Browse and download your favorite moments.
              </p>
            </div>

            {error && (
              <div className="error-message-download">
                <span className="error-icon">⚠️</span> {error}
              </div>
            )}

            {!selectedEvent ? (
              // Events Grid View
              <div className="events-grid-section">
                <h2>Past Events</h2>
                <p className="section-description">Select an event to view and download photos</p>
                
                {events.length === 0 ? (
                  <div className="empty-state-download">
                    <div className="empty-icon">📷</div>
                    <h3>No Past Events</h3>
                    <p>There are no past events with photos available at the moment.</p>
                  </div>
                ) : (
                  <div className="events-grid">
                    {events.map((event) => (
                      <div
                        key={event.eventId}
                        className="event-card"
                        onClick={() => handleEventSelect(event)}
                      >
                        <div className="event-card-icon">🎉</div>
                        <div className="event-card-content">
                          <h3>{event.eventName}</h3>
                          <p className="event-date">📅 {formatDate(event.eventDate)}</p>
                          <p className="event-venue">📍 {event.venue}</p>
                          <button className="view-photos-btn">
                            View Photos →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Photos Gallery View
              <div className="photos-gallery-section">
                <div className="gallery-header-download">
                  <button className="back-button" onClick={handleBackToEvents}>
                    ← Back to Events
                  </button>
                  <div className="event-info-download">
                    <h2>{selectedEvent.eventName}</h2>
                    <div className="event-meta">
                      <span>📅 {formatDate(selectedEvent.eventDate)}</span>
                      <span>📍 {selectedEvent.venue}</span>
                      {photos.length > 0 && (
                        <span>📸 {photos.length} photos</span>
                      )}
                    </div>
                  </div>
                  {photos.length > 0 && (
                    <button
                      className="download-all-btn"
                      onClick={downloadAllPhotos}
                      disabled={downloading}
                    >
                      {downloading ? (
                        <>
                          <span className="spinner-small-download"></span>
                          Downloading...
                        </>
                      ) : (
                        <>
                          📥 Download All ({photos.length})
                        </>
                      )}
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading photos...</p>
                  </div>
                ) : photos.length === 0 ? (
                  <div className="empty-state-download">
                    <div className="empty-icon">📸</div>
                    <h3>No Photos Available</h3>
                    <p>No photos have been uploaded for this event yet.</p>
                    <button className="back-button-secondary" onClick={handleBackToEvents}>
                      Browse Other Events
                    </button>
                  </div>
                ) : (
                  <>
                    {photos.length > 0 && (
                      <div className="search-bar-download">
                        <input
                          type="text"
                          placeholder="🔍 Search by caption or tags..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="search-input-download"
                        />
                      </div>
                    )}

                    <div className="photos-grid">
                      {filteredPhotos.map((photo) => (
                        <div key={photo.photoId} className="photo-card-download">
                          <div className="photo-image-wrapper">
                            <img
                              src={photo.photoUrl}
                              alt={photo.photoCaption || selectedEvent.eventName}
                              className="photo-image"
                              onClick={() => setSelectedPhoto(photo)}
                            />
                            {photo.isFeatured && (
                              <div className="featured-badge-download">
                                <span>⭐ Featured</span>
                              </div>
                            )}
                            <button
                              className="download-photo-btn"
                              onClick={() => downloadPhoto(photo.photoUrl, `${selectedEvent.eventName}_${photo.photoId}.jpg`)}
                              title="Download photo"
                            >
                              📥
                            </button>
                          </div>
                          <div className="photo-info-download">
                            {photo.photoCaption && (
                              <p className="photo-caption-download">{photo.photoCaption}</p>
                            )}
                            {photo.tags && photo.tags.length > 0 && (
                              <div className="photo-tags-download">
                                {photo.tags.map((tag, idx) => (
                                  <span key={idx} className="tag-download">#{tag}</span>
                                ))}
                              </div>
                            )}
                            <div className="photo-date-download">
                              📅 {formatDate(photo.uploadedAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {filteredPhotos.length === 0 && searchTerm && (
                      <div className="no-results">
                        <p>No photos match your search: "{searchTerm}"</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Lightbox Modal for full-size view */}
            {selectedPhoto && (
              <div className="lightbox-overlay-download" onClick={() => setSelectedPhoto(null)}>
                <div className="lightbox-content-download" onClick={(e) => e.stopPropagation()}>
                  <button className="lightbox-close-download" onClick={() => setSelectedPhoto(null)}>
                    ✕
                  </button>
                  <img
                    src={selectedPhoto.photoUrl}
                    alt={selectedPhoto.photoCaption || selectedEvent?.eventName}
                    className="lightbox-image-download"
                  />
                  <div className="lightbox-info-download">
                    <h3>{selectedEvent?.eventName}</h3>
                    {selectedPhoto.photoCaption && (
                      <p className="lightbox-caption">{selectedPhoto.photoCaption}</p>
                    )}
                    <div className="lightbox-meta-download">
                      <span>📅 {formatDate(selectedPhoto.uploadedAt)}</span>
                    </div>
                    {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                      <div className="lightbox-tags-download">
                        {selectedPhoto.tags.map((tag, idx) => (
                          <span key={idx} className="tag-download">#{tag}</span>
                        ))}
                      </div>
                    )}
                    <button
                      className="lightbox-download-btn"
                      onClick={() => downloadPhoto(selectedPhoto.photoUrl, `${selectedEvent.eventName}_${selectedPhoto.photoId}.jpg`)}
                    >
                      📥 Download Photo
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PhotoDownload;