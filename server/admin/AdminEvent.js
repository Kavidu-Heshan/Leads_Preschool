const mongoose = require("mongoose");

const AdminEventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  venue: { type: String, required: true },
  description: { type: String, required: true },
  parentEmails: { type: [String], default: [] } // NEW: Stores the list of parent emails
});

module.exports = mongoose.model("AdminEvent", AdminEventSchema);