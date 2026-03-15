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
        // Simple emoji avatar based on gender
        return this.gender === "Male" ? "👦" : "👧";
      }
    },
    dob: {
      type: Date,
      required: [true, "Date of Birth is required"]
    },
    age: {
      type: Number,
      required: [true, "Age is required"]
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
        trim: true
      }
    ],
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true
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