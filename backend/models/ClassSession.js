const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    name: { type: String, required: true },
    subjectCode: { type: String, required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Who is enrolled?
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
    
    // SECURITY: Geofence (Made optional for now)
    location: {
        latitude: { type: Number }, // Removed 'required'
        longitude: { type: Number }, // Removed 'required'
        radius: { type: Number, default: 50 }
    },

    // Session Management (The "Live" Switch)
    activeSession: {
        sessionId: String, // Random Token
        startTime: Date,
        isActive: { type: Boolean, default: false },
        currentVisualCode: String 
    }
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);