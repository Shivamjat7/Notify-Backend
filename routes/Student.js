const express = require("express");
const Student = require("../database/models/Student");
const auth = require('../middleware/authMiddleware')
const router = express.Router();



router.put("/student/updatedetails",auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const existingStudent = await Student.findById(studentId);

    if (!existingStudent) {
      return res.status(404).json({ success: false, msg: "Student not found" });
    }

    const { name, password, semester, branch, batch,profileImage } = req.body;

    // Prepare updated fields
    const updateData = { name, semester, branch, batches: batch ,profileImage};

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updated = await Student.findByIdAndUpdate(
      studentId,
      { $set: updateData },
      { new: true }
    );

    res.status(200).json({ success: true, updated });
  } catch (error) {
    console.error("Update error:", error);
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

// New endpoint to get attendance statistics
router.get('/student/attendance/stats', auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({ success: false, msg: "Student not found" });
    }

    // Get current date and week info
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDayName = daysOfWeek[currentDay];
    
    // Get student's subjects for the current week
    const Subject = require('../database/models/Subject');
    const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    
    let upcomingClasses = 0;
    let attendedClasses = 0;
    let notAttendedClasses = 0;
    
    // Get today's date in YYYY-MM-DD format
    const todayString = today.toISOString().slice(0, 10);
    
    // Calculate upcoming classes for the rest of the week
    for (let i = 0; i < weekDays.length; i++) {
      const dayName = weekDays[i];
      const dayIndex = daysOfWeek.indexOf(dayName);
      
      // Skip past days
      if (dayIndex < currentDay) continue;
      
      // Get subjects for this day
      const subjects = await Subject.find({
        semester: student.semester,
        branch: student.branch.toUpperCase(),
        batch: { $in: student.batches },
        [`schedule.${dayName}`]: { $exists: true },
      });
      
      if (dayIndex === currentDay) {
        // For today, check if attendance is already marked
        subjects.forEach(subject => {
          const attendanceArray = student.attendance.get(subject.name) || [];
          const todayAttendance = attendanceArray.find(a => a.date === todayString);
          
          if (todayAttendance) {
            if (todayAttendance.status) {
              attendedClasses++;
            } else {
              notAttendedClasses++;
            }
          } else {
            // Check if class time has passed
            const classTime = subject.schedule.get(dayName)?.time;
            if (classTime) {
              const [startTime] = classTime.split(' - ');
              const [time, period] = startTime.split(' ');
              const [hours, minutes] = time.split(':').map(Number);
              let classHour = hours;
              if (period.toLowerCase() === 'pm' && hours !== 12) classHour += 12;
              if (period.toLowerCase() === 'am' && hours === 12) classHour = 0;
              
              const classDateTime = new Date(today);
              classDateTime.setHours(classHour, minutes, 0, 0);
              
              // Add 55 minutes to class time to account for class duration
              const classEndTime = new Date(classDateTime);
              classEndTime.setMinutes(classEndTime.getMinutes() + 55);
              
              if (today > classEndTime) {
                // Class time has passed but no attendance marked
                notAttendedClasses++;
              } else if (today >= classDateTime) {
                // Class is currently happening
                upcomingClasses++;
              } else {
                // Class is upcoming today
                upcomingClasses++;
              }
            } else {
              upcomingClasses++;
            }
          }
        });
      } else {
        // Future days - all classes are upcoming
        upcomingClasses += subjects.length;
      }
    }
    
    res.status(200).json({
      success: true,
      stats: {
        upcoming: upcomingClasses,
        attended: attendedClasses,
        notAttended: notAttendedClasses
      }
    });
    
  } catch (error) {
    console.error("Error getting attendance stats:", error);
    res.status(500).json({ success: false, msg: "Server error", error: error.message });
  }
});

// New endpoint to get today's classes with detailed information
router.get('/student/today-classes', auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({ success: false, msg: "Student not found" });
    }

    const today = new Date();
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDayName = daysOfWeek[today.getDay()];
    const todayString = today.toISOString().slice(0, 10);
    
    const Subject = require('../database/models/Subject');
    
    // Get today's subjects
    const subjects = await Subject.find({
      semester: student.semester,
      branch: student.branch.toUpperCase(),
      batch: { $in: student.batches },
      [`schedule.${currentDayName}`]: { $exists: true },
    });
    
    const todayClasses = subjects.map(subject => {
      const attendanceArray = student.attendance.get(subject.name) || [];
      const todayAttendance = attendanceArray.find(a => a.date === todayString);
      const classTime = subject.schedule.get(currentDayName)?.time;
      const location = subject.schedule.get(currentDayName)?.location;
      
      let status = 'upcoming';
      let timeStatus = 'upcoming';
      
      if (todayAttendance) {
        status = todayAttendance.status ? 'attended' : 'not_attended';
        timeStatus = 'completed';
      } else if (classTime) {
        const [startTime] = classTime.split(' - ');
        const [time, period] = startTime.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let classHour = hours;
        if (period.toLowerCase() === 'pm' && hours !== 12) classHour += 12;
        if (period.toLowerCase() === 'am' && hours === 12) classHour = 0;
        
        const classDateTime = new Date(today);
        classDateTime.setHours(classHour, minutes, 0, 0);
        
        const classEndTime = new Date(classDateTime);
        classEndTime.setMinutes(classEndTime.getMinutes() + 55);
        
        if (today > classEndTime) {
          status = 'not_attended';
          timeStatus = 'missed';
        } else if (today >= classDateTime) {
          status = 'upcoming';
          timeStatus = 'ongoing';
        } else {
          status = 'upcoming';
          timeStatus = 'upcoming';
        }
      }
      
      return {
        id: subject._id,
        name: subject.name,
        time: classTime,
        location: location,
        type: subject.type,
        status: status,
        timeStatus: timeStatus
      };
    });
    
    // Sort by time
    todayClasses.sort((a, b) => {
      if (!a.time || !b.time) return 0;
      const getMinutes = (timeStr) => {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier.toLowerCase() === 'pm' && hours !== 12) hours += 12;
        if (modifier.toLowerCase() === 'am' && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };
      return getMinutes(a.time) - getMinutes(b.time);
    });
    
    res.status(200).json({
      success: true,
      classes: todayClasses
    });
    
  } catch (error) {
    console.error("Error getting today's classes:", error);
    res.status(500).json({ success: false, msg: "Server error", error: error.message });
  }
});


module.exports = router;
