const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Student = require('../database/models/Student');

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

// Get remaining cooldown time
function getRemainingCooldown(lastOTPSent) {
  if (!lastOTPSent) return 0;
  
  const now = new Date();
  const timeDiff = now.getTime() - lastOTPSent.getTime();
  const secondsDiff = Math.floor(timeDiff / 1000);
  
  return Math.max(0, 60 - secondsDiff);
}

// Send OTP email
router.post('/email/send-otp', async (req, res) => {
  const { email } = req.body;

  try {
    // Check if user exists
    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }

    // Check cooldown
    if (!canSendOTP(student.lastOTPSent)) {
      const remainingTime = getRemainingCooldown(student.lastOTPSent);
      return res.status(429).json({ 
        success: false, 
        msg: `Please wait ${remainingTime} seconds before requesting another OTP`,
        remainingTime: remainingTime
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    student.otp = {
      code: otp,
      expiresAt: expiresAt
    };
    student.lastOTPSent = new Date();
    await student.save();

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Hello ${student.name},</p>
          <p>Your verification code is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <p>Best regards,<br>Notify Team</p>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({ success: true, msg: 'OTP sent successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Error sending OTP', err: err.message });
  }
});

// Verify OTP
router.post('/email/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
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

    res.json({ success: true, msg: 'Email verified successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Error verifying OTP', err: err.message });
  }
});

// Resend OTP
router.post('/email/resend-otp', async (req, res) => {
  const { email } = req.body;

  try {
    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }

    // Check cooldown
    if (!canSendOTP(student.lastOTPSent)) {
      const remainingTime = getRemainingCooldown(student.lastOTPSent);
      return res.status(429).json({ 
        success: false, 
        msg: `Please wait ${remainingTime} seconds before requesting another OTP`,
        remainingTime: remainingTime
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save new OTP to database
    student.otp = {
      code: otp,
      expiresAt: expiresAt
    };
    student.lastOTPSent = new Date();
    await student.save();

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'New Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Hello ${student.name},</p>
          <p>Your new verification code is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <p>Best regards,<br>Notify Team</p>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({ success: true, msg: 'New OTP sent successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Error sending OTP', err: err.message });
  }
});

// Get remaining cooldown time
router.get('/email/cooldown/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const student = await Student.findOne({ email });
    
    if (!student) {
      return res.status(404).json({ success: false, msg: 'Student not found' });
    }

    const remainingTime = getRemainingCooldown(student.lastOTPSent);
    res.json({ 
      success: true, 
      remainingTime: remainingTime,
      canSend: remainingTime === 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Error checking cooldown', err: err.message });
  }
});

// Original email send route
router.post('/email/send', async (req, res) => {
  const { to, subject, text } = req.body;

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,           // e.g. 'someone@example.com'
      subject,      // e.g. 'Hello!'
      text,         // e.g. 'This is a test email.'
    };

    // Send it!
    await transporter.sendMail(mailOptions);

    res.json({ msg: 'Email sent successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error sending email', err: err.message });
  }
});

module.exports = router;
