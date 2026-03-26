import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/AdminStudentManagement.css';
import AdminNavbar from '../components/AdminNavbar';

const AdminStudentManagement = () => {
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');

  // Form data for editing
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Male',
    class: '',
    includeDaycare: false,
    dob: '',
    age: '',
    bloodType: '',
    guardianName: '',
    contactNumbers: '',
    email: '',
    medicalInformation: '',
    profilePhoto: ''
  });

  const [availableClasses, setAvailableClasses] = useState([]);
  const [photoPreview, setPhotoPreview] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3002/admin/students');
      if (response.data.success) {
        setStudents(response.data.students);
      } else {
        setError('Failed to fetch students');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    // Format date for input
    const formattedDob = selectedStudent.dob ? new Date(selectedStudent.dob).toISOString().split('T')[0] : '';
    const contactStr = selectedStudent.contactNumbers ? selectedStudent.contactNumbers.join(', ') : '';
    
    setFormData({
      fullName: selectedStudent.fullName || '',
      gender: selectedStudent.gender || 'Male',
      class: selectedStudent.class || '',
      includeDaycare: selectedStudent.includeDaycare || false,
      dob: formattedDob,
      age: selectedStudent.age || '',
      bloodType: selectedStudent.bloodType || '',
      guardianName: selectedStudent.guardianName || '',
      contactNumbers: contactStr,
      email: selectedStudent.email || '',
      medicalInformation: selectedStudent.medicalInformation || '',
      profilePhoto: selectedStudent.profilePhoto || ''
    });
    
    setPhotoPreview(selectedStudent.profilePhoto && selectedStudent.profilePhoto.startsWith('data:image') ? selectedStudent.profilePhoto : '');
    updateAvailableClasses(selectedStudent.age);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedStudent.fullName}'s profile? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await axios.delete(`http://localhost:3002/admin/students/${selectedStudent.childId}`);
      if (response.data.success) {
        setSuccess('Student deleted successfully!');
        setShowModal(false);
        setSelectedStudent(null);
        fetchStudents(); // Refresh the list
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to delete student');
      }
    } catch (err) {
      console.error('Error deleting student:', err);
      setError('Failed to delete student');
    }
  };

  const updateAvailableClasses = (age) => {
    const ageNum = parseInt(age);
    let classes = [];
    
    if (ageNum === 3) {
      classes = ["Daycare"];
    } else if (ageNum === 4) {
      classes = ["Daycare", "LKG"];
    } else if (ageNum === 5) {
      classes = ["Daycare", "UKG"];
    }
    
    setAvailableClasses(classes);
  };

  const calculateAge = (dobString) => {
    if (!dobString) return "";
    const birthDate = new Date(dobString);
    const today = new Date();
    
    let ageCalc = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      ageCalc--;
    }
    return ageCalc;
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^0\d{9}$/;
    return phoneRegex.test(phone);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'dob') {
      const calculatedAge = calculateAge(value);
      setFormData(prev => ({ ...prev, dob: value, age: calculatedAge }));
      updateAvailableClasses(calculatedAge);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match('image.*')) {
        setError("Please select an image file (JPEG, PNG, etc.)");
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        setError("Image size should be less than 2MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        setFormData(prev => ({ ...prev, profilePhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    // Validate phone numbers
    if (formData.contactNumbers) {
      const phones = formData.contactNumbers.split(',').map(p => p.trim());
      for (let phone of phones) {
        if (phone && !validatePhoneNumber(phone)) {
          setError("All phone numbers must be 10 digits starting with 0 (e.g., 0771234567)");
          return;
        }
      }
    }
    
    // Validate age
    if (formData.age < 3 || formData.age > 5) {
      setError("Child must be between 3 and 5 years old");
      return;
    }

    // Validate class
    if (!formData.class) {
      setError("Please select a class");
      return;
    }

    // Validate email
    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const submissionData = {
        ...formData,
        childId: selectedStudent.childId,
        contactNumbers: formData.contactNumbers ? formData.contactNumbers.split(',').map(p => p.trim()) : []
      };

      const response = await axios.put(`http://localhost:3002/admin/students/${selectedStudent.childId}`, submissionData);

      if (response.data.success) {
        setSuccess('Student profile updated successfully!');
        setIsEditing(false);
        setSelectedStudent({ ...selectedStudent, ...submissionData });
        fetchStudents(); // Refresh the list
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.error || 'Failed to update student');
      }
    } catch (err) {
      console.error('Error updating student:', err);
      setError('Failed to update student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Filter students based on search and class filter
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.childId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !filterClass || student.class === filterClass;
    return matchesSearch && matchesClass;
  });

  // Get unique classes for filter
  const uniqueClasses = [...new Set(students.map(s => s.class))];

  if (loading) {
    return (
      <div className="admin-student-wrapper">
        <AdminNavbar />
        <div className="admin-student-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading students...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-student-wrapper">
      <AdminNavbar />
      <div className="admin-student-container">
        <div className="nature-bg">
          <div className="leaf leaf-1">🌿</div>
          <div className="leaf leaf-2">🍃</div>
          <div className="leaf leaf-3">🌱</div>
          <div className="leaf leaf-4">🌿</div>
          <div className="leaf leaf-5">🍂</div>
        </div>

        <div className="floating-circle circle-1"></div>
        <div className="floating-circle circle-2"></div>
        <div className="floating-circle circle-3"></div>

        <div className="admin-card">
          <div className="admin-header">
            <div className="header-icon">
              <span className="admin-icon">👥</span>
            </div>
            <h1>Student Management</h1>
            <p className="header-subtitle">View, manage, and update student profiles</p>
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

          {/* Search and Filter Bar */}
          <div className="search-filter-bar">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="filter-box">
              <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
                <option value="">All Classes</option>
                {uniqueClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
            
            <button onClick={fetchStudents} className="refresh-btn">
              <span>🔄</span> Refresh
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-icon">👨‍🎓</div>
              <div className="stat-info">
                <h3>Total Students</h3>
                <p>{students.length}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-info">
                <h3>Daycare</h3>
                <p>{students.filter(s => s.class === 'Daycare').length}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎓</div>
              <div className="stat-info">
                <h3>LKG</h3>
                <p>{students.filter(s => s.class === 'LKG').length}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📖</div>
              <div className="stat-info">
                <h3>UKG</h3>
                <p>{students.filter(s => s.class === 'UKG').length}</p>
              </div>
            </div>
          </div>

          {/* Students Grid */}
          {filteredStudents.length === 0 ? (
            <div className="no-students">
              <div className="empty-state">
                <span className="empty-icon">📭</span>
                <h3>No Students Found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            </div>
          ) : (
            <div className="students-grid">
              {filteredStudents.map(student => (
                <div key={student.childId} className="student-card" onClick={() => handleViewDetails(student)}>
                  <div className="card-badge">
                    {student.includeDaycare && <span className="daycare-badge">+Daycare</span>}
                  </div>
                  <div className="student-avatar">
                    {student.profilePhoto && student.profilePhoto.startsWith('data:image') ? (
                      <img src={student.profilePhoto} alt={student.fullName} className="avatar-img" />
                    ) : (
                      <div className="avatar-emoji">
                        {student.profilePhoto || (student.gender === 'Male' ? '👦' : '👧')}
                      </div>
                    )}
                  </div>
                  <div className="student-info">
                    <h3>{student.fullName}</h3>
                    <p className="student-id">ID: {student.childId}</p>
                    <p className="student-class">
                      <span className="class-icon">📚</span> 
                      {student.includeDaycare ? `${student.class} + Daycare` : student.class}
                    </p>
                    <p className="student-age">
                      <span className="age-icon">🎂</span> 
                      {student.age} years
                    </p>
                  </div>
                  <div className="card-footer">
                    <button className="view-btn" onClick={(e) => { e.stopPropagation(); handleViewDetails(student); }}>
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal for Viewing/Editing Student Details */}
      {showModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditing ? 'Edit Student Profile' : 'Student Details'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              {!isEditing ? (
                // View Mode
                <div className="view-mode">
                  <div className="profile-photo-large">
                    {selectedStudent.profilePhoto && selectedStudent.profilePhoto.startsWith('data:image') ? (
                      <img src={selectedStudent.profilePhoto} alt={selectedStudent.fullName} />
                    ) : (
                      <div className="avatar-large">
                        {selectedStudent.profilePhoto || (selectedStudent.gender === 'Male' ? '👦' : '👧')}
                      </div>
                    )}
                  </div>

                  <div className="details-grid">
                    <div className="detail-item">
                      <label>Child ID</label>
                      <p>{selectedStudent.childId}</p>
                    </div>
                    <div className="detail-item">
                      <label>Full Name</label>
                      <p>{selectedStudent.fullName}</p>
                    </div>
                    <div className="detail-item">
                      <label>Gender</label>
                      <p>{selectedStudent.gender} {selectedStudent.gender === 'Male' ? '👦' : '👧'}</p>
                    </div>
                    <div className="detail-item">
                      <label>Blood Type</label>
                      <p>{selectedStudent.bloodType}</p>
                    </div>
                    <div className="detail-item">
                      <label>Date of Birth</label>
                      <p>{formatDate(selectedStudent.dob)}</p>
                    </div>
                    <div className="detail-item">
                      <label>Age</label>
                      <p>{selectedStudent.age} years</p>
                    </div>
                    <div className="detail-item full-width">
                      <label>Class</label>
                      <p className="class-badge">
                        {selectedStudent.includeDaycare ? selectedStudent.class + ' + Daycare' : selectedStudent.class}
                      </p>
                    </div>
                    <div className="detail-item full-width">
                      <label>Guardian Name</label>
                      <p>{selectedStudent.guardianName}</p>
                    </div>
                    <div className="detail-item full-width">
                      <label>Email</label>
                      <p>{selectedStudent.email}</p>
                    </div>
                    <div className="detail-item full-width">
                      <label>Contact Numbers</label>
                      <div className="contact-list">
                        {selectedStudent.contactNumbers && selectedStudent.contactNumbers.map((num, idx) => (
                          <p key={idx} className="contact-item">📞 {num}</p>
                        ))}
                      </div>
                    </div>
                    <div className="detail-item full-width">
                      <label>Medical Information</label>
                      <p className="medical-info">{selectedStudent.medicalInformation || 'None'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <form onSubmit={handleUpdate} className="edit-form">
                  {/* Profile Photo Upload */}
                  <div className="photo-upload-section">
                    <div className="photo-preview-container">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="preview-img" />
                      ) : (
                        <div className="avatar-large">
                          {formData.profilePhoto && !formData.profilePhoto.startsWith('data:image') ? formData.profilePhoto : '📷'}
                        </div>
                      )}
                    </div>
                    <div className="upload-controls">
                      <label htmlFor="admin-photo-upload" className="upload-btn">
                        <span>📸</span> Change Photo
                      </label>
                      <input
                        id="admin-photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        style={{ display: 'none' }}
                      />
                      <small>Max size: 2MB</small>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Gender *</label>
                      <select name="gender" value={formData.gender} onChange={handleInputChange} required>
                        <option value="Male">Male 👦</option>
                        <option value="Female">Female 👧</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Blood Type *</label>
                      <select name="bloodType" value={formData.bloodType} onChange={handleInputChange} required>
                        <option value="">Select Type</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Date of Birth *</label>
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Age</label>
                      <input
                        type="text"
                        value={formData.age}
                        readOnly
                        className="read-only"
                      />
                    </div>
                  </div>

                  {formData.age >= 3 && formData.age <= 5 && (
                    <div className="form-group">
                      <label>Class *</label>
                      {formData.age === 3 ? (
                        <input type="text" value="Daycare" readOnly className="read-only" />
                      ) : (
                        <select name="class" value={formData.class} onChange={handleInputChange} required>
                          <option value="">Select Class</option>
                          {availableClasses.map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))}
                        </select>
                      )}
                      
                      {formData.age >= 4 && formData.class && formData.class !== "Daycare" && (
                        <div className="daycare-option">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              name="includeDaycare"
                              checked={formData.includeDaycare}
                              onChange={handleInputChange}
                            />
                            <span>Add Daycare to {formData.class}</span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="form-group">
                    <label>Guardian Name *</label>
                    <input
                      type="text"
                      name="guardianName"
                      value={formData.guardianName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Contact Numbers *</label>
                    <input
                      type="text"
                      name="contactNumbers"
                      value={formData.contactNumbers}
                      onChange={handleInputChange}
                      placeholder="0771234567, 0112345678"
                      required
                    />
                    <small>Separate multiple numbers with commas. Each must be 10 digits starting with 0</small>
                  </div>

                  <div className="form-group">
                    <label>Medical Information</label>
                    <textarea
                      name="medicalInformation"
                      value={formData.medicalInformation}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Any allergies, medications, or conditions?"
                    />
                  </div>
                </form>
              )}
            </div>

            <div className="modal-footer">
              {!isEditing ? (
                <>
                  <button className="edit-btn" onClick={handleEdit}>
                    <span>✏️</span> Edit Profile
                  </button>
                  <button className="delete-btn" onClick={handleDelete}>
                    <span>🗑️</span> Delete Student
                  </button>
                  <button className="close-modal-btn" onClick={() => setShowModal(false)}>
                    Close
                  </button>
                </>
              ) : (
                <>
                  <button className="save-btn" onClick={handleUpdate} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : '💾 Save Changes'}
                  </button>
                  <button className="cancel-btn" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudentManagement;