import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../css/StudentProfile.css";

const StudentProfileForm = () => {
  const navigate = useNavigate();

  const [childId, setChildId] = useState("");
  const [childName, setChildName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [checkingProfile, setCheckingProfile] = useState(true);

  const [formData, setFormData] = useState({
    fullName: "",
    gender: "",
    dob: "",
    age: "",
    class: "",
    includeDaycare: false,
    bloodType: "",
    guardianName: "",
    email: "",
    medicalInformation: ""
  });

  const [contactNumbers, setContactNumbers] = useState([""]);
  const [profilePhoto, setProfilePhoto] = useState("");
  const [availableClasses, setAvailableClasses] = useState([]);
  
  const [validationErrors, setValidationErrors] = useState({
    contactNumbers: [],
    age: "",
    dob: ""
  });

  useEffect(() => {
    const storedChild = localStorage.getItem("currentChild");
    if (storedChild) {
      const parsedChild = JSON.parse(storedChild);
      setChildId(parsedChild.childId);
      checkExistingProfile(parsedChild.childId);
      fetchChildName(parsedChild.childId);
    } else {
      navigate("/child-enroll");
    }
  }, [navigate]);

  const checkExistingProfile = async (id) => {
    try {
      const response = await axios.get(`http://localhost:3002/check-profile/${id}`);
      if (response.data.exists) {
        navigate("/childdashboard");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingProfile(false);
    }
  };

  const fetchChildName = async (id) => {
    try {
      const response = await axios.get(`http://localhost:3002/child-name/${id}`);
      setChildName(response.data.childName);
      setFormData(prev => ({
        ...prev,
        fullName: response.data.childName
      }));
    } catch (err) {
      console.error("Error fetching child name:", err);
    }
  };

  useEffect(() => {
    if (formData.gender === "Male") {
      setProfilePhoto("👦");
    } else if (formData.gender === "Female") {
      setProfilePhoto("👧");
    } else {
      setProfilePhoto("");
    }
  }, [formData.gender]);

  // Update available classes based on age
  useEffect(() => {
    const age = parseInt(formData.age);
    let classes = [];
    
    if (age === 3) {
      classes = ["Daycare"];
      setFormData(prev => ({ ...prev, class: "Daycare", includeDaycare: false }));
    } else if (age === 4) {
      classes = ["Daycare", "LKG"];
      setFormData(prev => ({ ...prev, class: "" }));
    } else if (age === 5) {
      classes = ["Daycare", "UKG"];
      setFormData(prev => ({ ...prev, class: "" }));
    } else {
      classes = [];
      setFormData(prev => ({ ...prev, class: "" }));
    }
    
    setAvailableClasses(classes);
  }, [formData.age]);

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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else if (name === "dob") {
      const calculatedAge = calculateAge(value);
      setFormData({ ...formData, dob: value, age: calculatedAge });
      
      const ageError = calculatedAge < 3 ? "Child must be at least 3 years old" : 
                      calculatedAge > 5 ? "Child cannot be older than 5 years" : "";
      setValidationErrors(prev => ({
        ...prev,
        age: ageError,
        dob: ageError
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleContactChange = (index, value) => {
    const newContacts = [...contactNumbers];
    newContacts[index] = value;
    setContactNumbers(newContacts);
    
    const newErrors = [...validationErrors.contactNumbers];
    if (value.trim() === "") {
      newErrors[index] = "Contact number is required";
    } else if (!validatePhoneNumber(value.trim())) {
      newErrors[index] = "Phone number must be 10 digits and start with 0";
    } else {
      newErrors[index] = "";
    }
    
    setValidationErrors(prev => ({
      ...prev,
      contactNumbers: newErrors
    }));
  };

  const addContactField = () => {
    setContactNumbers([...contactNumbers, ""]);
    setValidationErrors(prev => ({
      ...prev,
      contactNumbers: [...prev.contactNumbers, ""]
    }));
  };

  const removeContactField = (index) => {
    if (contactNumbers.length > 1) {
      const newContacts = [...contactNumbers];
      newContacts.splice(index, 1);
      setContactNumbers(newContacts);
      
      const newErrors = [...validationErrors.contactNumbers];
      newErrors.splice(index, 1);
      setValidationErrors(prev => ({
        ...prev,
        contactNumbers: newErrors
      }));
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const phoneValid = contactNumbers.every(num => /^0\d{9}$/.test(num));
    if (!phoneValid) {
      setError("All phone numbers must be 10 digits starting with 0");
      return;
    }
    
    if (formData.age < 3 || formData.age > 5) {
      setError("Child must be between 3 and 5 years old");
      return;
    }

    if (!formData.class) {
      setError("Please select a class");
      return;
    }

    if (formData.age === 4 && formData.class === "LKG" && !formData.includeDaycare) {
      // LKG without daycare is allowed
    }

    if (formData.age === 5 && formData.class === "UKG" && !formData.includeDaycare) {
      // UKG without daycare is allowed
    }

    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    const validContacts = contactNumbers.filter(num => num.trim() !== "");

    try {
      const submissionData = {
        ...formData,
        childId: childId,
        contactNumbers: validContacts,
        profilePhoto: profilePhoto
      };

      const response = await axios.post("http://localhost:3002/student-profile", submissionData);

      if (response.data.success) {
        setSuccess("✓ Profile Saved! Redirecting to dashboard...");
        
        const storedChild = JSON.parse(localStorage.getItem("currentChild"));
        const classDisplay = formData.includeDaycare ? 
          `${formData.class} + Daycare` : formData.class;
        
        localStorage.setItem("currentChild", JSON.stringify({
          ...storedChild,
          profilePhoto: profilePhoto,
          gender: formData.gender,
          fullName: formData.fullName,
          class: classDisplay,
          profileCompleted: true
        }));
        
        setTimeout(() => {
          navigate("/childdashboard");
        }, 2000);
      }
    } catch (err) {
      console.error("Profile submission error:", err);
      setError(err.response?.data?.error || "Failed to save profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingProfile) {
    return (
      <div className="profile-container">
        <div className="profile-card" style={{ textAlign: 'center', padding: '50px' }}>
          <div className="profile-header">
            <div className="header-icon">
              <span className="profile-icon">🔄</span>
            </div>
            <h1>Checking Profile Status</h1>
            <p className="header-subtitle">Please wait while we verify your profile...</p>
          </div>
          <div className="spinner" style={{ margin: '30px auto', width: '50px', height: '50px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="nature-bg">
        <div className="leaf leaf-1">🌿</div>
        <div className="leaf leaf-2">🍃</div>
        <div className="leaf leaf-3">🌱</div>
        <div className="leaf leaf-4">🌿</div>
        <div className="leaf leaf-5">🍂</div>
        <div className="leaf leaf-6">🍃</div>
        <div className="leaf leaf-7">🌱</div>
        <div className="leaf leaf-8">🌿</div>
      </div>

      <div className="floating-circle circle-1"></div>
      <div className="floating-circle circle-2"></div>
      <div className="floating-circle circle-3"></div>

      <div className="profile-card">
        <div className="profile-header">
          <div className="header-icon">
            <span className="profile-icon">📝</span>
          </div>
          <h1>Complete Your Profile</h1>
          <p className="header-subtitle">Please fill out your details to continue.</p>
        </div>

        {profilePhoto && (
          <div className="profile-photo-preview">
            <div className="avatar-circle">
              {profilePhoto}
            </div>
            <p style={{
              marginTop: '10px',
              color: '#2E7D32',
              fontWeight: '500',
              fontSize: '1.1rem'
            }}>
              {childName}
            </p>
            <p style={{
              marginTop: '5px',
              color: '#558B2F',
              fontSize: '0.9rem',
              fontStyle: 'italic'
            }}>
              {formData.gender === 'Male' ? 'Boy' : 'Girl'} Profile
            </p>
          </div>
        )}

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

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label>Student ID</label>
              <input 
                type="text" 
                value={childId} 
                readOnly 
              />
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
                placeholder="Enter student full name"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Gender *</label>
              <select name="gender" value={formData.gender} onChange={handleInputChange} required>
                <option value="">Select Gender</option>
                <option value="Male">Male 👦</option>
                <option value="Female">Female 👧</option>
              </select>
              {formData.gender && (
                <small style={{
                  display: 'block',
                  marginTop: '5px',
                  color: '#4CAF50',
                  fontSize: '0.8rem'
                }}>
                  ✓ Profile emoji will be auto-assigned
                </small>
              )}
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
                className={validationErrors.dob ? 'input-error' : ''}
              />
              {validationErrors.dob && (
                <small style={{
                  display: 'block',
                  marginTop: '5px',
                  color: '#f44336',
                  fontSize: '0.8rem'
                }}>
                  ⚠️ {validationErrors.dob}
                </small>
              )}
            </div>

            <div className="form-group">
              <label>Age</label>
              <input 
                type="text" 
                value={formData.age} 
                readOnly 
                placeholder="Auto-calculated"
                className={validationErrors.age ? 'input-error' : ''}
              />
              {validationErrors.age && (
                <small style={{
                  display: 'block',
                  marginTop: '5px',
                  color: '#f44336',
                  fontSize: '0.8rem'
                }}>
                  ⚠️ {validationErrors.age}
                </small>
              )}
            </div>
          </div>

          {/* Class Selection */}
          {formData.age >= 3 && formData.age <= 5 && (
            <div className="form-row">
              <div className="form-group">
                <label>Class *</label>
                {formData.age === 3 ? (
                  <input 
                    type="text" 
                    value="Daycare" 
                    readOnly 
                    style={{
                      backgroundColor: '#F1F8E9',
                      borderColor: '#4CAF50',
                      color: '#33691E',
                      fontWeight: '600'
                    }}
                  />
                ) : (
                  <select 
                    name="class" 
                    value={formData.class} 
                    onChange={handleInputChange}
                    required
                    style={{
                      borderColor: formData.class ? '#4CAF50' : '#C8E6C9'
                    }}
                  >
                    <option value="">Select Class</option>
                    {availableClasses.map(className => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))}
                  </select>
                )}
                
                {/* Daycare Add-on Option for LKG and UKG */}
                {formData.age >= 4 && formData.class && formData.class !== "Daycare" && (
                  <div style={{
                    marginTop: '15px',
                    padding: '15px',
                    background: '#F1F8E9',
                    borderRadius: '12px',
                    border: '1px solid #4CAF50'
                  }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        name="includeDaycare"
                        checked={formData.includeDaycare}
                        onChange={handleInputChange}
                        style={{
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          accentColor: '#4CAF50'
                        }}
                      />
                      <span style={{
                        color: '#2E7D32',
                        fontWeight: '500',
                        fontSize: '0.95rem'
                      }}>
                        Add Daycare to {formData.class}
                      </span>
                    </label>
                    <p style={{
                      marginTop: '8px',
                      color: '#558B2F',
                      fontSize: '0.85rem',
                      paddingLeft: '30px'
                    }}>
                      ✓ Select if you want {formData.class} with Daycare facilities
                    </p>
                  </div>
                )}

                {/* Class Information based on age */}
                <div style={{
                  marginTop: '15px',
                  padding: '12px',
                  background: '#E3F2FD',
                  borderRadius: '10px',
                  border: '1px solid #64B5F6'
                }}>
                  <p style={{
                    color: '#1565C0',
                    fontWeight: '500',
                    fontSize: '0.9rem',
                    marginBottom: '5px'
                  }}>
                    📚 Available Options for Age {formData.age}:
                  </p>
                  <ul style={{
                    paddingLeft: '20px',
                    color: '#0D47A1',
                    fontSize: '0.85rem'
                  }}>
                    {formData.age === 3 && (
                      <li>✓ Daycare only</li>
                    )}
                    {formData.age === 4 && (
                      <>
                        <li>• Daycare only</li>
                        <li>• LKG (with option to add Daycare)</li>
                      </>
                    )}
                    {formData.age === 5 && (
                      <>
                        <li>• Daycare only</li>
                        <li>• UKG (with option to add Daycare)</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Guardian Name *</label>
              <input 
                type="text" 
                name="guardianName" 
                value={formData.guardianName} 
                onChange={handleInputChange} 
                required 
                placeholder="Enter primary guardian name"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email Address *</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleInputChange} 
                required 
                placeholder="guardian@example.com"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="contact-section">
              <label>Contact Numbers *</label>
              <small style={{
                display: 'block',
                marginBottom: '10px',
                color: '#666',
                fontSize: '0.85rem'
              }}>
                Must be 10 digits and start with 0 (e.g., 0771234567)
              </small>
              {contactNumbers.map((num, index) => (
                <div key={index} style={{ marginBottom: '15px' }}>
                  <div className="contact-input-wrapper">
                    <input 
                      type="tel" 
                      value={num} 
                      onChange={(e) => handleContactChange(index, e.target.value)} 
                      placeholder={`Contact Number ${index + 1} (e.g., 0771234567)`}
                      required={index === 0}
                      className={validationErrors.contactNumbers[index] ? 'input-error' : ''}
                    />
                    {contactNumbers.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeContactField(index)}
                        className="remove-contact"
                        title="Remove contact number"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {validationErrors.contactNumbers[index] && (
                    <small style={{
                      display: 'block',
                      marginTop: '5px',
                      color: '#f44336',
                      fontSize: '0.8rem',
                      paddingLeft: '10px'
                    }}>
                      ⚠️ {validationErrors.contactNumbers[index]}
                    </small>
                  )}
                </div>
              ))}
              <button 
                type="button" 
                onClick={addContactField}
                className="add-contact"
              >
                <span>➕</span> Add Another Number
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Medical Information</label>
              <textarea 
                name="medicalInformation" 
                value={formData.medicalInformation} 
                onChange={handleInputChange} 
                placeholder="Any allergies, medications, or conditions we should know about?"
                rows="4"
              ></textarea>
            </div>
          </div>

          {/* Validation Summary */}
          {(validationErrors.age || validationErrors.contactNumbers.some(e => e) || (formData.age && (formData.age < 3 || formData.age > 5))) && (
            <div className="validation-summary">
              <p>⚠️ Please fix the following errors:</p>
              <ul>
                {validationErrors.age && <li>• {validationErrors.age}</li>}
                {formData.age < 3 && <li>• Child must be at least 3 years old</li>}
                {formData.age > 5 && <li>• Child cannot be older than 5 years</li>}
                {validationErrors.contactNumbers.map((error, index) => 
                  error && <li key={index}>• Contact {index + 1}: {error}</li>
                )}
              </ul>
            </div>
          )}

          <button 
            type="submit" 
            className={`submit-button ${isSubmitting ? 'submitting' : ''}`}
            disabled={isSubmitting || (formData.age && (formData.age < 3 || formData.age > 5))}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Saving Profile...
              </>
            ) : (
              <>
                <span className="button-icon">💾</span>
                Save Profile & Continue
              </>
            )}
          </button>
        </form>

        <div className="profile-footer">
          <div className="footer-decoration">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
          <p className="footer-text">
            <span>🌿</span> Your profile is safe with us <span>🌿</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileForm;