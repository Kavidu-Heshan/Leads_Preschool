import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/StudentProfile.css'; 

const DaycarePage = () => {
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [todaysList, setTodaysList] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch data on load
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eligibleRes, todayRes] = await Promise.all([
        axios.get('http://localhost:3002/daycare/eligible'),
        axios.get('http://localhost:3002/daycare/today')
      ]);
      setEligibleStudents(eligibleRes.data);
      setTodaysList(todayRes.data);
    } catch (err) {
      console.error("Failed to load data", err);
      setError('Failed to load data. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  // Time validation check
  const isWithinAllowedTime = () => {
    const currentHour = new Date().getHours();
    // Allows access from 5:00 AM (5) up to 8:59 AM. 
    // The moment it hits 9:00 AM, it returns false.
    return currentHour >= 5 && currentHour < 9;
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Double-check time upon submission just in case the window was left open
    if (!isWithinAllowedTime()) {
      setError('Students can only be added between 5:00 AM and 9:00 AM.');
      return;
    }

    if (!selectedStudent) {
      setError('Please select a student to add.');
      return;
    }

    // Find full details of selected student to send name
    const studentData = eligibleStudents.find(s => s.childId === selectedStudent);

    try {
      const response = await axios.post('http://localhost:3002/daycare/add', {
        childId: studentData.childId,
        childName: studentData.fullName
      });

      if (response.data.success) {
        setSuccess(response.data.message);
        setSelectedStudent(''); // Reset dropdown
        fetchData(); // Refresh the list
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add student.');
    }
  };

  if (loading) {
    return <div className="profile-container"><div className="spinner" style={{margin: '100px auto'}}></div></div>;
  }

  const isLimitReached = todaysList.length >= 5;
  const isTimeValid = isWithinAllowedTime();
  const isFormDisabled = isLimitReached || !isTimeValid;

  return (
    <div className="profile-container">
      <div className="profile-card" style={{ maxWidth: '800px' }}>
        
        <div className="profile-header">
          <div className="header-icon">
            <span className="profile-icon">🧸</span>
          </div>
          <h1>Daily Daycare Attendance</h1>
          <p className="header-subtitle">Manage today's daycare students (Max 5)</p>
        </div>

        {/* Status Messages */}
        {error && <div className="error-message">⚠️ {error}</div>}
        {success && <div className="success-message">✓ {success}</div>}

        {/* Add Student Form */}
        <div style={{ background: '#F1F8E9', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #C8E6C9' }}>
          
          {/* Out of bounds time message */}
          {!isTimeValid && (
            <div style={{ background: '#FFF3E0', padding: '10px 15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #FFE0B2', color: '#E65100', fontWeight: 'bold' }}>
              🕒 Attendance closed. You can only add students between 5:00 AM and 9:00 AM.
            </div>
          )}

          <form onSubmit={handleAddStudent} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', opacity: isTimeValid ? 1 : 0.6 }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label>Select Eligible Student</label>
              <select 
                value={selectedStudent} 
                onChange={(e) => setSelectedStudent(e.target.value)}
                disabled={isFormDisabled}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', cursor: isFormDisabled ? 'not-allowed' : 'pointer' }}
              >
                <option value="">-- Choose a Student --</option>
                {eligibleStudents.map(student => {
                  const isAlreadyAdded = todaysList.some(t => t.childId === student.childId);
                  if (isAlreadyAdded) return null;
                  
                  return (
                    <option key={student.childId} value={student.childId}>
                      {student.fullName} ({student.childId})
                    </option>
                  );
                })}
              </select>
            </div>
            
            <button 
              type="submit" 
              className="submit-button"
              disabled={isFormDisabled || !selectedStudent}
              style={{ width: 'auto', padding: '12px 25px', marginBottom: 0, opacity: isFormDisabled ? 0.5 : 1, cursor: isFormDisabled ? 'not-allowed' : 'pointer' }}
            >
              ➕ Add to Daycare
            </button>
          </form>

          {isLimitReached && isTimeValid && (
            <p style={{ color: '#d32f2f', marginTop: '10px', fontSize: '0.9rem', fontWeight: 'bold' }}>
              ⚠️ Daily limit of 5 students has been reached.
            </p>
          )}
        </div>

        {/* Today's List Display */}
        <div className="todays-list">
          <h2 style={{ color: '#2E7D32', borderBottom: '2px solid #E8F5E9', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <span>📅 Today's List</span>
            <span style={{ fontSize: '1rem', background: isLimitReached ? '#ffcdd2' : '#E8F5E9', padding: '5px 15px', borderRadius: '20px' }}>
              {todaysList.length} / 5 Enrolled
            </span>
          </h2>

          {todaysList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666', background: '#fafafa', borderRadius: '8px', marginTop: '15px' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>🚸</span>
              No students added yet today.<br/>Select a student above to begin.
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px' }}>
              {todaysList.map((student, index) => (
                <li key={student._id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '15px', 
                  background: '#fff', 
                  border: '1px solid #eee', 
                  borderRadius: '8px',
                  marginBottom: '10px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ 
                    background: '#4CAF50', 
                    color: 'white', 
                    width: '30px', 
                    height: '30px', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    marginRight: '15px'
                  }}>
                    {index + 1}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: '#333', fontSize: '1.1rem' }}>{student.childName}</h3>
                    <span style={{ fontSize: '0.85rem', color: '#888' }}>ID: {student.childId} • Added at: {new Date(student.addedAt).toLocaleTimeString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
};

export default DaycarePage;