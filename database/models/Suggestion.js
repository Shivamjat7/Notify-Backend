const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  email: {
    type: String,
    required: true,
    trim: true
  },
  
  suggestion: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  }
});

module.exports = mongoose.model('Suggestion', suggestionSchema); 