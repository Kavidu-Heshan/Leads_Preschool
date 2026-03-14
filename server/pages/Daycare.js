const mongoose = require("mongoose");

const DaycareSchema = new mongoose.Schema({
  childName: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  parentName: { type: String, required: true },
  parentEmail: { type: String, required: true },
  // This field tracks when the appointment was made
  appointmentDate: { 
    type: Date, 
    default: Date.now, 
    index: { expires: '24h' } // AUTO-DELETE after 24 hours
  }
});

module.exports = mongoose.model("Daycare", DaycareSchema);