const mongoose = require("mongoose");

const StudentProfileSchema = new mongoose.Schema(
  {
    childId: {
      type: String,
      required: [true, "Child ID is required"],
      trim: true,
      uppercase: true,
      unique: true,
      ref: "Child"
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: ["Male", "Female"]
    },
    profilePhoto: {
      type: String,
      default: function() {
        return this.gender === "Male" ? "👦" : "👧";
      }
    },
    class: {
      type: String,
      required: [true, "Class is required"],
      enum: ["Daycare", "LKG", "UKG"]
    },
    includeDaycare: {
      type: Boolean,
      default: false
    },
    dob: {
      type: Date,
      required: [true, "Date of Birth is required"]
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [3, "Child must be at least 3 years old"],
      max: [5, "Child cannot be older than 5 years"]
    },
    bloodType: {
      type: String,
      required: [true, "Blood type is required"],
      trim: true
    },
    guardianName: {
      type: String,
      required: [true, "Guardian name is required"],
      trim: true
    },
    contactNumbers: [
      {
        type: String,
        required: [true, "At least one contact number is required"],
        trim: true,
        validate: {
          validator: function(v) {
            return /^0\d{9}$/.test(v);
          },
          message: props => `${props.value} is not a valid phone number! Must be 10 digits starting with 0`
        }
      }
    ],
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: props => `${props.value} is not a valid email address!`
      }
    },
    medicalInformation: {
      type: String,
      trim: true,
      default: "None"
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
StudentProfileSchema.index({ childId: 1 }, { unique: true });
StudentProfileSchema.index({ email: 1 });
StudentProfileSchema.index({ class: 1, includeDaycare: 1 });

// PRE SAVE MIDDLEWARE
// Note: This remains a standard callback function because it is not async
StudentProfileSchema.pre("save", function(next) {
  // If no profile photo is set, use gender-based emoji
  if (!this.profilePhoto) {
    this.profilePhoto = this.gender === "Male" ? "👦" : "👧";
  }
  next();
});

// PRE FIND ONE AND UPDATE MIDDLEWARE - FIXED
// Removed 'next' callback since we are using an async function
StudentProfileSchema.pre("findOneAndUpdate", async function() {
  const update = this.getUpdate();
  
  // Only process if there's an update object
  if (update) {
    // Handle $set operator
    if (update.$set) {
      // If gender is being updated and profile photo is not being explicitly set
      if (update.$set.gender && !update.$set.profilePhoto) {
        // Get the current document
        const doc = await this.model.findOne(this.getQuery());
        if (doc) {
          // If the current profile photo is an emoji, update it to match new gender
          if (doc.profilePhoto === "👦" || doc.profilePhoto === "👧") {
            update.$set.profilePhoto = update.$set.gender === "Male" ? "👦" : "👧";
          }
        }
      }
    }
    
    // Handle direct updates (without $set)
    if (update.gender && !update.profilePhoto) {
      const doc = await this.model.findOne(this.getQuery());
      if (doc) {
        if (doc.profilePhoto === "👦" || doc.profilePhoto === "👧") {
          update.profilePhoto = update.gender === "Male" ? "👦" : "👧";
        }
      }
    }
  }
});

// PRE UPDATE ONE MIDDLEWARE - FIXED
// Removed 'next' callback since we are using an async function
StudentProfileSchema.pre("updateOne", async function() {
  const update = this.getUpdate();
  
  // Only process if there's an update object
  if (update) {
    // Handle $set operator
    if (update.$set) {
      // If gender is being updated and profile photo is not being explicitly set
      if (update.$set.gender && !update.$set.profilePhoto) {
        // Get the current document
        const doc = await this.model.findOne(this.getQuery());
        if (doc) {
          // If the current profile photo is an emoji, update it to match new gender
          if (doc.profilePhoto === "👦" || doc.profilePhoto === "👧") {
            update.$set.profilePhoto = update.$set.gender === "Male" ? "👦" : "👧";
          }
        }
      }
    }
    
    // Handle direct updates (without $set)
    if (update.gender && !update.profilePhoto) {
      const doc = await this.model.findOne(this.getQuery());
      if (doc) {
        if (doc.profilePhoto === "👦" || doc.profilePhoto === "👧") {
          update.profilePhoto = update.gender === "Male" ? "👦" : "👧";
        }
      }
    }
  }
});

module.exports = mongoose.model("StudentProfile", StudentProfileSchema);