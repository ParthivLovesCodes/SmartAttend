import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TeacherHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/class/teacher-history', {
                    headers: { 'x-auth-token': token }
                });
                
                // SORT LOGIC: Alphabetical by Enrollment Number
                const sortedData = res.data.sort((a, b) => {
                    const idA = a.student?.enrollmentNumber || "Z";
                    const idB = b.student?.enrollmentNumber || "Z";
                    return idA.localeCompare(idB, undefined, { numeric: true });
                });

                setHistory(sortedData);
            } catch (err) {
                console.error("Error fetching history:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            {/* Header */}
            <div className="mb-8 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/teacher-dashboard')} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Users className="text-green-400" /> Attendance Register
                    </h1>
                </div>
                <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-400">
                    Total Present: <span className="text-white font-bold ml-1">{history.length}</span>
                </div>
            </div>

            {/* Table */}
            <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl border border-gray-700">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Loading class data...</div>
                ) : history.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <p className="text-xl mb-2">No attendance records found.</p>
                        <p className="text-sm">Start a class to get data.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-700 text-gray-300 uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="p-4 w-16">#</th>
                                    <th className="p-4">Enrollment No</th>
                                    <th className="p-4">Student Name</th>
                                    <th className="p-4">Time</th>
                                    <th className="p-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700 text-sm">
                                {history.map((record, index) => (
                                    <tr key={record._id} className="hover:bg-gray-750 transition-colors">
                                        <td className="p-4 text-gray-500">{index + 1}</td>
                                        <td className="p-4 font-mono text-blue-300 font-bold">
                                            {record.student?.enrollmentNumber || "N/A"}
                                        </td>
                                        <td className="p-4 font-medium text-white">
                                            {record.student?.name}
                                        </td>
                                        <td className="p-4 text-gray-400">
                                            {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="inline-block bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/20">
                                                Present
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherHistory;