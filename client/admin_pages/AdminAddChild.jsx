import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/AdminAddChild.css";
import AdminNavbar from "../components/AdminNavbar"; 
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const AdminAddChild = () => {
  const [childId, setChildId] = useState("");
  const [childName, setChildName] = useState("");
  const [children, setChildren] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  // LOAD CHILDREN FROM DATABASE
  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = () => {
    axios.get("http://localhost:3002/children")
      .then(res => {
        setChildren(res.data);
      })
      .catch(err => {
        console.log("Fetch error:", err);
        setError("Failed to load children data");
      });
  };

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

  // PDF DOWNLOAD FUNCTION - FIXED VERSION
  const downloadPDF = () => {
    if (children.length === 0) {
      setError("No children data to download");
      return;
    }

    setIsDownloading(true);

    try {
      // Create new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 197, 94);
      doc.text('Children Registration Report', 14, 20);
      
      // Add subtitle / date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Generated on: ${currentDate}`, 14, 30);
      doc.text(`Total Children: ${children.length}`, 14, 37);

      // Add a line separator
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, 42, 200, 42);

      // Prepare table data
      const tableData = children.map((child) => [
        child.childId || 'N/A',
        child.childName || 'N/A',
        child.registeredDate ? new Date(child.registeredDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }) : 'N/A'
      ]);

      // Generate table with autoTable - FIXED: using imported autoTable function
      autoTable(doc, {
        startY: 48,
        head: [['Child ID', 'Name', 'Registered Date']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [34, 197, 94],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 11,
          halign: 'center',
          valign: 'middle'
        },
        bodyStyles: {
          fontSize: 10,
          textColor: [30, 41, 59],
          valign: 'middle'
        },
        alternateRowStyles: {
          fillColor: [240, 253, 244]
        },
        columnStyles: {
          0: { cellWidth: 50, halign: 'center' },
          1: { cellWidth: 70, halign: 'left' },
          2: { cellWidth: 50, halign: 'center' }
        },
        margin: { left: 14, right: 14 }
      });

      // Add footer on each page
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Add summary at the end
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      doc.text(`* This report includes all registered children in the system.`, 14, finalY);
      doc.text(`* Total registered children: ${children.length}`, 14, finalY + 6);

      // Save the PDF
      doc.save(`children_report_${new Date().toISOString().split('T')[0]}.pdf`);
      setSuccess("PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF generation error:", err);
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

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

  const handleDeleteChild = async (childId, childName) => {
    const confirmDelete = window.confirm(
      `⚠️ WARNING: This will permanently delete "${childName}" (${childId}) and ALL associated data including:\n\n` +
      `• Student Profile\n• Attendance Records\n• Daycare Records\n• Password Changes\n\n` +
      `This action CANNOT be undone. Are you sure you want to proceed?`
    );
    
    if (!confirmDelete) {
      return;
    }

    setDeletingId(childId);
    setIsDeleting(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.delete(`http://localhost:3002/children/${childId}`);
      
      if (response.data.success) {
        setChildren(children.filter(child => child.childId !== childId));
        setSuccess(response.data.message || `Child "${childName}" has been deleted successfully!`);
        
        if (response.data.stats) {
          console.log("Deletion stats:", response.data.stats);
        }
      }
    } catch (err) {
      console.error("Delete error:", err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Failed to delete child. Please try again.");
      }
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    const childIdsToDelete = children.map(child => child.childId);
    
    if (childIdsToDelete.length === 0) {
      setError("No children to delete");
      return;
    }
    
    const confirmBulkDelete = window.confirm(
      `⚠️⚠️⚠️ WARNING: This will delete ALL ${childIdsToDelete.length} children and ALL associated data!\n\n` +
      `This action CANNOT be undone. Are you ABSOLUTELY sure you want to proceed?`
    );
    
    if (!confirmBulkDelete) {
      return;
    }
    
    setIsDeleting(true);
    setError("");
    setSuccess("");
    
    try {
      const response = await axios.post("http://localhost:3002/children/bulk-delete", {
        childIds: childIdsToDelete
      });
      
      if (response.data.success) {
        setChildren([]);
        setSuccess(response.data.message);
      }
    } catch (err) {
      console.error("Bulk delete error:", err);
      setError("Failed to perform bulk delete. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="admin-add-child-wrapper">
      <AdminNavbar />
      <div className="admin-dashboard" style={{ paddingTop: '80px' }}>
        <div className="nature-bg">
          <div className="leaf leaf-1">🌿</div>
          <div className="leaf leaf-2">🍃</div>
          <div className="leaf leaf-3">🌱</div>
          <div className="leaf leaf-4">🌿</div>
          <div className="leaf leaf-5">🍂</div>
        </div>
        
        <div className="dashboard-header">
          <div className="header-content">
            <h1>Parent Management</h1>
            <p className="header-subtitle">Register and manage parent's children in the system</p>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-value">{children.length}</span>
              <span className="stat-label">Total Children</span>
            </div>
            {children.length > 0 && (
              <>
                <button 
                  className="download-pdf-button"
                  onClick={downloadPDF}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <span className="spinner-small"></span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>
                      </svg>
                      Download PDF
                    </>
                  )}
                </button>
                <button 
                  className="bulk-delete-button"
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                >
                  Delete All
                </button>
              </>
            )}
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

              <button type="submit" className="submit-button" disabled={isSubmitting || isDeleting}>
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
                      <th>Actions</th>
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
                        <td>
                          <button
                            className="delete-button"
                            onClick={() => handleDeleteChild(child.childId, child.childName)}
                            disabled={isDeleting && deletingId === child.childId}
                            title={`Delete ${child.childName} and all associated data`}
                          >
                            {isDeleting && deletingId === child.childId ? (
                              <span className="spinner-small"></span>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                              </svg>
                            )}
                            Delete
                          </button>
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
    </div>
  );
};

export default AdminAddChild;