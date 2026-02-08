import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // <--- NEW IMPORT
import { motion } from 'framer-motion';
import { Lock, User } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate(); // <--- Initialize Hook

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
            
            // 1. Save the "Digital Passport" (Token)
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));

            // 2. check Role and Redirect
            if (res.data.user.role === 'teacher') {
                navigate('/teacher-dashboard');
            } else {
                navigate('/student-dashboard');
            }

        } catch (err) {
            alert("Error: Invalid Credentials");
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-900">
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md p-8 bg-gray-800 rounded-2xl shadow-xl border border-gray-700"
            >
                <h2 className="text-3xl font-bold text-center text-blue-500 mb-6">SmartAttend</h2>
                
                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input 
                            type="email" 
                            placeholder="Email Address" 
                            className="w-full pl-10 p-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white"
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input 
                            type="password" 
                            placeholder="Password" 
                            className="w-full pl-10 p-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white"
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded-lg transition"
                    >
                        LOGIN
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
};

export default Login;