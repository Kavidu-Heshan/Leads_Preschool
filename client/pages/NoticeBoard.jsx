import React, { useState, useEffect } from "react";
import axios from "axios";
import UserNavbar from "../components/UserNavbar";
import "../css/NoticeBoard.css";

const API_URL = import.meta.env.VITE_API_URL || "https://leadspreschool-production.up.railway.app";

const NoticeBoard = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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
      setError("Failed to load the notice board. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'High': return '🔴';
      case 'Medium': return '🟠';
      case 'Low': return '🟢';
      default: return '📢';
    }
  };

  return (
    <div className="noticeboard-wrapper">
      <UserNavbar />
      
      <div className="noticeboard-container">
        <div className="noticeboard-header">
          <h1>🌿 Notice Board</h1>
          <p>Stay updated with the latest news and announcements</p>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p>Loading notices...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🌱</div>
            <h3>All Caught Up!</h3>
            <p>There are no new announcements at the moment.</p>
          </div>
        ) : (
          <div className="notices-feed">
            {announcements.map((ann) => (
              <div key={ann._id} className={`notice-card priority-${ann.priority}`}>
                <div className="notice-header">
                  <div className="notice-title-group">
                    <h2>{getPriorityIcon(ann.priority)} {ann.title}</h2>
                    <div className="notice-date">
                      📅 {new Date(ann.createdAt).toLocaleDateString('en-US', {
                        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </div>
                  </div>
                  <div className="notice-badge">{ann.priority}</div>
                </div>
                
                <div className="notice-body">
                  {ann.message}
                </div>

                <div className="notice-footer">
                  <div className="teacher-avatar">👩‍🏫</div>
                  <span>Posted by <strong>{ann.posted_by}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticeBoard;
