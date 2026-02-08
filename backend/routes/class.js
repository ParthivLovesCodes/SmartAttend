const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const auth = require('../middleware/auth'); // We need to create this middleware next!

// 1. TEACHER: START A CLASS SESSION
// (For this demo, we will just update a "Global" class for simplicity)
let GLOBAL_SESSION = {
    isActive: false,
    code: "0000",
    teacherId: null
};

router.post('/start', async (req, res) => {
    const { code, teacherId } = req.body;
    GLOBAL_SESSION = { isActive: true, code, teacherId };
    console.log("📢 CLASS STARTED! Code:", code);
    res.json({ msg: "Class started successfully" });
});

router.post('/update-code', async (req, res) => {
    const { code } = req.body;
    if (GLOBAL_SESSION.isActive) {
        GLOBAL_SESSION.code = code;
        console.log("🔄 CODE ROTATED:", code);
    }
    res.json({ msg: "Code updated" });
});

router.post('/stop', async (req, res) => {
    GLOBAL_SESSION.isActive = false;
    console.log("🛑 CLASS STOPPED");
    res.json({ msg: "Class stopped" });
});

// 2. STUDENT: MARK ATTENDANCE
router.post('/mark', async (req, res) => {
    const { studentId, code, location } = req.body;

    console.log(`📩 Attendance Request: Student ${studentId} entered ${code}`);

    // CHECK 1: Is class active?
    if (!GLOBAL_SESSION.isActive) {
        return res.status(400).json({ msg: "No active class found!" });
    }

    // CHECK 2: Is code correct?
    if (code !== GLOBAL_SESSION.code) {
        return res.status(400).json({ msg: "Incorrect PIN! Look at the screen." });
    }

    // CHECK 3: (Optional) GPS Logic would go here

    // SUCCESS: Save to DB
    // (For now, we just log it to prove it works)
    console.log("✅ ATTENDANCE SAVED for Student ID:", studentId);

    // In a real app, you would do:
    // const newAttendance = new Attendance({ student: studentId, status: 'Present' });
    // await newAttendance.save();

    res.json({ msg: "Attendance Marked Successfully!", status: "Present" });
});

module.exports = router;