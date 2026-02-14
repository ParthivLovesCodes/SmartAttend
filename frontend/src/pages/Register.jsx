import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student', // Default is student
        enrollmentNumber: '' // <--- NEW FIELD
    });

    const navigate = useNavigate();
    const { name, email, password, role, enrollmentNumber } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            // Send data to backend
            const res = await axios.post('http://localhost:5000/api/auth/register', formData);
            
            // Save token and redirect
            localStorage.setItem('token', res.data.token);
            alert("Registration Successful!");
            
            // Send to correct dashboard
            if (role === 'teacher') navigate('/teacher-dashboard');
            else navigate('/student-dashboard');

        } catch (err) {
            console.error(err);
            alert("Registration Failed: " + (err.response?.data?.msg || "Server Error"));
        }
    };

    return (
        <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
            <form onSubmit={onSubmit} className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
                <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>

                {/* NAME */}
                <div className="mb-4">
                    <label className="block text-gray-400 mb-1">Full Name</label>
                    <input 
                        type="text" name="name" value={name} onChange={onChange} required
                        className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
                    />
                </div>

                {/* ROLE SELECTION */}
                <div className="mb-4">
                    <label className="block text-gray-400 mb-1">I am a...</label>
                    <select 
                        name="role" value={role} onChange={onChange}
                        className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
                    >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                    </select>
                </div>

                {/* ENROLLMENT NUMBER (Only shows if role is Student) */}
                {role === 'student' && (
                    <div className="mb-4 animate-fade-in">
                        <label className="block text-gray-400 mb-1">Enrollment Number</label>
                        <input 
                            type="text" name="enrollmentNumber" value={enrollmentNumber} onChange={onChange} required
                            placeholder="e.g. 190021"
                            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
                        />
                    </div>
                )}

                {/* EMAIL */}
                <div className="mb-4">
                    <label className="block text-gray-400 mb-1">Email Address</label>
                    <input 
                        type="email" name="email" value={email} onChange={onChange} required
                        className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
                    />
                </div>

                {/* PASSWORD */}
                <div className="mb-6">
                    <label className="block text-gray-400 mb-1">Password</label>
                    <input 
                        type="password" name="password" value={password} onChange={onChange} required
                        className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
                    />
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 p-3 rounded font-bold transition">
                    Register
                </button>
            </form>
        </div>
    );
};

export default Register;