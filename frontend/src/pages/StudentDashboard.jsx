import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';

const StudentDashboard = () => {
    const [status, setStatus] = useState("WAITING"); // WAITING, DETECTED, VERIFIED
    const [signalStrength, setSignalStrength] = useState(0);
    const [pin, setPin] = useState("");
    
    // AUDIO ENGINE
    const audioCtxRef = useRef(null);
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);
    const rafIdRef = useRef(null);

    const TARGET_FREQ = 19000;
    const THRESHOLD = 30; // Sensitivity

    const startListening = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false } });
            
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtxRef.current = new AudioContext();
            analyserRef.current = audioCtxRef.current.createAnalyser();
            
            const source = audioCtxRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);
            
            analyserRef.current.fftSize = 2048;
            const bufferLength = analyserRef.current.frequencyBinCount;
            dataArrayRef.current = new Uint8Array(bufferLength);

            detectSignal();
        } catch (err) {
            alert("Microphone Error: " + err.message);
        }
    };

    const detectSignal = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArrayRef.current);

        // Find 19kHz Bin
        const nyquist = audioCtxRef.current.sampleRate / 2;
        const index = Math.round(TARGET_FREQ / nyquist * dataArrayRef.current.length);

        // Check Volume
        let maxVol = 0;
        for (let i = index - 2; i <= index + 2; i++) {
            if (dataArrayRef.current[i] > maxVol) maxVol = dataArrayRef.current[i];
        }

        // Update UI
        setSignalStrength(maxVol);

        if (maxVol > THRESHOLD) {
            setStatus("DETECTED");
        } else {
            setStatus("WAITING");
        }

        rafIdRef.current = requestAnimationFrame(detectSignal);
    };

    // Stop listening on unmount
    useEffect(() => {
        return () => {
            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
            if (audioCtxRef.current) audioCtxRef.current.close();
        };
    }, []);

    const handleAttendance = async () => {
    // 1. Get User ID from Local Storage (Saved during Login)
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
        alert("Error: You are not logged in!");
        return;
    }

    try {
        // 2. Send Data to Server
        const res = await axios.post('http://localhost:5000/api/class/mark', {
            studentId: user.id,
            code: pin
        });

        // 3. Success!
        setStatus("VERIFIED");
        alert("✅ SUCCESS: " + res.data.msg);

    } catch (err) {
        // 4. Handle Errors (Wrong PIN, etc)
        alert("❌ FAILED: " + (err.response?.data?.msg || "Server Error"));
        setPin(""); // Clear the wrong pin
    }
};
    return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            
            {/* 1. THE VISUALIZER CIRCLE */}
            <div className="relative mb-10">
                <motion.div 
                    animate={{ 
                        scale: status === "DETECTED" ? [1, 1.2, 1] : 1,
                        borderColor: status === "DETECTED" ? "#10B981" : "#4B5563"
                    }}
                    transition={{ duration: 0.5, repeat: status === "DETECTED" ? Infinity : 0 }}
                    className="w-48 h-48 rounded-full border-4 flex items-center justify-center bg-gray-800 shadow-2xl"
                >
                    {status === "VERIFIED" ? (
                        <CheckCircle size={60} className="text-green-500" />
                    ) : (
                        <Mic size={50} className={status === "DETECTED" ? "text-green-400" : "text-gray-500"} />
                    )}
                </motion.div>
                
                {/* Status Text */}
                <div className="absolute -bottom-12 w-full text-center">
                    <p className="font-bold text-lg tracking-wider">
                        {status === "WAITING" ? "LISTENING..." : "SIGNAL FOUND!"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Strength: {signalStrength}</p>
                </div>
            </div>

            {/* 2. THE ACTION AREA */}
            {status === "WAITING" && (
                <button 
                    onClick={startListening}
                    className="px-8 py-3 bg-blue-600 rounded-full font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-900/20"
                >
                    TAP TO ACTIVATE MIC
                </button>
            )}

            {status === "DETECTED" && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-xs space-y-4"
                >
                    <p className="text-center text-sm text-gray-400">Please enter the 4-digit code on the screen:</p>
                    
                    <input 
                        type="number" 
                        maxLength="4"
                        className="w-full p-4 text-center text-3xl tracking-[1em] bg-gray-800 border border-gray-600 rounded-xl focus:border-blue-500 outline-none"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                    />

                    <button 
                        onClick={handleAttendance}
                        disabled={pin.length !== 4}
                        className="w-full py-4 bg-green-600 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl font-bold transition"
                    >
                        MARK PRESENT
                    </button>
                </motion.div>
            )}

             {status === "VERIFIED" && (
                <div className="text-green-400 font-bold text-xl animate-bounce">
                    ATTENDANCE MARKED!
                </div>
            )}

        </div>
    );
};

export default StudentDashboard;