/* eslint-disable no-unused-vars */
// QRScanner.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Html5QrcodeScanner } from "html5-qrcode";
import "../css/QRScanner.css";
import UserNavbar from '../components/UserNavbar';

const QRScanner = () => {
  const [scanner, setScanner] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState([]);
  const [currentScan, setCurrentScan] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  const scannerRef = useRef(null);
  const qrBoxRef = useRef(null);

  // Load scanned data from localStorage on component mount
  useEffect(() => {
    const savedScans = localStorage.getItem("qrScans");
    if (savedScans) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScannedData(JSON.parse(savedScans));
    }
  }, []);

  // Save scanned data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("qrScans", JSON.stringify(scannedData));
  }, [scannedData]);

  // Initialize QR Scanner
  const startScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
    }

    const qrScanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
      },
      false
    );

    qrScanner.render(onScanSuccess, onScanError);
    setScanner(qrScanner);
    setScanning(true);
    setError("");
  };

  const stopScanner = () => {
    if (scanner) {
      scanner.clear();
      setScanner(null);
      setScanning(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const onScanSuccess = async (decodedText, decodedResult) => {
    try {
      // Parse QR code data (expected format: "CHILD_ID|CHILD_NAME" or JSON)
      let childId, childName;
      
      if (decodedText.includes("|")) {
        const parts = decodedText.split("|");
        childId = parts[0].trim();
        childName = parts[1].trim();
      } else if (decodedText.includes(",")) {
        const parts = decodedText.split(",");
        childId = parts[0].trim();
        childName = parts[1].trim();
      } else {
        // Try to parse as JSON
        try {
          const data = JSON.parse(decodedText);
          childId = data.childId || data.id;
          childName = data.childName || data.name;
        } catch (e) {
            console.error("Can't read id",e);
          // If it's just a single value, treat as ID and try to fetch name
          childId = decodedText.trim();
          childName = "";
        }
      }

      if (!childId) {
        setError("Invalid QR code format. Please scan a valid child QR code.");
        return;
      }

      // If child name is not in QR, fetch from database
      if (!childName) {
        try {
          const response = await axios.get(`http://localhost:3002/child-name/${childId}`);
          childName = response.data.childName;
        } catch (err) {
          console.error("Error fetching child name:", err);
          childName = "Unknown";
        }
      }

      const scanData = {
        id: Date.now(),
        childId: childId,
        childName: childName,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        status: "Success"
      };

      // Check for duplicate scan within last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentScan = scannedData.find(
        scan => scan.childId === childId && new Date(scan.timestamp) > fiveMinutesAgo
      );

      if (recentScan) {
        setError(`${childName} (${childId}) was scanned recently. Please wait before scanning again.`);
        return;
      }

      setCurrentScan(scanData);
      setSuccess(`${childName} (${childId}) scanned successfully!`);
      
      // Add to scanned data list
      setScannedData(prev => [scanData, ...prev]);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
      
      // Optional: Play sound or vibrate
      if ("vibrate" in navigator) {
        navigator.vibrate(200);
      }
      
    } catch (err) {
      console.error("Error processing QR code:", err);
      setError("Failed to process QR code. Please try again.");
      setTimeout(() => setError(""), 3000);
    }
  };

  const onScanError = (errorMessage) => {
    console.warn("Scan error:", errorMessage);
    // Don't show error for every failed scan attempt
  };

  const clearAllScans = () => {
    if (window.confirm("Are you sure you want to clear all scanned data?")) {
      setScannedData([]);
      localStorage.removeItem("qrScans");
      setSuccess("All scan records cleared!");
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const deleteScan = (scanId) => {
    if (window.confirm("Are you sure you want to delete this scan record?")) {
      setScannedData(prev => prev.filter(scan => scan.id !== scanId));
      setSuccess("Scan record deleted!");
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const exportToCSV = () => {
    if (scannedData.length === 0) {
      setError("No data to export");
      return;
    }

    const filteredData = getFilteredData();
    const headers = ["Child ID", "Child Name", "Date", "Time", "Status"];
    const csvRows = [
      headers.join(","),
      ...filteredData.map(scan => {
        return [
          `"${scan.childId}"`,
          `"${scan.childName}"`,
          `"${scan.date}"`,
          `"${scan.time}"`,
          `"${scan.status}"`
        ].join(",");
      })
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `qr_scans_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    setSuccess("Data exported successfully!");
    setTimeout(() => setSuccess(""), 3000);
  };

  const getFilteredData = () => {
    let filtered = [...scannedData];
    
    if (filterDate) {
      filtered = filtered.filter(scan => scan.date === filterDate);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(scan =>
        scan.childId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scan.childName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const filteredScans = getFilteredData();
  const uniqueDates = [...new Set(scannedData.map(scan => scan.date))].sort().reverse();

  return (
    <>
      <UserNavbar />
      <div className="qr-scanner-wrapper">
        <div className="qr-scanner-container">
          {/* Decorative Elements */}
          <div className="nature-bg-qr">
            <div className="leaf-qr leaf-1">🌿</div>
            <div className="leaf-qr leaf-2">🍃</div>
            <div className="leaf-qr leaf-3">🌱</div>
          </div>
          <div className="floating-circle-qr circle-1"></div>
          <div className="floating-circle-qr circle-2"></div>

          <div className="qr-content">
            <div className="header-section-qr">
              <div className="header-icon-qr">
                <span className="header-emoji">📱</span>
              </div>
              <h1>QR Code Scanner</h1>
              <p className="header-subtitle-qr">
                Scan student QR codes to record attendance and track entries
              </p>
            </div>

            {error && (
              <div className="error-message-qr">
                <span className="error-icon">⚠️</span> {error}
              </div>
            )}

            {success && (
              <div className="success-message-qr">
                <span className="success-icon">✓</span> {success}
              </div>
            )}

            <div className="scanner-section">
              <div className="scanner-card">
                <div className="scanner-header">
                  <h2>QR Code Scanner</h2>
                  <p>Position the QR code within the frame to scan</p>
                </div>
                
                <div className="scanner-box" ref={qrBoxRef}>
                  <div id="qr-reader" className="qr-reader"></div>
                  {!scanning && (
                    <div className="scanner-overlay">
                      <button className="start-scanner-btn" onClick={startScanner}>
                        <span className="scanner-icon">📷</span>
                        Start Scanner
                      </button>
                    </div>
                  )}
                </div>

                {scanning && (
                  <button className="stop-scanner-btn" onClick={stopScanner}>
                    Stop Scanner
                  </button>
                )}

                <div className="scanner-instructions">
                  <div className="instruction-item">
                    <span className="instruction-icon">1️⃣</span>
                    <span>Click "Start Scanner" to activate camera</span>
                  </div>
                  <div className="instruction-item">
                    <span className="instruction-icon">2️⃣</span>
                    <span>Allow camera access when prompted</span>
                  </div>
                  <div className="instruction-item">
                    <span className="instruction-icon">3️⃣</span>
                    <span>Position QR code in the scanning area</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="data-section">
              <div className="data-header">
                <h2>Scanned Records</h2>
                <div className="data-actions">
                  <div className="filter-controls">
                    <select
                      className="filter-select"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                    >
                      <option value="">All Dates</option>
                      {uniqueDates.map(date => (
                        <option key={date} value={date}>{date}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Search by ID or Name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input-qr"
                    />
                  </div>
                  <div className="action-buttons">
                    <button className="export-btn" onClick={exportToCSV}>
                      📥 Export CSV
                    </button>
                    <button className="clear-btn" onClick={clearAllScans}>
                      🗑️ Clear All
                    </button>
                  </div>
                </div>
              </div>

              <div className="stats-cards">
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-info">
                    <h3>Total Scans</h3>
                    <p>{scannedData.length}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📅</div>
                  <div className="stat-info">
                    <h3>Today's Scans</h3>
                    <p>{scannedData.filter(scan => scan.date === new Date().toLocaleDateString()).length}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-info">
                    <h3>Unique Students</h3>
                    <p>{new Set(scannedData.map(scan => scan.childId)).size}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⏱️</div>
                  <div className="stat-info">
                    <h3>Last Scan</h3>
                    <p>{scannedData[0]?.time || "No scans"}</p>
                  </div>
                </div>
              </div>

              {filteredScans.length === 0 ? (
                <div className="empty-state-qr">
                  <div className="empty-icon">📭</div>
                  <h3>No Scan Records</h3>
                  <p>Scan QR codes to see records here</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="scans-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Child ID</th>
                        <th>Child Name</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredScans.map((scan, index) => (
                        <tr key={scan.id}>
                          <td>{index + 1}</td>
                          <td>
                            <span className="child-id">{scan.childId}</span>
                          </td>
                          <td>
                            <span className="child-name">{scan.childName}</span>
                          </td>
                          <td>{scan.date}</td>
                          <td>{scan.time}</td>
                          <td>
                            <span className="status-badge success">{scan.status}</span>
                          </td>
                          <td>
                            <button
                              className="delete-scan-btn"
                              onClick={() => deleteScan(scan.id)}
                              title="Delete record"
                            >
                              🗑️
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
    </>
  );
};

export default QRScanner;