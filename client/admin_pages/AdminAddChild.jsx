import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/AdminAddChild.css";

const AdminAddChild = () => {
  const [childId, setChildId] = useState("");
  const [childName, setChildName] = useState("");
  const [children, setChildren] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // LOAD CHILDREN FROM DATABASE
  useEffect(() => {
    axios.get("http://localhost:3002/children")
      .then(res => {
        setChildren(res.data);
      })
      .catch(err => {
        console.log("Fetch error:", err);
        setError("Failed to load children data");
      });
  }, []);

  const isChildIdUnique = (id) => {
    return !children.some(child => child.childId.toLowerCase() === id.toLowerCase());
  };

  const isChildNameUnique = (name) => {
    return !children.some(child => child.childName.toLowerCase() === name.toLowerCase());
  };

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    setError("");
    setSuccess("");

    const trimmedId = childId.trim();
    const trimmedName = childName.trim();

    if (!trimmedId) {
      setError("Child ID cannot be empty");
      return;
    }

    if (!trimmedName) {
      setError("Child Name cannot be empty");
      return;
    }

    if (!isChildIdUnique(trimmedId)) {
      setError(`Child ID "${trimmedId}" already exists. Please use a different ID.`);
      return;
    }

    if (!isChildNameUnique(trimmedName)) {
      setError(`Child Name "${trimmedName}" already exists. Please use a different name.`);
      return;
    }

    setIsSubmitting(true);

    const newChild = {
      childId: trimmedId,
      childName: trimmedName
    };

    axios.post("http://localhost:3002/add-child", newChild)
      .then(res => {
        setChildren([res.data, ...children]); 
        setChildId("");
        setChildName("");
        setSuccess("Child registered successfully!");
        setIsSubmitting(false);
      })
      .catch(err => {
        console.log("Submit error:", err);
        
        if (err.response && err.response.data && err.response.data.error) {
          setError(err.response.data.error);
        } else {
          setError("Failed to register child. Please try again.");
        }
        
        setIsSubmitting(false);
      });
  };

  return (
    <div className="admin-dashboard">
      <div className="nature-bg">
        <div className="leaf leaf-1">🌿</div>
        <div className="leaf leaf-2">🍃</div>
        <div className="leaf leaf-3">🌱</div>
        <div className="leaf leaf-4">🌿</div>
        <div className="leaf leaf-5">🍂</div>
      </div>
      
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Child Management</h1>
          <p className="header-subtitle">Register and manage children in the system</p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-value">{children.length}</span>
            <span className="stat-label">Total Children</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="form-card">
          <div className="card-header">
            <div className="header-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
              </svg>
            </div>
            <div className="header-title">
              <h2>Register New Child</h2>
              <p>Fill in the details to create a new child profile</p>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              <span className="success-icon">✅</span>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="registration-form">
            <div className="form-row">
              <div className="form-group">
                <label>Child ID <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="e.g., CH001"
                  value={childId}
                  onChange={(e) => {
                    setChildId(e.target.value);
                    setError(""); 
                  }}
                  required
                  className={error && error.includes("ID") ? "input-error" : ""}
                />
                <small className="input-hint">Must be unique. Any format accepted.</small>
              </div>

              <div className="form-group">
                <label>Child Name <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="e.g., K. Kavindu"
                  value={childName}
                  onChange={(e) => {
                    setChildName(e.target.value);
                    setError(""); 
                  }}
                  required
                  className={error && error.includes("Name") ? "input-error" : ""}
                />
                <small className="input-hint">Cannot have duplicate names. Case insensitive.</small>
              </div>
            </div>

            <button type="submit" className="submit-button" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Registering...
                </>
              ) : (
                "Register Child"
              )}
            </button>
          </form>
        </div>

        <div className="list-card">
          <div className="list-header">
            <h3>Registered Children</h3>
            <span className="child-count">{children.length} Total</span>
          </div>

          {children.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" fill="#E0E0E0"/>
              </svg>
              <h4>No Children Registered</h4>
              <p>Get started by registering a new child using the form above</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="children-table">
                <thead>
                  <tr>
                    <th>Child ID</th>
                    <th>Name</th>
                    <th>Registered Date</th>
                  </tr>
                </thead>
                <tbody>
                  {children.map((child, index) => (
                    <tr key={child._id || index}>
                      <td>
                        <span className="id-badge">{child.childId}</span>
                      </td>
                      <td>
                        <div className="child-info">
                          <div className="child-avatar">
                            {child.childName.charAt(0).toUpperCase()}
                          </div>
                          <span className="child-name">{child.childName}</span>
                        </div>
                      </td>
                      <td>
                        <span className="date-badge">
                          {new Date(child.registeredDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAddChild;