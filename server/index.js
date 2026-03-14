require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// --- MODELS ---
const ChildModel = require("./models/Child.js");

const app = express();
app.use(express.json());
app.use(cors());

// --- MONGODB CONNECTION ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.log("MongoDB connection error:", err));

/* ================================
   CHILD MANAGEMENT API
================================ */

// 1. ADD NEW CHILD
app.post("/add-child", async (req, res) => {
  try {
    const { childId, childName } = req.body;

    const trimmedId = childId?.trim();
    const trimmedName = childName?.trim();

    if (!trimmedId) {
      return res.status(400).json({ error: "Child ID is required", field: "childId" });
    }

    if (!trimmedName) {
      return res.status(400).json({ error: "Child Name is required", field: "childName" });
    }

    const existingId = await ChildModel.findOne({ 
      childId: { $regex: new RegExp(`^${trimmedId}$`, 'i') }
    });
    
    if (existingId) {
      return res.status(400).json({ error: `Child ID "${trimmedId}" already exists`, field: "childId", code: 11000 });
    }

    const existingName = await ChildModel.findOne({ 
      childName: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
    });
    
    if (existingName) {
      return res.status(400).json({ error: `Child Name "${trimmedName}" already exists`, field: "childName", code: 11000 });
    }

    const newChild = new ChildModel({
      childId: trimmedId,
      childName: trimmedName
    });

    const savedChild = await newChild.save();
    res.status(201).json(savedChild);

  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      const value = err.keyValue[field];
      return res.status(400).json({
        error: `${field === 'childId' ? 'Child ID' : 'Child Name'} "${value}" already exists`,
        field: field, code: 11000, keyPattern: err.keyPattern, keyValue: err.keyValue
      });
    }

    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: errors.join(', '), validationErrors: err.errors });
    }

    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error. Please try again." });
  }
});

// 2. GET ALL CHILDREN
app.get("/children", async (req, res) => {
  try {
    const children = await ChildModel.find().sort({ registeredDate: -1 });
    res.json(children);
  } catch (err) {
    console.error("Error fetching children:", err);
    res.status(500).json({ error: "Failed to fetch children data" });
  }
});

// 3. CHILD ENROLLMENT (LOGIN) - FIXED 500 ERROR
app.post("/child-enroll", async (req, res) => {
  try {
    const { childId, childName } = req.body;

    const trimmedId = childId?.trim();
    const trimmedName = childName?.trim();

    if (!trimmedId) {
      return res.status(400).json({ error: "Child ID is required", field: "childId" });
    }

    if (!trimmedName) {
      return res.status(400).json({ error: "Child Name is required", field: "childName" });
    }

    const child = await ChildModel.findOne({
      childId: { $regex: new RegExp(`^${trimmedId}$`, 'i') },
      childName: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
    });

    if (!child) {
      return res.status(401).json({ 
        error: "Invalid Child ID or Name. Please check your credentials.",
        field: "credentials"
      });
    }

    // THE FIX: Use updateOne instead of child.save() to safely update login time
    const loginTime = new Date();
    await ChildModel.updateOne(
      { _id: child._id }, 
      { $set: { lastLogin: loginTime } }
    );

    res.json({
      success: true,
      message: "Successfully enrolled",
      child: {
        childId: child.childId,
        childName: child.childName,
        registeredDate: child.registeredDate,
        lastLogin: loginTime
      }
    });

  } catch (err) {
    console.error("Enrollment error:", err);
    res.status(500).json({ error: "Server error during enrollment. Please try again." });
  }
});

// --- SERVER INITIALIZATION ---
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));