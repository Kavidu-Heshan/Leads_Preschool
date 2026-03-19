import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/StudentProfileManagement.css';

const StudentProfileManagement = () => {
  const navigate = useNavigate();
  
  // Get the logged-in child's ID from localStorage
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
  
  // Photo upload states
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

  // Get logged-in user from localStorage
  useEffect(function() {
    var storedChild = localStorage.getItem('currentChild');
    if (storedChild) {
      var parsedChild = JSON.parse(storedChild);
      setChildId(parsedChild.childId);
      fetchProfileData(parsedChild.childId);
    } else {
      setError("No logged-in user found. Please login first.");
      setTimeout(function() {
        navigate('/child-enroll');
      }, 2000);
    }
  }, [navigate]);

  var fetchProfileData = async function(id) {
    try {
      var response = await fetch('http://localhost:3002/student-profile/' + id);
      var data = await response.json();

      if (response.ok) {
        // Format date for the input field (YYYY-MM-DD)
        var formattedDob = data.dob ? new Date(data.dob).toISOString().split('T')[0] : '';
        
        // Convert contact numbers array to comma-separated string
        var contactStr = data.contactNumbers ? data.contactNumbers.join(', ') : '';
        
        var profileData = {
          childId: data.childId,
          fullName: data.fullName || '',
          gender: data.gender || 'Male',
          class: data.class || 'Daycare',
          includeDaycare: data.includeDaycare || false,
          dob: formattedDob,
          age: data.age || '',
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
        
        updateAvailableClasses(data.age);
        setError('');
      } else {
        setError("Profile not found. Please complete your profile first.");
        setTimeout(function() {
          navigate('/complete-profile');
        }, 2000);
      }
    } catch (err) {
      console.error("Connection error:", err);
      setError("Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  // Handle profile photo upload
  var handlePhotoUpload = function(e) {
    var file = e.target.files[0];
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
      var reader = new FileReader();
      reader.onloadend = function() {
        setPhotoPreview(reader.result);
        // Update formData with new photo
        setFormData(function(prev) {
          return {
            ...prev,
            profilePhoto: reader.result
          };
        });
      };
      reader.readAsDataURL(file);
    }
  };

  var removePhoto = function() {
    setProfilePhotoFile(null);
    setPhotoPreview("");
    // Reset to emoji based on gender
    var emojiPhoto = formData.gender === 'Male' ? '👦' : '👧';
    setFormData(function(prev) {
      return {
        ...prev,
        profilePhoto: emojiPhoto
      };
    });
    // Reset file input
    var input = document.getElementById('profile-photo-input-edit');
    if (input) {
      input.value = '';
    }
  };

  var updateAvailableClasses = function(age) {
    var ageNum = parseInt(age);
    var classes = [];
    
    if (ageNum === 3) {
      classes = ["Daycare"];
    } else if (ageNum === 4) {
      classes = ["Daycare", "LKG"];
    } else if (ageNum === 5) {
      classes = ["Daycare", "UKG"];
    }
    
    setAvailableClasses(classes);
  };

  var calculateAge = function(dobString) {
    if (!dobString) return "";
    var birthDate = new Date(dobString);
    var today = new Date();
    
    var ageCalc = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      ageCalc--;
    }
    return ageCalc;
  };

  var validatePhoneNumber = function(phone) {
    var phoneRegex = /^0\d{9}$/;
    return phoneRegex.test(phone);
  };

  var validateEmail = function(email) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  var handleChange = function(e) {
    var name = e.target.name;
    var value = e.target.value;
    var type = e.target.type;
    var checked = e.target.checked;
    
    if (type === 'checkbox') {
      setFormData(function(prev) {
        return { ...prev, [name]: checked };
      });
    } else if (name === 'dob') {
      var calculatedAge = calculateAge(value);
      setFormData(function(prev) {
        return { ...prev, dob: value, age: calculatedAge };
      });
      updateAvailableClasses(calculatedAge);
    } else {
      setFormData(function(prev) {
        return { ...prev, [name]: value };
      });
    }
  };

  var handleEdit = function() {
    setIsEditing(true);
    setShowPhotoUpload(true);
    setError('');
    setSuccess('');
    // Set photo preview if exists
    if (formData.profilePhoto && formData.profilePhoto.startsWith('data:image')) {
      setPhotoPreview(formData.profilePhoto);
    }
  };

  var handleCancel = function() {
    setFormData(originalData);
    setIsEditing(false);
    setShowPhotoUpload(false);
    setPhotoPreview(originalData.profilePhoto && originalData.profilePhoto.startsWith('data:image') ? originalData.profilePhoto : '');
    setError('');
    setSuccess('');
  };

  var handleSubmit = async function(e) {
    e.preventDefault();
    
    // Validate phone numbers
    if (formData.contactNumbers) {
      var phones = formData.contactNumbers.split(',').map(function(p) { return p.trim(); });
      for (var i = 0; i < phones.length; i++) {
        var phone = phones[i];
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
      var submissionData = {
        ...formData,
        childId: childId, // Ensure childId is included
        contactNumbers: formData.contactNumbers ? formData.contactNumbers.split(',').map(function(p) { return p.trim(); }) : []
      };

      var response = await fetch('http://localhost:3002/student-profile/' + childId, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      var data = await response.json();

      if (response.ok && data.success) {
        setSuccess("Profile updated successfully!");
        
        // Update localStorage with new data
        var storedChild = JSON.parse(localStorage.getItem('currentChild'));
        var classDisplay = formData.includeDaycare ? 
          formData.class + ' + Daycare' : formData.class;
        
        localStorage.setItem('currentChild', JSON.stringify({
          ...storedChild,
          fullName: formData.fullName,
          gender: formData.gender,
          profilePhoto: formData.profilePhoto,
          class: classDisplay
        }));
        
        setOriginalData(formData);
        setIsEditing(false);
        setShowPhotoUpload(false);
        
        setTimeout(function() {
          setSuccess('');
        }, 3000);
      } else {
        setError(data.error || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Connection error:", err);
      setError("Failed to connect to server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  var formatDate = function(dateString) {
    if (!dateString) return "";
    var date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
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
    );
  }

  return (
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
          <p className="header-subtitle">View and update your personal information</p>
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
                <p className="info-value">{formData.bloodType}</p>
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
                  {formData.contactNumbers.split(',').map(function(num, index) {
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
                onClick={function() { navigate('/childdashboard'); }}
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
                    {availableClasses.map(function(className) {
                      return (
                        <option key={className} value={className}>
                          {className}
                        </option>
                      );
                    })}
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
                className={"save-button " + (isSubmitting ? 'submitting' : '')}
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
  );
};

export default StudentProfileManagement;