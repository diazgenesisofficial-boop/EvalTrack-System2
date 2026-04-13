import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Shield, GraduationCap, ArrowRight, Loader2, Eye, EyeOff, Info, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Particles from '../components/Particles';
import axios from 'axios';
import '../styles/register.css';

const Register = () => {
    const [formData, setFormData] = useState({
        role: 'student',
        name: '',
        email: '',
        studentId: '',
        password: '',
        confirmPassword: '',
        program: 'BSIT',
        studentType: 'regular',
        yearLevel: '1',
        contactNumber: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [googleUser, setGoogleUser] = useState(null);
    const [isLinkedAccount, setIsLinkedAccount] = useState(false);
    
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    // Load Google user data if coming from Google sign-in
    useState(() => {
        const tempGoogleUser = sessionStorage.getItem('tempGoogleUser');
        if (tempGoogleUser) {
            const userData = JSON.parse(tempGoogleUser);
            setGoogleUser(userData);
            setFormData(prev => ({
                ...prev,
                email: userData.email || '',
                name: userData.name || ''
            }));
        }
    }, []);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
        
        // Auto-fill email from studentId for JMC domain
        if (id === 'studentId' && value && !googleUser && formData.role === 'student') {
            setFormData(prev => ({
                ...prev,
                [id]: value,
                email: value ? `${value}@jmc.edu.ph` : ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        console.log('Form data:', formData);
        console.log('Email validation:', formData.email, 'Ends with @jmc.edu.ph:', formData.email.endsWith('@jmc.edu.ph'));

        if (!formData.email.endsWith('@jmc.edu.ph')) {
            setError('Only school-issued JMC emails permitted (@jmc.edu.ph).');
            return;
        }

        // Password validation for students
        if (formData.role === 'student' && formData.password) {
            if (formData.password.length < 8) {
                setError('Password must be at least 8 characters long.');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match.');
                return;
            }
        }

        // For linked Google accounts, password is required
        if (isLinkedAccount && !formData.password) {
            setError('Please create a password for your linked account.');
            return;
        }

        console.log('Email validation passed, proceeding with registration...');

        setIsSubmitting(true);
        try {
            const payload = {
                role: formData.role,
                name: formData.name,
                email: formData.email,
                id: formData.role === 'student' ? formData.studentId : 'INS' + Date.now().toString().slice(-4),
                password: formData.password || formData.studentId,
                program: formData.role === 'student' ? formData.program : null,
                student_type: formData.role === 'student' ? formData.studentType : null,
                year_level: formData.role === 'student' ? formData.yearLevel : null,
                contact_number: formData.role === 'student' ? formData.contactNumber : null,
                google_uid: googleUser?.uid || null,
                is_linked_account: isLinkedAccount
            };

            console.log('Registration payload:', payload);

            if (formData.role === 'instructor' && formData.password.length < 8) {
                setError('Password must be at least 8 characters.');
                setIsSubmitting(false);
                return;
            }

            console.log('Sending registration request to: http://localhost:5000/api/auth/register');
            const res = await axios.post('http://localhost:5000/api/auth/register', payload);
            console.log('Registration response:', res.data);
            
            if (res.data.success) {
                // Clear temp Google user data
                sessionStorage.removeItem('tempGoogleUser');
                
                // Auto login after registration
                if (googleUser) {
                    await loginWithGoogle({ uid: googleUser.uid, email: formData.email });
                } else {
                    const loginId = formData.role === 'student' ? formData.studentId : formData.email;
                    const loginPw = formData.password || formData.studentId;
                    await login(loginId, loginPw, formData.role);
                }
                
                navigate(formData.role === 'student' ? '/student' : '/');
            } else {
                console.log('Registration failed:', res.data.message);
                setError(res.data.message || 'Registration failed');
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.response?.data?.message || 'Connection error. Check backend.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '100vh', 
            background: 'linear-gradient(-45deg, #6a1b9a, #ab47bc, #4a148c, #8e24aa)',
            backgroundSize: '400% 400%',
            fontFamily: "'Inter', sans-serif",
            position: 'relative',
            animation: 'gradientShift 8s ease infinite'
        }}>
            <style>
                {`
                    @keyframes gradientShift {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                    @keyframes shimmer {
                        0% { background-position: -200% center; }
                        100% { background-position: 200% center; }
                    }
                    @keyframes fadeInScale {
                        from {
                            opacity: 0;
                            transform: scale(0.9);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        25% { transform: translateX(-5px); }
                        75% { transform: translateX(5px); }
                    }
                    .auth-card {
                        animation: fadeInScale 0.8s ease-out;
                    }
                    .error-shake {
                        animation: shake 0.5s ease-in-out;
                    }
                    .shimmer-bg {
                        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
                        background-size: 200% 100%;
                        animation: shimmer 5s infinite;
                    }
                    .input-field {
                        transition: all 0.3s ease;
                    }
                    .input-field:focus-within {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 25px rgba(106, 27, 154, 0.15);
                    }
                    .register-btn {
                        transition: all 0.3s ease;
                        position: relative;
                        overflow: hidden;
                    }
                    .register-btn:hover:not(:disabled) {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 25px rgba(106, 27, 154, 0.3);
                    }
                    .register-btn::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: -100%;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                        transition: left 0.5s;
                    }
                    .register-btn:hover:not(:disabled)::before {
                        left: 100%;
                    }
                    .select-field {
                        transition: all 0.3s ease;
                    }
                    .select-field:focus-within {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 25px rgba(106, 27, 154, 0.15);
                    }
                `}
            </style>
            <Particles />
            <div className="auth-card" style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                width: '950px', 
                maxWidth: '90vw', 
                height: '650px',
                maxHeight: '90vh',
                boxShadow: '0 20px 60px rgba(0,0,0,0.25)', 
                borderRadius: '24px', 
                overflow: 'hidden', 
                position: 'relative', 
                zIndex: 10,
                background: 'white'
            }}>
                {/* Left Side - Enhanced Branding */}
                <div style={{ 
                    flex: 1, 
                    background: 'linear-gradient(135deg, #6a1b9a 0%, #8e24aa 100%)', 
                    color: 'white', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '3rem 2rem', 
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div className="shimmer-bg" style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: 0.3
                    }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <img 
                            src="/logo.png" 
                            alt="Jose Maria College Logo" 
                            style={{ 
                                width: '120px', 
                                marginBottom: '1.5rem',
                                filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))'
                            }} 
                        />
                        <h3 style={{ 
                            fontSize: '22px', 
                            fontWeight: '800', 
                            marginBottom: '0.5rem',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            letterSpacing: '-0.5px'
                        }}>
                            Jose Maria College
                        </h3>
                        <p style={{ 
                            fontSize: '14px', 
                            fontWeight: '500', 
                            opacity: 0.9,
                            fontFamily: "'Plus Jakarta Sans', sans-serif"
                        }}>
                            Foundation, Inc.
                        </p>
                    </div>
                </div>

                {/* Right Side - Enhanced Form */}
                <div style={{ 
                    flex: 1.3, 
                    padding: '2.5rem 3rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'flex-start',
                    background: '#ffffff',
                    maxHeight: '90vh',
                    overflowY: 'auto'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '1rem' }}>
                        <h2 style={{ 
                            fontSize: '28px', 
                            color: '#4a148c', 
                            marginBottom: '0.5rem', 
                            fontWeight: '900',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            letterSpacing: '-1px'
                        }}>
                            Create Account
                        </h2>
                        <p style={{ 
                            color: '#666', 
                            fontSize: '14px',
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: '400'
                        }}>
                            Register using your JMC email
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="error-shake" style={{ 
                                background: 'rgba(239, 68, 68, 0.08)', 
                                color: '#dc2626', 
                                padding: '12px 16px', 
                                borderRadius: '12px', 
                                marginBottom: '1.25rem', 
                                fontSize: '13px', 
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                                <span>{error}</span>
                            </div>
                        )}

                        {googleUser && (
                            <div style={{
                                background: 'linear-gradient(135deg, #6a1b9a 0%, #8e24aa 100%)',
                                color: 'white',
                                padding: '16px 20px',
                                borderRadius: '16px',
                                marginBottom: '1.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24">
                                        <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                        <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    </svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>
                                        Signed in with Google
                                    </p>
                                    <p style={{ fontSize: '12px', opacity: 0.9 }}>
                                        {googleUser.email}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Account Linking Option - Only show if Google user exists */}
                        {googleUser && (
                            <div style={{
                                background: isLinkedAccount ? 'rgba(106, 27, 154, 0.08)' : '#f8f9fa',
                                border: isLinkedAccount ? '2px solid #6a1b9a' : '1px solid #e9ecef',
                                borderRadius: '14px',
                                padding: '16px',
                                marginBottom: '1.25rem',
                                cursor: 'pointer'
                            }} onClick={() => setIsLinkedAccount(!isLinkedAccount)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '6px',
                                        border: isLinkedAccount ? 'none' : '2px solid #e9ecef',
                                        background: isLinkedAccount ? '#6a1b9a' : 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {isLinkedAccount && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '2px' }}>
                                            Link to existing Google account
                                        </p>
                                        <p style={{ fontSize: '12px', color: '#666' }}>
                                            Allows signing in with both email and Google
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="select-field" style={{ marginBottom: '1rem' }}>
                                <select 
                                    id="role" 
                                    required 
                                    value={formData.role}
                                    onChange={handleChange}
                                    disabled={!!googleUser}
                                    style={{ 
                                        width: '100%', 
                                        padding: '16px 20px', 
                                        border: 'none', 
                                        borderRadius: '16px', 
                                        fontSize: '14px', 
                                        fontWeight: '600',
                                        color: formData.role ? '#2d1b3d' : '#6c757d', 
                                        background: 'transparent', 
                                        outline: 'none',
                                        fontFamily: "'DM Sans', sans-serif",
                                        appearance: 'none',
                                        cursor: googleUser ? 'not-allowed' : 'pointer',
                                        opacity: googleUser ? 0.7 : 1
                                    }}
                                >
                                    <option value="student">Student</option>
                                    <option value="instructor">Instructor</option>
                                </select>
                                <div style={{
                                    position: 'absolute',
                                    right: '20px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    pointerEvents: 'none',
                                    color: '#6c757d'
                                }}>
                                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                                        <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                </div>
                            </div>

                        <div className="input-field" style={{ marginBottom: '1rem' }}>
                            <div style={{
                                position: 'relative',
                                background: '#f8f9fa',
                                borderRadius: '16px',
                                border: '1px solid #e9ecef',
                                transition: 'all 0.3s ease'
                            }}>
                                <User style={{ 
                                    position: 'absolute', 
                                    left: '20px', 
                                    top: '50%', 
                                    transform: 'translateY(-50%)',
                                    color: '#6c757d', 
                                    size: 20 
                                }} />
                                <input 
                                    type="text" 
                                    id="name" 
                                    placeholder="Full Name" 
                                    required 
                                    value={formData.name}
                                    onChange={handleChange}
                                    style={{ 
                                        width: '100%', 
                                        padding: '16px 20px 16px 52px', 
                                        border: 'none', 
                                        borderRadius: '16px', 
                                        fontSize: '14px', 
                                        fontWeight: '600',
                                        color: '#2d1b3d', 
                                        background: 'transparent', 
                                        outline: 'none',
                                        fontFamily: "'DM Sans', sans-serif"
                                    }} 
                                />
                            </div>
                        </div>

                        <div className="input-field" style={{ marginBottom: '1rem' }}>
                            <div style={{
                                position: 'relative',
                                background: '#f8f9fa',
                                borderRadius: '16px',
                                border: '1px solid #e9ecef',
                                transition: 'all 0.3s ease'
                            }}>
                                <Mail style={{ 
                                    position: 'absolute', 
                                    left: '20px', 
                                    top: '50%', 
                                    transform: 'translateY(-50%)',
                                    color: '#6c757d', 
                                    size: 20 
                                }} />
                                <input 
                                    type="email" 
                                    id="email" 
                                    placeholder="JMC Email (@jmc.edu.ph)" 
                                    required 
                                    value={formData.email}
                                    onChange={handleChange}
                                    style={{ 
                                        width: '100%', 
                                        padding: '16px 20px 16px 52px', 
                                        border: 'none', 
                                        borderRadius: '16px', 
                                        fontSize: '14px', 
                                        fontWeight: '600',
                                        color: '#2d1b3d', 
                                        background: 'transparent', 
                                        outline: 'none',
                                        fontFamily: "'DM Sans', sans-serif"
                                    }} 
                                />
                            </div>
                            <div style={{ 
                                color: '#dc2626', 
                                fontSize: '11px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                marginTop: '6px', 
                                paddingLeft: '16px',
                                fontFamily: "'DM Sans', sans-serif"
                            }}>
                                <Info size={12} />
                                Only school-issued JMC emails permitted
                            </div>
                        </div>

                        {formData.role === 'student' && (
                            <div id="student-fields">
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                    <div className="input-field" style={{ flex: 1 }}>
                                        <div style={{
                                            position: 'relative',
                                            background: '#f8f9fa',
                                            borderRadius: '16px',
                                            border: '1px solid #e9ecef',
                                            transition: 'all 0.3s ease'
                                        }}>
                                            <Shield style={{ 
                                                position: 'absolute', 
                                                left: '20px', 
                                                top: '50%', 
                                                transform: 'translateY(-50%)',
                                                color: '#6c757d', 
                                                size: 20 
                                            }} />
                                            <input 
                                                type="text" 
                                                id="studentId" 
                                                placeholder="Student ID" 
                                                required 
                                                value={formData.studentId}
                                                onChange={handleChange}
                                                style={{ 
                                                    width: '100%', 
                                                    padding: '16px 20px 16px 52px', 
                                                    border: 'none', 
                                                    borderRadius: '16px', 
                                                    fontSize: '14px', 
                                                    fontWeight: '600',
                                                    color: '#2d1b3d', 
                                                    background: 'transparent', 
                                                    outline: 'none',
                                                    fontFamily: "'DM Sans', sans-serif"
                                                }} 
                                            />
                                        </div>
                                    </div>
                                    <div className="select-field" style={{ flex: 1 }}>
                                        <div style={{
                                            position: 'relative',
                                            background: '#f8f9fa',
                                            borderRadius: '16px',
                                            border: '1px solid #e9ecef',
                                            transition: 'all 0.3s ease'
                                        }}>
                                            <select 
                                                id="program" 
                                                value={formData.program}
                                                onChange={handleChange}
                                                style={{ 
                                                    width: '100%', 
                                                    padding: '16px 20px', 
                                                    border: 'none', 
                                                    borderRadius: '16px', 
                                                    fontSize: '14px', 
                                                    fontWeight: '600',
                                                    color: '#2d1b3d', 
                                                    background: 'transparent', 
                                                    outline: 'none',
                                                    fontFamily: "'DM Sans', sans-serif",
                                                    appearance: 'none',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <option value="BSIT">BSIT</option>
                                                <option value="BSEMC" disabled>BSEMC</option>
                                            </select>
                                            <div style={{
                                                position: 'absolute',
                                                right: '20px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                pointerEvents: 'none',
                                                color: '#6c757d'
                                            }}>
                                                <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                                                    <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="select-field" style={{ marginBottom: '1.5rem' }}>
                                    <div style={{
                                        position: 'relative',
                                        background: '#f8f9fa',
                                        borderRadius: '16px',
                                        border: '1px solid #e9ecef',
                                        transition: 'all 0.3s ease'
                                    }}>
                                        <select 
                                            id="studentType" 
                                            value={formData.studentType}
                                            onChange={handleChange}
                                            style={{ 
                                                width: '100%', 
                                                padding: '16px 20px', 
                                                border: 'none', 
                                                borderRadius: '16px', 
                                                fontSize: '14px', 
                                                fontWeight: '600',
                                                color: '#2d1b3d', 
                                                background: 'transparent', 
                                                outline: 'none',
                                                fontFamily: "'DM Sans', sans-serif",
                                                appearance: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="regular">Regular Enrollment</option>
                                            <option value="irregular">Irregular Enrollment</option>
                                            <option value="transferee">Transferee</option>
                                        </select>
                                        <div style={{
                                            position: 'absolute',
                                            right: '20px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            pointerEvents: 'none',
                                            color: '#6c757d'
                                        }}>
                                            <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                                                <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ 
                                    fontSize: '12px', 
                                    color: '#6a1b9a', 
                                    marginBottom: '1.5rem', 
                                    background: 'rgba(106, 27, 154, 0.05)', 
                                    padding: '12px 16px', 
                                    borderRadius: '12px', 
                                    borderLeft: '3px solid #6a1b9a', 
                                    lineHeight: '1.5',
                                    fontFamily: "'DM Sans', sans-serif"
                                }}>
                                    <strong style={{ fontWeight: '700' }}>Security Note:</strong> Your password will default to your <b>Student ID Number</b>. You can change it after login.
                                </div>
                            </div>
                        )}

                        {formData.role === 'instructor' && (
                            <div className="input-field" style={{ marginBottom: '1.5rem' }}>
                                <div style={{
                                    position: 'relative',
                                    background: '#f8f9fa',
                                    borderRadius: '16px',
                                    border: '1px solid #e9ecef',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <Lock style={{ 
                                        position: 'absolute', 
                                        left: '20px', 
                                        top: '50%', 
                                        transform: 'translateY(-50%)',
                                        color: '#6c757d', 
                                        size: 20 
                                    }} />
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        id="password" 
                                        placeholder="Create Password" 
                                        required 
                                        value={formData.password}
                                        onChange={handleChange}
                                        style={{ 
                                            width: '100%', 
                                            padding: '16px 52px 16px 52px', 
                                            border: 'none', 
                                            borderRadius: '16px', 
                                            fontSize: '14px', 
                                            fontWeight: '600',
                                            color: '#2d1b3d', 
                                            background: 'transparent', 
                                            outline: 'none',
                                            fontFamily: "'DM Sans', sans-serif"
                                        }} 
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{ 
                                            position: 'absolute', 
                                            right: '20px', 
                                            top: '50%', 
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            color: '#6c757d',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            borderRadius: '4px',
                                            transition: 'color 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => e.target.style.color = '#6a1b9a'}
                                        onMouseLeave={(e) => e.target.style.color = '#6c757d'}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isSubmitting || !formData.role}
                            className="register-btn"
                            style={{ 
                                width: '100%', 
                                padding: '16px', 
                                fontSize: '16px', 
                                fontWeight: '800', 
                                color: 'white', 
                                background: '#6a1b9a', 
                                border: 'none', 
                                borderRadius: '16px', 
                                cursor: 'pointer', 
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                opacity: !formData.role ? 0.7 : 1,
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                letterSpacing: '0.5px',
                                position: 'relative'
                            }}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    <span>Creating Account...</span>
                                </>
                            ) : (
                                <>
                                    <span>Register Account</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>

                        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                            <span style={{ fontSize: '13px', color: '#666', fontFamily: "'DM Sans', sans-serif" }}>
                                Already have an account?{' '}
                            </span>
                            <Link 
                                to="/login" 
                                style={{ 
                                    color: '#6a1b9a', 
                                    fontWeight: '700', 
                                    textDecoration: 'none',
                                    fontSize: '13px',
                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                    transition: 'color 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.color = '#8e24aa'}
                                onMouseLeave={(e) => e.target.style.color = '#6a1b9a'}
                            >
                                Login here
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
