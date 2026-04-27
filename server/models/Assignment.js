const mongoose = require("mongoose");

const AssignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  className: {
    type: String,
    enum: ["LKG", "UKG", "ALL"],
    default: "ALL"
  },
  subject: {
    type: String,
    required: true,
  },
  deadline: {
    type: Date,
    required: true,
  },
  fileUrl: {
    type: String,
  },
  fileName: {
    type: String,
  },
  teacherName: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("Assignment", AssignmentSchema);
