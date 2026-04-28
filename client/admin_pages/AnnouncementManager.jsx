import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminNavbar from "../components/AdminNavbar";
import "../css/AnnouncementManager.css";

const API_URL = import.meta.env.VITE_API_URL || "https://leadspreschool-production.up.railway.app";

const AnnouncementManager = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("Low");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [teacherName, setTeacherName] = useState("");

  useEffect(() => {
    // Check authentication
    const teacherData = localStorage.getItem("currentTeacher");
    const adminData = localStorage.getItem("currentAdmin");
    
    if (teacherData) {
      try {
        const parsed = JSON.parse(teacherData);
        setTeacherName(parsed.teacherName || "Teacher");
      } catch (err) {
        setTeacherName("Teacher");
      }
    } else if (adminData) {
      setTeacherName("Admin");
    } else {
      setTeacherName("Admin");
    }

    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/announcements`);
      setAnnouncements(res.data);
      setError("");
    } catch (err) {
      console.error("Error fetching announcements:", err);
      setError("Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError("Title and message are required.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const newAnnouncement = {
        title,
        message,
        priority,
        endDate: endDate ? new Date(endDate) : null,
        posted_by: teacherName || "Admin"
      };

      await axios.post(`${API_URL}/announcements`, newAnnouncement, {
        headers: {
          Authorization: `Bearer admin-token`
        }
      });

      setSuccess("Announcement posted successfully! 📢");
      setTitle("");
      setMessage("");
      setPriority("Low");
      setEndDate("");
      fetchAnnouncements();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error creating announcement:", err);
      setError("Failed to post announcement. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/announcements/${id}`, {
        headers: {
          Authorization: `Bearer admin-token`
        }
      });
      setSuccess("Announcement deleted.");
      fetchAnnouncements();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error deleting announcement:", err);
      setError("Failed to delete announcement.");
    }
  };

  return (
    <div className="announcement-manager-wrapper">
      <AdminNavbar />
      
      <div className="manager-container">
        <div className="manager-header">
          <h1>📢 Notice Board Manager</h1>
          <p>Post and manage announcements for parents and children 🌿</p>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}
        {success && <div className="alert alert-success">✓ {success}</div>}

        <div className="announcement-form-card">
          <h2>Create New Announcement</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="E.g., Field Trip Next Week!" 
                maxLength="255"
              />
            </div>
            
            <div className="form-group">
              <label>Message</label>
              <textarea 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                placeholder="Write the announcement details here..."
                rows="4"
              ></textarea>
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="Low">🟢 Low (General Info)</option>
                <option value="Medium">🟠 Medium (Important)</option>
                <option value="High">🔴 High (Urgent)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Auto-Remove Date (Optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Posting..." : "Post Announcement"}
            </button>
          </form>
        </div>

        <div className="announcements-list-section">
          <h2>Existing Announcements</h2>
          
          {loading ? (
            <div className="loading-spinner">Loading announcements...</div>
          ) : announcements.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
              No announcements posted yet.
            </div>
          ) : (
            announcements.map((ann) => (
              <div key={ann._id} className={`announcement-item priority-${ann.priority}`}>
                <div className="announcement-content">
                  <h3>{ann.title}</h3>
                  <div className="announcement-meta">
                    <span className="priority-badge">{ann.priority} Priority</span>
                    <span>Posted by: {ann.posted_by}</span>
                    <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="announcement-message">{ann.message}</div>
                </div>
                <button 
                  onClick={() => handleDelete(ann._id)} 
                  className="delete-btn"
                  title="Delete Announcement"
                >
                  🗑️ Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementManager;
