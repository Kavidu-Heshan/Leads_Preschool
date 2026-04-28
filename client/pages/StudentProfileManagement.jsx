import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css/StudentProfileManagement.css';
import UserNavbar from '../components/UserNavbar';

const StudentProfileManagement = () => {
  const navigate = useNavigate();
  
  const [childId, setChildId] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    childId: '',
    fullName: '',
    gender: 'Male',
    class: 'Daycare',
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

  const [originalData, setOriginalData] = useState({});
  const [availableClasses, setAvailableClasses] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

  // Get child data from both localStorage and sessionStorage
  const getChildData = () => {
    let storedChild = localStorage.getItem("currentChild");
    if (!storedChild) {
      storedChild = sessionStorage.getItem("currentChild");
    }
    
    if (storedChild) {
      try {
        return JSON.parse(storedChild);
      } catch (e) {
        console.error("Error parsing child data:", e);
        return null;
      }
    }
    return null;
  };

  // Update child session in both storages
  const updateChildSession = (updatedData) => {
    const storedChildLocal = localStorage.getItem("currentChild");
    if (storedChildLocal) {
      const currentSession = JSON.parse(storedChildLocal);
      const updatedSession = { ...currentSession, ...updatedData };
      localStorage.setItem("currentChild", JSON.stringify(updatedSession));
    }
    
    const storedChildSession = sessionStorage.getItem("currentChild");
    if (storedChildSession) {
      const currentSession = JSON.parse(storedChildSession);
      const updatedSession = { ...currentSession, ...updatedData };
      sessionStorage.setItem("currentChild", JSON.stringify(updatedSession));
    }
  };

  useEffect(() => {
    const child = getChildData();
    if (child && child.childId) {
      setChildId(child.childId);
      fetchProfileData(child.childId);
    } else {
      setError("No logged-in user found. Please login first.");
      setTimeout(() => {
        navigate('/child-enroll');
      }, 2000);
    }
  }, [navigate]);

  const fetchProfileData = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(`https://leadspreschool-production.up.railway.app/student-profile/${id}`);
      
      if (response.data) {
        const data = response.data;
        
        // Format date for the input field (YYYY-MM-DD)
        let formattedDob = '';
        if (data.dob) {
          const dobDate = new Date(data.dob);
          formattedDob = dobDate.toISOString().split('T')[0];
        }
        
        // Convert contact numbers array to comma-separated string
        const contactStr = data.contactNumbers ? data.contactNumbers.join(', ') : '';
        
        const profileData = {
          childId: data.childId || id,
          fullName: data.fullName || '',
          gender: data.gender || 'Male',
          class: data.class || 'Daycare',
          includeDaycare: data.includeDaycare || false,
          dob: formattedDob,
          age: data.age || calculateAge(formattedDob),
          bloodType: data.bloodType || '',
          guardianName: data.guardianName || '',
          contactNumbers: contactStr,
          email: data.email || '',
          medicalInformation: data.medicalInformation || 'None',
          profilePhoto: data.profilePhoto || (data.gender === 'Male' ? '👦' : '👧')
        };
        
        setFormData(profileData);
        setOriginalData(profileData);
        
        // Set photo preview if profile photo is Base64
        if (data.profilePhoto && data.profilePhoto.startsWith('data:image')) {
          setPhotoPreview(data.profilePhoto);
        }
        
        updateAvailableClasses(data.age || calculateAge(formattedDob));
        setError('');
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      if (err.response && err.response.status === 404) {
        setError("Profile not found. Please complete your profile first.");
        setTimeout(() => {
          navigate('/studentprofileform');
        }, 2000);
      } else {
        setError("Failed to load profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.match('image.*')) {
        setError("Please select an image file (JPEG, PNG, etc.)");
        return;
      }
      
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError("Image size should be less than 2MB");
        return;
      }

      setProfilePhotoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        setFormData(prev => ({
          ...prev,
          profilePhoto: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setProfilePhotoFile(null);
    setPhotoPreview("");
    const emojiPhoto = formData.gender === 'Male' ? '👦' : '👧';
    setFormData(prev => ({
      ...prev,
      profilePhoto: emojiPhoto
    }));
    // Reset file input
    const input = document.getElementById('profile-photo-input-edit');
    if (input) {
      input.value = '';
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
    
    // Auto-select class for age 3
    if (ageNum === 3) {
      setFormData(prev => ({ ...prev, class: "Daycare", includeDaycare: false }));
    }
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'dob') {
      const calculatedAge = calculateAge(value);
      setFormData(prev => ({ 
        ...prev, 
        dob: value, 
        age: calculatedAge 
      }));
      updateAvailableClasses(calculatedAge);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowPhotoUpload(true);
    setError('');
    setSuccess('');
    if (formData.profilePhoto && formData.profilePhoto.startsWith('data:image')) {
      setPhotoPreview(formData.profilePhoto);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
    setShowPhotoUpload(false);
    setPhotoPreview(originalData.profilePhoto && originalData.profilePhoto.startsWith('data:image') ? originalData.profilePhoto : '');
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate phone numbers
    if (formData.contactNumbers) {
      const phones = formData.contactNumbers.split(',').map(p => p.trim());
      for (let i = 0; i < phones.length; i++) {
        const phone = phones[i];
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
    setSuccess('');

    try {
      // Prepare data for submission
      const submissionData = {
        ...formData,
        childId: childId,
        contactNumbers: formData.contactNumbers ? formData.contactNumbers.split(',').map(p => p.trim()) : []
      };

      const response = await axios.put(`https://leadspreschool-production.up.railway.app/student-profile/${childId}`, submissionData);

      if (response.data.success) {
        setSuccess("Profile updated successfully!");
        
        // Update localStorage with new data
        const classDisplay = formData.includeDaycare ? 
          `${formData.class} + Daycare` : formData.class;
        
        updateChildSession({
          fullName: formData.fullName,
          gender: formData.gender,
          profilePhoto: formData.profilePhoto,
          class: classDisplay,
          lastActivity: new Date().toISOString()
        });
        
        setOriginalData(formData);
        setIsEditing(false);
        setShowPhotoUpload(false);
        
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError(response.data.error || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Connection error:", err);
      if (err.response) {
        setError(err.response.data?.error || "Failed to update profile.");
      } else if (err.request) {
        setError("Cannot connect to server. Please check your connection.");
      } else {
        setError("An unexpected error occurred.");
      }
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

  if (loading) {
    return (
      <div className="profile-mgmt-wrapper">
        <UserNavbar />
        <div className="profile-mgmt-container">
          <div className="nature-bg">
            <div className="leaf leaf-1">🌿</div>
            <div className="leaf leaf-2">🍃</div>
            <div className="leaf leaf-3">🌱</div>
          </div>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-mgmt-wrapper">
      <UserNavbar />
      <div className="profile-mgmt-container">
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

        <div className="profile-card">
          <div className="profile-header">
            <div className="header-icon">
              <span className="profile-icon">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  formData.profilePhoto && !formData.profilePhoto.startsWith('data:image') ? formData.profilePhoto : '👤'
                )}
              </span>
            </div>
            <h2>My Profile Management</h2>
            <p className="header-subtitle" style={{ color: '#000000', fontWeight: '500' }}>
              View and update your personal information
            </p>
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

          {/* View Mode */}
          {!isEditing ? (
            <div className="profile-view">
              {/* Profile Photo Display */}
              <div className="profile-photo-display">
                {formData.profilePhoto && formData.profilePhoto.startsWith('data:image') ? (
                  <img 
                    src={formData.profilePhoto} 
                    alt="Profile" 
                    className="profile-photo-large"
                  />
                ) : (
                  <div className="avatar-large">
                    {formData.profilePhoto || (formData.gender === 'Male' ? '👦' : '👧')}
                  </div>
                )}
              </div>

              <div className="info-grid">
                <div className="info-item">
                  <label>Child ID</label>
                  <p className="info-value read-only">{childId}</p>
                </div>

                <div className="info-item">
                  <label>Full Name</label>
                  <p className="info-value">{formData.fullName}</p>
                </div>

                <div className="info-item">
                  <label>Gender</label>
                  <p className="info-value">
                    {formData.gender} {formData.gender === 'Male' ? '👦' : '👧'}
                  </p>
                </div>

                <div className="info-item">
                  <label>Blood Type</label>
                  <p className="info-value">{formData.bloodType || 'Not specified'}</p>
                </div>

                <div className="info-item">
                  <label>Date of Birth</label>
                  <p className="info-value">{formatDate(formData.dob)}</p>
                </div>

                <div className="info-item">
                  <label>Age</label>
                  <p className="info-value">{formData.age} years</p>
                </div>

                <div className="info-item full-width">
                  <label>Class</label>
                  <p className="info-value class-badge">
                    {formData.includeDaycare ? formData.class + ' + Daycare' : formData.class}
                  </p>
                </div>

                <div className="info-item full-width">
                  <label>Guardian Name</label>
                  <p className="info-value">{formData.guardianName}</p>
                </div>

                <div className="info-item full-width">
                  <label>Email Address</label>
                  <p className="info-value">{formData.email}</p>
                </div>

                <div className="info-item full-width">
                  <label>Contact Numbers</label>
                  <div className="contact-list">
                    {formData.contactNumbers && formData.contactNumbers.split(',').map((num, index) => {
                      return num.trim() && (
                        <p key={index} className="info-value contact-item">
                          📞 {num.trim()}
                        </p>
                      );
                    })}
                  </div>
                </div>

                <div className="info-item full-width">
                  <label>Medical Information</label>
                  <p className="info-value medical-info">
                    {formData.medicalInformation || "None"}
                  </p>
                </div>
              </div>

              <div className="action-buttons">
                <button 
                  onClick={handleEdit}
                  className="edit-button"
                >
                  <span className="button-icon">✏️</span>
                  Edit My Profile
                </button>
                <button 
                  onClick={() => navigate('/childdashboard')}
                  className="back-button"
                >
                  <span className="button-icon">←</span>
                  Back to Dashboard
                </button>
              </div>
            </div>
          ) : (
            /* Edit Mode */
            <form onSubmit={handleSubmit} className="profile-form">
              {/* Profile Photo Upload Section */}
              {showPhotoUpload && (
                <div className="profile-photo-upload-section">
                  <div className="photo-upload-container">
                    {photoPreview ? (
                      <div className="photo-preview">
                        <img src={photoPreview} alt="Profile Preview" className="preview-image" />
                        <button type="button" onClick={removePhoto} className="remove-photo-btn" title="Remove photo">
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="avatar-circle" style={{ fontSize: formData.profilePhoto && !formData.profilePhoto.startsWith('data:image') ? '48px' : '32px' }}>
                        {formData.profilePhoto && !formData.profilePhoto.startsWith('data:image') ? formData.profilePhoto : '📷'}
                      </div>
                    )}
                    
                    <div className="upload-controls">
                      <label htmlFor="profile-photo-input-edit" className="upload-photo-btn">
                        <span>📸</span> 
                        {photoPreview ? 'Change Photo' : 'Upload Photo'}
                      </label>
                      <input
                        id="profile-photo-input-edit"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        style={{ display: 'none' }}
                      />
                      <p className="photo-hint">
                        Max size: 2MB (JPEG, PNG)
                      </p>
                    </div>
                  </div>
                  
                  {!photoPreview && (
                    <p className="emoji-fallback-note">
                      Using {formData.gender === 'Male' ? '👦' : '👧'} emoji as fallback
                    </p>
                  )}
                </div>
              )}

              {/* Child ID - Read Only */}
              <div className="form-group">
                <label>Child ID (Cannot be changed)</label>
                <input 
                  type="text" 
                  value={childId} 
                  disabled 
                  className="read-only-field"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input 
                    type="text" 
                    name="fullName" 
                    value={formData.fullName} 
                    onChange={handleChange} 
                    required 
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Gender *</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} required>
                    <option value="Male">Male 👦</option>
                    <option value="Female">Female 👧</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Blood Type *</label>
                  <select name="bloodType" value={formData.bloodType} onChange={handleChange} required>
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
                    onChange={handleChange} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Age</label>
                  <input 
                    type="number" 
                    name="age" 
                    value={formData.age} 
                    readOnly 
                    placeholder="Auto-calculated"
                    className="read-only-field"
                  />
                </div>
              </div>

              {/* Class Selection */}
              {formData.age >= 3 && formData.age <= 5 && (
                <div className="form-group">
                  <label>Class *</label>
                  {formData.age === 3 ? (
                    <input 
                      type="text" 
                      value="Daycare" 
                      readOnly 
                      className="read-only-field"
                    />
                  ) : (
                    <select 
                      name="class" 
                      value={formData.class} 
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Class</option>
                      {availableClasses.map((className) => (
                        <option key={className} value={className}>
                          {className}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {/* Daycare Add-on Option */}
                  {formData.age >= 4 && formData.class && formData.class !== "Daycare" && (
                    <div className="daycare-option">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="includeDaycare"
                          checked={formData.includeDaycare}
                          onChange={handleChange}
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
                  onChange={handleChange} 
                  required 
                  placeholder="Enter guardian name"
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                  placeholder="guardian@example.com"
                />
              </div>

              <div className="form-group">
                <label>Contact Numbers *</label>
                <input 
                  type="text" 
                  name="contactNumbers" 
                  value={formData.contactNumbers} 
                  onChange={handleChange} 
                  placeholder="0771234567, 0112345678" 
                  required 
                />
                <small className="input-hint">
                  Multiple numbers? Separate with commas. Each must be 10 digits starting with 0
                </small>
              </div>

              <div className="form-group">
                <label>Medical Information</label>
                <textarea 
                  name="medicalInformation" 
                  value={formData.medicalInformation} 
                  onChange={handleChange} 
                  rows="4"
                  placeholder="Any allergies, medications, or conditions we should know about?"
                ></textarea>
              </div>

              <div className="action-buttons">
                <button 
                  type="submit" 
                  className={`save-button ${isSubmitting ? 'submitting' : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-small"></span>
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <span className="button-icon">💾</span>
                      Save Changes
                    </>
                  )}
                </button>
                
                <button 
                  type="button" 
                  onClick={handleCancel}
                  className="cancel-button"
                  disabled={isSubmitting}
                >
                  <span className="button-icon">✕</span>
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="profile-footer">
            <div className="footer-decoration">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
            <p className="footer-text">
              <span>🌿</span> Your profile information is secure with us <span>🌿</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileManagement;