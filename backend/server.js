require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const classRoutes = require('./routes/class'); // <--- IMPORT THIS

// 1. App Config
const app = express();
app.use(cors());
app.use(express.json());

// 2. Create HTTP Server & Socket Server
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // React Frontend URL
        methods: ["GET", "POST"]
    }
});

// 3. Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// 3. Database Connection (Placeholder)
// mongoose.connect(process.env.MONGO_URI);

// 4. Socket.io Logic (The Real-Time Magic)
io.on('connection', (socket) => {
    console.log('User Connected:', socket.id);

    // Event: Student Joins a Class Session
    socket.on('join_session', (sessionId) => {
        socket.join(sessionId);
        console.log(`Socket ${socket.id} joined session ${sessionId}`);
    });

    // Event: Student Marks Attendance
    socket.on('mark_attendance', (data) => {
        console.log("Attendance Request:", data);
        
        // TODO: Save to MongoDB here
        
        // Notify the Teacher (in the same room)
        io.to(data.sessionId).emit('attendance_update', {
            studentName: data.name,
            status: "Present"
        });
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected:', socket.id);
    });
});

// 5. Start Server
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/class', classRoutes);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});