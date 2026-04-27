import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/Assignments.css";
import AdminNavbar from "../components/AdminNavbar";

const AssignmentManager = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [className, setClassName] = useState("ALL");
  const [subject, setSubject] = useState("");
  const [deadline, setDeadline] = useState("");
  const [file, setFile] = useState(null);
  
  // View Submissions State
  const [activeAssignmentId, setActiveAssignmentId] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  const teacherData = JSON.parse(localStorage.getItem('currentTeacher') || sessionStorage.getItem('currentTeacher') || '{}');
  const teacherName = teacherData.teacherName || 'Admin';

  const API_URL = import.meta.env.VITE_API_URL || "https://leadspreschool-production.up.railway.app";

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/assignments`);
      setAssignments(response.data);
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setError("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!title || !subject || !deadline) {
      setError("Please fill all required fields.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("className", className);
    formData.append("subject", subject);
    formData.append("deadline", deadline);
    formData.append("teacherName", teacherName);
    if (file) {
      formData.append("file", file);
    }

    try {
      const response = await axios.post(`${API_URL}/assignments/create`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (response.data.success) {
        setSuccess("Assignment posted successfully!");
        setTitle("");
        setDescription("");
        setClassName("ALL");
        setSubject("");
        setDeadline("");
        setFile(null);
        document.getElementById('assignmentFile').value = '';
        fetchAssignments();
      }
    } catch (err) {
      setError("Failed to create assignment.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this assignment and all its submissions?")) return;
    
    try {
      await axios.delete(`${API_URL}/assignments/${id}`);
      setSuccess("Assignment deleted.");
      fetchAssignments();
    } catch (err) {
      setError("Failed to delete assignment.");
    }
  };

  const fetchSubmissions = async (id) => {
    if (activeAssignmentId === id) {
      setActiveAssignmentId(null);
      return;
    }
    
    try {
      const response = await axios.get(`${API_URL}/assignments/submissions/${id}`);
      setSubmissions(response.data);
      setActiveAssignmentId(id);
    } catch (err) {
      setError("Failed to fetch submissions.");
    }
  };

  const downloadFile = (url, fileName) => {
    window.open(`${API_URL}${url}`, "_blank");
  };

  return (
    <div className="assignments-wrapper">
      <AdminNavbar />
      
      <div className="assignments-container">
        <div className="assignments-header">
          <h1>📚 Assignment Manager</h1>
          <p>Post assignments and review student submissions</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="form-card">
          <h2>Create New Assignment</h2>
          <form onSubmit={handleCreate}>
            <div className="form-group mb-3">
              <label>Title *</label>
              <input type="text" className="form-control" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="form-group mb-3">
              <label>Description</label>
              <textarea className="form-control" value={description} onChange={e => setDescription(e.target.value)} rows="3" />
            </div>
            <div className="row mb-3">
              <div className="col-md-4">
                <label>Class</label>
                <select className="form-control" value={className} onChange={e => setClassName(e.target.value)}>
                  <option value="ALL">All Classes</option>
                  <option value="LKG">LKG</option>
                  <option value="UKG">UKG</option>
                </select>
              </div>
              <div className="col-md-4">
                <label>Subject *</label>
                <input type="text" className="form-control" value={subject} onChange={e => setSubject(e.target.value)} required />
              </div>
              <div className="col-md-4">
                <label>Deadline *</label>
                <input type="datetime-local" className="form-control" value={deadline} onChange={e => setDeadline(e.target.value)} required />
              </div>
            </div>
            <div className="form-group mb-4">
              <label>Attachment (Optional)</label>
              <input type="file" id="assignmentFile" className="form-control" onChange={e => setFile(e.target.files[0])} />
            </div>
            <button type="submit" className="action-btn primary">Post Assignment</button>
          </form>
        </div>

        <h2>Active Assignments</h2>
        {loading ? (
          <p>Loading...</p>
        ) : assignments.length === 0 ? (
          <p>No assignments created yet.</p>
        ) : (
          assignments.map(assignment => (
            <div key={assignment._id} className="assignment-card">
              <div className="assignment-header">
                <div>
                  <h3 className="assignment-title">{assignment.title}</h3>
                  <span className={`badge ${assignment.className.toLowerCase()}`}>{assignment.className}</span>
                  <span style={{ marginLeft: '10px', color: '#666' }}>{assignment.subject}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <small style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                    Deadline: {new Date(assignment.deadline).toLocaleString()}
                  </small>
                </div>
              </div>
              <p>{assignment.description}</p>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button className="action-btn secondary" onClick={() => fetchSubmissions(assignment._id)}>
                  👥 View Submissions
                </button>
                {assignment.fileUrl && (
                  <button className="action-btn secondary" onClick={() => downloadFile(assignment.fileUrl, assignment.fileName)}>
                    📎 Download Prompt
                  </button>
                )}
                <button className="action-btn danger" onClick={() => handleDelete(assignment._id)}>
                  🗑️ Delete
                </button>
              </div>

              {activeAssignmentId === assignment._id && (
                <div className="submissions-list">
                  <h4>Submissions ({submissions.length})</h4>
                  {submissions.length === 0 ? (
                    <p>No submissions yet.</p>
                  ) : (
                    submissions.map(sub => (
                      <div key={sub._id} className="submission-item">
                        <div>
                          <strong>{sub.childName}</strong> ({sub.childId})
                          <br/>
                          <small>Submitted: {new Date(sub.submittedAt).toLocaleString()}</small>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <span className={`status-badge ${sub.status.toLowerCase()}`}>{sub.status}</span>
                          <button className="action-btn primary" onClick={() => downloadFile(sub.fileUrl, sub.fileName)}>
                            ⬇️ Download
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AssignmentManager;
