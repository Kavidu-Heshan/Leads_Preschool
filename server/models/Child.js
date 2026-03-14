const mongoose = require("mongoose");

const ChildSchema = new mongoose.Schema(
{
  childId: {
    type: String,
    required: [true, "Child ID is required"],
    trim: true,
    uppercase: true,
    validate: {
      validator: function (v) {
        return v && v.trim().length > 0;
      },
      message: "Child ID cannot be empty"
    }
  },

  childName: {
    type: String,
    required: [true, "Child name is required"],
    trim: true,
    validate: {
      validator: function (v) {
        return v && v.trim().length > 0;
      },
      message: "Child name cannot be empty"
    }
  },

  registeredDate: {
    type: Date,
    default: Date.now
  },

  lastLogin: {
    type: Date,
    default: null
  }
},
{
  timestamps: true
}
);

// Case-insensitive unique indexes
ChildSchema.index(
  { childId: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

ChildSchema.index(
  { childName: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

// PRE SAVE MIDDLEWARE (FIXED)
ChildSchema.pre("save", async function () {
  if (this.childId) {
    this.childId = this.childId.trim();
  }

  if (this.childName) {
    this.childName = this.childName.trim();
  }
});

module.exports = mongoose.model("Child", ChildSchema);