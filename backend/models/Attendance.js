const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    date: { type: String, required: true }, // Format: "YYYY-MM-DD"
    
    status: { type: String, enum: ['Present', 'Absent', 'Late'], default: 'Present' },
    
    // PROOF DATA
    verificationMethod: { type: String, enum: ['Ultrasonic', 'Manual', 'FaceID'], default: 'Ultrasonic' },
    gpsLocation: { 
        latitude: Number, 
        longitude: Number 
    },
    deviceFingerprint: { type: String } // Must match User.deviceId
}, { timestamps: true });

// Prevent duplicate attendance for the same class on the same day
attendanceSchema.index({ student: 1, class: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);