const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Links to the Student
        required: true
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class', // <--- IMPORTANT: This must match the model name in ClassSession.js
        required: true
    },
    sessionId: { 
        type: String, 
        required: true // This locks the attendance to ONE specific class instance
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Present', 'Late', 'Absent'],
        default: 'Present'
    },
    // We will use these in Week 5 (GPS Security)
    location: {
        latitude: Number,
        longitude: Number
    },
    deviceFingerprint: String
});

module.exports = mongoose.model('Attendance', AttendanceSchema);