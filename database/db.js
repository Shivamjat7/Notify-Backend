require('dotenv').config();
const mongoose = require('mongoose');

const connectToMONGO = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // Exit if connection fails
  }
};

module.exports = connectToMONGO;
