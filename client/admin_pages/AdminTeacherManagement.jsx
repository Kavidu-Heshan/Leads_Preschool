import React, { useState, useEffect } from 'react';
import '../css/AdminTeacherManagement.css';

const AdminTeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [classSummary, setClassSummary] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    onLeave: 0,
    byClass: {
      lkg: 0,
      ukg: 0,
      daycare: 0,
      nursery: 0,
      notAssigned: 0
    },
    classTeachers: 0
  });
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [showAssignClassModal, setShowAssignClassModal] = useState(false);
  const [showRemoveClassModal, setShowRemoveClassModal] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [classToRemove, setClassToRemove] = useState(null);
  const [selectedClassForBulk, setSelectedClassForBulk] = useState('');
  const [selectedSectionForBulk, setSelectedSectionForBulk] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeView, setActiveView] = useState('teachers'); // 'teachers' or 'classes'
  const [selectAll, setSelectAll] = useState(false);

  // Form state for teacher
  const [formData, setFormData] = useState({
    teacherId: '',
    teacherName: '',
    email: '',
    phoneNumber: '',
    alternatePhone: '',
    dateOfBirth: '',
    gender: 'Female',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: ''
    },
    qualification: "Bachelor's in Education",
    specialization: 'Early Childhood Education',
    experience: '',
    previousSchool: '',
    assignedClasses: [],
    primaryClass: { className: '', section: '' },
    joiningDate: '',
    employmentType: 'Full-time',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    bankDetails: {
      accountHolderName: '',
      accountNumber: '',
      bankName: '',
      branch: '',
      ifscCode: ''
    },
    skills: [],
    languages: ['English'],
    status: 'Active',
    username: '',
    password: ''
  });

  // Form state for class assignment
  const [classAssignment, setClassAssignment] = useState({
    className: 'LKG',
    section: '',
    isClassTeacher: false,
    assignedClasses: []
  });

  // Available options
  const qualifications = [
    "Diploma in Early Childhood Education",
    "Bachelor's in Education",
    "Master's in Education",
    "PhD in Education",
    "Montessori Certified",
    "Other"
  ];

  const specializations = [
    "Early Childhood Education",
    "Special Education",
    "Montessori Method",
    "Play-Based Learning",
    "Language Development",
    "Child Psychology",
    "Other"
  ];

  const employmentTypes = [
    "Full-time",
    "Part-time",
    "Contract",
    "Probation",
    "Intern"
  ];

  const classOptions = [
    "LKG",
    "UKG",
    "Daycare",
    "Nursery"
  ];

  const sectionOptions = ["A", "B", "C", "D", "E"];

  const skillOptions = [
    "Classroom Management",
    "Lesson Planning",
    "Child Development",
    "Parent Communication",
    "Creative Arts",
    "Music",
    "Storytelling",
    "First Aid",
    "Other"
  ];

  const languageOptions = [
    "English",
    "Sinhala",
    "Tamil",
    "Other"
  ];

  const statusOptions = [
    "Active",
    "On Leave",
    "Resigned",
    "Terminated",
    "Probation"
  ];

  // Get admin info from localStorage
  const adminId = localStorage.getItem('adminId') || 'ADMIN001';
  // eslint-disable-next-line no-unused-vars
  const adminName = localStorage.getItem('adminName') || 'Administrator';

  // Fetch teachers on component mount
  useEffect(() => {
    fetchTeachers();
    fetchClassSummary();
    
    // Auto-refresh every 5 minutes
    const intervalId = setInterval(() => {
      fetchTeachers();
      fetchClassSummary();
      setLastUpdated(new Date());
    }, 300000);

    return () => clearInterval(intervalId);
  }, []);

  // Fetch teachers when filters change
  useEffect(() => {
    if (!loading) {
      fetchTeachers();
    }
  }, [filterStatus, filterClass]);

  // Handle select all
  useEffect(() => {
    if (selectAll) {
      setTeachers(teachers.map(t => ({ ...t, selected: true })));
    } else {
      setTeachers(teachers.map(t => ({ ...t, selected: false })));
    }
  }, [selectAll]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      // Build query string
      let queryParams = [];
      if (filterStatus) queryParams.push(`status=${filterStatus}`);
      if (filterClass) queryParams.push(`class=${filterClass}`);
      
      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

      // Fetch teachers
      const teachersRes = await fetch(`http://localhost:3002/teachers${queryString}`);
      const teachersData = await teachersRes.json();
      
      // Add selected property to each teacher
      const teachersWithSelection = Array.isArray(teachersData) 
        ? teachersData.map(t => ({ ...t, selected: false }))
        : [];
      
      setTeachers(teachersWithSelection);

      // Fetch statistics
      const statsRes = await fetch('http://localhost:3002/teachers/stats/summary');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      setError('');
    } catch (err) {
      console.error('Error fetching teachers:', err);
      setError('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassSummary = async () => {
    try {
      const res = await fetch('http://localhost:3002/teachers/class-summary');
      if (res.ok) {
        const data = await res.json();
        setClassSummary(data.summary || []);
      }
    } catch (err) {
      console.error('Error fetching class summary:', err);
    }
  };

  const validateForm = () => {
    const errors = {};

    // Validate phone numbers
    if (formData.phoneNumber && !/^0\d{9}$/.test(formData.phoneNumber)) {
      errors.phoneNumber = 'Phone number must be 10 digits starting with 0';
    }

    if (formData.alternatePhone && !/^0\d{9}$/.test(formData.alternatePhone)) {
      errors.alternatePhone = 'Phone number must be 10 digits starting with 0';
    }

    // Validate emergency contact phone
    if (formData.emergencyContact?.phone && !/^0\d{9}$/.test(formData.emergencyContact.phone)) {
      errors.emergencyPhone = 'Emergency contact phone must be 10 digits starting with 0';
    }

    // Validate email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Validate experience
    if (formData.experience && (formData.experience < 0 || formData.experience > 50)) {
      errors.experience = 'Experience must be between 0 and 50 years';
    }

    // Validate username (if new teacher)
    if (!editingTeacher && formData.username && formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    // Validate password (if new teacher)
    if (!editingTeacher && formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle nested objects (address, emergencyContact, bankDetails)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleArrayChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleClassAssignmentChange = (e) => {
    const { name, value, type, checked } = e.target;
    setClassAssignment({
      ...classAssignment,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const addClassToAssignment = () => {
    if (!classAssignment.className) return;

    const newClass = {
      className: classAssignment.className,
      section: classAssignment.section || '',
      isClassTeacher: classAssignment.isClassTeacher
    };

    // Check if already added
    const exists = classAssignment.assignedClasses.some(
      c => c.className === newClass.className && c.section === newClass.section
    );

    if (!exists) {
      setClassAssignment({
        ...classAssignment,
        assignedClasses: [...classAssignment.assignedClasses, newClass],
        className: 'LKG',
        section: '',
        isClassTeacher: false
      });
    }
  };

  const removeClassFromAssignment = (index) => {
    const updatedClasses = classAssignment.assignedClasses.filter((_, i) => i !== index);
    setClassAssignment({
      ...classAssignment,
      assignedClasses: updatedClasses
    });
  };

  const resetForm = () => {
    setFormData({
      teacherId: '',
      teacherName: '',
      email: '',
      phoneNumber: '',
      alternatePhone: '',
      dateOfBirth: '',
      gender: 'Female',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: ''
      },
      qualification: "Bachelor's in Education",
      specialization: 'Early Childhood Education',
      experience: '',
      previousSchool: '',
      assignedClasses: [],
      primaryClass: { className: '', section: '' },
      joiningDate: '',
      employmentType: 'Full-time',
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      },
      bankDetails: {
        accountHolderName: '',
        accountNumber: '',
        bankName: '',
        branch: '',
        ifscCode: ''
      },
      skills: [],
      languages: ['English'],
      status: 'Active',
      username: '',
      password: ''
    });
    setEditingTeacher(null);
  };

  const resetClassAssignment = () => {
    setClassAssignment({
      className: 'LKG',
      section: '',
      isClassTeacher: false,
      assignedClasses: []
    });
    setSelectedTeacher(null);
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      ...teacher,
      dateOfBirth: teacher.dateOfBirth ? teacher.dateOfBirth.split('T')[0] : '',
      joiningDate: teacher.joiningDate ? teacher.joiningDate.split('T')[0] : '',
      password: '' // Don't populate password
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (teacher) => {
    setTeacherToDelete(teacher);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!teacherToDelete) return;

    try {
      const response = await fetch(`http://localhost:3002/teachers/${teacherToDelete.teacherId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Teacher deleted successfully!');
        setShowDeleteModal(false);
        setTeacherToDelete(null);
        fetchTeachers();
        fetchClassSummary();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to delete teacher');
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError('Failed to connect to server');
    }
  };

  const handleAssignClass = (teacher) => {
    setSelectedTeacher(teacher);
    setClassAssignment({
      className: 'LKG',
      section: '',
      isClassTeacher: false,
      assignedClasses: teacher.assignedClasses || []
    });
    setShowAssignClassModal(true);
  };

  const confirmAssignClass = async () => {
    if (!selectedTeacher) return;

    setFormLoading(true);
    try {
      const response = await fetch(`http://localhost:3002/teachers/${selectedTeacher.teacherId}/assign-classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classes: classAssignment.assignedClasses
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Classes assigned successfully!');
        setShowAssignClassModal(false);
        setSelectedTeacher(null);
        resetClassAssignment();
        fetchTeachers();
        fetchClassSummary();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to assign classes');
      }
    } catch (err) {
      console.error("Assign class error:", err);
      setError('Failed to connect to server');
    } finally {
      setFormLoading(false);
    }
  };

  // New function to handle removing a class from a teacher
  const handleRemoveClass = (teacher, classToRemove) => {
    setSelectedTeacher(teacher);
    setClassToRemove(classToRemove);
    setShowRemoveClassModal(true);
  };

  const confirmRemoveClass = async () => {
    if (!selectedTeacher || !classToRemove) return;

    setFormLoading(true);
    try {
      const response = await fetch(`http://localhost:3002/teachers/${selectedTeacher.teacherId}/remove-class`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          className: classToRemove.className,
          section: classToRemove.section || ''
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(`Class ${classToRemove.className}${classToRemove.section ? `-${classToRemove.section}` : ''} removed successfully!`);
        setShowRemoveClassModal(false);
        setSelectedTeacher(null);
        setClassToRemove(null);
        fetchTeachers();
        fetchClassSummary();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to remove class');
      }
    } catch (err) {
      console.error("Remove class error:", err);
      setError('Failed to connect to server');
    } finally {
      setFormLoading(false);
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedClassForBulk) {
      setError('Please select a class');
      return;
    }

    const selectedTeacherIds = teachers
      .filter(t => t.selected)
      .map(t => t.teacherId);

    if (selectedTeacherIds.length === 0) {
      setError('Please select at least one teacher');
      return;
    }

    setFormLoading(true);
    try {
      const response = await fetch('http://localhost:3002/teachers/bulk-assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          className: selectedClassForBulk,
          section: selectedSectionForBulk,
          teacherIds: selectedTeacherIds,
          isClassTeacher: false
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(`Successfully assigned ${selectedTeacherIds.length} teachers to ${selectedClassForBulk}`);
        setShowBulkAssignModal(false);
        setSelectedClassForBulk('');
        setSelectedSectionForBulk('');
        setSelectAll(false);
        fetchTeachers();
        fetchClassSummary();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to assign teachers');
      }
    } catch (err) {
      console.error("Bulk assign error:", err);
      setError('Failed to connect to server');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setError('Please fix the errors in the form');
      return;
    }

    setFormLoading(true);
    setError('');
    setSuccess('');

    try {
      const url = editingTeacher 
        ? `http://localhost:3002/teachers/${editingTeacher.teacherId}`
        : 'http://localhost:3002/teachers';
      
      const method = editingTeacher ? 'PUT' : 'POST';

      // Prepare data for submission
      const submitData = {
        ...formData,
        createdBy: adminId,
        experience: parseInt(formData.experience) || 0
      };

      // Remove password if empty during edit
      if (editingTeacher && !submitData.password) {
        delete submitData.password;
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(editingTeacher ? 'Teacher updated successfully!' : 'Teacher created successfully!');
        resetForm();
        setShowForm(false);
        fetchTeachers();
        fetchClassSummary();
        setLastUpdated(new Date());
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || `Failed to ${editingTeacher ? 'update' : 'create'} teacher`);
      }
    } catch (err) {
      console.error("Submission error:", err);
      setError('Failed to connect to server');
    } finally {
      setFormLoading(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'Active': return 'badge-active';
      case 'On Leave': return 'badge-leave';
      case 'Resigned': return 'badge-resigned';
      case 'Terminated': return 'badge-terminated';
      case 'Probation': return 'badge-probation';
      default: return '';
    }
  };

  const toggleTeacherSelection = (teacherId) => {
    setTeachers(teachers.map(t => 
      t.teacherId === teacherId ? { ...t, selected: !t.selected } : t
    ));
    setSelectAll(false);
  };

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
  };

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.teacherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.teacherId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.phoneNumber?.includes(searchTerm);
    return matchesSearch;
  });

  const selectedCount = teachers.filter(t => t.selected).length;

  return (
    <div className="admin-teacher-container">
      {/* Decorative Elements */}
      <div className="teacher-decor">
        <div className="decor-circle circle-1"></div>
        <div className="decor-circle circle-2"></div>
        <div className="decor-circle circle-3"></div>
        <div className="decor-icon icon-1">👩‍🏫</div>
        <div className="decor-icon icon-2">📚</div>
        <div className="decor-icon icon-3">✏️</div>
      </div>

      <div className="admin-content">
        {/* Header */}
        <div className="admin-header">
          <div className="header-left">
            <div className="admin-avatar">
              <span className="avatar-icon">👩‍🏫</span>
            </div>
            <div className="admin-info">
              <h1 className="admin-title">Teacher Management</h1>
              <p className="admin-subtitle">Manage all preschool teachers and class assignments</p>
              <div className="admin-badge">
                <span className="badge-dot"></span>
                Administrator
              </div>
            </div>
          </div>
          <div className="header-right">
            <div className="last-updated">
              <span className="update-icon">🔄</span>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="view-toggle">
          <button
            className={`toggle-btn ${activeView === 'teachers' ? 'active' : ''}`}
            onClick={() => setActiveView('teachers')}
          >
            <span className="toggle-icon">👥</span>
            Teachers View
          </button>
          <button
            className={`toggle-btn ${activeView === 'classes' ? 'active' : ''}`}
            onClick={() => setActiveView('classes')}
          >
            <span className="toggle-icon">📋</span>
            Class Summary View
          </button>
        </div>

        {activeView === 'teachers' ? (
          <>
            {/* Stats Cards */}
            <div className="stats-cards">
              <div className="stat-card total">
                <div className="stat-icon">👥</div>
                <div className="stat-details">
                  <span className="stat-label">Total Teachers</span>
                  <span className="stat-value">{stats.total}</span>
                </div>
              </div>
              <div className="stat-card active">
                <div className="stat-icon">✅</div>
                <div className="stat-details">
                  <span className="stat-label">Active</span>
                  <span className="stat-value">{stats.active}</span>
                </div>
              </div>
              <div className="stat-card leave">
                <div className="stat-icon">🌴</div>
                <div className="stat-details">
                  <span className="stat-label">On Leave</span>
                  <span className="stat-value">{stats.onLeave}</span>
                </div>
              </div>
              <div className="stat-card class-teacher">
                <div className="stat-icon">👩‍🏫</div>
                <div className="stat-details">
                  <span className="stat-label">Class Teachers</span>
                  <span className="stat-value">{stats.classTeachers}</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="action-bar">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search teachers by name, ID, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="filter-box">
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Status</option>
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="filter-box">
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

              <button 
                className="create-button"
                onClick={() => {
                  resetForm();
                  setShowForm(!showForm);
                }}
              >
                <span className="button-icon">{showForm ? '✕' : '+'}</span>
                {showForm ? 'Close Form' : 'Add Teacher'}
              </button>

              <button 
                className="bulk-button"
                onClick={() => setShowBulkAssignModal(true)}
                disabled={selectedCount === 0}
              >
                <span className="button-icon">📦</span>
                Bulk Assign ({selectedCount})
              </button>
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

            {/* Teacher Form */}
            {showForm && (
              <div className="form-card">
                <h2 className="form-title">
                  {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
                </h2>
                
                <form onSubmit={handleSubmit} className="teacher-form">
                  <div className="form-section">
                    <h3 className="section-title">Personal Information</h3>
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label>Full Name *</label>
                        <input
                          type="text"
                          name="teacherName"
                          value={formData.teacherName}
                          onChange={handleInputChange}
                          required
                          placeholder="Enter teacher's full name"
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
                          placeholder="teacher@example.com"
                        />
                      </div>

                      <div className="form-group">
                        <label>Phone Number *</label>
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          required
                          placeholder="0771234567"
                        />
                      </div>

                      <div className="form-group">
                        <label>Alternate Phone</label>
                        <input
                          type="tel"
                          name="alternatePhone"
                          value={formData.alternatePhone}
                          onChange={handleInputChange}
                          placeholder="0771234567"
                        />
                      </div>

                      <div className="form-group">
                        <label>Date of Birth *</label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Gender *</label>
                        <select name="gender" value={formData.gender} onChange={handleInputChange} required>
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3 className="section-title">Address</h3>
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label>Street Address *</label>
                        <input
                          type="text"
                          name="address.street"
                          value={formData.address?.street}
                          onChange={handleInputChange}
                          required
                          placeholder="Street address"
                        />
                      </div>

                      <div className="form-group">
                        <label>City *</label>
                        <input
                          type="text"
                          name="address.city"
                          value={formData.address?.city}
                          onChange={handleInputChange}
                          required
                          placeholder="City"
                        />
                      </div>

                      <div className="form-group">
                        <label>State *</label>
                        <input
                          type="text"
                          name="address.state"
                          value={formData.address?.state}
                          onChange={handleInputChange}
                          required
                          placeholder="State"
                        />
                      </div>

                      <div className="form-group">
                        <label>Postal Code *</label>
                        <input
                          type="text"
                          name="address.postalCode"
                          value={formData.address?.postalCode}
                          onChange={handleInputChange}
                          required
                          placeholder="Postal code"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3 className="section-title">Professional Information</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Qualification *</label>
                        <select name="qualification" value={formData.qualification} onChange={handleInputChange} required>
                          {qualifications.map(q => (
                            <option key={q} value={q}>{q}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Specialization *</label>
                        <select name="specialization" value={formData.specialization} onChange={handleInputChange} required>
                          {specializations.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Years of Experience *</label>
                        <input
                          type="number"
                          name="experience"
                          value={formData.experience}
                          onChange={handleInputChange}
                          required
                          min="0"
                          max="50"
                          placeholder="Years of experience"
                        />
                      </div>

                      <div className="form-group">
                        <label>Previous School</label>
                        <input
                          type="text"
                          name="previousSchool"
                          value={formData.previousSchool}
                          onChange={handleInputChange}
                          placeholder="Previous school name"
                        />
                      </div>

                      <div className="form-group">
                        <label>Employment Type *</label>
                        <select name="employmentType" value={formData.employmentType} onChange={handleInputChange} required>
                          {employmentTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Joining Date *</label>
                        <input
                          type="date"
                          name="joiningDate"
                          value={formData.joiningDate}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Status</label>
                        <select name="status" value={formData.status} onChange={handleInputChange}>
                          {statusOptions.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3 className="section-title">Skills & Languages</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Skills (Select multiple)</label>
                        <select
                          multiple
                          value={formData.skills || []}
                          onChange={(e) => handleArrayChange('skills', 
                            Array.from(e.target.selectedOptions, option => option.value)
                          )}
                          className="multi-select"
                          size="4"
                        >
                          {skillOptions.map(skill => (
                            <option key={skill} value={skill}>{skill}</option>
                          ))}
                        </select>
                        <small>Hold Ctrl to select multiple</small>
                      </div>

                      <div className="form-group">
                        <label>Languages (Select multiple)</label>
                        <select
                          multiple
                          value={formData.languages || ['English']}
                          onChange={(e) => handleArrayChange('languages',
                            Array.from(e.target.selectedOptions, option => option.value)
                          )}
                          className="multi-select"
                          size="4"
                        >
                          {languageOptions.map(lang => (
                            <option key={lang} value={lang}>{lang}</option>
                          ))}
                        </select>
                        <small>Hold Ctrl to select multiple</small>
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3 className="section-title">Emergency Contact</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Contact Name *</label>
                        <input
                          type="text"
                          name="emergencyContact.name"
                          value={formData.emergencyContact?.name}
                          onChange={handleInputChange}
                          required
                          placeholder="Emergency contact name"
                        />
                      </div>

                      <div className="form-group">
                        <label>Relationship *</label>
                        <input
                          type="text"
                          name="emergencyContact.relationship"
                          value={formData.emergencyContact?.relationship}
                          onChange={handleInputChange}
                          required
                          placeholder="e.g., Spouse, Parent"
                        />
                      </div>

                      <div className="form-group">
                        <label>Contact Phone *</label>
                        <input
                          type="tel"
                          name="emergencyContact.phone"
                          value={formData.emergencyContact?.phone}
                          onChange={handleInputChange}
                          required
                          placeholder="0771234567"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3 className="section-title">Bank Details (Optional)</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Account Holder Name</label>
                        <input
                          type="text"
                          name="bankDetails.accountHolderName"
                          value={formData.bankDetails?.accountHolderName}
                          onChange={handleInputChange}
                          placeholder="Account holder name"
                        />
                      </div>

                      <div className="form-group">
                        <label>Account Number</label>
                        <input
                          type="text"
                          name="bankDetails.accountNumber"
                          value={formData.bankDetails?.accountNumber}
                          onChange={handleInputChange}
                          placeholder="Account number"
                        />
                      </div>

                      <div className="form-group">
                        <label>Bank Name</label>
                        <input
                          type="text"
                          name="bankDetails.bankName"
                          value={formData.bankDetails?.bankName}
                          onChange={handleInputChange}
                          placeholder="Bank name"
                        />
                      </div>

                      <div className="form-group">
                        <label>Branch</label>
                        <input
                          type="text"
                          name="bankDetails.branch"
                          value={formData.bankDetails?.branch}
                          onChange={handleInputChange}
                          placeholder="Branch"
                        />
                      </div>

                      <div className="form-group">
                        <label>IFSC Code</label>
                        <input
                          type="text"
                          name="bankDetails.ifscCode"
                          value={formData.bankDetails?.ifscCode}
                          onChange={handleInputChange}
                          placeholder="IFSC code"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3 className="section-title">Login Credentials</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Username *</label>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          required={!editingTeacher}
                          placeholder="Username for login"
                          disabled={editingTeacher}
                        />
                      </div>

                      <div className="form-group">
                        <label>Password {editingTeacher ? '(Optional)' : '*'} </label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          required={!editingTeacher}
                          placeholder={editingTeacher ? "Leave blank to keep current" : "Password"}
                          minLength="6"
                        />
                        {editingTeacher && (
                          <small>Leave blank to keep current password</small>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="submit-btn" disabled={formLoading}>
                      {formLoading ? (
                        <>
                          <span className="spinner"></span>
                          {editingTeacher ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        editingTeacher ? 'Update Teacher' : 'Create Teacher'
                      )}
                    </button>
                    <button 
                      type="button" 
                      className="cancel-btn"
                      onClick={() => {
                        resetForm();
                        setShowForm(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Selection Bar */}
            {selectedCount > 0 && (
              <div className="selection-bar">
                <span>{selectedCount} teacher{selectedCount > 1 ? 's' : ''} selected</span>
                <button 
                  className="assign-selected-btn"
                  onClick={() => setShowBulkAssignModal(true)}
                >
                  Assign to Class
                </button>
                <button 
                  className="clear-selection-btn"
                  onClick={() => {
                    setTeachers(teachers.map(t => ({ ...t, selected: false })));
                    setSelectAll(false);
                  }}
                >
                  Clear Selection
                </button>
              </div>
            )}

            {/* Teachers Table */}
            <div className="table-wrapper">
              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading teachers...</p>
                </div>
              ) : (
                <table className="teachers-table">
                  <thead>
                    <tr>
                      <th className="checkbox-col">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th>Teacher ID</th>
                      <th>Name</th>
                      <th>Contact</th>
                      <th>Qualification</th>
                      <th>Assigned Classes</th>
                      <th>Experience</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeachers.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="no-data">
                          <span className="no-data-icon">👩‍🏫</span>
                          <p>No teachers found</p>
                          <button className="create-first-btn" onClick={() => setShowForm(true)}>
                            Add your first teacher
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredTeachers.map((teacher) => (
                        <tr key={teacher.teacherId || teacher._id}>
                          <td className="checkbox-col">
                            <input
                              type="checkbox"
                              checked={teacher.selected || false}
                              onChange={() => toggleTeacherSelection(teacher.teacherId)}
                            />
                          </td>
                          <td>
                            <span className="teacher-id">{teacher.teacherId}</span>
                          </td>
                          <td>
                            <div className="teacher-name-cell">
                              <strong>{teacher.teacherName}</strong>
                              {teacher.assignedClasses?.some(c => c.isClassTeacher) && (
                                <span className="class-teacher-badge">Class Teacher</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="contact-info">
                              <div>{teacher.email}</div>
                              <div className="phone">{teacher.phoneNumber}</div>
                            </div>
                          </td>
                          <td>
                            <div className="qualification-info">
                              <div>{teacher.qualification}</div>
                              <div className="specialization">{teacher.specialization}</div>
                            </div>
                          </td>
                          <td>
                            <div className="assigned-classes">
                              {teacher.assignedClasses && teacher.assignedClasses.length > 0 ? (
                                teacher.assignedClasses.map((cls, idx) => (
                                  <div key={idx} className="class-tag-wrapper">
                                    <span className="class-tag">
                                      {cls.className}{cls.section ? `-${cls.section}` : ''}
                                      {cls.isClassTeacher && ' 👑'}
                                    </span>
                                    <button
                                      className="remove-class-btn-small"
                                      onClick={() => handleRemoveClass(teacher, cls)}
                                      title="Remove this class"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <span className="not-assigned">Not Assigned</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="experience-info">
                              <span className="experience-years">{teacher.experience} years</span>
                              {teacher.previousSchool && (
                                <div className="previous-school" title={teacher.previousSchool}>
                                  {teacher.previousSchool.substring(0, 15)}...
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${getStatusBadgeClass(teacher.status)}`}>
                              {teacher.status}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="action-btn assign"
                                onClick={() => handleAssignClass(teacher)}
                                title="Assign Classes"
                              >
                                📋
                              </button>
                              <button
                                className="action-btn edit"
                                onClick={() => handleEdit(teacher)}
                                title="Edit teacher"
                              >
                                ✏️
                              </button>
                              <button
                                className="action-btn delete"
                                onClick={() => handleDelete(teacher)}
                                title="Delete teacher"
                              >
                                🗑️
                              </button>
                              {/* <button
                                className="action-btn view"
                                onClick={() => window.open(`/teacher/${teacher.teacherId}`, '_blank')}
                                title="View details"
                              >
                                👁️
                              </button> */}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          /* Class Summary View */
          <div className="class-summary-view">
            <h2 className="summary-title">Class-wise Teacher Distribution</h2>
            <div className="class-summary-grid">
              {classSummary.map((classInfo) => (
                <div key={classInfo.className} className="class-summary-card">
                  <div className="class-header">
                    <h3>{classInfo.className}</h3>
                    <div className="class-stats">
                      <span className="total-badge">Total: {classInfo.totalTeachers}</span>
                      <span className="ct-badge">Class Teachers: {classInfo.classTeachers}</span>
                    </div>
                  </div>
                  <div className="sections-list">
                    {classInfo.sections?.map((section, idx) => (
                      <div key={idx} className="section-item">
                        <div className="section-header">
                          <span className="section-name">Section {section.section === 'No Section' ? 'Default' : section.section}</span>
                          <span className="teacher-count">{section.teacherCount} teachers</span>
                        </div>
                        <div className="class-teacher-info">
                          Class Teacher: <strong>{section.classTeacher}</strong>
                        </div>
                        <div className="teacher-names">
                          <small>Teachers: {section.teachers?.join(', ')}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table Footer */}
        {activeView === 'teachers' && (
          <div className="table-footer">
            <div className="footer-info">
              Showing {filteredTeachers.length} of {teachers.length} teachers
            </div>
            <div className="footer-actions">
              <button className="export-btn" onClick={() => {
                // Export functionality
                const csvContent = [
                  ['Teacher ID', 'Name', 'Email', 'Phone', 'Qualification', 'Specialization', 'Assigned Classes', 'Experience', 'Status'],
                  ...filteredTeachers.map(t => [
                    t.teacherId,
                    t.teacherName,
                    t.email,
                    t.phoneNumber,
                    t.qualification,
                    t.specialization,
                    t.assignedClasses?.map(c => `${c.className}${c.section ? `-${c.section}` : ''}`).join('; ') || 'Not Assigned',
                    t.experience,
                    t.status
                  ])
                ].map(row => row.join(',')).join('\n');
                
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `teachers_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
              }}>
                📥 Export to CSV
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Delete Teacher</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this teacher?</p>
              <p className="teacher-name">{teacherToDelete?.teacherName}</p>
              <p className="warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="delete-btn" onClick={confirmDelete}>
                Delete Teacher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Class Modal */}
      {showAssignClassModal && selectedTeacher && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <h3>Assign Classes - {selectedTeacher.teacherName}</h3>
              <button className="modal-close" onClick={() => {
                setShowAssignClassModal(false);
                resetClassAssignment();
              }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="assign-class-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Class</label>
                    <select 
                      name="className" 
                      value={classAssignment.className} 
                      onChange={handleClassAssignmentChange}
                    >
                      {classOptions.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Section</label>
                    <select 
                      name="section" 
                      value={classAssignment.section} 
                      onChange={handleClassAssignmentChange}
                    >
                      <option value="">No Section</option>
                      {sectionOptions.map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="isClassTeacher"
                        checked={classAssignment.isClassTeacher}
                        onChange={handleClassAssignmentChange}
                      />
                      Class Teacher
                    </label>
                    <button 
                    type="button" 
                    className="add-class-btn"
                    onClick={addClassToAssignment}
                  >
                    Add Class
                  </button>
                  </div>

                  
                </div>

                <div className="assigned-classes-list">
                  <h4>Assigned Classes:</h4>
                  {classAssignment.assignedClasses.length === 0 ? (
                    <p className="no-classes">No classes assigned yet</p>
                  ) : (
                    classAssignment.assignedClasses.map((cls, index) => (
                      <div key={index} className="assigned-class-item">
                        <span className="class-info">
                          {cls.className} {cls.section && `- Section ${cls.section}`}
                          {cls.isClassTeacher && ' 👑 (Class Teacher)'}
                        </span>
                        <button 
                          className="remove-class-btn"
                          onClick={() => removeClassFromAssignment(index)}
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => {
                setShowAssignClassModal(false);
                resetClassAssignment();
              }}>
                Cancel
              </button>
              <button 
                className="assign-btn" 
                onClick={confirmAssignClass}
                disabled={classAssignment.assignedClasses.length === 0 || formLoading}
              >
                {formLoading ? 'Saving...' : 'Save Assignments'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Class Confirmation Modal - NEW */}
      {showRemoveClassModal && selectedTeacher && classToRemove && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Remove Class</h3>
              <button className="modal-close" onClick={() => {
                setShowRemoveClassModal(false);
                setSelectedTeacher(null);
                setClassToRemove(null);
              }}>✕</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to remove this class from {selectedTeacher.teacherName}?</p>
              <p className="teacher-name">
                {classToRemove.className}{classToRemove.section ? `-${classToRemove.section}` : ''}
                {classToRemove.isClassTeacher && ' 👑 (Class Teacher)'}
              </p>
              <p className="warning">This action will remove the teacher from this class assignment.</p>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => {
                setShowRemoveClassModal(false);
                setSelectedTeacher(null);
                setClassToRemove(null);
              }}>
                Cancel
              </button>
              <button 
                className="delete-btn" 
                onClick={confirmRemoveClass}
                disabled={formLoading}
              >
                {formLoading ? 'Removing...' : 'Remove Class'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {showBulkAssignModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Bulk Assign Teachers to Class</h3>
              <button className="modal-close" onClick={() => setShowBulkAssignModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Select Class *</label>
                <select 
                  value={selectedClassForBulk} 
                  onChange={(e) => setSelectedClassForBulk(e.target.value)}
                  required
                >
                  <option value="">Choose a class</option>
                  {classOptions.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Section (Optional)</label>
                <select 
                  value={selectedSectionForBulk} 
                  onChange={(e) => setSelectedSectionForBulk(e.target.value)}
                >
                  <option value="">No Section</option>
                  {sectionOptions.map(sec => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>
              </div>

              <div className="selected-count">
                <span className="count-badge">
                  {selectedCount} teacher{selectedCount !== 1 ? 's' : ''} selected for assignment
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowBulkAssignModal(false)}>
                Cancel
              </button>
              <button 
                className="assign-btn" 
                onClick={handleBulkAssign}
                disabled={!selectedClassForBulk || selectedCount === 0 || formLoading}
              >
                {formLoading ? 'Assigning...' : 'Assign to Class'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTeacherManagement;