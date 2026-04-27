const mongoose = require("mongoose");

const AssignmentSubmissionSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment",
    required: true,
  },
  childId: {
    type: String,
    required: true,
  },
  childName: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["Submitted", "Late"],
    default: "Submitted"
  },
  feedback: {
    type: String,
  },
  grade: {
    type: String,
  }
});

module.exports = mongoose.model("AssignmentSubmission", AssignmentSubmissionSchema);
