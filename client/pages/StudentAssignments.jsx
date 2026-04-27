import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../css/Assignments.css";
import UserNavbar from "../components/UserNavbar";

const StudentAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [activeClass, setActiveClass] = useState("ALL");
  const [uploadingAssignmentId, setUploadingAssignmentId] = useState(null);
  const fileInputRef = useRef(null);

  const childData = JSON.parse(localStorage.getItem('currentChild') || sessionStorage.getItem('currentChild') || '{}');
  const childId = childData.childId;
  const childName = childData.childName || childId; // Fallback

  const API_URL = import.meta.env.VITE_API_URL || "https://leadspreschool-production.up.railway.app";

  useEffect(() => {
    if (childId) {
      fetchData();
    } else {
      setError("Please log in to view assignments.");
      setLoading(false);
    }
  }, [activeClass]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assigRes, subRes] = await Promise.all([
        axios.get(`${API_URL}/assignments/class/${activeClass}`),
        axios.get(`${API_URL}/assignments/my-submissions/${childId}`)
      ]);
      setAssignments(assigRes.data);
      setMySubmissions(subRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e, assignmentId) => {
    const file = e.target.files[0];
    if (!file) return;

    handleUpload(file, assignmentId);
  };

  const handleUpload = async (file, assignmentId) => {
    setError("");
    setSuccess("");
    setUploadingAssignmentId(assignmentId);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("childId", childId);
    formData.append("childName", childName);

    try {
      const response = await axios.post(`${API_URL}/assignments/submit/${assignmentId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (response.data.success) {
        setSuccess("Assignment submitted successfully!");
        fetchData(); // Refresh to get new submission status
      }
    } catch (err) {
      setError("Failed to submit assignment. Please try again.");
    } finally {
      setUploadingAssignmentId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const downloadFile = (url) => {
    window.open(`${API_URL}${url}`, "_blank");
  };

  const getSubmissionForAssignment = (assignmentId) => {
    return mySubmissions.find(sub => sub.assignmentId === assignmentId);
  };

  return (
    <div className="assignments-wrapper">
      <UserNavbar />
      
      <div className="assignments-container">
        <div className="assignments-header">
          <h1>📝 My Assignments</h1>
          <p>View your tasks and upload your completed work here</p>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <select 
            className="form-control" 
            style={{ maxWidth: '300px', margin: '0 auto', display: 'inline-block' }}
            value={activeClass}
            onChange={(e) => setActiveClass(e.target.value)}
          >
            <option value="ALL">All Classes (General)</option>
            <option value="LKG">LKG</option>
            <option value="UKG">UKG</option>
          </select>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <span className="spinner"></span>
            <p>Loading your assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="form-card" style={{ textAlign: 'center' }}>
            <h2>No assignments found! 🎉</h2>
            <p>Check back later for new tasks from your teacher.</p>
          </div>
        ) : (
          assignments.map(assignment => {
            const submission = getSubmissionForAssignment(assignment._id);
            const isLate = new Date() > new Date(assignment.deadline) && !submission;

            return (
              <div key={assignment._id} className="assignment-card">
                <div className="assignment-header">
                  <div>
                    <h3 className="assignment-title">{assignment.title}</h3>
                    <span className={`badge ${assignment.className.toLowerCase()}`}>{assignment.className}</span>
                    <span style={{ marginLeft: '10px', color: '#666' }}>{assignment.subject}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <small style={{ color: isLate ? '#e74c3c' : '#4a8a5f', fontWeight: 'bold' }}>
                      Deadline: {new Date(assignment.deadline).toLocaleString()}
                    </small>
                    <br/>
                    {submission ? (
                      <span className={`status-badge ${submission.status.toLowerCase()}`}>
                        {submission.status}
                      </span>
                    ) : (
                      <span className={`status-badge ${isLate ? 'late' : 'pending'}`}>
                        {isLate ? 'Overdue' : 'Pending'}
                      </span>
                    )}
                  </div>
                </div>
                
                <p>{assignment.description}</p>
                <p><small style={{color: '#888'}}>Posted by: {assignment.teacherName}</small></p>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                  {assignment.fileUrl && (
                    <button className="action-btn secondary" onClick={() => downloadFile(assignment.fileUrl)}>
                      📎 Download Assignment Details
                    </button>
                  )}
                  
                  {submission && (
                    <button className="action-btn secondary" onClick={() => downloadFile(submission.fileUrl)}>
                      📄 View My Submission
                    </button>
                  )}
                  
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <input 
                      type="file" 
                      id={`upload-${assignment._id}`}
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileSelect(e, assignment._id)}
                      ref={fileInputRef}
                    />
                    <button 
                      className="action-btn primary"
                      disabled={uploadingAssignmentId === assignment._id}
                      onClick={() => document.getElementById(`upload-${assignment._id}`).click()}
                    >
                      {uploadingAssignmentId === assignment._id ? 'Uploading...' : (submission ? '📤 Update Submission' : '📤 Upload Work')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudentAssignments;
