const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const User = require('../models/User');


// --- FIX: RENAME VARIABLE TO AVOID CONFLICT ---
const ClassModel = require('../models/ClassSession'); 
const Attendance = require('../models/Attendance');
module.exports = function(io){
    // 1. TEACHER: GET OR CREATE A DEFAULT CLASS
// 1. TEACHER: GET CLASS INFO & ACTIVE ATTENDEES
router.get('/my-class', auth, async (req, res) => {
    try {
        console.log("🔍 Debug: User ID is", req.user.id);

        let classSession = await ClassModel.findOne({ teacher: req.user.id });
        let currentAttendees = []; // Initialize empty list

        // --- PART A: AUTO-CREATE CLASS (Your Existing Logic) ---
        if (!classSession) {
            console.log("⚠️ No class found. Creating a new one...");
            classSession = new ClassModel({
                name: "Computer Networks",
                subjectCode: "CS-302",
                teacher: req.user.id,
                location: { latitude: 0, longitude: 0, radius: 50 },
                activeSession: {
                    isActive: false,
                    sessionId: null,
                    currentVisualCode: "0000"
                }
            });
            await classSession.save();
            console.log("✅ New Class Created Successfully!");
        } else {
            console.log("✅ Existing Class Found:", classSession.name);
        }

        // --- PART B: THE NEW FIX (Fetch Attendees if Active) ---
        // If the class is currently running, go get the list of students!
        if (classSession.activeSession && classSession.activeSession.isActive) {
            console.log("📡 Session is Active. Fetching students...");
            
            currentAttendees = await Attendance.find({ 
                sessionId: classSession.activeSession.sessionId 
            })
            .populate('student', 'name enrollmentNumber') // Get names, not just IDs
            .sort({ date: -1 }); // Show newest on top
            
            console.log(`Found ${currentAttendees.length} active students.`);
        }
        // -------------------------------------------------------

        // Return Class Data + The Student List
        res.json({ 
            ...classSession.toObject(), 
            currentAttendees 
        });

    } catch (err) {
        console.error("❌ ERROR in /my-class:", err); 
        res.status(500).send('Server Error');
    }
});

// 2. TEACHER: START CLASS
router.post('/start', auth, async (req, res) => {
    const { classId, code } = req.body;

    try {
        let classSession = await ClassModel.findById(classId);
        
        if (!classSession) return res.status(404).json({ msg: "Class not found" });

        classSession.activeSession = {
            isActive: true,
            sessionId: new Date().getTime().toString(),
            startTime: Date.now(),
            currentVisualCode: code
        };

        await classSession.save();
        console.log(`📢 Class Started! Code: ${code}`);
        res.json({ msg: "Class Started", session: classSession.activeSession });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 5. STUDENT: JOIN A CLASS PERMANENTLY
router.post('/join', auth, async (req, res) => {
    const { classId } = req.body;
    const studentId = req.user.id;

    // 1. Validate Input
    if (!classId) {
        return res.status(400).json({ msg: "Class ID is required" });
    }

    // 2. Validate MongoDB ID Format (Prevents the crash!)
    if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({ msg: "Invalid Class ID. It should be a long string like '65d4...' " });
    }

    try {
        const classToJoin = await ClassModel.findById(classId);
        if (!classToJoin) return res.status(404).json({ msg: "Class not found" });

        // 3. Check if already enrolled
        // Note: We use .includes() with toString() to be safe with ObjectIds
        if (classToJoin.students.some(id => id.toString() === studentId)) {
            return res.status(400).json({ msg: "You are already enrolled in this class!" });
        }

        // 4. Add to list
        classToJoin.students.push(studentId);
        await classToJoin.save();

        res.json({ msg: "Enrolled Successfully!", className: classToJoin.name });

    } catch (err) {
        console.error("Join Error:", err.message);
        res.status(500).send("Server Error");
    }
});

// 3. TEACHER: UPDATE CODE
router.post('/update-code', auth, async (req, res) => {
    const { classId, code } = req.body;
    try {
        let classSession = await ClassModel.findById(classId);
        if (classSession && classSession.activeSession.isActive) {
            classSession.activeSession.currentVisualCode = code;
            await classSession.save();
            res.json({ msg: "Code Updated" });
        }
    } catch (err) {
        console.error(err);
    }
});

// ... your existing update-code route is above this ...

// 4. TEACHER: STOP CLASS (Add this NEW route)
router.post('/stop', auth, async (req, res) => {
    const { classId } = req.body;

    try {
        let classSession = await ClassModel.findById(classId);

        // Security: Check if class exists and belongs to this teacher
        if (!classSession) return res.status(404).json({ msg: "Class not found" });
        if (classSession.teacher.toString() !== req.user.id) {
            return res.status(401).json({ msg: "Not authorized" });
        }

        // --- THE FIX: Turn off the active session in DB ---
        classSession.activeSession.isActive = false;
        classSession.activeSession.currentVisualCode = null; // Clear the code
        
        await classSession.save();
        res.json({ msg: "Class Session Stopped" });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// 4. STUDENT: MARK ATTENDANCE (Updated for Session Logic)
router.post('/mark', auth, async (req, res) => {
    const { code } = req.body;
    const studentId = req.user.id;

    try {
        // 1. Security Check: Teachers cannot mark attendance
        if (req.user.role === 'teacher') {
            return res.status(403).json({ msg: "Teachers cannot mark attendance!" });
        }

        // 2. Find the Active Class matching the Code
        const activeClass = await ClassModel.findOne({ 
            "activeSession.isActive": true,
            "activeSession.currentVisualCode": code 
        });

        if (!activeClass) {
            return res.status(400).json({ msg: "Invalid Code or Class Not Active!" });
        }

        if (!activeClass.students.includes(studentId)) {
            return res.status(403).json({ msg: "ACCESS DENIED: You are not enrolled in this class." });
        }

        // --- THE FIX: CHECK BY SESSION ID (Not Date) ---
        // We check if the student has already marked attendance for THIS specific session fingerprint.
        const existingRecord = await Attendance.findOne({
            student: studentId,
            sessionId: activeClass.activeSession.sessionId 
        });

        if (existingRecord) {
            // Updated error message
            return res.status(400).json({ msg: "Attendance already marked for this session!" });
        }
        // ------------------------------------------------

        // 3. Create the Record (Make sure to SAVE the sessionId!)
        const newAttendance = new Attendance({
            student: studentId,
            classId: activeClass._id,
            sessionId: activeClass.activeSession.sessionId, // <--- CRITICAL: Save the ID
            status: 'Present'
        });

        await newAttendance.save();
        console.log(`✅ Attendance Saved for Student ${studentId}`);

        // 4. Real-Time Update (Socket.io)
        await newAttendance.populate('student', 'name enrollmentNumber');
        io.to(activeClass._id.toString()).emit('new_attendance', newAttendance);

        res.json({ msg: "Attendance Marked Successfully!", class: activeClass.name });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// 5. STUDENT: GET MY ATTENDANCE HISTORY
router.get('/student-history', auth, async (req, res) => {
    try {
        const studentId = req.user.id;

        // Find all attendance records for this student
        const history = await Attendance.find({ student: studentId })
            .populate('classId', 'name subjectCode') // <--- MAGIC: Fills in the Class Name automatically!
            .sort({ date: -1 }); // Sort by Newest First

        res.json(history);

    } catch (err) {
        console.error("History Error:", err.message);
        res.status(500).send('Server Error');
    }
});

// 6. TEACHER: GET CLASS HISTORY (Sorted Register)
router.get('/teacher-history', auth, async (req, res) => {
    try {
        const classSession = await ClassModel.findOne({ teacher: req.user.id });
        if (!classSession) return res.status(404).json({ msg: "Class not found" });

        // Populate 'student' details including the new 'enrollmentNumber'
        const history = await Attendance.find({ classId: classSession._id })
            .populate('student', 'name enrollmentNumber role') 
            .sort({ date: -1 });
        // Safer Filter: Checks if student exists first
        const studentOnlyHistory = history.filter(record => 
            record.student && record.student.role === 'student'
        );
        res.json(studentOnlyHistory);

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
return router;
}
