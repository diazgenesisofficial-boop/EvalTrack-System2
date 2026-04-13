import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { googleSignIn } from '../firebase';

const AuthContext = createContext();

// API Base URL matching the backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing session
        const userStr = sessionStorage.getItem('currentUser') || localStorage.getItem('user');
        const token = sessionStorage.getItem('token') || localStorage.getItem('authToken');
        
        if (userStr && token) {
            try {
                const userData = JSON.parse(userStr);
                setUser(userData);
                // Set default auth header for axios
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } catch (e) {
                sessionStorage.removeItem('currentUser');
                sessionStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('authToken');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password, role = 'student') => {
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password, role });
            if (res.data.success) {
                // Store in both session and local for persistence
                sessionStorage.setItem('currentUser', JSON.stringify(res.data.user));
                sessionStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                localStorage.setItem('authToken', res.data.token);
                
                // Set auth header
                axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
                
                setUser(res.data.user);
                return res.data;
            }
        } catch (err) {
            return { 
                success: false, 
                message: err.response?.data?.message || 'Login failed',
                requiresGoogleLink: err.response?.data?.requiresGoogleLink,
                accountExists: err.response?.data?.accountExists,
                googleUid: err.response?.data?.googleUid
            };
        }
    };

    const loginWithGoogle = async (firebaseUser) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/login`, {
                email: firebaseUser.email,
                isGoogleLogin: true,
                googleUid: firebaseUser.uid,
                role: 'student'
            });

            if (res.data.success) {
                sessionStorage.setItem('currentUser', JSON.stringify(res.data.user));
                sessionStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                localStorage.setItem('authToken', res.data.token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
                setUser(res.data.user);
                return { success: true, ...res.data };
            }
        } catch (err) {
            const data = err.response?.data || {};
            return {
                success: false,
                message: data.message || 'Google login failed',
                needsRegistration: data.needsRegistration,
                accountExists: data.accountExists,
                googleUid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL
            };
        }
    };

    const register = async (userData) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/register`, userData);
            return res.data;
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || 'Registration failed',
                accountExists: err.response?.data?.accountExists
            };
        }
    };

    const linkAccount = async (email, googleUid, password) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/link-account`, {
                email,
                googleUid,
                password
            });

            if (res.data.success) {
                sessionStorage.setItem('currentUser', JSON.stringify(res.data.user));
                sessionStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                localStorage.setItem('authToken', res.data.token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
                setUser(res.data.user);
            }
            return res.data;
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || 'Failed to link accounts'
            };
        }
    };

    const forgotPassword = async (email) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
                email,
                role: 'student'
            });
            return res.data;
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || 'Request failed'
            };
        }
    };

    const logout = () => {
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    const checkAuth = (allowedRoles) => {
        const userStr = sessionStorage.getItem('currentUser') || localStorage.getItem('user');
        if (!userStr) return null;
        
        const userData = JSON.parse(userStr);
        if (allowedRoles && !allowedRoles.includes(userData.role)) {
            return null;
        }
        return userData;
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            login, 
            loginWithGoogle,
            register,
            linkAccount,
            forgotPassword,
            logout, 
            loading, 
            checkAuth, 
            API_BASE_URL 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
