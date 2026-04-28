const mongoose = require("mongoose");

const AnnouncementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true
  },
  message: {
    type: String,
    required: [true, "Message is required"],
  },
  priority: {
    type: String,
    required: true,
    enum: ["Low", "Medium", "High"],
    default: "Low"
  },
  posted_by: {
    type: String,
    required: [true, "Posted by is required"],
  },
  endDate: {
    type: Date,
    required: false,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: null
  }
});

// Add index for better query performance
AnnouncementSchema.index({ createdAt: -1 });
AnnouncementSchema.index({ priority: 1 });
AnnouncementSchema.index({ endDate: 1 });

const AnnouncementModel = mongoose.model("announcements", AnnouncementSchema);
module.exports = AnnouncementModel;