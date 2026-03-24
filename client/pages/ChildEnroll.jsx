import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../css/ChildEnroll.css";
import UserNavbar from "../components/UserNavbar";

const ChildEnroll = () => {
  const navigate = useNavigate();
  
  const [childId, setChildId] = useState("");
  const [childName, setChildName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [idError, setIdError] = useState("");
  const [nameError, setNameError] = useState("");
  const [touched, setTouched] = useState({
    childId: false,
    childName: false
  });

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const validateChildId = (id) => {
    if (!id || id.trim() === "") {
      return "Child ID is required";
    }
    return "";
  };

  const validateChildName = (name) => {
    if (!name || name.trim() === "") {
      return "Password is required";
    }
    return "";
  };

  const handleIdChange = (e) => {
    const value = e.target.value;
    setChildId(value);
    if (touched.childId) {
      setIdError(validateChildId(value));
    }
    setError(""); 
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setChildName(value);
    if (touched.childName) {
      setNameError(validateChildName(value));
    }
    setError(""); 
  };

  const handleIdBlur = () => {
    setTouched({ ...touched, childId: true });
    setIdError(validateChildId(childId));
  };

  const handleNameBlur = () => {
    setTouched({ ...touched, childName: true });
    setNameError(validateChildName(childName));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const idValidationError = validateChildId(childId);
    const nameValidationError = validateChildName(childName);

    setIdError(idValidationError);
    setNameError(nameValidationError);

    if (idValidationError || nameValidationError) {
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.post("http://localhost:3002/child-enroll", {
        childId: childId.trim(),
        childName: childName.trim()
      });

      if (response.data.success) {
        setSuccess("✓ Successfully enrolled! Redirecting to dashboard...");
        
        localStorage.setItem("currentChild", JSON.stringify({
          childId: response.data.child.childId,
          childName: response.data.child.childName,
          enrolledAt: new Date().toISOString(),
          hasChangedPassword: response.data.hasChangedPassword || false
        }));

        setTimeout(() => {
          navigate("/changepwd");
        }, 2000);
      }
    } catch (err) {
      console.error("Enrollment error:", err);
      
      if (err.response) {
        switch (err.response.status) {
          case 401:
            setError("❌ Invalid Child ID or Password. Please try again.");
            break;
          case 404:
            setError("❌ Child not found. Please check your credentials.");
            break;
          case 500:
            setError("❌ Server error. Please try again later.");
            break;
          default:
            setError(err.response.data.error || "❌ Enrollment failed. Please try again.");
        }
      } else if (err.request) {
        setError("❌ Cannot connect to server. Please check your connection.");
      } else {
        setError("❌ An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotCredentials = () => {
    setError("Please contact your administrator to retrieve your Child ID and reset your password.");
  };

  return (
    <div className="child-enroll-wrapper">
      <UserNavbar />
      <div className="enroll-container">
        <div className="nature-bg">
          <div className="leaf leaf-1">🌿</div>
          <div className="leaf leaf-2">🍃</div>
          <div className="leaf leaf-3">🌱</div>
          <div className="leaf leaf-4">🌿</div>
          <div className="leaf leaf-5">🍂</div>
        </div>

        <div className="enroll-card">
          <div className="enroll-header">
            <div className="header-icon">
              <span className="tree-icon">🌳</span>
            </div>
            <h1>Child Login</h1>
            <p className="header-subtitle">Welcome back! Enter your Child ID and password to continue.</p>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              <span className="success-icon">✓</span>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="enroll-form">
            <div className="form-group">
              <label htmlFor="childId">
                <span className="label-icon">🆔</span>
                Child ID
              </label>
              <div className={`input-wrapper ${idError ? 'error' : ''}`}>
                <input
                  type="text"
                  id="childId"
                  placeholder="Enter your Child ID"
                  value={childId}
                  onChange={handleIdChange}
                  onBlur={handleIdBlur}
                  disabled={isSubmitting}
                  className={idError ? 'input-error' : ''}
                  autoComplete="off"
                />
                {childId && !idError && touched.childId && (
                  <span className="input-valid">✓</span>
                )}
              </div>
              {idError && <span className="error-text">{idError}</span>}
              <small className="input-hint">
                Use the Child ID provided by your parent/guardian
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="childName">
                <span className="label-icon">🔑</span>
                Password
              </label>
              <div className={`input-wrapper ${nameError ? 'error' : ''}`}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="childName"
                  placeholder="Enter your password"
                  value={childName}
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                  disabled={isSubmitting}
                  className={nameError ? 'input-error' : ''}
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
                {childName && !nameError && touched.childName && (
                  <span className="input-valid">✓</span>
                )}
              </div>
              {nameError && <span className="error-text">{nameError}</span>}
              <small className="input-hint">
                Enter your password (if you changed it, use your new password)
              </small>
            </div>

            <button 
              type="submit" 
              className={`enroll-button ${isSubmitting ? 'submitting' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Logging in...
                </>
              ) : (
                <>
                  <span className="button-icon">🌱</span>
                  Login
                </>
              )}
            </button>

            <div className="help-section">
              <p className="help-text">
                <span className="help-icon">❓</span>
                First time here? Use your name as the password.
              </p>
              <button 
                type="button" 
                className="forgot-link"
                onClick={handleForgotCredentials}
              >
                Forgot your password?
              </button>
            </div>
          </form>

          <div className="enroll-footer">
            <div className="footer-decoration">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
            <p className="footer-text">
              Secure login powered by nature's protection 🌿
            </p>
          </div>
        </div>

        <div className="fun-facts">
          <div className="fact-card">
            <span className="fact-icon">🌟</span>
            <p className="fact-text">Learning is an adventure!</p>
          </div>
          <div className="fact-card">
            <span className="fact-icon">📚</span>
            <p className="fact-text">Every day is a new discovery</p>
          </div>
          <div className="fact-card">
            <span className="fact-icon">🎨</span>
            <p className="fact-text">Be creative, be yourself</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildEnroll;