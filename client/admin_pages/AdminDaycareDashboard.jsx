import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/AdminDaycareDashboard.css'; // Import the CSS file

const AdminDaycareDashboard = () => {
  const [students, setStudents] = useState([]);
  const [presentToday, setPresentToday] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch all eligible students AND today's attendance simultaneously
      const [eligibleRes, todayRes] = await Promise.all([
        axios.get('http://localhost:3002/daycare/eligible'),
        axios.get('http://localhost:3002/daycare/today')
      ]);
      
      setStudents(eligibleRes.data);
      // Map today's list to an array of childIds for easy lookup
      const presentIds = todayRes.data.map(entry => entry.childId);
      setPresentToday(presentIds);
    } catch (err) {
      console.error("Failed to load admin data", err);
      setError('Failed to load daycare data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.childId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort students: present first, then not present
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const aIsPresent = presentToday.includes(a.childId);
    const bIsPresent = presentToday.includes(b.childId);
    
    // Present children come first
    if (aIsPresent && !bIsPresent) return -1;
    if (!aIsPresent && bIsPresent) return 1;
    
    // If both present or both not present, sort by name alphabetically
    return (a.fullName || '').localeCompare(b.fullName || '');
  });

  // Group students for display (optional - to show sections)
  const presentStudents = sortedStudents.filter(student => presentToday.includes(student.childId));
  const notPresentStudents = sortedStudents.filter(student => !presentToday.includes(student.childId));

  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <div className="nature-bg">
          <div className="leaf leaf-1">🌿</div>
          <div className="leaf leaf-2">🍃</div>
          <div className="leaf leaf-3">🌱</div>
          <div className="leaf leaf-4">🌿</div>
          <div className="leaf leaf-5">🍂</div>
          <div className="leaf leaf-6">🍃</div>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading daycare data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
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

      <div className="dashboard-content">
        {/* Header & Stats Section */}
        <div className="dashboard-header">
          <div className="header-title">
            <div className="header-icon">👑</div>
            <div>
              <h1>Admin Daycare Overview</h1>
              <p className="header-subtitle">Manage and view all registered daycare students</p>
            </div>
          </div>
          
          <div className="stats-container">
            <div className="stat-card">
              <h3 className="stat-number">{students.length}</h3>
              <span className="stat-label">Total Eligible</span>
            </div>
            <div className={`stat-card ${presentToday.length >= 5 ? 'full' : ''}`}>
              <h3 className="stat-number">{presentToday.length} / 5</h3>
              <span className="stat-label">Present Today</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span> {error}
          </div>
        )}

        {/* Search Bar */}
        <div className="search-container">
          <input 
            type="text" 
            placeholder="🔍 Search students by name or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Present Students Section */}
        {presentStudents.length > 0 && (
          <div className="section-container">
            <div className="section-header">
              <div className="section-title">
                <span className="section-icon">✅</span>
                <h2>Present Today</h2>
                <span className="section-count">{presentStudents.length}</span>
              </div>
            </div>
            <div className="students-grid">
              {presentStudents.map((student, index) => (
                <div 
                  key={student.childId} 
                  className={`student-card present`}
                  style={{ '--index': index }}
                >
                  {/* Status Badge */}
                  <div className="status-badge present">
                    <span className="status-dot present"></span>
                    Present Today
                  </div>

                  {/* Profile Photo Avatar */}
                  <div className="student-avatar">
                    {student.profilePhoto || (student.gender === 'Male' ? '👦' : '👧')}
                  </div>

                  {/* Student Info */}
                  <h3 className="student-name">{student.fullName}</h3>
                  <span className="student-id">ID: {student.childId}</span>

                  <div className="student-details">
                    <div className="detail-item">
                      <span className="detail-label">Main Class</span>
                      <strong className="detail-value">{student.class}</strong>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Facility</span>
                      <strong className="detail-value">
                        {student.class === 'Daycare' ? 'Primary' : 'Extended'}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Not Present Students Section */}
        {notPresentStudents.length > 0 && (
          <div className="section-container">
            <div className="section-header">
              <div className="section-title">
                <span className="section-icon">⏳</span>
                <h2>Not Present Today</h2>
                <span className="section-count">{notPresentStudents.length}</span>
              </div>
            </div>
            <div className="students-grid">
              {notPresentStudents.map((student, index) => (
                <div 
                  key={student.childId} 
                  className="student-card"
                  style={{ '--index': index }}
                >
                  {/* Status Badge */}
                  <div className="status-badge">
                    <span className="status-dot"></span>
                    Not Present
                  </div>

                  {/* Profile Photo Avatar */}
                  <div className="student-avatar">
                    {student.profilePhoto || (student.gender === 'Male' ? '👦' : '👧')}
                  </div>

                  {/* Student Info */}
                  <h3 className="student-name">{student.fullName}</h3>
                  <span className="student-id">ID: {student.childId}</span>

                  <div className="student-details">
                    <div className="detail-item">
                      <span className="detail-label">Main Class</span>
                      <strong className="detail-value">{student.class}</strong>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Facility</span>
                      <strong className="detail-value">
                        {student.class === 'Daycare' ? 'Primary' : 'Extended'}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results Found */}
        {sortedStudents.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h2>No students found</h2>
            <p>No students matching "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDaycareDashboard;