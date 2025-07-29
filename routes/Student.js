const express = require("express");
const Student = require("../database/models/Student");
const auth = require('../middleware/authMiddleware')
const router = express.Router();



router.put("/student/update/:id", async (req, res) => {
  try {
    const studentId = req.params.id;
    const existingStudent = await Student.findOne({ _id: studentId });
    if (!existingStudent)
      return res.json({ success: false, msg: "student not found" });
    const { name, email, password, semester, branch, batches } = req.body;
    const updated = await Student.findOneAndUpdate(
      { email },
      { $set: { name, email, password, semester, branch, batches } },
      { new: true }
    );
    res.status(200).json({ success: true, updated });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Server error", error: error.message });
  }
});


router.get("/student/fetchallstudent", async (req, res) => {
  try {
    const allStudents = await Student.find();
    res.status(200).json({ success: true, allStudents });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Server error", error: error.message });
  }
});

router.get("/student/fetchstudent", auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await Student.findById(studentId);
    if (!student) return res.json({ success: false, msg: "student not found" });
    res.status(200).json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Server error", error: error.message });
  }
});

router.put('/student/attendance', auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await Student.findById(studentId);
    if (!student) return res.json({ success: false, msg: "student not found" });

    const { subject, status } = req.body;
    const today = new Date().toISOString().slice(0, 10);

    if (!student.attendance.has(subject)) {
      student.attendance.set(subject, []);
    }

    student.attendance.get(subject).push({ date: today, status });

    await student.save();

    res.status(200).json({ success: true, updated: student });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Server error", error: error.message });
  }
});

router.post('/student/attendance/get', auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { subject } = req.body;

    const existingStudent = await Student.findById(studentId);
    if (!existingStudent)
      return res.json({ success: false, msg: "student not found" });

    const attendance = existingStudent.attendance.get(subject);

    res.status(200).json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Server error", error: error.message });
  }
});




module.exports = router;
