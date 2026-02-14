import { Navigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode"; // You might need to install this: npm install jwt-decode

const PrivateRoute = ({ children, roleRequired }) => {
    const token = localStorage.getItem('token');

    // 1. CHECK: Is there a token?
    if (!token) {
        return <Navigate to="/" />;
    }

    try {
        // 2. CHECK: Is the token valid and is the role correct?
        const decoded = jwtDecode(token);
        
        // If a specific role is required (like 'teacher') and the user doesn't have it
        if (roleRequired && decoded.user.role !== roleRequired) {
            alert("Unauthorized: You are not a " + roleRequired);
            return <Navigate to="/" />;
        }

        // If all good, show the page!
        return children;

    } catch (error) {
        // If token is garbage/expired, kick them out
        localStorage.removeItem('token');
        return <Navigate to="/" />;
    }
};

export default PrivateRoute;