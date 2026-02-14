import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import StudentHistory from './pages/StudentHistory';
import Register from './pages/Register';
import TeacherHistory from './pages/TeacherHistory';
import PrivateRoute from './pages/PrivateRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* PROTECTED TEACHER ROUTES */}
        <Route 
          path="/teacher-dashboard" 
          element={
            <PrivateRoute roleRequired="teacher">
              <TeacherDashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/teacher/history" 
          element={
            <PrivateRoute roleRequired="teacher">
              <TeacherHistory />
            </PrivateRoute>
          } 
        />

        {/* PROTECTED STUDENT ROUTES */}
        <Route 
          path="/student-dashboard" 
          element={
            <PrivateRoute roleRequired="student">
              <StudentDashboard />
            </PrivateRoute>
          } 
        />
         <Route 
          path="/student/history" 
          element={
            <PrivateRoute roleRequired="student">
              <StudentHistory />
            </PrivateRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;