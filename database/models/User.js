const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  phone: {
    type: String,
  },

  branch: {
    type: String,
  },

  semester: {
    type: Number,
  },
});

module.exports = mongoose.model("user", userSchema);
