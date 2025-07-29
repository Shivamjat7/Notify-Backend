const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  branch: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['lecture', 'practical', 'tutorial'],
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  professor: {
    type: String,
    required: true
  },
  batch: {
    type: [String],
    required: true
  },
  schedule: {
    type: Map,
    of: {
      time: String,
      location: String
    },
    default: {}
  }
});

module.exports = mongoose.model('Subject', subjectSchema);
