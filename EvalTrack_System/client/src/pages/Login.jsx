import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Lock, Mail, Loader2, Eye, EyeOff, User, AlertCircle, 
  GraduationCap, UserCircle, ArrowRight, Key, Link as LinkIcon
} from 'lucide-react';
import Particles from '../components/Particles';
import { googleSignIn } from '../firebase';
import '../styles/login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Role and auth method states
    const [activeRole, setActiveRole] = useState('faculty');
    const [studentAuthMethod, setStudentAuthMethod] = useState('google');
    
    // Modal states
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [linkPassword, setLinkPassword] = useState('');
    const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
    
    const { login, loginWithGoogle, linkAccount, forgotPassword } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        
        const result = await login(email, password, activeRole);
        
        if (result.success) {
            if (result.user.must_change_password) {
                navigate('/must-change-password');
            } else {
                navigate(result.user.role === 'admin' ? '/admin' : 
                         result.user.role === 'student' ? '/student' : '/');
            }
        } else if (result.requiresGoogleLink) {
            setPendingGoogleUser({ email, uid: result.googleUid });
            setShowLinkModal(true);
        } else {
            setError(result.message);
        }
        
        setIsSubmitting(false);
    };

    // Handle Google Sign In
    const handleGoogleSignIn = async () => {
        setError('');
        setIsSubmitting(true);
        
        const firebaseResult = await googleSignIn();
        
        if (!firebaseResult.success) {
            setError(firebaseResult.error || 'Google sign-in failed');
            setIsSubmitting(false);
            return;
        }
        
        const result = await loginWithGoogle(firebaseResult.user);
        
        if (result.success) {
            navigate('/student');
        } else if (result.accountExists) {
            setPendingGoogleUser({
                email: result.email,
                uid: result.googleUid,
                displayName: result.displayName,
                photoURL: result.photoURL
            });
            setShowLinkModal(true);
        } else if (result.needsRegistration) {
            sessionStorage.setItem('tempGoogleUser', JSON.stringify({
                email: result.email,
                name: result.displayName,
                uid: result.googleUid,
                photoURL: result.photoURL
            }));
            navigate('/register');
        } else {
            setError(result.message);
        }
        
        setIsSubmitting(false);
    };

    // Handle account linking
    const handleLinkAccount = async () => {
        if (!linkPassword || !pendingGoogleUser) return;
        
        setIsSubmitting(true);
        const result = await linkAccount(pendingGoogleUser.email, pendingGoogleUser.uid, linkPassword);
        
        if (result.success) {
            navigate('/student');
        } else {
            setError(result.message);
        }
        
        setIsSubmitting(false);
    };

    // Handle forgot password
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!forgotEmail) return;
        
        setIsSubmitting(true);
        const result = await forgotPassword(forgotEmail);
        
        if (result.success) {
            alert('Password reset link sent to your email!');
            setShowForgotModal(false);
            setForgotEmail('');
        } else {
            setError(result.message);
        }
        
        setIsSubmitting(false);
    };

    const closeModals = () => {
        setShowForgotModal(false);
        setShowLinkModal(false);
        setLinkPassword('');
        setPendingGoogleUser(null);
        setError('');
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
                    .role-btn {
                        transition: all 0.3s ease;
                        position: relative;
                        overflow: hidden;
                    }
                    .role-btn::after {
                        content: '';
                        position: absolute;
                        bottom: 0;
                        left: 50%;
                        width: 0;
                        height: 3px;
                        background: #6a1b9a;
                        transition: all 0.3s ease;
                        transform: translateX(-50%);
                    }
                    .role-btn.active::after {
                        width: 60%;
                    }
                    .google-btn {
                        transition: all 0.3s ease;
                        border: 2px solid #e0e0e0;
                    }
                    .google-btn:hover {
                        border-color: #6a1b9a;
                        transform: translateY(-2px);
                        box-shadow: 0 8px 20px rgba(106, 27, 154, 0.15);
                    }
                    .login-btn {
                        transition: all 0.3s ease;
                        position: relative;
                        overflow: hidden;
                    }
                    .login-btn:hover:not(:disabled) {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 25px rgba(106, 27, 154, 0.3);
                    }
                    .login-btn::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: -100%;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                        transition: left 0.5s;
                    }
                    .login-btn:hover:not(:disabled)::before {
                        left: 100%;
                    }
                    @keyframes slideUp {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .slide-up { animation: slideUp 0.3s ease-out; }
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    .modal-overlay { animation: fadeIn 0.3s ease-out; }
                `}
            </style>
            <Particles />
            <div className="auth-card" style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                width: '900px', 
                maxWidth: '90vw', 
                height: '520px',
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
                    flex: 1.2, 
                    padding: '2.5rem 3rem', 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    background: '#ffffff',
                    overflowY: 'auto'
                }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ 
                            fontSize: '26px', 
                            color: '#4a148c', 
                            marginBottom: '0.5rem', 
                            fontWeight: '900',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            letterSpacing: '-1px'
                        }}>
                            Welcome Back
                        </h2>
                        <p style={{ 
                            color: '#666', 
                            fontSize: '13px',
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: '400'
                        }}>
                            Sign in to access your academic portal
                        </p>
                    </div>

                    {/* Role Selector */}
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '1.25rem',
                        background: '#f5f5f5',
                        padding: '4px',
                        borderRadius: '12px'
                    }}>
                        <button
                            type="button"
                            onClick={() => setActiveRole('faculty')}
                            className={`role-btn ${activeRole === 'faculty' ? 'active' : ''}`}
                            style={{
                                flex: 1,
                                padding: '10px 16px',
                                border: 'none',
                                background: activeRole === 'faculty' ? 'white' : 'transparent',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                color: activeRole === 'faculty' ? '#6a1b9a' : '#666',
                                boxShadow: activeRole === 'faculty' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                            }}
                        >
                            <UserCircle size={16} />
                            Faculty
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveRole('student')}
                            className={`role-btn ${activeRole === 'student' ? 'active' : ''}`}
                            style={{
                                flex: 1,
                                padding: '10px 16px',
                                border: 'none',
                                background: activeRole === 'student' ? 'white' : 'transparent',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                color: activeRole === 'student' ? '#6a1b9a' : '#666',
                                boxShadow: activeRole === 'student' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                            }}
                        >
                            <GraduationCap size={16} />
                            Student
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="error-shake" style={{ 
                            background: 'rgba(239, 68, 68, 0.08)', 
                            color: '#dc2626', 
                            padding: '12px 16px', 
                            borderRadius: '12px', 
                            marginBottom: '1rem', 
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

                    {/* FACULTY LOGIN FORM */}
                    {activeRole === 'faculty' && (
                        <form onSubmit={handleSubmit} className="slide-up">
                            <div className="input-field" style={{ marginBottom: '1rem' }}>
                                <div style={{
                                    position: 'relative',
                                    background: '#f8f9fa',
                                    borderRadius: '16px',
                                    border: '1px solid #e9ecef'
                                }}>
                                    <User style={{ 
                                        position: 'absolute', 
                                        left: '18px', 
                                        top: '50%', 
                                        transform: 'translateY(-50%)',
                                        color: '#6c757d', 
                                        size: 18 
                                    }} />
                                    <input 
                                        type="text" 
                                        placeholder="Email or Faculty ID" 
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '14px 18px 14px 48px', 
                                            border: 'none', 
                                            borderRadius: '16px', 
                                            fontSize: '14px', 
                                            fontWeight: '500',
                                            color: '#2d1b3d', 
                                            background: 'transparent', 
                                            outline: 'none'
                                        }} 
                                    />
                                </div>
                            </div>

                            <div className="input-field" style={{ marginBottom: '0.5rem' }}>
                                <div style={{
                                    position: 'relative',
                                    background: '#f8f9fa',
                                    borderRadius: '16px',
                                    border: '1px solid #e9ecef'
                                }}>
                                    <Lock style={{ 
                                        position: 'absolute', 
                                        left: '18px', 
                                        top: '50%', 
                                        transform: 'translateY(-50%)',
                                        color: '#6c757d', 
                                        size: 18 
                                    }} />
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="Password" 
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '14px 48px 14px 48px', 
                                            border: 'none', 
                                            borderRadius: '16px', 
                                            fontSize: '14px', 
                                            fontWeight: '500',
                                            color: '#2d1b3d', 
                                            background: 'transparent', 
                                            outline: 'none'
                                        }} 
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{ 
                                            position: 'absolute', 
                                            right: '16px', 
                                            top: '50%', 
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            color: '#6c757d',
                                            cursor: 'pointer',
                                            padding: '4px'
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div style={{ textAlign: 'right', marginBottom: '1.25rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotModal(true)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#6a1b9a',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    Forgot password?
                                </button>
                            </div>

                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="login-btn"
                                style={{ 
                                    width: '100%', 
                                    padding: '14px', 
                                    fontSize: '15px', 
                                    fontWeight: '700', 
                                    color: 'white', 
                                    background: '#6a1b9a', 
                                    border: 'none', 
                                    borderRadius: '14px', 
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                    opacity: isSubmitting ? 0.8 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                {isSubmitting ? (
                                    <><Loader2 size={18} className="animate-spin" /> Signing in...</>
                                ) : (
                                    <><Lock size={18} /> Sign In</>
                                )}
                            </button>
                        </form>
                    )}

                    {/* STUDENT LOGIN */}
                    {activeRole === 'student' && (
                        <div className="slide-up">
                            {/* Student Auth Method Toggle */}
                            <div style={{
                                display: 'flex',
                                gap: '8px',
                                marginBottom: '1.25rem',
                                background: '#f0e6f5',
                                padding: '4px',
                                borderRadius: '10px'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setStudentAuthMethod('google')}
                                    style={{
                                        flex: 1,
                                        padding: '10px 14px',
                                        border: 'none',
                                        background: studentAuthMethod === 'google' ? 'white' : 'transparent',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        color: studentAuthMethod === 'google' ? '#6a1b9a' : '#666',
                                        boxShadow: studentAuthMethod === 'google' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    </svg>
                                    Google
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStudentAuthMethod('email')}
                                    style={{
                                        flex: 1,
                                        padding: '10px 14px',
                                        border: 'none',
                                        background: studentAuthMethod === 'email' ? 'white' : 'transparent',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        color: studentAuthMethod === 'email' ? '#6a1b9a' : '#666',
                                        boxShadow: studentAuthMethod === 'email' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <Mail size={14} />
                                    Email
                                </button>
                            </div>

                            {/* Google Sign In */}
                            {studentAuthMethod === 'google' && (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleGoogleSignIn}
                                        disabled={isSubmitting}
                                        className="google-btn"
                                        style={{
                                            width: '100%',
                                            padding: '14px',
                                            background: 'white',
                                            borderRadius: '14px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#333',
                                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '10px',
                                            marginBottom: '1rem'
                                        }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        </svg>
                                        {isSubmitting ? 'Signing in...' : 'Sign in with Google'}
                                    </button>

                                    <div style={{
                                        textAlign: 'center',
                                        marginTop: '1rem',
                                        padding: '12px',
                                        background: '#f8f9fa',
                                        borderRadius: '10px'
                                    }}>
                                        <p style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>
                                            New student?
                                        </p>
                                        <Link
                                            to="/register"
                                            style={{
                                                color: '#6a1b9a',
                                                fontWeight: '700',
                                                fontSize: '13px',
                                                textDecoration: 'none',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            Complete registration <ArrowRight size={14} />
                                        </Link>
                                    </div>
                                </>
                            )}

                            {/* Email/Password Sign In */}
                            {studentAuthMethod === 'email' && (
                                <form onSubmit={handleSubmit}>
                                    <div className="input-field" style={{ marginBottom: '1rem' }}>
                                        <div style={{
                                            position: 'relative',
                                            background: '#f8f9fa',
                                            borderRadius: '16px',
                                            border: '1px solid #e9ecef'
                                        }}>
                                            <Mail style={{ 
                                                position: 'absolute', 
                                                left: '18px', 
                                                top: '50%', 
                                                transform: 'translateY(-50%)',
                                                color: '#6c757d', 
                                                size: 18 
                                            }} />
                                            <input 
                                                type="email" 
                                                placeholder="Student Email" 
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                style={{ 
                                                    width: '100%', 
                                                    padding: '14px 18px 14px 48px', 
                                                    border: 'none', 
                                                    borderRadius: '16px', 
                                                    fontSize: '14px', 
                                                    fontWeight: '500',
                                                    color: '#2d1b3d', 
                                                    background: 'transparent', 
                                                    outline: 'none'
                                                }} 
                                            />
                                        </div>
                                    </div>

                                    <div className="input-field" style={{ marginBottom: '0.5rem' }}>
                                        <div style={{
                                            position: 'relative',
                                            background: '#f8f9fa',
                                            borderRadius: '16px',
                                            border: '1px solid #e9ecef'
                                        }}>
                                            <Lock style={{ 
                                                position: 'absolute', 
                                                left: '18px', 
                                                top: '50%', 
                                                transform: 'translateY(-50%)',
                                                color: '#6c757d', 
                                                size: 18 
                                            }} />
                                            <input 
                                                type={showPassword ? "text" : "password"} 
                                                placeholder="Password" 
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                style={{ 
                                                    width: '100%', 
                                                    padding: '14px 48px 14px 48px', 
                                                    border: 'none', 
                                                    borderRadius: '16px', 
                                                    fontSize: '14px', 
                                                    fontWeight: '500',
                                                    color: '#2d1b3d', 
                                                    background: 'transparent', 
                                                    outline: 'none'
                                                }} 
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                style={{ 
                                                    position: 'absolute', 
                                                    right: '16px', 
                                                    top: '50%', 
                                                    transform: 'translateY(-50%)',
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#6c757d',
                                                    cursor: 'pointer',
                                                    padding: '4px'
                                                }}
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'right', marginBottom: '1.25rem' }}>
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotModal(true)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#6a1b9a',
                                                fontSize: '12px',
                                                cursor: 'pointer',
                                                fontWeight: '600'
                                            }}
                                        >
                                            Forgot password?
                                        </button>
                                    </div>

                                    <button 
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="login-btn"
                                        style={{ 
                                            width: '100%', 
                                            padding: '14px', 
                                            fontSize: '15px', 
                                            fontWeight: '700', 
                                            color: 'white', 
                                            background: '#6a1b9a', 
                                            border: 'none', 
                                            borderRadius: '14px', 
                                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                            opacity: isSubmitting ? 0.8 : 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        {isSubmitting ? (
                                            <><Loader2 size={18} className="animate-spin" /> Signing in...</>
                                        ) : (
                                            <><Lock size={18} /> Sign In</>
                                        )}
                                    </button>

                                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                                        <span style={{ fontSize: '12px', color: '#666' }}>
                                            Don't have an account?{' '}
                                            <Link to="/register" style={{ color: '#6a1b9a', fontWeight: '700' }}>
                                                Register
                                            </Link>
                                        </span>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotModal && (
                <div 
                    className="modal-overlay"
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000
                    }}
                    onClick={(e) => e.target === e.currentTarget && setShowForgotModal(false)}
                >
                    <div style={{
                        background: 'white',
                        borderRadius: '20px',
                        padding: '32px',
                        maxWidth: '400px',
                        width: '90%',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #6a1b9a, #8e24aa)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px'
                            }}>
                                <Key size={28} color="white" />
                            </div>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#333', marginBottom: '8px' }}>
                                Reset Password
                            </h3>
                            <p style={{ fontSize: '13px', color: '#666' }}>
                                Enter your email and we'll send you a reset link
                            </p>
                        </div>

                        <form onSubmit={handleForgotPassword}>
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{
                                    position: 'relative',
                                    background: '#f8f9fa',
                                    borderRadius: '14px',
                                    border: '1px solid #e9ecef'
                                }}>
                                    <Mail style={{ 
                                        position: 'absolute', 
                                        left: '16px', 
                                        top: '50%', 
                                        transform: 'translateY(-50%)',
                                        color: '#6c757d', 
                                        size: 16 
                                    }} />
                                    <input 
                                        type="email" 
                                        placeholder="your.email@jmc.edu.ph"
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        required
                                        style={{ 
                                            width: '100%', 
                                            padding: '12px 16px 12px 44px', 
                                            border: 'none', 
                                            borderRadius: '14px', 
                                            fontSize: '14px', 
                                            outline: 'none',
                                            background: 'transparent'
                                        }} 
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                style={{ 
                                    width: '100%', 
                                    padding: '14px', 
                                    fontSize: '14px', 
                                    fontWeight: '700', 
                                    color: 'white', 
                                    background: '#6a1b9a', 
                                    border: 'none', 
                                    borderRadius: '12px', 
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                    opacity: isSubmitting ? 0.8 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    marginBottom: '12px'
                                }}
                            >
                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                            </button>

                            <button 
                                type="button"
                                onClick={() => setShowForgotModal(false)}
                                style={{ 
                                    width: '100%', 
                                    padding: '12px', 
                                    fontSize: '13px', 
                                    fontWeight: '600', 
                                    color: '#666', 
                                    background: '#f5f5f5', 
                                    border: 'none', 
                                    borderRadius: '12px', 
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Link Account Modal */}
            {showLinkModal && pendingGoogleUser && (
                <div 
                    className="modal-overlay"
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000
                    }}
                    onClick={(e) => e.target === e.currentTarget && closeModals()}
                >
                    <div style={{
                        background: 'white',
                        borderRadius: '20px',
                        padding: '32px',
                        maxWidth: '420px',
                        width: '90%',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #6a1b9a, #8e24aa)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px'
                            }}>
                                <LinkIcon size={28} color="white" />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#333', marginBottom: '8px' }}>
                                Link Google Account
                            </h3>
                            <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.5' }}>
                                An account already exists for <strong>{pendingGoogleUser.email}</strong>.<br />
                                Enter your existing password to link your Google sign-in.
                            </p>
                        </div>

                        {error && (
                            <div style={{ 
                                background: 'rgba(239, 68, 68, 0.08)', 
                                color: '#dc2626', 
                                padding: '10px 14px', 
                                borderRadius: '10px', 
                                marginBottom: '16px', 
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '6px', display: 'block' }}>
                                Current Password
                            </label>
                            <div style={{
                                position: 'relative',
                                background: '#f8f9fa',
                                borderRadius: '14px',
                                border: '1px solid #e9ecef'
                            }}>
                                <Lock style={{ 
                                    position: 'absolute', 
                                    left: '16px', 
                                    top: '50%', 
                                    transform: 'translateY(-50%)',
                                    color: '#6c757d', 
                                    size: 16 
                                }} />
                                <input 
                                    type="password" 
                                    placeholder="Enter your existing password"
                                    value={linkPassword}
                                    onChange={(e) => setLinkPassword(e.target.value)}
                                    style={{ 
                                        width: '100%', 
                                        padding: '12px 16px 12px 44px', 
                                        border: 'none', 
                                        borderRadius: '14px', 
                                        fontSize: '14px', 
                                        outline: 'none',
                                        background: 'transparent'
                                    }} 
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handleLinkAccount}
                            disabled={isSubmitting || !linkPassword}
                            style={{ 
                                width: '100%', 
                                padding: '14px', 
                                fontSize: '14px', 
                                fontWeight: '700', 
                                color: 'white', 
                                background: '#6a1b9a', 
                                border: 'none', 
                                borderRadius: '12px', 
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                opacity: isSubmitting ? 0.8 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                marginBottom: '10px'
                            }}
                        >
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <LinkIcon size={16} />}
                            {isSubmitting ? 'Linking...' : 'Link Accounts'}
                        </button>

                        <button 
                            onClick={() => navigate('/register')}
                            style={{ 
                                width: '100%', 
                                padding: '12px', 
                                fontSize: '13px', 
                                fontWeight: '600', 
                                color: '#6a1b9a', 
                                background: '#f0e6f5', 
                                border: 'none', 
                                borderRadius: '12px', 
                                cursor: 'pointer',
                                marginBottom: '10px'
                            }}
                        >
                            Create New Account Instead
                        </button>

                        <button 
                            onClick={closeModals}
                            style={{ 
                                width: '100%', 
                                padding: '10px', 
                                fontSize: '13px', 
                                fontWeight: '500', 
                                color: '#666', 
                                background: 'transparent', 
                                border: 'none', 
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
