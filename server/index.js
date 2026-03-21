require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

// --- MODELS ---
const ChildModel = require("./models/Child.js");
const NewChildPwdModel = require("./models/NewChildPwd.js");
const StudentProfileModel = require("./models/StudentProfile.js");
const EventModel = require("./models/Event.js");
const TeacherModel = require("./models/Teacher.js");

const app = express();
app.use(express.json());
app.use(cors());

// --- MONGODB CONNECTION ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
    // Run status update every hour
    setInterval(async () => {
      try {
        await EventModel.updateAllStatuses();
        console.log("Event statuses updated automatically");
      } catch (err) {
        console.error("Error updating event statuses:", err);
      }
    }, 60 * 60 * 1000); // Every hour
  })
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

// 3. CHILD ENROLLMENT (LOGIN)
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

    const childWithNewPwd = await NewChildPwdModel.findOne({
      childId: { $regex: new RegExp(`^${trimmedId}$`, 'i') }
    });

    let child = null;
    let usingNewPassword = false;

    if (childWithNewPwd) {
      child = await ChildModel.findOne({
        childId: { $regex: new RegExp(`^${trimmedId}$`, 'i') }
      });

      if (child && childWithNewPwd.newPassword.toLowerCase() === trimmedName.toLowerCase()) {
        usingNewPassword = true;
        await NewChildPwdModel.updateOne(
          { _id: childWithNewPwd._id },
          { $set: { lastUsed: new Date() } }
        );
      } else {
        child = null; 
      }
    } else {
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

// 4. CHANGE PASSWORD
app.post("/change-password", async (req, res) => {
  try {
    const { childId, currentPassword, newPassword, confirmNewPassword } = req.body;

    const trimmedId = childId?.trim();
    const trimmedCurrentPwd = currentPassword?.trim();
    const trimmedNewPwd = newPassword?.trim();
    const trimmedConfirmPwd = confirmNewPassword?.trim();

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

    const child = await ChildModel.findOne({
      childId: { $regex: new RegExp(`^${trimmedId}$`, 'i') }
    });

    if (!child) {
      return res.status(404).json({ 
        error: "Child not found",
        field: "childId"
      });
    }

    const existingNewPwd = await NewChildPwdModel.findOne({
      childId: { $regex: new RegExp(`^${trimmedId}$`, 'i') }
    });

    if (existingNewPwd) {
      return res.status(400).json({ 
        error: "You have already changed your password. Password can only be changed once.",
        field: "general"
      });
    }

    if (child.childName.toLowerCase() !== trimmedCurrentPwd.toLowerCase()) {
      return res.status(401).json({ 
        error: "Current password is incorrect",
        field: "currentPassword"
      });
    }

    if (child.childName.toLowerCase() === trimmedNewPwd.toLowerCase()) {
      return res.status(400).json({
        error: "New password cannot be the same as your name",
        field: "newPassword"
      });
    }

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
    
    const passwordChanges = await NewChildPwdModel.find();
    
    const passwordChangeMap = {};
    passwordChanges.forEach(change => {
      passwordChangeMap[change.childId.toLowerCase()] = {
        hasChangedPassword: true,
        passwordChangedAt: change.passwordChangedAt,
        lastUsed: change.lastUsed
      };
    });
    
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

// 7. GET CHILD NAME BY ID
app.get("/child-name/:childId", async (req, res) => {
  try {
    const { childId } = req.params;
    const child = await ChildModel.findOne({ 
      childId: { $regex: new RegExp(`^${childId}$`, 'i') }
    });
    
    if (!child) {
      return res.status(404).json({ error: "Child not found" });
    }
    
    res.json({ childName: child.childName });
  } catch (err) {
    console.error("Error fetching child name:", err);
    res.status(500).json({ error: "Failed to fetch child name" });
  }
});

// 8. CHECK IF PROFILE EXISTS
app.get("/check-profile/:childId", async (req, res) => {
  try {
    const { childId } = req.params;
    const profile = await StudentProfileModel.findOne({ 
      childId: { $regex: new RegExp(`^${childId}$`, 'i') }
    });
    
    res.json({ 
      exists: !!profile,
      profile: profile || null
    });
  } catch (err) {
    console.error("Error checking profile:", err);
    res.status(500).json({ error: "Failed to check profile status" });
  }
});

// 9. CREATE STUDENT PROFILE (UPDATED WITH PROPER ERROR HANDLING)
app.post("/student-profile", async (req, res) => {
  try {
    const profileData = req.body;

    // Check if childId is missing before hitting the database
    if (!profileData.childId) {
      return res.status(400).json({ 
        success: false, 
        error: "Child ID is missing. Please try logging in again." 
      });
    }

    const existingProfile = await StudentProfileModel.findOne({ 
      childId: { $regex: new RegExp(`^${profileData.childId}$`, 'i') } 
    });

    if (existingProfile) {
      return res.status(400).json({ 
        success: false, 
        error: "A profile already exists for this Student ID." 
      });
    }

    const newProfile = new StudentProfileModel(profileData);
    await newProfile.save();

    res.status(201).json({ 
      success: true, 
      message: "Student profile saved successfully!" 
    });

  } catch (err) {
    console.error("Error creating student profile:", err);

    // Catch Mongoose Validation Errors and send to frontend
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, error: errors.join(', ') });
    }

    // Catch Duplicate Key Errors (MongoDB code 11000)
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: "A record with this information already exists in the database." });
    }

    // Generic fallback for actual server crashes
    res.status(500).json({ 
      success: false, 
      error: "Failed to save profile. Please check the server logs." 
    });
  }
});

