const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');

// Storage config for Assignments and Submissions
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir;
    // Determine path based on route
    if (req.originalUrl.includes('submit')) {
      uploadDir = path.join(__dirname, '../uploads/submissions');
    } else {
      uploadDir = path.join(__dirname, '../uploads/assignments');
    }

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// 1. Create Assignment
router.post('/create', upload.single('file'), async (req, res) => {
  try {
    const { title, description, className, subject, deadline, teacherName } = req.body;
    
    let fileUrl = null;
    let fileName = null;
    if (req.file) {
      fileUrl = `/uploads/assignments/${req.file.filename}`;
      fileName = req.file.originalname;
    }

    const newAssignment = new Assignment({
      title,
      description,
      className: className || 'ALL',
      subject,
      deadline: new Date(deadline),
      fileUrl,
      fileName,
      teacherName
    });

    await newAssignment.save();
    res.status(201).json({ success: true, assignment: newAssignment });
  } catch (error) {
    console.error("Error creating assignment:", error);
    res.status(500).json({ error: "Failed to create assignment" });
  }
});

// 2. Get all assignments (Teacher)
router.get('/', async (req, res) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

// 3. Get assignments by class (Student)
router.get('/class/:className', async (req, res) => {
  try {
    const { className } = req.params;
    const assignments = await Assignment.find({
      $or: [{ className: className }, { className: 'ALL' }]
    }).sort({ deadline: 1 });
    
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

// 4. Submit Assignment (Student)
router.post('/submit/:id', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { childId, childName } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    // Determine status (Late or Submitted)
    const now = new Date();
    const status = now > assignment.deadline ? "Late" : "Submitted";

    // Check if already submitted
    let submission = await AssignmentSubmission.findOne({ assignmentId: id, childId });
    
    if (submission) {
      // Update existing
      submission.fileUrl = `/uploads/submissions/${req.file.filename}`;
      submission.fileName = req.file.originalname;
      submission.submittedAt = now;
      submission.status = status;
    } else {
      // Create new
      submission = new AssignmentSubmission({
        assignmentId: id,
        childId,
        childName,
        fileUrl: `/uploads/submissions/${req.file.filename}`,
        fileName: req.file.originalname,
        submittedAt: now,
        status
      });
    }

    await submission.save();
    res.json({ success: true, submission });
  } catch (error) {
    console.error("Submission error:", error);
    res.status(500).json({ error: "Failed to submit assignment" });
  }
});

// 5. Get Submissions for an assignment (Teacher)
router.get('/submissions/:id', async (req, res) => {
  try {
    const submissions = await AssignmentSubmission.find({ assignmentId: req.params.id }).sort({ submittedAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

// 6. Delete Assignment
router.delete('/:id', async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    await AssignmentSubmission.deleteMany({ assignmentId: req.params.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete assignment" });
  }
});

// 7. Get File endpoint
router.get('/download/:type/:filename', (req, res) => {
  const { type, filename } = req.params;
  const filePath = path.join(__dirname, `../uploads/${type}`, filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath, filename);
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

// 8. Get My Submissions (Student)
router.get('/my-submissions/:childId', async (req, res) => {
  try {
    const submissions = await AssignmentSubmission.find({ childId: req.params.childId });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

module.exports = router;
