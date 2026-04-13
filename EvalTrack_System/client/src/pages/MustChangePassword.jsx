import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Particles from '../components/Particles';

const MustChangePassword = () => {
    const { user, logout } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    if (!user || !user.must_change_password) {
        return <Navigate to="/" />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });

        if (newPassword !== confirmPassword) {
            setStatus({ type: 'error', message: 'Passwords do not match.' });
            return;
        }

        if (newPassword.length < 6) {
            setStatus({ type: 'error', message: 'Password must be at least 6 characters.' });
            return;
        }

        setIsSubmitting(true);
        try {
            // PHP-style session auth - no JWT token needed
            const res = await axios.post(`http://localhost:5000/api/auth/change-password`, {
                id: user.id,
                new_password: newPassword
            });

            if (res.data.success) {
                setStatus({ type: 'success', message: 'Password updated! Redirecting to portal...' });
                setTimeout(() => {
                    // Update local user state or force re-login
                    logout();
                    navigate('/login');
                }, 2000);
            } else {
                setStatus({ type: 'error', message: res.data.message || 'Update failed' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Server connection error.' });
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
            position: 'relative'
        }}>
            <Particles />
            <div className="password-container" style={{ 
                background: 'rgba(255, 255, 255, 0.95)', 
                width: '100%',
                maxWidth: '400px', 
                padding: '40px', 
                borderRadius: '20px', 
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                zIndex: 10
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ 
                        width: '60px', 
                        height: '60px', 
                        background: '#6a1b9a', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        margin: '0 auto 20px',
                        color: 'white'
                    }}>
                        <Lock size={30} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', color: '#4a148c', fontWeight: '700', marginBottom: '10px' }}>
                        Set New Password
                    </h2>
                    <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: '1.5' }}>
                        For security, please change your password before continuing to the EvalTrack portal.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {status.message && (
                        <div style={{ 
                            background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                            color: status.type === 'success' ? '#059669' : '#dc2626', 
                            padding: '12px 15px', 
                            borderRadius: '10px', 
                            marginBottom: '20px', 
                            fontSize: '0.85rem', 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            border: `1px solid ${status.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                        }}>
                            {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                            {status.message}
                        </div>
                    )}

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#4a148c', marginBottom: '8px', textTransform: 'uppercase' }}>
                            New Password
                        </label>
                        <input 
                            type="password" 
                            required 
                            className="fc"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #ddd' }}
                            placeholder="Min. 6 characters"
                        />
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#4a148c', marginBottom: '8px', textTransform: 'uppercase' }}>
                            Confirm New Password
                        </label>
                        <input 
                            type="password" 
                            required 
                            className="fc"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #ddd' }}
                            placeholder="Repeat new password"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="btn btn-primary" 
                        style={{ width: '100%', padding: '14px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyCenter: 'center', gap: '10px' }}
                    >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                        Update Password
                    </button>
                </form>
            </div>
        </div>
    );
};

export default MustChangePassword;