// 10. GET STUDENT PROFILE BY CHILD ID
app.get("/student-profile/:childId", async (req, res) => {
  try {
    const { childId } = req.params;
    const profile = await StudentProfileModel.findOne({ 
      childId: { $regex: new RegExp(`^${childId}$`, 'i') } 
    });
    
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    
    res.json(profile);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// 11. UPDATE STUDENT PROFILE
app.put("/student-profile/:childId", async (req, res) => {
  try {
    const { childId } = req.params;
    const updateData = { ...req.body };

    delete updateData.childId;
    delete updateData._id;

    if (updateData.contactNumbers && typeof updateData.contactNumbers === 'string') {
        updateData.contactNumbers = updateData.contactNumbers.split(',').map(num => num.trim());
    }

    const updatedProfile = await StudentProfileModel.findOneAndUpdate(
      { childId: { $regex: new RegExp(`^${childId}$`, 'i') } },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ success: false, error: "Profile not found" });
    }

    res.json({ success: true, message: "Profile updated successfully!", profile: updatedProfile });

  } catch (err) {
    console.error("Error updating profile:", err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, error: errors.join(', ') });
    }
    
    res.status(500).json({ success: false, error: "Failed to update profile." });
  }
});


/* ================================
   EVENT MANAGEMENT API
================================ */

// 1. CREATE NEW EVENT
app.post("/events", async (req, res) => {
  try {
    const eventData = req.body;
    
    if (eventData.registrationDeadline === "") eventData.registrationDeadline = null;
    if (eventData.maxAttendees === "") eventData.maxAttendees = null;

    const requiredFields = ['eventName', 'eventType', 'eventDate', 'eventTime', 'venue', 'organizer'];
    for (const field of requiredFields) {
      if (!eventData[field]) {
        return res.status(400).json({ success: false, error: `${field} is required` });
      }
    }

    if (eventData.status === 'Upcoming') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventDate = new Date(eventData.eventDate);
      eventDate.setHours(0, 0, 0, 0);
      
      if (eventDate < today) {
        return res.status(400).json({ success: false, error: "Cannot create upcoming event with past date" });
      }
    }

    if (eventData.registrationDeadline && new Date(eventData.registrationDeadline) > new Date(eventData.eventDate)) {
      return res.status(400).json({ success: false, error: "Registration deadline must be on or before the event date" });
    }

    if (!eventData.eventId) {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const count = await EventModel.countDocuments();
      eventData.eventId = `EVT${year}${month}${(count + 1).toString().padStart(4, '0')}`;
    }

    const newEvent = new EventModel(eventData);
    await newEvent.save();

    res.status(201).json({ success: true, message: "Event created successfully!", event: newEvent });

  } catch (err) {
    console.error("Error creating event:", err);
    
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: "Event ID already exists. Please use a different ID." });
    }

    if (err.name === 'ValidationError' || err.name === 'CastError') {
      const errors = err.errors ? Object.values(err.errors).map(e => e.message).join(', ') : "Invalid data format.";
      return res.status(400).json({ success: false, error: errors });
    }

    res.status(500).json({ success: false, error: "Failed to create event. Please try again." });
  }
});

// 2. GET ALL EVENTS (with optional filters)
app.get("/events", async (req, res) => {
  try {
    const { status, type, fromDate, toDate } = req.query;
    let query = {};

    if (status) query.status = status;
    if (type) query.eventType = type;
    if (fromDate || toDate) {
      query.eventDate = {};
      if (fromDate) query.eventDate.$gte = new Date(fromDate);
      if (toDate) query.eventDate.$lte = new Date(toDate);
    }

    const events = await EventModel.find(query).sort({ eventDate: -1 });
    res.json(events);

  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// --- FIX: SPECIFIC EVENT ROUTES MUST GO ABOVE DYNAMIC /events/:eventId ---

// 3. GET TODAY'S EVENTS
app.get("/events/today/list", async (req, res) => {
  try {
    await EventModel.updateAllStatuses();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const events = await EventModel.find({
      eventDate: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ eventTime: 1 });

    res.json(events);

  } catch (err) {
    console.error("Error fetching today's events:", err);
    res.status(500).json({ error: "Failed to fetch today's events" });
  }
});

// 4. GET UPCOMING EVENTS
app.get("/events/upcoming/list", async (req, res) => {
  try {
    await EventModel.updateAllStatuses();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const events = await EventModel.find({
      eventDate: { $gte: tomorrow }, 
      status: { $in: ["Upcoming"] }
    }).sort({ eventDate: 1, eventTime: 1 });

    res.json(events);

  } catch (err) {
    console.error("Error fetching upcoming events:", err);
    res.status(500).json({ error: "Failed to fetch upcoming events" });
  }
});

// 5. GET PAST EVENTS
app.get("/events/past/list", async (req, res) => {
  try {
    await EventModel.updateAllStatuses();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = await EventModel.find({
      eventDate: { $lt: today },
      status: "Completed"
    }).sort({ eventDate: -1 });

    res.json(events);

  } catch (err) {
    console.error("Error fetching past events:", err);
    res.status(500).json({ error: "Failed to fetch past events" });
  }
});

// 6. GET EVENTS STATISTICS
app.get("/events/stats/summary", async (req, res) => {
  try {
    await EventModel.updateAllStatuses();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalCount,
      upcomingCount,
      todayCount,
      pastCount,
      ongoingCount
    ] = await Promise.all([
      EventModel.countDocuments(),
      EventModel.countDocuments({ 
        eventDate: { $gte: tomorrow },
        status: "Upcoming"
      }),
      EventModel.countDocuments({
        eventDate: {
          $gte: today,
          $lt: tomorrow
        }
      }),
      EventModel.countDocuments({ 
        eventDate: { $lt: today },
        status: "Completed"
      }),
      EventModel.countDocuments({ 
        eventDate: {
          $gte: today,
          $lt: tomorrow
        },
        status: "Ongoing"
      })
    ]);

    res.json({
      total: totalCount,
      upcoming: upcomingCount,
      today: todayCount,
      past: pastCount,
      ongoing: ongoingCount
    });

  } catch (err) {
    console.error("Error fetching event stats:", err);
    res.status(500).json({ error: "Failed to fetch event statistics" });
  }
});

// 7. GET EVENT BY ID (Catch-All route must go below specific routes)
app.get("/events/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await EventModel.findOne({ 
      eventId: { $regex: new RegExp(`^${eventId}$`, 'i') }
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json(event);

  } catch (err) {
    console.error("Error fetching event:", err);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

// 8. UPDATE EVENT
app.put("/events/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const updateData = req.body;
    
    if (updateData.status === 'Upcoming' && updateData.eventDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventDate = new Date(updateData.eventDate);
      eventDate.setHours(0, 0, 0, 0);
      
      if (eventDate < today) {
        return res.status(400).json({ success: false, error: "Cannot set upcoming event with past date" });
      }
    }

    if (updateData.registrationDeadline && updateData.eventDate) {
      if (new Date(updateData.registrationDeadline) > new Date(updateData.eventDate)) {
        return res.status(400).json({ success: false, error: "Registration deadline must be on or before the event date" });
      }
    }

    updateData.updatedAt = new Date();

    const updatedEvent = await EventModel.findOneAndUpdate(
      { eventId: { $regex: new RegExp(`^${eventId}$`, 'i') } },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }

    res.json({ success: true, message: "Event updated successfully!", event: updatedEvent });

  } catch (err) {
    console.error("Error updating event:", err);
    res.status(500).json({ success: false, error: "Failed to update event" });
  }
});

// 9. DELETE EVENT
app.delete("/events/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const deletedEvent = await EventModel.findOneAndDelete({ 
      eventId: { $regex: new RegExp(`^${eventId}$`, 'i') }
    });

    if (!deletedEvent) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }

    res.json({ success: true, message: "Event deleted successfully!" });

  } catch (err) {
    console.error("Error deleting event:", err);
    res.status(500).json({ success: false, error: "Failed to delete event" });
  }
});


/* ================================
   TEACHER MANAGEMENT API
================================ */

// 1. CREATE NEW TEACHER
app.post("/teachers", async (req, res) => {
  try {
    const teacherData = req.body;
    
    const requiredFields = ['teacherName', 'email', 'phoneNumber', 'dateOfBirth', 'gender', 
                            'address', 'qualification', 'specialization', 'experience', 
                            'employmentType', 'emergencyContact', 'username', 'password'];
    
    for (const field of requiredFields) {
      if (!teacherData[field]) {
        return res.status(400).json({ success: false, error: `${field} is required` });
      }
    }

    const existingUsername = await TeacherModel.findOne({ username: teacherData.username.toLowerCase() });
    if (existingUsername) {
      return res.status(400).json({ success: false, error: "Username already exists. Please choose a different username." });
    }

    const existingEmail = await TeacherModel.findOne({ email: teacherData.email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ success: false, error: "Email already exists. Please use a different email." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(teacherData.password, salt);
    teacherData.password = hashedPassword;

    if (!teacherData.teacherId) {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const count = await TeacherModel.countDocuments();
      teacherData.teacherId = `TCH${year}${(count + 1).toString().padStart(4, '0')}`;
    }

    if (!teacherData.assignedClasses) teacherData.assignedClasses = [];
    if (!teacherData.primaryClass) teacherData.primaryClass = { className: "", section: "" };

    const newTeacher = new TeacherModel(teacherData);
    await newTeacher.save();

    const teacherResponse = newTeacher.toObject();
    delete teacherResponse.password;

    res.status(201).json({ success: true, message: "Teacher created successfully!", teacher: teacherResponse });

  } catch (err) {
    console.error("Error creating teacher:", err);
    
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ success: false, error: `${field} already exists. Please use a different ${field}.` });
    }

    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, error: errors.join(', ') });
    }

    res.status(500).json({ success: false, error: "Failed to create teacher. Please try again." });
  }
});

// 2. GET ALL TEACHERS
app.get("/teachers", async (req, res) => {
  try {
    const { status, class: assignedClass } = req.query;
    let query = {};

    if (status) query.status = status;
    if (assignedClass) query["assignedClasses.className"] = assignedClass;

    const teachers = await TeacherModel.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(teachers);

  } catch (err) {
    console.error("Error fetching teachers:", err);
    res.status(500).json({ error: "Failed to fetch teachers data" });
  }
});

// --- FIX: SPECIFIC TEACHER ROUTES MUST GO ABOVE DYNAMIC /teachers/:teacherId ---

// 3. GET TEACHER STATISTICS
app.get("/teachers/stats/summary", async (req, res) => {
  try {
    const [
      totalTeachers, activeTeachers, onLeaveTeachers, lkgTeachers,
      ukgTeachers, daycareTeachers, nurseryTeachers, classTeachers
    ] = await Promise.all([
      TeacherModel.countDocuments(),
      TeacherModel.countDocuments({ status: "Active" }),
      TeacherModel.countDocuments({ status: "On Leave" }),
      TeacherModel.countDocuments({ "assignedClasses.className": "LKG" }),
      TeacherModel.countDocuments({ "assignedClasses.className": "UKG" }),
      TeacherModel.countDocuments({ "assignedClasses.className": "Daycare" }),
      TeacherModel.countDocuments({ "assignedClasses.className": "Nursery" }),
      TeacherModel.countDocuments({ "assignedClasses.isClassTeacher": true })
    ]);

    const allTeachers = await TeacherModel.find({}, { assignedClasses: 1 });
    const notAssignedTeachers = allTeachers.filter(t => !t.assignedClasses || t.assignedClasses.length === 0).length;

    res.json({
      total: totalTeachers,
      active: activeTeachers,
      onLeave: onLeaveTeachers,
      byClass: {
        lkg: lkgTeachers, ukg: ukgTeachers, daycare: daycareTeachers,
        nursery: nurseryTeachers, notAssigned: notAssignedTeachers
      },
      classTeachers: classTeachers
    });

  } catch (err) {
    console.error("Error fetching teacher stats:", err);
    res.status(500).json({ error: "Failed to fetch teacher statistics" });
  }
});

// 4. GET CLASS SUMMARY
app.get("/teachers/class-summary", async (req, res) => {
  try {
    const classes = ["LKG", "UKG", "Daycare", "Nursery"];
    const summary = [];

    for (const className of classes) {
      const teachers = await TeacherModel.find({
        "assignedClasses.className": className,
        status: "Active"
      }).select('teacherName assignedClasses');

      const classTeachers = teachers.filter(t => 
        t.assignedClasses.some(c => c.className === className && c.isClassTeacher)
      );

      const sections = {};
      teachers.forEach(teacher => {
        teacher.assignedClasses
          .filter(c => c.className === className)
          .forEach(c => {
            const section = c.section || 'No Section';
            if (!sections[section]) {
              sections[section] = { teachers: [], classTeacher: null };
            }
            sections[section].teachers.push(teacher.teacherName);
            if (c.isClassTeacher) {
              sections[section].classTeacher = teacher.teacherName;
            }
          });
      });

      summary.push({
        className,
        totalTeachers: teachers.length,
        classTeachers: classTeachers.length,
        sections: Object.keys(sections).map(key => ({
          section: key,
          teacherCount: sections[key].teachers.length,
          teachers: sections[key].teachers,
          classTeacher: sections[key].classTeacher || 'Not assigned'
        }))
      });
    }

    res.json({ success: true, summary });

  } catch (err) {
    console.error("Error fetching class summary:", err);
    res.status(500).json({ error: "Failed to fetch class summary" });
  }
});

// 5. GET TEACHERS BY CLASS
app.get("/teachers/class/:className", async (req, res) => {
  try {
    const { className } = req.params;
    const { section } = req.query;
    
    let query = {
      "assignedClasses.className": className,
      status: "Active"
    };
    
    if (section) query["assignedClasses.section"] = section;

    const teachers = await TeacherModel.find(query).select('-password');

    const classTeacherQuery = {
      "assignedClasses.className": className,
      "assignedClasses.isClassTeacher": true,
      status: "Active"
    };
    
    if (section) classTeacherQuery["assignedClasses.section"] = section;

    const classTeachers = await TeacherModel.find(classTeacherQuery).select('-password');

    res.json({
      success: true, teachers, classTeachers,
      totalCount: teachers.length, classTeacherCount: classTeachers.length
    });

  } catch (err) {
    console.error("Error fetching teachers by class:", err);
    res.status(500).json({ error: "Failed to fetch teachers" });
  }
});

// 6. BULK ASSIGN TEACHERS TO CLASS
app.post("/teachers/bulk-assign", async (req, res) => {
  try {
    const { className, section, teacherIds, isClassTeacher } = req.body;

    if (!className || !teacherIds || !Array.isArray(teacherIds)) {
      return res.status(400).json({ success: false, error: "Class name and teacher IDs array are required" });
    }

    const academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    const results = [];

    for (const teacherId of teacherIds) {
      try {
        const teacher = await TeacherModel.findOne({ 
          teacherId: { $regex: new RegExp(`^${teacherId}$`, 'i') }
        });

        if (teacher) {
          const alreadyAssigned = teacher.assignedClasses?.some(c => 
            c.className === className && c.section === (section || "")
          );
          
          if (!alreadyAssigned) {
            if (!teacher.assignedClasses) teacher.assignedClasses = [];
            
            teacher.assignedClasses.push({
              className, section: section || "", isClassTeacher: isClassTeacher || false,
              assignedDate: new Date(), academicYear
            });

            if (teacher.assignedClasses.length === 1) {
              teacher.primaryClass = { className, section: section || "" };
            }

            await teacher.save();
            results.push({ teacherId: teacher.teacherId, teacherName: teacher.teacherName, success: true, message: "Assigned successfully" });
          } else {
            results.push({ teacherId: teacher.teacherId, teacherName: teacher.teacherName, success: false, message: "Already assigned to this class" });
          }
        } else {
          results.push({ teacherId, success: false, message: "Teacher not found" });
        }
      } catch (err) {
        results.push({ teacherId, success: false, message: "Error assigning teacher" });
      }
    }

    res.json({ success: true, message: "Bulk assignment completed", results });

  } catch (err) {
    console.error("Error in bulk assignment:", err);
    res.status(500).json({ success: false, error: "Failed to perform bulk assignment" });
  }
});

// 7. GET TEACHER BY ID (Catch-All route must go BELOW specific routes)
app.get("/teachers/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const teacher = await TeacherModel.findOne({ 
      teacherId: { $regex: new RegExp(`^${teacherId}$`, 'i') }
    }).select('-password');

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    res.json(teacher);

  } catch (err) {
    console.error("Error fetching teacher:", err);
    res.status(500).json({ error: "Failed to fetch teacher" });
  }
});

// 8. UPDATE TEACHER
app.put("/teachers/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const updateData = { ...req.body };

    delete updateData.teacherId; delete updateData._id;
    delete updateData.password; delete updateData.createdBy;

    if (updateData.username) {
      const existingTeacher = await TeacherModel.findOne({
        username: updateData.username.toLowerCase(),
        teacherId: { $ne: teacherId }
      });
      if (existingTeacher) return res.status(400).json({ success: false, error: "Username already exists." });
    }

    if (updateData.email) {
      const existingTeacher = await TeacherModel.findOne({
        email: updateData.email.toLowerCase(),
        teacherId: { $ne: teacherId }
      });
      if (existingTeacher) return res.status(400).json({ success: false, error: "Email already exists." });
    }

    const updatedTeacher = await TeacherModel.findOneAndUpdate(
      { teacherId: { $regex: new RegExp(`^${teacherId}$`, 'i') } },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedTeacher) {
      return res.status(404).json({ success: false, error: "Teacher not found" });
    }

    res.json({ success: true, message: "Teacher updated successfully!", teacher: updatedTeacher });

  } catch (err) {
    console.error("Error updating teacher:", err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, error: errors.join(', ') });
    }
    res.status(500).json({ success: false, error: "Failed to update teacher" });
  }
});

// 9. DELETE TEACHER
app.delete("/teachers/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const deletedTeacher = await TeacherModel.findOneAndDelete({ 
      teacherId: { $regex: new RegExp(`^${teacherId}$`, 'i') }
    });

    if (!deletedTeacher) return res.status(404).json({ success: false, error: "Teacher not found" });

    res.json({ success: true, message: "Teacher deleted successfully!" });

  } catch (err) {
    console.error("Error deleting teacher:", err);
    res.status(500).json({ success: false, error: "Failed to delete teacher" });
  }
});

// 10. ASSIGN CLASSES TO TEACHER
app.post("/teachers/:teacherId/assign-classes", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { classes } = req.body;

    if (!classes || !Array.isArray(classes)) {
      return res.status(400).json({ success: false, error: "Classes array is required" });
    }

    const teacher = await TeacherModel.findOne({ 
      teacherId: { $regex: new RegExp(`^${teacherId}$`, 'i') }
    });

    if (!teacher) return res.status(404).json({ success: false, error: "Teacher not found" });

    const classTeacherCount = classes.filter(c => c.isClassTeacher).length;
    if (classTeacherCount > 1) {
      return res.status(400).json({ success: false, error: "Teacher can only be class teacher for one class" });
    }

    teacher.assignedClasses = classes.map(c => ({
      className: c.className, section: c.section || "", isClassTeacher: c.isClassTeacher || false,
      assignedDate: new Date(), academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
    }));

    const primaryClass = classes.find(c => c.isClassTeacher) || classes[0];
    if (primaryClass) {
      teacher.primaryClass = { className: primaryClass.className, section: primaryClass.section || "" };
    } else {
      teacher.primaryClass = { className: "", section: "" };
    }

    await teacher.save();

    const teacherResponse = teacher.toObject();
    delete teacherResponse.password;

    res.json({ success: true, message: "Classes assigned successfully!", teacher: teacherResponse });

  } catch (err) {
    console.error("Error assigning classes:", err);
    res.status(500).json({ success: false, error: "Failed to assign classes" });
  }
});

