// models/Student.js

const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  phone: {
    type: String // optional if you still want SMS later
  },

  branch: {
    type: String,
    required: true
  },

  semester: {
    type: Number,
    required: true
  },

  batches: {
    type: [String],
    required: true
  },

  attendance: {
    type: Map,
    of: [mongoose.Schema.Types.Mixed], 
    default: {}
    // Example: { "Data Structures": [1,0,"_",1] }
  },

  lastAbsentMailDate: {
    type: String // "YYYY-MM-DD" to prevent duplicate daily emails
  }
});

module.exports = mongoose.model('Student', studentSchema);
