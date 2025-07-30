const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const Student = require("../database/models/Student");
const nodemailer = require("nodemailer");

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Check if enough time has passed since last OTP
function canSendOTP(lastOTPSent) {
  if (!lastOTPSent) return true;
  
  const now = new Date();
  const timeDiff = now.getTime() - lastOTPSent.getTime();
  const secondsDiff = Math.floor(timeDiff / 1000);
  
  return secondsDiff >= 60; // 60 seconds cooldown
}

// Validate email domain
function validateEmailDomain(email) {
  const allowedDomain = '@mnit.ac.in';
  return email.toLowerCase().endsWith(allowedDomain);
}

// register route:
router.post("/auth/signup", async (req, res) => {
  try {
    const { name, email, password, semester, branch, batch } = req.body;
    
    // Validate email domain
    if (!validateEmailDomain(email)) {
      return res.status(400).json({ 
        success: false, 
        msg: "Only @mnit.ac.in email addresses are allowed for registration" 
      });
    }

    const existingStudent = await Student.findOne({ email });
    if (existingStudent)
      return res.json({ success: false, msg: "student already exits" });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const newStudent = await Student.create({
      name,
      email,
      password: hashed,
      semester,
      branch,
      batches: batch,
      otp: {
        code: otp,
        expiresAt: expiresAt
      },
      lastOTPSent: new Date()
    });

    // Send OTP email
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Email Verification OTP',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to Notify!</h2>
            <p>Hello ${name},</p>
            <p>Thank you for signing up! Please verify your email address using the code below:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't create this account, please ignore this email.</p>
            <p>Best regards,<br>Notify Team</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue with registration even if email fails
    }

    res.status(200).json({ 
      success: true, 
      msg: "Registration successful! Please check your email for verification code.",
      email: email 
    });
  } catch (err) {
    res.status(500).json({ success: false, err: err.message });
  }
});

// Verify email and complete registration
router.post("/auth/verify-email", async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }

    // Check if OTP exists and is not expired
    if (!student.otp || !student.otp.code || !student.otp.expiresAt) {
      return res.status(400).json({ success: false, msg: 'No OTP found' });
    }

    if (new Date() > student.otp.expiresAt) {
      return res.status(400).json({ success: false, msg: 'OTP has expired' });
    }

    if (student.otp.code !== otp) {
      return res.status(400).json({ success: false, msg: 'Invalid OTP' });
    }

    // Mark email as verified
    student.isEmailVerified = true;
    student.otp = undefined; // Clear OTP after successful verification
    await student.save();

    // Generate JWT token
    const payload = { id: student._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET);

    res.json({ 
      success: true, 
      msg: 'Email verified successfully!',
      token 
    });
  } catch (err) {
    res.status(500).json({ success: false, err: err.message });
  }
});

//Lofin route:
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const student = await Student.findOne({ email });
    if (!student) return res.status(400).json({ msg: "invalid credential" });

    const isMatched = await bcrypt.compare(password, student.password);
    if (!isMatched) return res.status(400).json({ msg: "invalid credential" });

    // Check if email is verified
    if (!student.isEmailVerified) {
      return res.status(400).json({ 
        success: false, 
        msg: "Please verify your email before logging in",
        needsVerification: true,
        email: email
      });
    }

    const payload = { id: student._id };
    const token =  jwt.sign(payload, process.env.JWT_SECRET);

    res
      .status(201)
      .json({ succes: true, token, msg: "login successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error logging in', err });
  }
});

module.exports = router;