// 11. REMOVE TEACHER FROM CLASS
app.delete("/teachers/:teacherId/classes/:className", async (req, res) => {
  try {
    const { teacherId, className } = req.params;
    const { section } = req.query;

    const teacher = await TeacherModel.findOne({ 
      teacherId: { $regex: new RegExp(`^${teacherId}$`, 'i') }
    });

    if (!teacher) return res.status(404).json({ success: false, error: "Teacher not found" });

    teacher.assignedClasses = (teacher.assignedClasses || []).filter(c => 
      !(c.className === className && (!section || c.section === section))
    );

    if (teacher.primaryClass?.className === className && (!section || teacher.primaryClass?.section === section)) {
      teacher.primaryClass = teacher.assignedClasses[0] || { className: "", section: "" };
    }

    await teacher.save();

    const teacherResponse = teacher.toObject();
    delete teacherResponse.password;

    res.json({ success: true, message: "Teacher removed from class successfully!", teacher: teacherResponse });

  } catch (err) {
    console.error("Error removing teacher from class:", err);
    res.status(500).json({ success: false, error: "Failed to remove teacher from class" });
  }
});

// 12. UPDATE TEACHER'S CLASS ROLE
app.patch("/teachers/:teacherId/classes/:className/role", async (req, res) => {
  try {
    const { teacherId, className } = req.params;
    const { section, isClassTeacher } = req.body;

    const teacher = await TeacherModel.findOne({ 
      teacherId: { $regex: new RegExp(`^${teacherId}$`, 'i') }
    });

    if (!teacher) return res.status(404).json({ success: false, error: "Teacher not found" });

    const classIndex = (teacher.assignedClasses || []).findIndex(c => 
      c.className === className && (!section || c.section === section)
    );

    if (classIndex === -1) {
      return res.status(404).json({ success: false, error: "Teacher not assigned to this class" });
    }

    if (isClassTeacher) {
      teacher.assignedClasses.forEach((c, index) => {
        if (index !== classIndex) c.isClassTeacher = false;
      });
      teacher.primaryClass = { className, section: teacher.assignedClasses[classIndex].section || "" };
    }

    teacher.assignedClasses[classIndex].isClassTeacher = isClassTeacher;
    await teacher.save();

    const teacherResponse = teacher.toObject();
    delete teacherResponse.password;

    res.json({ success: true, message: `Teacher ${isClassTeacher ? 'set as' : 'removed as'} class teacher successfully`, teacher: teacherResponse });

  } catch (err) {
    console.error("Error updating teacher role:", err);
    res.status(500).json({ success: false, error: "Failed to update teacher role" });
  }
});

// 13. UPDATE TEACHER STATUS
app.patch("/teachers/:teacherId/status", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { status } = req.body;

    if (!status || !["Active", "On Leave", "Resigned", "Terminated", "Probation"].includes(status)) {
      return res.status(400).json({ success: false, error: "Valid status is required" });
    }

    const updatedTeacher = await TeacherModel.findOneAndUpdate(
      { teacherId: { $regex: new RegExp(`^${teacherId}$`, 'i') } },
      { $set: { status } },
      { new: true }
    ).select('-password');

    if (!updatedTeacher) return res.status(404).json({ success: false, error: "Teacher not found" });

    res.json({ success: true, message: "Teacher status updated successfully!", teacher: updatedTeacher });

  } catch (err) {
    console.error("Error updating teacher status:", err);
    res.status(500).json({ success: false, error: "Failed to update teacher status" });
  }
});

// 14. TEACHER LOGIN
app.post("/teacher-login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const teacher = await TeacherModel.findOne({ username: username.toLowerCase() });

    if (!teacher) return res.status(401).json({ error: "Invalid username or password" });

    const isMatch = await bcrypt.compare(password, teacher.password);
    
    if (!isMatch) return res.status(401).json({ error: "Invalid username or password" });

    const loginTime = new Date();
    await TeacherModel.updateOne({ _id: teacher._id }, { $set: { lastLogin: loginTime } });

    const teacherResponse = teacher.toObject();
    delete teacherResponse.password;

    res.json({ success: true, message: "Login successful", teacher: teacherResponse, lastLogin: loginTime });

  } catch (err) {
    console.error("Teacher login error:", err);
    res.status(500).json({ error: "Server error during login. Please try again." });
  }
});

// --- SERVER INITIALIZATION ---
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));