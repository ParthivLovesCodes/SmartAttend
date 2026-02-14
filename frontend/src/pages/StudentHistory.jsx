import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, CheckCircle } from 'lucide-react';

const StudentHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/class/student-history', {
                    headers: { 'x-auth-token': token }
                });
                setHistory(res.data);
            } catch (err) {
                console.error("Failed to load history", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <Calendar className="text-blue-500" /> 
                My Attendance History
            </h1>

            {loading ? (
                <p className="text-gray-400">Loading records...</p>
            ) : history.length === 0 ? (
                <div className="text-center py-20 bg-gray-800 rounded-xl">
                    <p className="text-gray-400 text-lg">No attendance records found yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {history.map((record) => (
                        <div key={record._id} className="bg-gray-800 p-4 rounded-xl flex items-center justify-between border border-gray-700 hover:border-blue-500 transition">
                            
                            {/* LEFT: Class Info */}
                            <div>
                                <h3 className="font-bold text-lg text-white">
                                    {record.classId ? record.classId.name : "Unknown Class"}
                                </h3>
                                <p className="text-gray-400 text-sm">
                                    {record.classId ? record.classId.subjectCode : "N/A"}
                                </p>
                            </div>

                            {/* RIGHT: Status & Date */}
                            <div className="text-right">
                                <div className="flex items-center gap-2 justify-end mb-1">
                                    <span className="text-green-400 font-bold text-sm bg-green-900/30 px-3 py-1 rounded-full flex items-center gap-2">
                                        <CheckCircle size={14} /> Present
                                    </span>
                                </div>
                                <p className="text-gray-500 text-xs flex items-center gap-1 justify-end">
                                    <Clock size={12} />
                                    {new Date(record.date).toLocaleDateString()} • {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentHistory;