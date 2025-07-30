const express = require('express');
const router = express.Router();
const Suggestion = require('../database/models/Suggestion');
const Student = require('../database/models/Student');
const auth = require('../middleware/authMiddleware');

// POST - Submit a new suggestion (from About page)
router.post('/services/suggestions', auth, async (req, res) => {
  try {
    const { suggestion } = req.body;
    
    // Get user info from database using the user ID from auth middleware
    const user = await Student.findById(req.user.id).select('name email');
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    // Validate suggestion text
    if (!suggestion || !suggestion.trim()) {
      return res.status(400).json({
        success: false,
        msg: 'Suggestion text is required'
      });
    }

    // Validate suggestion length
    if (suggestion.length > 1000) {
      return res.status(400).json({
        success: false,
        msg: 'Suggestion must be less than 1000 characters'
      });
    }

    // Create new suggestion
    const newSuggestion = new Suggestion({
      name: user.name,
      email: user.email,
      suggestion: suggestion.trim()
    });

    await newSuggestion.save();

    res.status(201).json({
      success: true,
      msg: 'Thanks for your suggestion!'
    });

  } catch (error) {
    console.error('Error submitting suggestion:', error);
    res.status(500).json({
      success: false,
      msg: 'Error submitting suggestion',
      error: error.message
    });
  }
});



module.exports = router; 