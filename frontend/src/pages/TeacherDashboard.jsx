import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from "socket.io-client";
import { motion } from 'framer-motion';
import { Wifi, Square, Play, Users, RefreshCw } from 'lucide-react';

// Connect to Backend Socket
const socket = io("http://localhost:5000");

const TeacherDashboard = () => {
    // --- STATE ---
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [classSession, setClassSession] = useState(null);
    const [visualCode, setVisualCode] = useState("----");
    const [liveAttendees, setLiveAttendees] = useState([]);
    
    // --- AUDIO REFS (The Ultrasonic Engine) ---
    const audioCtxRef = useRef(null);
    const oscillatorRef = useRef(null);

    // 1. INITIAL SETUP: Fetch Class & Join Socket Room
    useEffect(() => {
        const fetchClass = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                // 1. Get Class Data AND the Student List
                const res = await axios.get('http://localhost:5000/api/class/my-class', {
                    headers: { 'x-auth-token': token }
                });
                
                // Debugging: Check if the list is actually coming from the server
                console.log("📦 Data received from server:", res.data); 

                setClassSession(res.data);
                
                // Join the Socket Room
                socket.emit("join_class", res.data._id);

                // 2. RESTORE THE STATE (This is the missing magic part)
                if (res.data.activeSession?.isActive) {
                    setVisualCode(res.data.activeSession.currentVisualCode);
                    setIsBroadcasting(true);
                    
                    // --- THE FIX: Save the list into state ---
                    // If currentAttendees exists, use it. Otherwise, empty list.
                    setLiveAttendees(res.data.currentAttendees || []); 
                    // ----------------------------------------
                }

            } catch (err) {
                console.error("Failed to load class", err);
            }
        };
        fetchClass();

        // Socket Listener
        socket.on("new_attendance", (newStudentData) => {
            setLiveAttendees((prev) => [newStudentData, ...prev]);
        });

        return () => {
            socket.off("new_attendance");
        };
    }, []);

    // --- AUDIO FUNCTIONS ---
    const startAudioEngine = () => {
        if (!audioCtxRef.current) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtxRef.current = new AudioContext();
        }
        // Prevent double start
        if (oscillatorRef.current) return; 

        oscillatorRef.current = audioCtxRef.current.createOscillator();
        oscillatorRef.current.frequency.setValueAtTime(19000, audioCtxRef.current.currentTime); // 19kHz Ultrasonic
        oscillatorRef.current.connect(audioCtxRef.current.destination);
        oscillatorRef.current.start();
    };

    const stopAudioEngine = () => {
        if (oscillatorRef.current) {
            oscillatorRef.current.stop();
            oscillatorRef.current.disconnect();
            oscillatorRef.current = null;
        }
        // We generally keep audioContext open, but you can close it if you want to save battery
    };

    const toggleClass = async () => {
        const token = localStorage.getItem('token');
        
        if (isBroadcasting) {
            // --- STOPPING THE CLASS ---
            stopAudioEngine(); // 1. Cut the sound
            
            try {
                // 2. TELL THE BACKEND TO STOP
                await axios.post('http://localhost:5000/api/class/stop', 
                    { classId: classSession._id },
                    { headers: { 'x-auth-token': token } }
                );
                
                // 3. Update Frontend Only AFTER Backend confirms
                setIsBroadcasting(false);
                setVisualCode("----");
                setLiveAttendees([]); // Clear the list
                
            } catch (err) {
                console.error("Failed to stop class:", err);
                alert("Error stopping class. Please try again.");
            }

        } else {
            // --- STARTING THE CLASS ---
            startAudioEngine(); // 1. Start Sound
            const newCode = Math.floor(1000 + Math.random() * 9000).toString();
            setVisualCode(newCode);
            setIsBroadcasting(true);

            try {
                // 2. TELL BACKEND TO START
                await axios.post('http://localhost:5000/api/class/start', 
                    { classId: classSession._id, code: newCode },
                    { headers: { 'x-auth-token': token } }
                );
            } catch (err) {
                console.error("Error starting class:", err);
                stopAudioEngine();
                setIsBroadcasting(false); // Revert if failed
            }
        }
    };

    // --- AUTO REFRESH CODE (Every 15s) ---
    useEffect(() => {
        let interval;
        if (isBroadcasting && classSession) {
            interval = setInterval(async () => {
                const newCode = Math.floor(1000 + Math.random() * 9000).toString();
                setVisualCode(newCode);
                
                // Update DB
                const token = localStorage.getItem('token');
                try {
                    await axios.post('http://localhost:5000/api/class/update-code', 
                        { classId: classSession._id, code: newCode },
                        { headers: { 'x-auth-token': token } }
                    );
                } catch (err) {
                    console.error("Auto-update failed", err);
                }
            }, 15000);
        }
        return () => clearInterval(interval);
    }, [isBroadcasting, classSession]);

    return (
        <div className="min-h-screen flex flex-col items-center bg-gray-900 text-white p-6">
            
            {/* --- HEADER SECTION --- */}
            <div className="w-full max-w-lg bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700 text-center mb-8 relative overflow-hidden">
                {/* COPY CLASS ID SNIPPET */}
            <div className="mb-6 flex flex-col items-center">
                <p className="text-xs text-gray-500 mb-1">Class ID for Enrollment:</p>
                <div 
                    onClick={() => {
                        navigator.clipboard.writeText(classSession._id);
                        alert("Class ID Copied!");
                    }}
                    className="bg-gray-900 px-4 py-2 rounded-full border border-gray-700 text-xs font-mono text-gray-300 cursor-pointer hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                    {classSession?._id}
                    <span className="text-gray-500">(Click to Copy)</span>
                </div>
            </div>
                <div className={`absolute top-0 left-0 w-full h-2 transition-colors duration-500 ${isBroadcasting ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                
                <h2 className="text-gray-400 uppercase text-xs tracking-widest mb-2">
                    {classSession ? classSession.subjectCode : "Loading..."}
                </h2>
                <h1 className="text-3xl font-bold mb-6">
                    {classSession ? classSession.name : "Loading Class..."}
                </h1>

                {/* VISUAL CODE BOX */}
                <div className="bg-black/40 rounded-xl p-8 mb-8 border border-gray-600 relative">
                    <span className="text-6xl font-mono font-bold tracking-[0.3em] text-blue-400 shadow-blue-500/50 drop-shadow-lg">
                        {visualCode}
                    </span>
                    
                    {/* Broadcasting Indicator */}
                    {isBroadcasting && (
                        <div className="absolute top-4 right-4 animate-pulse flex items-center gap-2">
                            <Wifi size={16} className="text-green-500" />
                            <span className="text-xs text-green-500 font-bold">LIVE (19kHz)</span>
                        </div>
                    )}
                </div>

                {/* START/STOP BUTTON */}
                <button 
                    onClick={toggleClass}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg ${
                        isBroadcasting 
                        ? 'bg-red-600 hover:bg-red-700 shadow-red-900/20' 
                        : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'
                    }`}
                >
                    {isBroadcasting ? (
                        <> <Square size={20} fill="currentColor" /> STOP SESSION </>
                    ) : (
                        <> <Play size={20} fill="currentColor" /> START SESSION </>
                    )}
                </button>
            </div>

            {/* --- LIVE ATTENDANCE FEED (SOCKET.IO) --- */}
            <div className="w-full max-w-lg">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Users className="text-green-400" /> Live Attendees
                    </h3>
                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30">
                        {liveAttendees.length} Present
                    </span>
                </div>

                <div className="space-y-3">
                    {liveAttendees.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 bg-gray-800/50 rounded-lg border border-gray-700 border-dashed">
                            Waiting for students to join...
                        </div>
                    ) : (
                        liveAttendees.map((record, index) => (
                            <motion.div 
                                key={index} 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-800 p-4 rounded-lg flex justify-between items-center border border-gray-700 shadow-md"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                                        {record.student?.name?.charAt(0) || "S"}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white leading-tight">{record.student?.name}</p>
                                        <p className="text-xs text-gray-400 font-mono">{record.student?.enrollmentNumber}</p>
                                    </div>
                                </div>
                                <span className="text-green-400 text-[10px] font-bold border border-green-500/30 px-2 py-1 rounded uppercase tracking-wider">
                                    Just Now
                                </span>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;