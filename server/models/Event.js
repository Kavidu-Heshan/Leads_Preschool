const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: [true, "Event ID is required"],
      trim: true,
      unique: true,
      uppercase: true
    },
    eventName: {
      type: String,
      required: [true, "Event name is required"],
      trim: true
    },
    eventType: {
      type: String,
      required: [true, "Event type is required"],
      enum: ["Cultural", "Sports", "Educational", "Parent-Teacher", "Holiday", "Workshop", "Other"]
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    eventDate: {
      type: Date,
      required: [true, "Event date is required"]
    },
    eventTime: {
      type: String,
      required: [true, "Event time is required"]
    },
    endTime: {
      type: String,
      default: ""
    },
    venue: {
      type: String,
      required: [true, "Venue is required"],
      trim: true
    },
    organizer: {
      type: String,
      required: [true, "Organizer name is required"],
      trim: true
    },
    contactPerson: {
      type: String,
      trim: true
    },
    contactPhone: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^0\d{9}$/.test(v);
        },
        message: props => `${props.value} is not a valid phone number! Must be 10 digits starting with 0`
      }
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v) {
          return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: props => `${props.value} is not a valid email address!`
      }
    },
    targetAudience: {
      type: String,
      enum: ["All", "Students Only", "Parents Only", "Teachers Only", "Students & Parents", "Staff Only"],
      default: "All"
    },
    maxAttendees: {
      type: Number,
      min: [1, "Max attendees must be at least 1"],
      default: null
    },
    registrationRequired: {
      type: Boolean,
      default: false
    },
    registrationDeadline: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ["Upcoming", "Ongoing", "Completed", "Cancelled"],
      default: "Upcoming"
    },
    createdBy: {
      type: String,
      required: [true, "Creator ID is required"]
    }
  },
  {
    timestamps: true // This automatically handles createdAt and updatedAt!
  }
);

// Indexes for faster queries
EventSchema.index({ eventDate: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ eventType: 1 });

// ==========================================
// PRE-SAVE HOOK (FIXED)
// ==========================================
// We use an async function here, so Mongoose knows it's a promise. 
// DO NOT use next() inside an async function!
EventSchema.pre("save", async function () {
  // Ensure the status makes sense based on the date before saving
  if (this.status !== 'Cancelled' && this.eventDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const eventDate = new Date(this.eventDate);
    eventDate.setHours(0, 0, 0, 0);

    if (eventDate < today) {
      this.status = 'Completed';
    } else if (eventDate.getTime() === today.getTime()) {
      this.status = 'Ongoing';
    } else {
      this.status = 'Upcoming';
    }
  }
});

// ==========================================
// STATIC METHODS
// ==========================================
// This is required because your index.js calls EventModel.updateAllStatuses()
EventSchema.statics.updateAllStatuses = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 1. Mark past events as Completed
  await this.updateMany(
    { 
      eventDate: { $lt: today }, 
      status: { $nin: ['Completed', 'Cancelled'] } 
    },
    { $set: { status: 'Completed' } }
  );

  // 2. Mark today's events as Ongoing
  await this.updateMany(
    { 
      eventDate: { $gte: today, $lt: tomorrow }, 
      status: { $nin: ['Ongoing', 'Cancelled'] } 
    },
    { $set: { status: 'Ongoing' } }
  );

  // 3. Ensure future events are Upcoming
  await this.updateMany(
    { 
      eventDate: { $gte: tomorrow }, 
      status: { $nin: ['Upcoming', 'Cancelled'] } 
    },
    { $set: { status: 'Upcoming' } }
  );
};

module.exports = mongoose.model("Event", EventSchema);