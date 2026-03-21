import React, { useState, useEffect } from 'react';
import '../css/DaycareEnrollment.css';

const DaycareEnrollment = () => {
  const [children, setChildren] = useState([]);
  const [daycareChildren, setDaycareChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');

  // Form state for enrollment
  const [enrollmentData, setEnrollmentData] = useState({
    childId: '',
    fullName: '',
    startDate: '',
    schedule: 'Full Day',
    pickupTime: '17:00',
    dropoffTime: '08:00',
    specialInstructions: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    medicalNotes: '',
    dietaryRestrictions: ''
  });

  // Form state for adding new child to daycare
  const [newChildData, setNewChildData] = useState({
    childId: '',
    fullName: '',
    gender: 'Male',
    class: '',
    includeDaycare: false,
    dob: '',
    age: '',
    bloodType: '',
    guardianName: '',
    contactNumbers: [''],
    email: '',
    medicalInformation: ''
  });

  // Class options
  const classOptions = ['Daycare', 'LKG', 'UKG'];
  const scheduleOptions = ['Full Day', 'Half Day Morning', 'Half Day Afternoon', 'Flexible'];
  const bloodTypeOptions = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const genderOptions = ['Male', 'Female'];

  // Fetch all children and daycare enrolled children
  useEffect(() => {
    fetchChildren();
    fetchDaycareChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const response = await fetch('http://localhost:3002/students');
      const data = await response.json();
      if (response.ok) {
        setChildren(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching children:', err);
      setError('Failed to load children data');
    }
  };

  const fetchDaycareChildren = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3002/daycare/enrolled');
      const data = await response.json();
      if (response.ok) {
        setDaycareChildren(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching daycare children:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChildChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'contactNumbers') {
      const contactNumbers = [...newChildData.contactNumbers];
      contactNumbers[0] = value;
      setNewChildData({ ...newChildData, contactNumbers });
    } else if (type === 'checkbox') {
      setNewChildData({ ...newChildData, [name]: checked });
    } else if (name === 'dob') {
      // Calculate age when DOB changes
      const age = calculateAge(value);
      setNewChildData({ ...newChildData, dob: value, age });
    } else {
      setNewChildData({ ...newChildData, [name]: value });
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const validateNewChild = () => {
    if (!newChildData.fullName) return 'Full name is required';
    if (!newChildData.gender) return 'Gender is required';
    if (!newChildData.class) return 'Class is required';
    if (!newChildData.dob) return 'Date of birth is required';
    
    const age = calculateAge(newChildData.dob);
    if (age < 3) return 'Child must be at least 3 years old';
    if (age > 5) return 'Child cannot be older than 5 years';
    
    if (!newChildData.bloodType) return 'Blood type is required';
    if (!newChildData.guardianName) return 'Guardian name is required';
    if (!newChildData.contactNumbers[0]) return 'Contact number is required';
    
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(newChildData.contactNumbers[0])) {
      return 'Contact number must be 10 digits starting with 0';
    }
    
    if (!newChildData.email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newChildData.email)) {
      return 'Please enter a valid email address';
    }
    
    return null;
  };

  const handleCreateChild = async (e) => {
    e.preventDefault();
    
    const validationError = validateNewChild();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:3002/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newChildData,
          includeDaycare: newChildData.includeDaycare,
          age: calculateAge(newChildData.dob),
          childId: `CH${Date.now()}`,
          profilePhoto: newChildData.gender === 'Male' ? '👦' : '👧'
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Child profile created successfully!');
        setNewChildData({
          childId: '',
          fullName: '',
          gender: 'Male',
          class: '',
          includeDaycare: false,
          dob: '',
          age: '',
          bloodType: '',
          guardianName: '',
          contactNumbers: [''],
          email: '',
          medicalInformation: ''
        });
        fetchChildren();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to create child profile');
      }
    } catch (err) {
      console.error('Error creating child:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollChild = (child) => {
    // Check if child includes daycare
    if (!child.includeDaycare) {
      setError(`Cannot enroll ${child.fullName} in daycare. This child is not registered for daycare services.`);
      setTimeout(() => setError(''), 4000);
      return;
    }

    // Check if already enrolled
    const alreadyEnrolled = daycareChildren.some(dc => dc.childId === child.childId);
    if (alreadyEnrolled) {
      setError(`${child.fullName} is already enrolled in daycare.`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    setSelectedChild(child);
    setEnrollmentData({
      ...enrollmentData,
      childId: child.childId,
      fullName: child.fullName,
      startDate: new Date().toISOString().split('T')[0],
      emergencyContact: {
        name: child.guardianName || '',
        phone: child.contactNumbers?.[0] || '',
        relationship: 'Parent/Guardian'
      },
      medicalNotes: child.medicalInformation || '',
      dietaryRestrictions: ''
    });
    setShowEnrollForm(true);
  };

  const handleEnrollmentChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEnrollmentData({
        ...enrollmentData,
        [parent]: {
          ...enrollmentData[parent],
          [child]: value
        }
      });
    } else {
      setEnrollmentData({ ...enrollmentData, [name]: value });
    }
  };

  const validateEnrollment = () => {
    if (!enrollmentData.startDate) return 'Start date is required';
    if (!enrollmentData.emergencyContact.name) return 'Emergency contact name is required';
    if (!enrollmentData.emergencyContact.phone) return 'Emergency contact phone is required';
    
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(enrollmentData.emergencyContact.phone)) {
      return 'Emergency contact phone must be 10 digits starting with 0';
    }
    
    return null;
  };

  const handleSubmitEnrollment = async (e) => {
    e.preventDefault();
    
    const validationError = validateEnrollment();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:3002/daycare/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enrollmentData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(`${selectedChild.fullName} has been successfully enrolled in daycare!`);
        setShowEnrollForm(false);
        setSelectedChild(null);
        fetchDaycareChildren();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to enroll child in daycare');
      }
    } catch (err) {
      console.error('Enrollment error:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromDaycare = async (child) => {
    if (!window.confirm(`Are you sure you want to remove ${child.fullName} from daycare?`)) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3002/daycare/${child.enrollmentId || child._id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(`${child.fullName} has been removed from daycare.`);
        fetchDaycareChildren();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to remove from daycare');
      }
    } catch (err) {
      console.error('Remove error:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Filter children for enrollment (only those with includeDaycare=true and not already enrolled)
  const eligibleChildren = children.filter(child => 
    child.includeDaycare === true && 
    !daycareChildren.some(dc => dc.childId === child.childId) &&
    (child.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     child.childId?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterClass === '' || child.class === filterClass)
  );

  return (
    <div className="daycare-container">
      <div className="daycare-decor">
        <div className="decor-circle circle-1"></div>
        <div className="decor-circle circle-2"></div>
        <div className="decor-icon icon-1">🏠</div>
        <div className="decor-icon icon-2">👶</div>
        <div className="decor-icon icon-3">🎨</div>
      </div>

      <div className="daycare-content">
        {/* Header */}
        <div className="daycare-header">
          <div className="header-left">
            <div className="header-icon">🏠</div>
            <div>
              <h1 className="daycare-title">Daycare Management</h1>
              <p className="daycare-subtitle">Enroll and manage children in daycare services</p>
            </div>
          </div>
          <div className="stats-container">
            <div className="stat-card-small">
              <span className="stat-number">{daycareChildren.length}</span>
              <span className="stat-label">Enrolled</span>
            </div>
            <div className="stat-card-small">
              <span className="stat-number">{children.filter(c => c.includeDaycare).length}</span>
              <span className="stat-label">Eligible</span>
            </div>
          </div>
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

        {/* Add Child Form Section */}
        <div className="form-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-icon">👶</span>
              Register New Child
            </h2>
            <p className="section-description">Create a child profile. Check "Include Daycare" to make them eligible for daycare enrollment.</p>
          </div>

          <form onSubmit={handleCreateChild} className="child-form">
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={newChildData.fullName}
                  onChange={handleNewChildChange}
                  required
                  placeholder="Enter child's full name"
                />
              </div>

              <div className="form-group">
                <label>Gender *</label>
                <select name="gender" value={newChildData.gender} onChange={handleNewChildChange} required>
                  {genderOptions.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Class *</label>
                <select name="class" value={newChildData.class} onChange={handleNewChildChange} required>
                  <option value="">Select Class</option>
                  {classOptions.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Date of Birth *</label>
                <input
                  type="date"
                  name="dob"
                  value={newChildData.dob}
                  onChange={handleNewChildChange}
                  required
                />
                {newChildData.age && (
                  <small className="age-hint">Age: {newChildData.age} years</small>
                )}
              </div>

              <div className="form-group">
                <label>Blood Type *</label>
                <select name="bloodType" value={newChildData.bloodType} onChange={handleNewChildChange} required>
                  <option value="">Select Blood Type</option>
                  {bloodTypeOptions.map(bt => (
                    <option key={bt} value={bt}>{bt}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Guardian Name *</label>
                <input
                  type="text"
                  name="guardianName"
                  value={newChildData.guardianName}
                  onChange={handleNewChildChange}
                  required
                  placeholder="Parent/Guardian full name"
                />
              </div>

              <div className="form-group">
                <label>Contact Number *</label>
                <input
                  type="tel"
                  name="contactNumbers"
                  value={newChildData.contactNumbers[0]}
                  onChange={handleNewChildChange}
                  required
                  placeholder="0771234567"
                />
                <small>10 digits starting with 0</small>
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={newChildData.email}
                  onChange={handleNewChildChange}
                  required
                  placeholder="parent@example.com"
                />
              </div>

              <div className="form-group full-width">
                <label>Medical Information</label>
                <textarea
                  name="medicalInformation"
                  value={newChildData.medicalInformation}
                  onChange={handleNewChildChange}
                  rows="2"
                  placeholder="Any allergies, medical conditions, or special notes"
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="includeDaycare"
                    checked={newChildData.includeDaycare}
                    onChange={handleNewChildChange}
                  />
                  <span className="checkbox-text">Include Daycare Services</span>
                </label>
                <p className="checkbox-hint">
                  {newChildData.includeDaycare 
                    ? "✓ Child will be eligible for daycare enrollment" 
                    : "⚠️ Child cannot be enrolled in daycare without this option"}
                </p>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? <span className="spinner"></span> : 'Register Child'}
              </button>
            </div>
          </form>
        </div>

        {/* Eligible Children Section */}
        <div className="eligible-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-icon">✅</span>
              Eligible Children for Daycare
            </h2>
            <p className="section-description">Children who have daycare included in their profile can be enrolled.</p>
          </div>

          <div className="filter-bar">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <select 
              value={filterClass} 
              onChange={(e) => setFilterClass(e.target.value)}
              className="filter-select"
            >
              <option value="">All Classes</option>
              {classOptions.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          {eligibleChildren.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">👶</span>
              <p>No eligible children found</p>
              <p className="empty-hint">Register a child with "Include Daycare" option checked</p>
            </div>
          ) : (
            <div className="children-grid">
              {eligibleChildren.map(child => (
                <div key={child.childId} className="child-card">
                  <div className="child-avatar">
                    <span className="avatar-emoji">{child.profilePhoto || (child.gender === 'Male' ? '👦' : '👧')}</span>
                  </div>
                  <div className="child-info">
                    <h3 className="child-name">{child.fullName}</h3>
                    <p className="child-details">
                      <span className="detail-badge">{child.class}</span>
                      <span className="detail-badge">{child.age} years</span>
                    </p>
                    <p className="child-contact">{child.guardianName}</p>
                    <p className="child-contact">{child.contactNumbers?.[0]}</p>
                  </div>
                  <button 
                    className="enroll-btn"
                    onClick={() => handleEnrollChild(child)}
                  >
                    Enroll in Daycare
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Currently Enrolled Section */}
        <div className="enrolled-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-icon">🏠</span>
              Currently Enrolled in Daycare
            </h2>
            <p className="section-description">Children currently attending daycare services.</p>
          </div>

          {loading && daycareChildren.length === 0 ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
            </div>
          ) : daycareChildren.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🏠</span>
              <p>No children currently enrolled in daycare</p>
              <p className="empty-hint">Enroll eligible children from above</p>
            </div>
          ) : (
            <div className="enrolled-grid">
              {daycareChildren.map(child => (
                <div key={child.enrollmentId || child._id} className="enrolled-card">
                  <div className="enrolled-header">
                    <div className="enrolled-avatar">
                      <span>{child.profilePhoto || (child.gender === 'Male' ? '👦' : '👧')}</span>
                    </div>
                    <div className="enrolled-info">
                      <h4 className="enrolled-name">{child.fullName}</h4>
                      <p className="enrolled-class">{child.class} | {child.age} years</p>
                    </div>
                    <button 
                      className="remove-btn"
                      onClick={() => handleRemoveFromDaycare(child)}
                      title="Remove from daycare"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="enrolled-details">
                    <div className="detail-row">
                      <span className="detail-label">Schedule:</span>
                      <span className="detail-value">{child.schedule || 'Full Day'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Timings:</span>
                      <span className="detail-value">{child.dropoffTime || '08:00'} - {child.pickupTime || '17:00'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Emergency:</span>
                      <span className="detail-value">{child.emergencyContact?.name} ({child.emergencyContact?.phone})</span>
                    </div>
                    {child.specialInstructions && (
                      <div className="detail-row">
                        <span className="detail-label">Notes:</span>
                        <span className="detail-value">{child.specialInstructions}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Enrollment Modal */}
      {showEnrollForm && selectedChild && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Enroll in Daycare</h3>
              <button className="modal-close" onClick={() => {
                setShowEnrollForm(false);
                setSelectedChild(null);
              }}>✕</button>
            </div>
            <form onSubmit={handleSubmitEnrollment}>
              <div className="modal-body">
                <div className="enrollment-child-info">
                  <span className="child-emoji">{selectedChild.profilePhoto || (selectedChild.gender === 'Male' ? '👦' : '👧')}</span>
                  <div>
                    <strong>{selectedChild.fullName}</strong>
                    <p>{selectedChild.class} | {selectedChild.age} years</p>
                  </div>
                </div>

                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={enrollmentData.startDate}
                    onChange={handleEnrollmentChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Schedule Type *</label>
                  <select name="schedule" value={enrollmentData.schedule} onChange={handleEnrollmentChange} required>
                    {scheduleOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Drop-off Time</label>
                    <input
                      type="time"
                      name="dropoffTime"
                      value={enrollmentData.dropoffTime}
                      onChange={handleEnrollmentChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Pick-up Time</label>
                    <input
                      type="time"
                      name="pickupTime"
                      value={enrollmentData.pickupTime}
                      onChange={handleEnrollmentChange}
                    />
                  </div>
                </div>

                <div className="form-section-title">Emergency Contact</div>
                
                <div className="form-group">
                  <label>Contact Name *</label>
                  <input
                    type="text"
                    name="emergencyContact.name"
                    value={enrollmentData.emergencyContact.name}
                    onChange={handleEnrollmentChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      name="emergencyContact.phone"
                      value={enrollmentData.emergencyContact.phone}
                      onChange={handleEnrollmentChange}
                      required
                      placeholder="0771234567"
                    />
                  </div>
                  <div className="form-group">
                    <label>Relationship</label>
                    <input
                      type="text"
                      name="emergencyContact.relationship"
                      value={enrollmentData.emergencyContact.relationship}
                      onChange={handleEnrollmentChange}
                      placeholder="Parent, Grandparent, etc."
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Special Instructions</label>
                  <textarea
                    name="specialInstructions"
                    value={enrollmentData.specialInstructions}
                    onChange={handleEnrollmentChange}
                    rows="2"
                    placeholder="Any special notes for daycare staff"
                  />
                </div>

                <div className="form-group">
                  <label>Medical Notes</label>
                  <textarea
                    name="medicalNotes"
                    value={enrollmentData.medicalNotes}
                    onChange={handleEnrollmentChange}
                    rows="2"
                    placeholder="Allergies, medications, or medical conditions"
                  />
                </div>

                <div className="form-group">
                  <label>Dietary Restrictions</label>
                  <textarea
                    name="dietaryRestrictions"
                    value={enrollmentData.dietaryRestrictions}
                    onChange={handleEnrollmentChange}
                    rows="2"
                    placeholder="Food allergies, dietary preferences"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => {
                  setShowEnrollForm(false);
                  setSelectedChild(null);
                }}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Enrolling...' : 'Confirm Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DaycareEnrollment;