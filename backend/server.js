require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const connectDB = require('./config/db'); // Ensure this matches your file path

const app = express();
const server = http.createServer(app);

// 1. SETUP SOCKET.IO
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Allow Frontend
        methods: ["GET", "POST"]
    }
});

// 2. MIDDLEWARE
app.use(cors());
app.use(express.json());

// 3. DATABASE
connectDB();

// 4. SOCKET CONNECTION LOGIC (Only for Joining Rooms)
io.on('connection', (socket) => {
    console.log('⚡ New Client Connected:', socket.id);

    // TEACHER: Joins a room named after their Class ID
    socket.on('join_class', (classId) => {
        socket.join(classId);
        console.log(`User ${socket.id} joined class room: ${classId}`);
    });

    socket.on('disconnect', () => {
        console.log('Client Disconnected', socket.id);
    });
});

// 5. ROUTES (Pass 'io' to the class route!)
app.use('/api/auth', require('./routes/auth'));

// CRITICAL CHANGE: We function-call the route to pass 'io'
app.use('/api/class', require('./routes/class')(io)); 

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));