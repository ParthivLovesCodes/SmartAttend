import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, CheckCircle, LogOut, UserPlus, Wifi } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
    // --- STATE MANAGEMENT ---
    const [status, setStatus] = useState("WAITING"); // WAITING, LISTENING, DETECTED, VERIFIED
    const [signalStrength, setSignalStrength] = useState(0);
    const [code, setCode] = useState("");
    const [classIdToJoin, setClassIdToJoin] = useState("");
    const [joinMsg, setJoinMsg] = useState("");
    const navigate = useNavigate();
    
    // --- AUDIO REFS ---
    const audioCtxRef = useRef(null);
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);
    const rafIdRef = useRef(null);

    const TARGET_FREQ = 19000; // 19kHz
    const THRESHOLD = 30; // Sensitivity

    // 1. SECURITY CHECK ON LOAD
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
        }
    }, [navigate]);

    // --- AUDIO LOGIC (The "Cool" Part) ---
    const startListening = async () => {
        try {
            setStatus("LISTENING");
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
            alert("Microphone Access Denied: " + err.message);
            setStatus("WAITING");
        }
    };

    const detectSignal = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArrayRef.current);

        // Calculate Frequency Index for 19kHz
        const nyquist = audioCtxRef.current.sampleRate / 2;
        const index = Math.round(TARGET_FREQ / nyquist * dataArrayRef.current.length);

        // Check Volume at that frequency
        let maxVol = 0;
        for (let i = index - 2; i <= index + 2; i++) {
            if (dataArrayRef.current[i] > maxVol) maxVol = dataArrayRef.current[i];
        }

        setSignalStrength(maxVol);

        // SIGNAL DETECTED?
        if (maxVol > THRESHOLD) {
            setStatus("DETECTED");
        } else {
            if (status !== "VERIFIED" && status !== "DETECTED") setStatus("LISTENING");
        }

        // Keep looping
        if (status !== "VERIFIED") {
            rafIdRef.current = requestAnimationFrame(detectSignal);
        }
    };

    // Cleanup Audio on Unmount
    useEffect(() => {
        return () => {
            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
            if (audioCtxRef.current) audioCtxRef.current.close();
        };
    }, []);

    // --- API LOGIC ---

    // A. MARK ATTENDANCE
    const handleAttendance = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/class/mark', 
                { code: code }, 
                { headers: { 'x-auth-token': token } }
            );

            setStatus("VERIFIED");
            stopAudio(); // Success! Stop listening.
            alert("✅ SUCCESS: " + res.data.msg);

        } catch (err) {
            alert("❌ FAILED: " + (err.response?.data?.msg || "Server Error"));
            setCode(""); 
        }
    };

    // B. JOIN CLASS (The New Day 5 Feature)
    const handleJoinClass = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const res = await axios.post('http://localhost:5000/api/class/join', 
                { classId: classIdToJoin }, 
                { headers: { 'x-auth-token': token } }
            );
            setJoinMsg(`🎉 Joined: ${res.data.className}`);
            setClassIdToJoin("");
        } catch (err) {
            setJoinMsg("❌ Error: " + (err.response?.data?.msg || "Failed to join"));
        }
    };

    const stopAudio = () => {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        if (audioCtxRef.current) audioCtxRef.current.close();
    };

    const logout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col items-center">
            
            {/* --- HEADER --- */}
            <div className="w-full max-w-md flex justify-between items-center mb-8 pt-4">
                <div>
                    <h1 className="text-xl font-bold">Student Portal</h1>
                    <p className="text-xs text-gray-400">SmartAttend v1.0</p>
                </div>
                <button onClick={logout} className="text-gray-400 hover:text-white">
                    <LogOut size={20} />
                </button>
            </div>

            {/* --- SECTION 1: ATTENDANCE VISUALIZER --- */}
            <div className="relative mb-12">
                <motion.div 
                    animate={{ 
                        scale: status === "DETECTED" ? [1, 1.2, 1] : 1,
                        borderColor: status === "DETECTED" ? "#10B981" : (status === "LISTENING" ? "#3B82F6" : "#4B5563")
                    }}
                    transition={{ duration: 0.5, repeat: status === "DETECTED" ? Infinity : 0 }}
                    className={`w-48 h-48 rounded-full border-4 flex items-center justify-center bg-gray-800 shadow-2xl relative overflow-hidden ${
                        status === "VERIFIED" ? "border-green-500" : ""
                    }`}
                >
                    {/* Signal Bars Animation */}
                    {status === "LISTENING" && (
                         <div className="absolute inset-0 bg-blue-500/10 flex items-end justify-center gap-1 pb-10">
                            {[1,2,3,4,5].map(i => (
                                <motion.div 
                                    key={i}
                                    animate={{ height: [10, signalStrength/2, 10] }}
                                    className="w-2 bg-blue-500 rounded-full"
                                />
                            ))}
                         </div>
                    )}

                    {status === "VERIFIED" ? (
                        <CheckCircle size={60} className="text-green-500 z-10" />
                    ) : (
                        <Mic size={50} className={status === "DETECTED" ? "text-green-400 z-10" : "text-gray-500 z-10"} />
                    )}
                </motion.div>
                
                {/* Status Text */}
                <div className="absolute -bottom-16 w-full text-center">
                    <p className={`font-bold text-lg tracking-wider ${status === "DETECTED" ? "text-green-400" : "text-white"}`}>
                        {status === "WAITING" && "MIC OFF"}
                        {status === "LISTENING" && "LISTENING..."}
                        {status === "DETECTED" && "SIGNAL FOUND!"}
                        {status === "VERIFIED" && "ATTENDANCE MARKED"}
                    </p>
                    {status === "LISTENING" && <p className="text-xs text-gray-500">Strength: {signalStrength}</p>}
                </div>
            </div>

            {/* --- SECTION 2: ACTIONS --- */}
            <div className="w-full max-w-xs space-y-6">
                
                {/* A. START BUTTON */}
                {status === "WAITING" && (
                    <button 
                        onClick={startListening}
                        className="w-full py-4 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                    >
                        <Mic size={20} /> TAP TO START
                    </button>
                )}

                {/* B. CODE INPUT (Only shows if Signal Detected) */}
                {(status === "DETECTED" || status === "LISTENING") && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                             <p className="text-xs text-center text-gray-400 mb-2 uppercase tracking-widest">
                                {status === "DETECTED" ? "Enter Code from Screen" : "Waiting for Signal..."}
                             </p>
                             <input 
                                type="number" 
                                maxLength="4"
                                placeholder="----"
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 text-center text-3xl tracking-[0.5em] font-mono focus:ring-2 focus:ring-green-500 outline-none"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                disabled={status !== "DETECTED"}
                             />
                        </div>

                        {status === "DETECTED" && (
                            <button 
                                onClick={handleAttendance}
                                disabled={code.length !== 4}
                                className="w-full py-4 bg-green-600 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl font-bold transition shadow-lg"
                            >
                                MARK PRESENT
                            </button>
                        )}
                    </motion.div>
                )}
            </div>

            {/* --- SECTION 3: ENROLLMENT (Day 5 Feature) --- */}
            <div className="mt-12 w-full max-w-xs pt-8 border-t border-gray-800">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <UserPlus size={14} /> Course Enrollment
                </p>
                
                <form onSubmit={handleJoinClass} className="space-y-2">
                    <input 
                        type="text" 
                        value={classIdToJoin}
                        onChange={(e) => setClassIdToJoin(e.target.value)}
                        placeholder="Paste Class ID here..."
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:border-purple-500 outline-none transition-colors"
                    />
                    <button type="submit" className="w-full py-2 bg-purple-900/50 text-purple-300 border border-purple-500/30 rounded-lg text-sm font-bold hover:bg-purple-900 transition-colors">
                        JOIN NEW CLASS
                    </button>
                </form>
                {joinMsg && <p className="text-xs text-center mt-2 text-purple-400">{joinMsg}</p>}
            </div>

        </div>
    );
};

export default StudentDashboard;