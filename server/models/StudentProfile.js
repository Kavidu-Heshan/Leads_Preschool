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
      default: function () {
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
          validator: function (v) {
            return /^0\d{9}$/.test(v);
          },
          message: props =>
            `${props.value} is not a valid phone number! Must be 10 digits starting with 0`
        }
      }
    ],
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
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

// Indexes
StudentProfileSchema.index({ childId: 1 }, { unique: true });
StudentProfileSchema.index({ email: 1 });
StudentProfileSchema.index({ class: 1, includeDaycare: 1 });

// ✅ PRE SAVE (Fixed: Removed 'next', standard synchronous function)
StudentProfileSchema.pre("save", function () {
  if (!this.profilePhoto) {
    this.profilePhoto = this.gender === "Male" ? "👦" : "👧";
  }
});

// ✅ PRE FINDONEANDUPDATE (Fixed: Async function without 'next')
StudentProfileSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate();

  if (update) {
    if (update.$set) {
      if (update.$set.gender && !update.$set.profilePhoto) {
        const doc = await this.model.findOne(this.getQuery());
        if (doc && (doc.profilePhoto === "👦" || doc.profilePhoto === "👧")) {
          update.$set.profilePhoto =
            update.$set.gender === "Male" ? "👦" : "👧";
        }
      }
    }

    if (update.gender && !update.profilePhoto) {
      const doc = await this.model.findOne(this.getQuery());
      if (doc && (doc.profilePhoto === "👦" || doc.profilePhoto === "👧")) {
        update.profilePhoto =
          update.gender === "Male" ? "👦" : "👧";
      }
    }
  }
});

// ✅ PRE UPDATEONE (Fixed: Async function without 'next')
StudentProfileSchema.pre("updateOne", async function () {
  const update = this.getUpdate();

  if (update) {
    if (update.$set) {
      if (update.$set.gender && !update.$set.profilePhoto) {
        const doc = await this.model.findOne(this.getQuery());
        if (doc && (doc.profilePhoto === "👦" || doc.profilePhoto === "👧")) {
          update.$set.profilePhoto =
            update.$set.gender === "Male" ? "👦" : "👧";
        }
      }
    }

    if (update.gender && !update.profilePhoto) {
      const doc = await this.model.findOne(this.getQuery());
      if (doc && (doc.profilePhoto === "👦" || doc.profilePhoto === "👧")) {
        update.profilePhoto =
          update.gender === "Male" ? "👦" : "👧";
      }
    }
  }
});

module.exports = mongoose.model("StudentProfile", StudentProfileSchema);