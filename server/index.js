require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// --- MODELS ---
const ChildModel = require("./models/Child.js");
const NewChildPwdModel = require("./models/NewChildPwd.js");

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

// 3. CHILD ENROLLMENT (LOGIN) - Now checks both original name and new password
app.post("/child-enroll", async (req, res) => {
  try {
    const { childId, childName } = req.body;

    const trimmedId = childId?.trim();
    const trimmedName = childName?.trim();

    if (!trimmedId) {
      return res.status(400).json({ error: "Child ID is required", field: "childId" });
    }

    if (!trimmedName) {
      return res.status(400).json({ error: "Password is required", field: "childName" });
    }

    // First, check if the child has a new password set
    const childWithNewPwd = await NewChildPwdModel.findOne({
      childId: { $regex: new RegExp(`^${trimmedId}$`, 'i') }
    });

    let child = null;
    let usingNewPassword = false;

    if (childWithNewPwd) {
      // Child has changed password - check using new password
      child = await ChildModel.findOne({
        childId: { $regex: new RegExp(`^${trimmedId}$`, 'i') }
      });

      // Verify the new password matches
      if (child && childWithNewPwd.newPassword.toLowerCase() === trimmedName.toLowerCase()) {
        usingNewPassword = true;
        // Update last used time for the new password
        await NewChildPwdModel.updateOne(
          { _id: childWithNewPwd._id },
          { $set: { lastUsed: new Date() } }
        );
      } else {
        child = null; // Password doesn't match
      }
    } else {
      // No new password set - check using original child name
      child = await ChildModel.findOne({
        childId: { $regex: new RegExp(`^${trimmedId}$`, 'i') },
        childName: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
      });
    }

    if (!child) {
      return res.status(401).json({ 
        error: "Invalid Child ID or Password. Please check your credentials.",
        field: "credentials"
      });
    }

    // Update last login time
    const loginTime = new Date();
    await ChildModel.updateOne(
      { _id: child._id }, 
      { $set: { lastLogin: loginTime } }
    );

    res.json({
      success: true,
      message: "Successfully enrolled",
      hasChangedPassword: !!childWithNewPwd,
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

// 4. CHANGE PASSWORD - Store new password in separate collection (ONE-TIME ONLY)
app.post("/change-password", async (req, res) => {
  try {
    const { childId, currentPassword, newPassword, confirmNewPassword } = req.body;

    const trimmedId = childId?.trim();
    const trimmedCurrentPwd = currentPassword?.trim();
    const trimmedNewPwd = newPassword?.trim();
    const trimmedConfirmPwd = confirmNewPassword?.trim();

    // Validation
    if (!trimmedId || !trimmedCurrentPwd || !trimmedNewPwd || !trimmedConfirmPwd) {
      return res.status(400).json({ 
        error: "All fields are required",
        fields: { childId: !trimmedId, currentPassword: !trimmedCurrentPwd, 
                 newPassword: !trimmedNewPwd, confirmNewPassword: !trimmedConfirmPwd }
      });
    }

    if (trimmedNewPwd !== trimmedConfirmPwd) {
      return res.status(400).json({ 
        error: "New password and confirm password do not match",
        field: "confirmNewPassword"
      });
    }

    if (trimmedNewPwd.length < 3) {
      return res.status(400).json({
        error: "New password must be at least 3 characters long",
        field: "newPassword"
      });
    }

    // Find the child
    const child = await ChildModel.findOne({
      childId: { $regex: new RegExp(`^${trimmedId}$`, 'i') }
    });

    if (!child) {
      return res.status(404).json({ 
        error: "Child not found",
        field: "childId"
      });
    }

    // CRITICAL CHECK: Verify if this child has already changed password
    const existingNewPwd = await NewChildPwdModel.findOne({
      childId: { $regex: new RegExp(`^${trimmedId}$`, 'i') }
    });

    if (existingNewPwd) {
      return res.status(400).json({ 
        error: "You have already changed your password. Password can only be changed once.",
        field: "general"
      });
    }

    // Check current password against child's name
    if (child.childName.toLowerCase() !== trimmedCurrentPwd.toLowerCase()) {
      return res.status(401).json({ 
        error: "Current password is incorrect",
        field: "currentPassword"
      });
    }

    // Check if new password is same as current password
    if (child.childName.toLowerCase() === trimmedNewPwd.toLowerCase()) {
      return res.status(400).json({
        error: "New password cannot be the same as your name",
        field: "newPassword"
      });
    }

    // Save the new password in the separate collection (ONE-TIME ONLY)
    const newChildPwd = new NewChildPwdModel({
      childId: child.childId,
      childName: child.childName,
      newPassword: trimmedNewPwd,
      passwordChangedAt: new Date()
    });
    
    await newChildPwd.save();

    res.json({
      success: true,
      message: "Password changed successfully! From now on, use your new password to login. You cannot change it again.",
      childId: child.childId
    });

  } catch (err) {
    console.error("Password change error:", err);
    
    if (err.code === 11000) {
      return res.status(400).json({ 
        error: "You have already changed your password. Password can only be changed once.",
        field: "general"
      });
    }
    
    res.status(500).json({ error: "Server error during password change. Please try again." });
  }
});

// 5. CHECK IF CHILD HAS CHANGED PASSWORD
app.post("/check-password-status", async (req, res) => {
  try {
    const { childId } = req.body;

    const trimmedId = childId?.trim();

    if (!trimmedId) {
      return res.status(400).json({ error: "Child ID is required" });
    }

    const existingNewPwd = await NewChildPwdModel.findOne({
      childId: { $regex: new RegExp(`^${trimmedId}$`, 'i') }
    });

    res.json({
      hasChangedPassword: !!existingNewPwd,
      passwordChangedAt: existingNewPwd ? existingNewPwd.passwordChangedAt : null
    });

  } catch (err) {
    console.error("Error checking password status:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
});

// 6. GET ALL CHILDREN WITH PASSWORD STATUS
app.get("/children-with-status", async (req, res) => {
  try {
    const children = await ChildModel.find().sort({ registeredDate: -1 });
    
    // Get all password changes
    const passwordChanges = await NewChildPwdModel.find();
    
    // Create a map for quick lookup
    const passwordChangeMap = {};
    passwordChanges.forEach(change => {
      passwordChangeMap[change.childId.toLowerCase()] = {
        hasChangedPassword: true,
        passwordChangedAt: change.passwordChangedAt,
        lastUsed: change.lastUsed
      };
    });
    
    // Combine the data
    const childrenWithStatus = children.map(child => ({
      ...child.toObject(),
      passwordStatus: passwordChangeMap[child.childId.toLowerCase()] || {
        hasChangedPassword: false,
        passwordChangedAt: null,
        lastUsed: null
      }
    }));
    
    res.json(childrenWithStatus);
  } catch (err) {
    console.error("Error fetching children with status:", err);
    res.status(500).json({ error: "Failed to fetch children data" });
  }
});

// --- SERVER INITIALIZATION ---
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));