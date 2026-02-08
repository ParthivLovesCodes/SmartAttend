const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },

    // Student Specifics
    enrollmentNumber: { type: String, unique: true, sparse: true }, 
    department: { type: String }, 
    semester: { type: Number },

    // SECURITY: Lock account to one phone
    deviceId: { type: String, default: null }, 
    
    // DASHBOARD STATS (Fast Access)
    attendanceScore: { type: Number, default: 0 } // Percentage
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);