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

module.exports = mongoose.model("StudentProfile", StudentProfileSchema);