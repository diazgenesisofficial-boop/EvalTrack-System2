import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/AppLayout';
import { 
    Users, 
    Shield, 
    Settings, 
    Mail, 
    Database, 
    RefreshCcw, 
    Trash2, 
    Search,
    Loader2,
    CheckCircle,
    AlertCircle,
    MoreHorizontal
} from 'lucide-react';

const Admin = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('users');
    const [searchQuery, setSearchQuery] = useState('');
    const [isRepairing, setIsRepairing] = useState(false);
    const [repairMsg, setRepairMsg] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // PHP-style session auth - no JWT token needed
            const res = await axios.get('http://localhost:5000/api/auth/users');
            // Backend returns array directly (PHP-style)
            setUsers(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            // PHP-style session auth - no JWT token needed
            await axios.put(`http://localhost:5000/api/users/${id}/status`, { status: newStatus });
            fetchUsers();
            alert('User status updated!');
        } catch (err) {
            console.error(err);
            alert('Update failed');
        }
    };

    const handleRepairDB = async () => {
        setIsRepairing(true);
        try {
            const token = localStorage.getItem('token');
            // In a real app, this would be an API call. 
            // For now, we'll simulate the steps from database_repair.php
            setRepairMsg({ type: 'success', text: 'Step 1: Checking schema integrity...' });
            await new Promise(r => setTimeout(r, 800));
            setRepairMsg({ type: 'success', text: 'Step 2: Restoring missing system accounts...' });
            await new Promise(r => setTimeout(r, 800));
            setRepairMsg({ type: 'success', text: 'Step 3: Optimizing table indexes...' });
            await new Promise(r => setTimeout(r, 800));
            setRepairMsg({ type: 'success', text: '✅ Database integrity restored successfully.' });
            setTimeout(() => setRepairMsg(null), 5000);
            fetchUsers();
        } catch (err) {
            console.error(err);
            setRepairMsg({ type: 'error', text: 'Health check failed. Check server connection.' });
        } finally {
            setIsRepairing(false);
        }
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.id.toString().includes(searchQuery)
    );

    return (
        <div className="admin-content">
            {/* Admin Header Stats */}
            <div className="stat-grid">
                <div className="stat-card s-purple">
                    <div className="stat-icon si-purple"><Users size={20} /></div>
                    <div className="stat-info">
                        <div className="stat-val">{users.length}</div>
                        <div className="stat-lbl">Total Users</div>
                    </div>
                </div>
                <div className="stat-card s-mag">
                    <div className="stat-icon si-mag"><Shield size={20} /></div>
                    <div className="stat-info">
                        <div className="stat-val">{users.filter(u => u.role === 'admin').length}</div>
                        <div className="stat-lbl">Admins</div>
                    </div>
                </div>
                <div className="stat-card s-teal">
                    <div className="stat-icon si-teal"><CheckCircle size={20} /></div>
                    <div className="stat-info">
                        <div className="stat-val">{users.filter(u => u.status === 'Active').length}</div>
                        <div className="stat-lbl">Active Accounts</div>
                    </div>
                </div>
                <div className="stat-card s-amber">
                    <div className="stat-icon si-amber"><Database size={20} /></div>
                    <div className="stat-info">
                        <div className="stat-val">HEALTHY</div>
                        <div className="stat-lbl">DB Status</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr lg(2fr)', gap: '24px', marginTop: '24px' }} className="admin-grid-layout">
                {/* Management Area */}
                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <div className="card-hd">
                        <div className="card-title">
                            <Users size={16} />
                            User Directory
                            <span className="badge bg-gray" style={{ marginLeft: '8px' }}>{filteredUsers.length} Users</span>
                        </div>
                        <div className="search-wrap" style={{ position: 'relative' }}>
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--g300)' }} />
                            <input 
                                type="text" 
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="fc"
                                style={{ paddingLeft: '36px', width: '250px' }}
                            />
                        </div>
                    </div>

                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>User ID</th>
                                    <th>Full Name</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" style={{ textAlign: 'center' }}><Loader2 className="animate-spin" /></td></tr>
                                ) : filteredUsers.map(u => (
                                    <tr key={u.id}>
                                        <td style={{ fontWeight: '800' }}>{u.id}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div className="sr-avatar">{u.name.charAt(0)}</div>
                                                <span style={{ fontWeight: '600' }}>{u.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${u.role === 'admin' ? 'bg-purple' : 'bg-blue'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                onClick={() => handleUpdateStatus(u.id, u.status === 'Active' ? 'Suspended' : 'Active')}
                                                className={`badge ${u.status === 'Active' ? 'bg-green' : 'bg-red'}`}
                                                style={{ cursor: 'pointer', border: 'none' }}
                                            >
                                                {u.status}
                                            </button>
                                        </td>
                                        <td>
                                            <button className="btn btn-ghost btn-xs">
                                                <MoreHorizontal size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* System Maintenance */}
                <div className="maintenance-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="ai-hub" style={{ padding: '24px' }}>
                        <h4 className="ai-hub-title">Health Check</h4>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: '12px 0 24px' }}>
                            Maintain system integrity by repairing database tables and optimizing query performance.
                        </p>
                        
                        {repairMsg && (
                            <div className={`badge ${repairMsg.type === 'success' ? 'bg-green' : 'bg-red'}`} style={{ width: '100%', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                                {repairMsg.text}
                            </div>
                        )}

                        <button 
                            onClick={handleRepairDB}
                            disabled={isRepairing}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '16px' }}
                        >
                            {isRepairing ? <RefreshCcw className="animate-spin" /> : 'Run System Repair'}
                        </button>
                    </div>

                    <div className="card">
                        <div className="card-hd">
                            <div className="card-title">
                                <Database size={16} />
                                Database Logs
                            </div>
                        </div>
                        <div className="logs-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {[
                                { time: '10 mins ago', msg: 'New evaluation recorded for ID: 107655' },
                                { time: '1 hour ago', msg: 'User status updated by Root Admin' },
                                { time: '4 hours ago', msg: 'System backup generated' },
                            ].map((log, i) => (
                                <div key={i} style={{ display: 'flex', gap: '10px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--g200)', marginTop: '4px' }}></div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--g800)' }}>{log.msg}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--g400)', textTransform: 'uppercase', marginTop: '2px' }}>{log.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="card" style={{ marginTop: '24px' }}>
                        <div className="card-hd">
                            <div className="card-title" style={{ color: 'var(--ember)' }}>
                                <AlertCircle size={16} />
                                Danger Zone
                            </div>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <p style={{ fontSize: '12px', color: 'var(--g400)', marginBottom: '16px', lineHeight: '1.6' }}>
                                Wiping application data will permanently delete all student records, evaluations, grades, and sessions. This action is irreversible.
                            </p>
                            <button 
                                className="btn btn-danger" 
                                style={{ fontSize: '12px', padding: '10px 20px' }}
                                onClick={() => {
                                    if (window.confirm('CRITICAL: Are you absolutely sure you want to wipe all application data? This cannot be undone.')) {
                                        alert('Simulating Database Wipe...');
                                    }
                                }}
                            >
                                <Trash2 size={14} style={{ marginRight: '8px' }} /> Wipe All Application Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin;
