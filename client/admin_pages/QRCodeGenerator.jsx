/* eslint-disable no-unused-vars */
// QRScanner.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Html5QrcodeScanner } from "html5-qrcode";
import "../css/QRScanner.css";
import AdminNavbar from '../components/AdminNavbar';

const QRScanner = () => {
  const [scanner, setScanner] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState([]);
  const [currentScan, setCurrentScan] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dailyAttendance, setDailyAttendance] = useState({});
  const [selectedDate, setSelectedDate] = useState("");
  const [lastClearedDate, setLastClearedDate] = useState("");
  const [expandedDates, setExpandedDates] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  
  const scannerRef = useRef(null);
  const qrBoxRef = useRef(null);
  const isProcessingRef = useRef(false);

  // Function to save attendance to MongoDB
  const saveAttendanceToMongoDB = async (date, attendanceRecords) => {
    try {
      const response = await axios.post('http://localhost:3002/attendance/save', {
        date: date,
        attendanceRecords: attendanceRecords
      });
      
      if (response.data.success) {
        console.log(`Successfully saved ${attendanceRecords.length} records to MongoDB`);
        return true;
      } else {
        console.error('Failed to save attendance:', response.data.error);
        return false;
      }
    } catch (err) {
      console.error('Error saving attendance to MongoDB:', err);
      return false;
    }
  };

  // Function to load attendance history from MongoDB
  const loadAttendanceHistory = async () => {
    try {
      const response = await axios.get('http://localhost:3002/attendance/history');
      if (response.data.success) {
        const attendanceData = {};
        response.data.attendance.forEach(record => {
          if (!attendanceData[record.date]) {
            attendanceData[record.date] = [];
          }
          attendanceData[record.date].push({
            childId: record.childId,
            childName: record.childName,
            className: record.className || 'N/A',
            firstScanTime: record.firstScanTime,
            scanCount: record.scanCount,
            attendanceStatus: record.attendanceStatus
          });
        });
        setDailyAttendance(attendanceData);
      }
    } catch (err) {
      console.error('Error loading attendance history:', err);
    }
  };

  // Load scanned data from localStorage on component mount
  useEffect(() => {
    loadAttendanceHistory();
    
    const savedScans = localStorage.getItem("qrScans");
    if (savedScans) {
      const parsedScans = JSON.parse(savedScans);
      const sortedScans = parsedScans.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setScannedData(sortedScans);
    }
    
    const savedAttendance = localStorage.getItem("dailyAttendance");
    if (savedAttendance) {
      setDailyAttendance(prev => ({
        ...prev,
        ...JSON.parse(savedAttendance)
      }));
    }
    
    const savedLastCleared = localStorage.getItem("lastClearedDate");
    if (savedLastCleared) {
      setLastClearedDate(savedLastCleared);
    }
  }, []);

  // Save scanned data to localStorage whenever it changes
  useEffect(() => {
    const sortedData = [...scannedData].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    if (JSON.stringify(sortedData) !== JSON.stringify(scannedData)) {
      setScannedData(sortedData);
    } else {
      localStorage.setItem("qrScans", JSON.stringify(scannedData));
    }
  }, [scannedData]);

  // Save daily attendance to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("dailyAttendance", JSON.stringify(dailyAttendance));
  }, [dailyAttendance]);

  // Save last cleared date
  useEffect(() => {
    localStorage.setItem("lastClearedDate", lastClearedDate);
  }, [lastClearedDate]);

  // Function to clear scanned records after saving attendance
  const clearScannedRecords = () => {
    if (scannedData.length > 0) {
      setScannedData([]);
      localStorage.removeItem("qrScans");
      setSuccess("Scanned records cleared for new day!");
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  // Function to save today's unique attendance and clear records
  const saveDailyAttendanceAndClear = async () => {
    if (scannedData.length === 0) return false;
    
    const today = new Date().toLocaleDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString();
    
    const alreadySaved = dailyAttendance[yesterday] && dailyAttendance[yesterday].length > 0;
    
    if (!alreadySaved && scannedData.length > 0) {
      const uniqueStudentsMap = new Map();
      
      scannedData.forEach(scan => {
        const scanDate = new Date(scan.timestamp).toLocaleDateString();
        if (scanDate === yesterday) {
          if (!uniqueStudentsMap.has(scan.childId)) {
            uniqueStudentsMap.set(scan.childId, {
              childId: scan.childId,
              childName: scan.childName,
              className: scan.className || 'N/A',
              firstScanTime: scan.time,
              attendanceStatus: "Present",
              scanCount: 1,
              allScanTimes: [{ time: scan.time, timestamp: scan.timestamp }]
            });
          } else {
            const existing = uniqueStudentsMap.get(scan.childId);
            existing.scanCount += 1;
            existing.allScanTimes.push({ time: scan.time, timestamp: scan.timestamp });
          }
        }
      });
      
      const yesterdayAttendance = Array.from(uniqueStudentsMap.values());
      
      if (yesterdayAttendance.length > 0) {
        const savedToDB = await saveAttendanceToMongoDB(yesterday, yesterdayAttendance);
        
        if (savedToDB) {
          setDailyAttendance(prev => ({
            ...prev,
            [yesterday]: yesterdayAttendance
          }));
          console.log(`Saved attendance for ${yesterday}: ${yesterdayAttendance.length} students`);
          
          clearScannedRecords();
          setLastClearedDate(yesterday);
          return true;
        }
      }
    }
    return false;
  };

  // Check for end of day and handle midnight reset
  useEffect(() => {
    const checkEndOfDay = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const currentDate = now.toLocaleDateString();
      
      if (hours === 0 && minutes === 0) {
        if (lastClearedDate !== currentDate) {
          const saved = saveDailyAttendanceAndClear();
          
          if (!saved && scannedData.length > 0) {
            const hasTodayScans = scannedData.some(scan => {
              const scanDate = new Date(scan.timestamp).toLocaleDateString();
              return scanDate === currentDate;
            });
            
            if (!hasTodayScans && scannedData.length > 0) {
              clearScannedRecords();
              setLastClearedDate(currentDate);
            }
          }
        }
      }
    };
    
    const interval = setInterval(checkEndOfDay, 60000);
    checkEndOfDay();
    
    return () => clearInterval(interval);
  }, [scannedData, dailyAttendance, lastClearedDate]);

  // Function to manually save attendance and clear records
  const saveAttendanceManually = async () => {
    if (scannedData.length === 0) {
      setError("No scan data available to save");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    const today = new Date().toLocaleDateString();
    const alreadySaved = dailyAttendance[today] && dailyAttendance[today].length > 0;
    
    if (alreadySaved) {
      setError(`Attendance for ${today} has already been saved`);
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    setIsSaving(true);
    setSuccess("Saving attendance to database...");
    
    const uniqueStudentsMap = new Map();
    
    scannedData.forEach(scan => {
      const scanDate = new Date(scan.timestamp).toLocaleDateString();
      if (scanDate === today) {
        if (!uniqueStudentsMap.has(scan.childId)) {
          uniqueStudentsMap.set(scan.childId, {
            childId: scan.childId,
            childName: scan.childName,
            className: scan.className || 'N/A',
            firstScanTime: scan.time,
            attendanceStatus: "Present",
            scanCount: 1,
            allScanTimes: [{ time: scan.time, timestamp: scan.timestamp }]
          });
        } else {
          const existing = uniqueStudentsMap.get(scan.childId);
          existing.scanCount += 1;
          existing.allScanTimes.push({ time: scan.time, timestamp: scan.timestamp });
          existing.firstScanTime = scan.time;
        }
      }
    });
    
    const todaysAttendance = Array.from(uniqueStudentsMap.values());
    
    if (todaysAttendance.length === 0) {
      setError("No scans found for today");
      setIsSaving(false);
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    const savedToDB = await saveAttendanceToMongoDB(today, todaysAttendance);
    
    if (savedToDB) {
      setDailyAttendance(prev => ({
        ...prev,
        [today]: todaysAttendance
      }));
      
      clearScannedRecords();
      setLastClearedDate(today);
      
      setSuccess(`✅ Saved attendance for ${today} (${todaysAttendance.length} students) to database and cleared records!`);
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError("Failed to save attendance to database. Please check your connection.");
      setTimeout(() => setError(""), 3000);
    }
    
    setIsSaving(false);
  };

  // Function to manually clear all scanned records
  const clearAllScans = () => {
    if (window.confirm("Are you sure you want to clear all scanned data? This will not save attendance.")) {
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

  const deleteAttendanceRecord = (date, childId) => {
    if (window.confirm(`Are you sure you want to delete attendance record for ${childId} on ${date}?`)) {
      setDailyAttendance(prev => {
        const updatedDateRecords = prev[date].filter(record => record.childId !== childId);
        if (updatedDateRecords.length === 0) {
          const { [date]: _, ...rest } = prev;
          return rest;
        }
        return {
          ...prev,
          [date]: updatedDateRecords
        };
      });
      setSuccess(`Attendance record deleted for ${date}!`);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const toggleDateExpansion = (date) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

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
    isProcessingRef.current = false;
  };

  const stopScanner = () => {
    if (scanner) {
      scanner.clear();
      setScanner(null);
      setScanning(false);
    }
    isProcessingRef.current = false;
  };

  const onScanSuccess = async (decodedText, decodedResult) => {
    if (isProcessingRef.current) {
      return;
    }
    
    isProcessingRef.current = true;
    
    try {
      let childId = "";
      let childName = "";
      let className = "";
      
      // Step 1: Check if the scanned text is a URL
      if (decodedText.startsWith("http://") || decodedText.startsWith("https://")) {
        try {
          const url = new URL(decodedText);
          const params = new URLSearchParams(url.search);
          
          childId = params.get("childId") || params.get("id") || "";
          childName = params.get("childName") || params.get("name") || "";
          className = params.get("className") || params.get("class") || "";

          if (!childId) {
            const pathParts = url.pathname.split('/').filter(Boolean);
            if (pathParts.length > 0) {
              childId = pathParts[pathParts.length - 1];
            }
          }
        } catch (urlError) {
          console.error("Failed to parse URL:", urlError);
        }
      } 
      else {
        if (decodedText.includes("|")) {
          const parts = decodedText.split("|");
          childId = parts[0].trim();
          childName = parts[1] ? parts[1].trim() : "";
          className = parts[2] ? parts[2].trim() : "";
        } 
        else if (decodedText.includes(",")) {
          const parts = decodedText.split(",");
          childId = parts[0].trim();
          childName = parts[1] ? parts[1].trim() : "";
          className = parts[2] ? parts[2].trim() : "";
        } 
        else {
          try {
            const data = JSON.parse(decodedText);
            childId = data.childId || data.id;
            childName = data.childName || data.name;
            className = data.className || data.class;
          } catch (e) {
            childId = decodedText.trim();
          }
        }
      }

      if (!childId) {
        setError("Invalid QR code format. Could not identify Child ID.");
        isProcessingRef.current = false;
        return;
      }

      // Step 3: Fetch from database if needed
      if (!childName || !className) {
        try {
          const response = await axios.get(`http://localhost:3002/student-details/${childId}`);
          if (response.data.success) {
            childName = childName || response.data.childName || "Unknown Name";
            className = className || response.data.className || response.data.class || "N/A";
          } else {
            childName = childName || "Unknown Name";
            className = className || "N/A";
          }
        } catch (err) {
          console.error("Error fetching student details from backend:", err);
          childName = childName || "Unknown";
          className = className || "N/A";
        }
      }

      const scanData = {
        id: Date.now(),
        childId: childId,
        childName: childName,
        className: className,
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
        setError(`${childName} (${childId}) was scanned recently. Please wait 5 minutes.`);
        isProcessingRef.current = false;
        return;
      }

      setCurrentScan(scanData);
      setSuccess(`${childName} (${childId}) - ${className} scanned successfully!`);
      
      setScannedData(prev => [scanData, ...prev]);
      
      setTimeout(() => setSuccess(""), 3000);
      
      if ("vibrate" in navigator) {
        navigator.vibrate(200);
      }
      
      setTimeout(() => {
        stopScanner();
        setSuccess(prevSuccess => prevSuccess + " Scanner stopped automatically.");
        setTimeout(() => setSuccess(""), 3000);
      }, 500);
      
    } catch (err) {
      console.error("Error processing QR code:", err);
      setError("Failed to process QR code. Please try again.");
      setTimeout(() => setError(""), 3000);
      isProcessingRef.current = false;
    }
  };

  const onScanError = (errorMessage) => {};

  const getUniqueStudents = () => {
    const uniqueMap = new Map();
    const sortedData = [...scannedData].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    sortedData.forEach(scan => {
      if (!uniqueMap.has(scan.childId)) {
        uniqueMap.set(scan.childId, {
          childId: scan.childId,
          childName: scan.childName,
          className: scan.className || 'N/A',
          firstScanDate: scan.date,
          firstScanTime: scan.time,
          totalScans: 1
        });
      } else {
        const existing = uniqueMap.get(scan.childId);
        existing.totalScans += 1;
        if (new Date(scan.timestamp) > new Date(`${existing.firstScanDate} ${existing.firstScanTime}`)) {
          existing.firstScanDate = scan.date;
          existing.firstScanTime = scan.time;
        }
      }
    });
    
    return Array.from(uniqueMap.values());
  };

  const exportToCSV = () => {
    if (scannedData.length === 0) {
      setError("No data to export");
      return;
    }

    const uniqueStudents = getUniqueStudents();
    const headers = ["Child ID", "Child Name", "Class", "First Scan Date", "First Scan Time", "Total Scans"];
    const csvRows = [
      headers.join(","),
      ...uniqueStudents.map(student => {
        return [
          `"${student.childId}"`,
          `"${student.childName}"`,
          `"${student.className}"`,
          `"${student.firstScanDate}"`,
          `"${student.firstScanTime}"`,
          `"${student.totalScans}"`
        ].join(",");
      })
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `unique_students_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    setSuccess(`Exported ${uniqueStudents.length} unique student records successfully!`);
    setTimeout(() => setSuccess(""), 3000);
  };

  const exportAttendanceToCSV = (date = null) => {
    const datesToExport = date ? [date] : Object.keys(dailyAttendance).sort((a, b) => new Date(a) - new Date(b));
    
    if (datesToExport.length === 0) {
      setError("No attendance data to export");
      return;
    }

    const allRecords = [];
    datesToExport.forEach(dateKey => {
      dailyAttendance[dateKey].forEach(record => {
        allRecords.push({
          ...record,
          date: dateKey
        });
      });
    });

    const headers = ["Date", "Child ID", "Child Name", "Class", "First Scan Time", "Scan Count", "Status"];
    const csvRows = [
      headers.join(","),
      ...allRecords.map(record => {
        return [
          `"${record.date}"`,
          `"${record.childId}"`,
          `"${record.childName}"`,
          `"${record.className || 'N/A'}"`,
          `"${record.firstScanTime}"`,
          `"${record.scanCount}"`,
          `"${record.attendanceStatus}"`
        ].join(",");
      })
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fileName = date ? `attendance_${date}.csv` : `all_attendance_${new Date().toISOString().split("T")[0]}.csv`;
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    setSuccess(`Attendance data exported successfully!`);
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
        scan.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (scan.className && scan.className.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return filtered;
  };

  const filteredScans = getFilteredData();
  const uniqueDates = [...new Set(scannedData.map(scan => scan.date))].sort((a, b) => new Date(a) - new Date(b));
  const attendanceDates = Object.keys(dailyAttendance).sort((a, b) => new Date(a) - new Date(b));

  return (
    <>
      <AdminNavbar />
      <div className="qr-scanner-wrapper">
        <div className="qr-scanner-container">
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
                  <div className="instruction-item">
                    <span className="instruction-icon">✨</span>
                    <span>Scanner will automatically stop after each successful scan</span>
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
                      placeholder="Search by ID, Name or Class..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input-qr"
                    />
                  </div>
                  <div className="action-buttons">
                    <button className="export-btn" onClick={exportToCSV}>
                      📥 Export Unique Students
                    </button>
                    <button className="clear-btn" onClick={clearAllScans}>
                      🗑️ Clear All
                    </button>
                    <button 
                      className="save-attendance-btn" 
                      onClick={saveAttendanceManually}
                      disabled={isSaving}
                    >
                      {isSaving ? '💾 Saving...' : '💾 Save & Clear Today\'s Records'}
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
                  <div className="stat-icon">👥</div>
                  <div className="stat-info">
                    <h3>Unique Students</h3>
                    <p>{new Set(scannedData.map(scan => scan.childId)).size}</p>
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
                        <th>Class</th>
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
                          <td>{scan.childId}</td>
                          <td>{scan.childName}</td>
                          <td>{scan.className || 'N/A'}</td>
                          <td>{scan.date}</td>
                          <td>{scan.time}</td>
                          <td><span className="status-badge success">{scan.status}</span></td>
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

            <div className="data-section attendance-section">
              <div className="data-header">
                <h2>📋 Daily Attendance Records</h2>
                <div className="data-actions">
                  <button 
                    className="export-btn" 
                    onClick={() => exportAttendanceToCSV()}
                    style={{ marginRight: '10px' }}
                  >
                    📥 Export All Attendance
                  </button>
                </div>
              </div>

              {attendanceDates.length === 0 ? (
                <div className="empty-state-qr">
                  <div className="empty-icon">📋</div>
                  <h3>No Attendance Records</h3>
                  <p>Attendance will be automatically saved and records cleared at midnight</p>
                  <p className="hint-text">Click "Save & Clear Today's Records" to manually save and clear</p>
                </div>
              ) : (
                <div className="attendance-dates-container">
                  {attendanceDates.map(date => (
                    <div key={date} className="attendance-date-card">
                      <div className="attendance-date-header" onClick={() => toggleDateExpansion(date)}>
                        <div className="date-info">
                          <span className="date-icon">📅</span>
                          <h3>{date}</h3>
                          <span className="student-count">({dailyAttendance[date].length} students)</span>
                        </div>
                        <div className="date-actions">
                          <button 
                            className="export-date-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              exportAttendanceToCSV(date);
                            }}
                            title="Export this date"
                          >
                            📥 Export
                          </button>
                          <button 
                            className="toggle-expand-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDateExpansion(date);
                            }}
                          >
                            {expandedDates[date] ? '▼' : '▶'}
                          </button>
                        </div>
                      </div>
                      
                      {expandedDates[date] && (
                        <div className="attendance-table-container">
                          <table className="attendance-table">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Child ID</th>
                                <th>Child Name</th>
                                <th>Class</th>
                                <th>First Scan Time</th>
                                <th>Scan Count</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dailyAttendance[date].map((record, index) => (
                                <tr key={`${record.childId}-${date}`}>
                                  <td>{index + 1}</td>
                                  <td>{record.childId}</td>
                                  <td>{record.childName}</td>
                                  <td>{record.className || 'N/A'}</td>
                                  <td>{record.firstScanTime}</td>
                                  <td><span className="scan-count-badge">{record.scanCount}</span></td>
                                  <td><span className="status-badge present">✓ Present</span></td>
                                  <td>
                                    <button
                                      className="delete-attendance-btn"
                                      onClick={() => deleteAttendanceRecord(date, record.childId)}
                                      title="Delete this attendance record"
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
                  ))}
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