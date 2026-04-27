const mongoose = require("mongoose");

const AnnouncementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    required: true,
    enum: ["Low", "Medium", "High"],
    default: "Low"
  },
  posted_by: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const AnnouncementModel = mongoose.model("announcements", AnnouncementSchema);
module.exports = AnnouncementModel;
