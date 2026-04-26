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
  className: { 
    type: String, 
    required: true,
    trim: true,
    index: true,
    default: 'N/A'
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

// Index for class-based queries
attendanceSchema.index({ className: 1, date: 1 });

// Index for month and school year queries
attendanceSchema.index({ month: 1, schoolYear: 1 });
attendanceSchema.index({ weekOfYear: 1, schoolYear: 1 });

// Static method to get attendance by date range
attendanceSchema.statics.getAttendanceByDateRange = async function(startDate, endDate) {
  return await this.find({
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: -1, childName: 1 });
};

// Static method to get attendance by class and date range
attendanceSchema.statics.getAttendanceByClass = async function(className, startDate, endDate) {
  return await this.find({
    className: className,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: -1, childName: 1 });
};

// Static method to get attendance by specific student
attendanceSchema.statics.getStudentAttendance = async function(childId, startDate, endDate) {
  const query = { childId: childId };
  if (startDate && endDate) {
    query.date = { $gte: startDate, $lte: endDate };
  }
  return await this.find(query).sort({ date: -1 });
};

// Static method to get monthly attendance summary
attendanceSchema.statics.getMonthlySummary = async function(year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0);
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay.getDate()}`;
  
  const attendance = await this.find({
    date: { $gte: startDate, $lte: endDate }
  });
  
  const summary = {
    totalPresent: attendance.length,
    uniqueStudents: new Set(attendance.map(a => a.childId)).size,
    attendanceByDay: {},
    attendanceByClass: {},
    totalScans: attendance.reduce((sum, record) => sum + record.scanCount, 0)
  };
  
  attendance.forEach(record => {
    // Group by day
    if (!summary.attendanceByDay[record.date]) {
      summary.attendanceByDay[record.date] = {
        present: 0,
        late: 0,
        halfDay: 0,
        totalScans: 0
      };
    }
    summary.attendanceByDay[record.date][record.attendanceStatus.toLowerCase()]++;
    summary.attendanceByDay[record.date].totalScans += record.scanCount;
    
    // Group by class
    if (!summary.attendanceByClass[record.className]) {
      summary.attendanceByClass[record.className] = {
        total: 0,
        uniqueStudents: new Set(),
        totalScans: 0
      };
    }
    summary.attendanceByClass[record.className].total++;
    summary.attendanceByClass[record.className].uniqueStudents.add(record.childId);
    summary.attendanceByClass[record.className].totalScans += record.scanCount;
  });
  
  // Convert Sets to counts
  for (const className in summary.attendanceByClass) {
    summary.attendanceByClass[className].uniqueStudents = summary.attendanceByClass[className].uniqueStudents.size;
  }
  
  return summary;
};

// Static method to get class-wise attendance report
attendanceSchema.statics.getClassWiseReport = async function(startDate, endDate) {
  const attendance = await this.find({
    date: { $gte: startDate, $lte: endDate }
  });
  
  const report = {};
  
  attendance.forEach(record => {
    if (!report[record.className]) {
      report[record.className] = {
        totalScans: 0,
        uniqueStudents: new Set(),
        presentCount: 0,
        lateCount: 0,
        halfDayCount: 0,
        students: {}
      };
    }
    
    report[record.className].totalScans += record.scanCount;
    report[record.className].uniqueStudents.add(record.childId);
    
    if (record.attendanceStatus === 'Present') report[record.className].presentCount++;
    if (record.attendanceStatus === 'Late') report[record.className].lateCount++;
    if (record.attendanceStatus === 'Half Day') report[record.className].halfDayCount++;
    
    if (!report[record.className].students[record.childId]) {
      report[record.className].students[record.childId] = {
        childName: record.childName,
        totalScans: 0,
        attendanceDates: [],
        statusCounts: {
          present: 0,
          late: 0,
          halfDay: 0
        }
      };
    }
    report[record.className].students[record.childId].totalScans += record.scanCount;
    report[record.className].students[record.childId].attendanceDates.push(record.date);
    report[record.className].students[record.childId].statusCounts[record.attendanceStatus.toLowerCase()]++;
  });
  
  // Convert Sets to counts and sort students
  for (const className in report) {
    report[className].uniqueStudents = report[className].uniqueStudents.size;
    // Convert students object to array and sort by name
    report[className].students = Object.values(report[className].students).sort((a, b) => 
      a.childName.localeCompare(b.childName)
    );
  }
  
  return report;
};

// Static method to get student attendance percentage
attendanceSchema.statics.getAttendancePercentage = async function(childId, startDate, endDate) {
  const attendance = await this.find({
    childId: childId,
    date: { $gte: startDate, $lte: endDate }
  });
  
  const totalDays = attendance.length;
  const presentDays = attendance.filter(a => a.attendanceStatus === 'Present').length;
  const lateDays = attendance.filter(a => a.attendanceStatus === 'Late').length;
  const halfDays = attendance.filter(a => a.attendanceStatus === 'Half Day').length;
  
  return {
    childId: childId,
    childName: attendance[0]?.childName || 'Unknown',
    className: attendance[0]?.className || 'N/A',
    totalDays: totalDays,
    presentDays: presentDays,
    lateDays: lateDays,
    halfDays: halfDays,
    attendancePercentage: totalDays > 0 ? ((presentDays + (halfDays * 0.5)) / totalDays * 100).toFixed(2) : 0,
    averageScansPerDay: totalDays > 0 ? (attendance.reduce((sum, a) => sum + a.scanCount, 0) / totalDays).toFixed(2) : 0
  };
};

// Static method to get today's attendance
attendanceSchema.statics.getTodaysAttendance = async function() {
  const today = new Date().toLocaleDateString();
  return await this.find({ date: today }).sort({ childName: 1 });
};

// Static method to delete attendance by date
attendanceSchema.statics.deleteByDate = async function(date) {
  return await this.deleteMany({ date: date });
};

// Static method to get attendance summary by week
attendanceSchema.statics.getWeeklySummary = async function(year, weekNumber) {
  const attendance = await this.find({ weekOfYear: weekNumber, schoolYear: `${year}-${year + 1}` });
  
  const summary = {
    weekNumber: weekNumber,
    year: year,
    totalScans: attendance.reduce((sum, record) => sum + record.scanCount, 0),
    uniqueStudents: new Set(attendance.map(a => a.childId)).size,
    attendanceByClass: {},
    dailyBreakdown: {}
  };
  
  attendance.forEach(record => {
    // By class
    if (!summary.attendanceByClass[record.className]) {
      summary.attendanceByClass[record.className] = {
        totalScans: 0,
        uniqueStudents: new Set(),
        totalPresent: 0
      };
    }
    summary.attendanceByClass[record.className].totalScans += record.scanCount;
    summary.attendanceByClass[record.className].uniqueStudents.add(record.childId);
    if (record.attendanceStatus === 'Present') {
      summary.attendanceByClass[record.className].totalPresent++;
    }
    
    // Daily breakdown
    if (!summary.dailyBreakdown[record.date]) {
      summary.dailyBreakdown[record.date] = {
        totalScans: 0,
        uniqueStudents: new Set(),
        present: 0,
        late: 0,
        halfDay: 0
      };
    }
    summary.dailyBreakdown[record.date].totalScans += record.scanCount;
    summary.dailyBreakdown[record.date].uniqueStudents.add(record.childId);
    summary.dailyBreakdown[record.date][record.attendanceStatus.toLowerCase()]++;
  });
  
  // Convert Sets to counts
  for (const className in summary.attendanceByClass) {
    summary.attendanceByClass[className].uniqueStudents = summary.attendanceByClass[className].uniqueStudents.size;
  }
  for (const date in summary.dailyBreakdown) {
    summary.dailyBreakdown[date].uniqueStudents = summary.dailyBreakdown[date].uniqueStudents.size;
  }
  
  return summary;
};

// Instance method to add a new scan time
attendanceSchema.methods.addScanTime = function(scanTime) {
  this.scanCount += 1;
  this.allScanTimes.push({
    time: scanTime,
    timestamp: new Date()
  });
  this.firstScanTime = scanTime; // Update to latest scan
  return this.save();
};

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;