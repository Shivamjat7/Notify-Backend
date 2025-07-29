const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const Student = require("../database/models/Student");

// register route:
router.post("/auth/signup", async (req, res) => {
  try {
    const { name, email, password, semester, branch, batches } = req.body;
    const existingStudent = await Student.findOne({ email });
    if (existingStudent)
      return res.json({ success: false, msg: "student already exits" });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const newStudent = await Student.create({
      name,
      email,
      password: hashed,
      semester,
      branch,
      batches,
    });
    const payload = {id: newStudent._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET);

    res.status(200).json({ success: true, token });
  } catch (err) {
    res.status(500).json({ sucess: false, err: err.message });
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
