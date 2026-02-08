import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wifi, Square, Play } from 'lucide-react';
import axios from 'axios';

const TeacherDashboard = () => {
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [visualCode, setVisualCode] = useState("----");
    
    // AUDIO ENGINE REFS
    const audioCtxRef = useRef(null);
    const oscillatorRef = useRef(null);

    const toggleClass = () => {
        if (isBroadcasting) {
            stopBroadcast();
        } else {
            startBroadcast();
        }
    };

    const startBroadcast = async () => {
    // 1. Audio Logic (Keep your existing audio code here!)
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtxRef.current = new AudioContext();
    oscillatorRef.current = audioCtxRef.current.createOscillator();
    oscillatorRef.current.frequency.setValueAtTime(19000, audioCtxRef.current.currentTime);
    oscillatorRef.current.connect(audioCtxRef.current.destination);
    oscillatorRef.current.start();

    // 2. Generate Initial Code
    const newCode = Math.floor(1000 + Math.random() * 9000).toString();
    setVisualCode(newCode);

    // 3. TELL THE SERVER! (The New Part)
    try {
        await axios.post('http://localhost:5000/api/class/start', { 
            code: newCode,
            teacherId: "123" // In real app, get this from localStorage
        });
        setIsBroadcasting(true);
    } catch (err) {
        console.error("Server Error:", err);
    }
};

    const stopBroadcast = () => {
        if (oscillatorRef.current) {
            oscillatorRef.current.stop();
            oscillatorRef.current.disconnect();
        }
        if (audioCtxRef.current) {
            audioCtxRef.current.close();
        }
        setIsBroadcasting(false);
        setVisualCode("----");
    };

    // Helper: Generate random 4-digit code
    const generateNewCode = () => {
        const code = Math.floor(1000 + Math.random() * 9000);
        setVisualCode(code.toString());
    };

    // Auto-refresh code every 15 seconds (Security Feature)
 useEffect(() => {
    let interval;
    if (isBroadcasting) {
        interval = setInterval(async () => {
            const newCode = Math.floor(1000 + Math.random() * 9000).toString();
            setVisualCode(newCode);
            
            // Send new code to server
            await axios.post('http://localhost:5000/api/class/update-code', { code: newCode });
        }, 15000);
    }
    return () => clearInterval(interval);
}, [isBroadcasting]);

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
            
            {/* STATUS INDICATOR */}
            <motion.div 
                animate={{ scale: isBroadcasting ? [1, 1.1, 1] : 1 }}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 border-4 ${isBroadcasting ? 'border-green-500 bg-green-900/20' : 'border-gray-600'}`}
            >
                <Wifi size={40} className={isBroadcasting ? 'text-green-400' : 'text-gray-600'} />
            </motion.div>

            <h1 className="text-4xl font-bold mb-2">
                {isBroadcasting ? "Class is Live" : "Ready to Start"}
            </h1>
            <p className="text-gray-400 mb-10">Subject: Computer Networks (CS-302)</p>

            {/* VISUAL PIN DISPLAY */}
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 mb-10 text-center w-full max-w-sm">
                <p className="text-sm text-gray-400 uppercase tracking-widest mb-2">Visual Security Code</p>
                <div className="text-6xl font-mono font-bold tracking-widest text-white">
                    {visualCode}
                </div>
                {isBroadcasting && <p className="text-xs text-green-400 mt-2 animate-pulse">Refreshing in 15s...</p>}
            </div>

            {/* CONTROL BUTTON */}
            <button 
                onClick={toggleClass}
                className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                    isBroadcasting 
                    ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20' 
                    : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20'
                }`}
            >
                {isBroadcasting ? (
                    <> <Square size={20} fill="currentColor" /> STOP CLASS </>
                ) : (
                    <> <Play size={20} fill="currentColor" /> START CLASS </>
                )}
            </button>

        </div>
    );
};

export default TeacherDashboard;