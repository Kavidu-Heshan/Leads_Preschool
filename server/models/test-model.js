const mongoose = require('mongoose');
require('dotenv').config();

const TeacherModel = require('./models/Teacher.js');

console.log('TeacherModel type:', typeof TeacherModel);
console.log('TeacherModel.find type:', typeof TeacherModel.find);
console.log('TeacherModel.countDocuments type:', typeof TeacherModel.countDocuments);

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    
    try {
      // Test find
      const teachers = await TeacherModel.find();
      console.log('Find successful, teachers count:', teachers.length);
      
      // Test countDocuments
      const count = await TeacherModel.countDocuments();
      console.log('Count successful:', count);
      
    } catch (err) {
      console.error('Error:', err);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });