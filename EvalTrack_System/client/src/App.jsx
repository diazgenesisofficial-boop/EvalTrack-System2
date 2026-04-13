import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import MustChangePassword from './pages/MustChangePassword';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Enrollment from './pages/Enrollment';
import Profile from './pages/Profile';
import Evaluations from './pages/Evaluations';
import Messages from './pages/Messages';
import Admin from './pages/Admin';
import Exams from './pages/Exams';
import Student from './pages/Student';
import CurriculumEvaluation from './pages/CurriculumEvaluation';
import AdminDashboard from './pages/AdminDashboard';
import InstructorDashboard from './pages/InstructorDashboard';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-12 h-12 border-4 border-p500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }
    
    if (!user) {
        return <Navigate to="/login" />;
    }

    if (user.must_change_password && window.location.pathname !== '/must-change-password') {
        return <Navigate to="/must-change-password" />;
    }
    
    return <AppLayout>{children}</AppLayout>;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/must-change-password" element={<MustChangePassword />} />
                    <Route 
                        path="/" 
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/reports" 
                        element={
                            <ProtectedRoute>
                                <Reports />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/enrollment" 
                        element={
                            <ProtectedRoute>
                                <Enrollment />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/evaluations" 
                        element={
                            <ProtectedRoute>
                                <Evaluations />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/curriculum-evaluation" 
                        element={
                            <ProtectedRoute>
                                <CurriculumEvaluation />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin-dashboard" 
                        element={
                            <ProtectedRoute>
                                <AdminDashboard />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/exams" 
                        element={
                            <ProtectedRoute>
                                <Exams />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/student" 
                        element={
                            <ProtectedRoute>
                                <Student />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/messages" 
                        element={
                            <ProtectedRoute>
                                <Messages />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin" 
                        element={
                            <ProtectedRoute>
                                <Admin />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/profile" 
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/instructor-dashboard" 
                        element={
                            <ProtectedRoute>
                                <InstructorDashboard />
                            </ProtectedRoute>
                        } 
                    />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
