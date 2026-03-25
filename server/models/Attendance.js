const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  // Primary fields
  date: { 
    type: String, 
    required: true,
    index: true
  },
  childId: { 
    type: String, 
    required: true,
    index: true,
    trim: true
  },
  childName: { 
    type: String, 
    required: true,
    trim: true
  },
  
  // Attendance details
  firstScanTime: { 
    type: String, 
    required: true 
  },
  scanCount: { 
    type: Number, 
    default: 1 
  },
  attendanceStatus: { 
    type: String, 
    enum: ['Present', 'Absent', 'Late', 'Half Day'], 
    default: 'Present' 
  },
  
  // Timestamps for all scans
  allScanTimes: [{
    time: String,
    timestamp: Date
  }],
  
  // Additional metadata
  schoolYear: { 
    type: String, 
    default: () => {
      const year = new Date().getFullYear();
      return `${year}-${year + 1}`;
    }
  },
  month: { 
    type: String,
    default: () => new Date().toLocaleString('default', { month: 'long' })
  },
  weekOfYear: { 
    type: Number,
    default: () => {
      const date = new Date();
      const start = new Date(date.getFullYear(), 0, 1);
      const days = Math.floor((date - start) / (24 * 60 * 60 * 1000));
      return Math.ceil((days + start.getDay() + 1) / 7);
    }
  }
}, { 
  // Let Mongoose handle createdAt and updatedAt automatically!
  timestamps: true 
});

// Compound index to ensure unique attendance per child per day
attendanceSchema.index({ date: 1, childId: 1 }, { unique: true });

// Static method to get attendance by date range
attendanceSchema.statics.getAttendanceByDateRange = async function(startDate, endDate) {
  return await this.find({
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: -1, childName: 1 });
};

// Static method to get monthly attendance summary
attendanceSchema.statics.getMonthlySummary = async function(year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toLocaleDateString();
  
  const attendance = await this.find({
    date: { $gte: startDate, $lte: endDate }
  });
  
  const summary = {
    totalPresent: attendance.length,
    uniqueStudents: new Set(attendance.map(a => a.childId)).size,
    attendanceByDay: {}
  };
  
  attendance.forEach(record => {
    if (!summary.attendanceByDay[record.date]) {
      summary.attendanceByDay[record.date] = {
        present: 0,
        late: 0,
        halfDay: 0
      };
    }
    summary.attendanceByDay[record.date][record.attendanceStatus.toLowerCase()]++;
  });
  
  return summary;
};

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;