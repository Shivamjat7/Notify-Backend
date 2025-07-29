const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

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
