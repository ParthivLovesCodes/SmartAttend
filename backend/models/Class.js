const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g., "Data Structures"
    subjectCode: { type: String, required: true }, // e.g., "CS-302"
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Who is enrolled?
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
    
    // SECURITY: Geofence Coordinates (Where is this class held?)
    location: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        radius: { type: Number, default: 50 } // meters
    },

    // Session Management
    activeSession: {
        sessionId: String, // Random Token
        startTime: Date,
        isActive: { type: Boolean, default: false },
        currentVisualCode: String // The 4-digit PIN on the board
    }
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);