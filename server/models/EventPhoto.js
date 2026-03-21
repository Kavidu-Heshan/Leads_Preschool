const mongoose = require("mongoose");

const EventPhotoSchema = new mongoose.Schema(
  {
    photoId: {
      type: String,
      required: true,
      unique: true,
      default: function() {
        return `PH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
    },
    eventId: {
      type: String,
      required: [true, "Event ID is required"],
      trim: true,
      uppercase: true,
      ref: "Event"
    },
    eventName: {
      type: String,
      required: [true, "Event name is required"],
      trim: true
    },
    photoUrl: {
      type: String,
      required: [true, "Photo URL is required"]
    },
    photoCaption: {
      type: String,
      trim: true,
      default: ""
    },
    uploadedBy: {
      type: String,
      required: true,
      default: "SYSTEM"
    },
    uploadedByName: {
      type: String,
      default: "Admin"
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    photoDate: {
      type: Date,
      default: Date.now
    },
    photoSize: {
      type: Number,
      default: 0
    },
    photoType: {
      type: String,
      default: ""
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ["Active", "Archived", "Deleted"],
      default: "Active"
    },
    tags: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
EventPhotoSchema.index({ eventId: 1, uploadedAt: -1 });
EventPhotoSchema.index({ eventId: 1, isFeatured: -1 });
EventPhotoSchema.index({ uploadedAt: -1 });
EventPhotoSchema.index({ tags: 1 });

module.exports = mongoose.model("EventPhoto", EventPhotoSchema);