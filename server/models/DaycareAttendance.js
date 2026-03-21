// models/DaycareAttendance.js
const mongoose = require("mongoose");

const DaycareAttendanceSchema = new mongoose.Schema({
  childId: {
    type: String,
    required: true,
    ref: "StudentProfile"
  },
  childName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    // We will store the exact midnight time of the specific day to make querying easy
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

// Index to easily find records for a specific date
DaycareAttendanceSchema.index({ date: 1 });

module.exports = mongoose.model("DaycareAttendance", DaycareAttendanceSchema);