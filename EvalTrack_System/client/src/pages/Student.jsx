import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, BookOpen, ClipboardCheck, Bell, Settings, LogOut } from 'lucide-react';

const Student = () => {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '2rem',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, #6a1b9a 0%, #8e24aa 100%)',
                borderRadius: '16px',
                color: 'white'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                        width: '50px', 
                        height: '50px', 
                        borderRadius: '50%', 
                        background: 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <GraduationCap size={28} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>
                            Student Portal
                        </h1>
                        <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>
                            {user?.name || user?.email || 'Welcome, Student'}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={handleLogout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>

            {/* Dashboard Grid */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem'
            }}>
                {/* Evaluations Card */}
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid #f0f0f0'
                }}>
                    <div style={{ 
                        width: '50px', 
                        height: '50px', 
                        borderRadius: '12px', 
                        background: 'rgba(106, 27, 154, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1rem'
                    }}>
                        <ClipboardCheck size={24} color="#6a1b9a" />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#333', marginBottom: '8px' }}>
                        My Evaluations
                    </h3>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                        View your course evaluations and feedback
                    </p>
                </div>

                {/* Courses Card */}
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid #f0f0f0'
                }}>
                    <div style={{ 
                        width: '50px', 
                        height: '50px', 
                        borderRadius: '12px', 
                        background: 'rgba(33, 150, 243, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1rem'
                    }}>
                        <BookOpen size={24} color="#2196f3" />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#333', marginBottom: '8px' }}>
                        My Courses
                    </h3>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                        Browse your enrolled courses
                    </p>
                </div>

                {/* Notifications Card */}
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid #f0f0f0'
                }}>
                    <div style={{ 
                        width: '50px', 
                        height: '50px', 
                        borderRadius: '12px', 
                        background: 'rgba(255, 152, 0, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1rem'
                    }}>
                        <Bell size={24} color="#ff9800" />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#333', marginBottom: '8px' }}>
                        Notifications
                    </h3>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                        Check your latest announcements
                    </p>
                </div>

                {/* Settings Card */}
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid #f0f0f0'
                }}>
                    <div style={{ 
                        width: '50px', 
                        height: '50px', 
                        borderRadius: '12px', 
                        background: 'rgba(76, 175, 80, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1rem'
                    }}>
                        <Settings size={24} color="#4caf50" />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#333', marginBottom: '8px' }}>
                        Account Settings
                    </h3>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                        Manage your profile and password
                    </p>
                </div>
            </div>

            {/* Info Section */}
            <div style={{
                marginTop: '2rem',
                padding: '1.5rem',
                background: '#f8f9fa',
                borderRadius: '16px',
                border: '1px solid #e9ecef'
            }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '12px' }}>
                    Welcome to the Student Portal
                </h3>
                <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
                    This is your dashboard where you can access evaluations, view courses, and manage your account. 
                    Use the cards above to navigate to different sections. For help, contact your program head or 
                    the IT support team.
                </p>
            </div>
        </div>
    );
};

export default Student;
