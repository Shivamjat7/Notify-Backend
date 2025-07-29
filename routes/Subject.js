const express = require("express");
const Subject = require("../database/models/Subject");
const Student = require("../database/models/Student");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
// add new subject
router.post("/subject/new", async (req, res) => {
  try {
    const { name, code, branch, semester, type, batches, professor, schedule } =
      req.body;
    const subject = await Subject({
      name,
      code,
      branch,
      semester,
      type,
      batches,
      professor,
      schedule,
    });
    await subject.save();
    res.status(201).json({ sucess: true, subject });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, msg: "Server error", error: error.message });
  }
});
// get subject by subject id
router.get("/subject/:id", auth, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    res.status(201).json({ sucess: true, subject });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, msg: "Server error", error: error.message });
  }
});
// subject by day
router.get("/subject/get/:day", auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const day = req.params.day;

    if (!studentId || !day) {
      return res
        .status(400)
        .json({ success: false, message: "studentId and day are required" });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    const subjects = await Subject.find({
      semester: student.semester,
      branch: student.branch.toUpperCase(),
      batch: { $in: student.batches },
      [`schedule.${day}`]: { $exists: true },
    });

    // const today = new Date().toISOString().slice(0, 10);

    // const filteredSubjects = subjects.filter((s) => {
    //   const attendanceArray = student.attendance?.get(s.name) || [];
    //   return !attendanceArray.some((a) => a.date === today);
    // });

    const formatted = subjects.map((subj) => ({
      id: subj._id,
      subject: subj.name,
      time: subj.schedule.get(day)?.time || "No time",
      location: subj.schedule.get(day)?.location || "No location",
      type: subj.type,
    }));

    res.status(200).json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching subjects", err: err.message });
  }
});
//schedule 
router.post("/schedule", auth, async (req, res) => {
  const { branch, semester, batch } = req.body;
  const schedule = [];
  const Days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  for (const day of Days) {
  
    const subjects = await Subject.find({
      semester,
      branch,
      batch,
      [`schedule.${day}`]: { $exists: true },
    });
    
     const formatted = subjects.map((subj) => ({
      id: subj._id,
      subject: subj.name,
      time: subj.schedule.get(day)?.time || "No time",
      location: subj.schedule.get(day)?.location || "No location",
      type: subj.type,
    }));
    schedule.push(formatted);

  }
  res.status(200).json(schedule)
});

module.exports = router;
