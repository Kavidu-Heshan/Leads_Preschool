const mongoose = require("mongoose");

const NewChildPwdSchema = new mongoose.Schema(
  {
    childId: {
      type: String,
      required: [true, "Child ID is required"],
      trim: true,
      uppercase: true,
      ref: "Child" // Reference to Child collection
    },
    
    childName: {
      type: String,
      required: [true, "Child name is required"],
      trim: true
    },
    
    newPassword: {
      type: String,
      required: [true, "New password is required"],
      trim: true
    },
    
    passwordChangedAt: {
      type: Date,
      default: Date.now
    },
    
    lastUsed: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Index for faster lookups - case insensitive
NewChildPwdSchema.index(
  { childId: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

// Compound index for login validation
NewChildPwdSchema.index(
  { childId: 1, newPassword: 1 },
  { collation: { locale: "en", strength: 2 } }
);

module.exports = mongoose.model("NewChildPwd", NewChildPwdSchema);