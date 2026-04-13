import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, 
    FileText, 
    GraduationCap, 
    User, 
    LogOut, 
    Menu, 
    X, 
    Library,
    ChevronRight,
    Clock,
    Home,
    MessageSquare,
    Settings,
    Search,
    Zap,
    CheckCircle,
    BarChart3
} from 'lucide-react';
import Particles from './Particles';

const AppLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { name: 'Home', path: '/', icon: Home, role: ['student', 'instructor', 'admin', 'dean'], group: 'Main' },
        { name: 'My Reports', path: '/reports', icon: FileText, role: ['student'], group: 'My Portal' },
        { name: 'AI Reports', path: '/reports', icon: BarChart3, role: ['instructor', 'admin', 'dean'], group: 'Main' },
        { name: 'Curriculum Evaluation', path: '/curriculum-evaluation', icon: CheckCircle, role: ['student', 'admin', 'dean'], group: 'My Portal' },
        { name: 'Evaluate / Grade', path: '/evaluations', icon: CheckCircle, role: ['instructor', 'admin', 'dean'], group: 'Main' },
        { name: 'Admin Dashboard', path: '/admin-dashboard', icon: Library, role: ['admin', 'registrar'], group: 'Tools' },
        { name: 'AI Exam Generator', path: '/exams', icon: Zap, role: ['instructor', 'admin', 'dean'], group: 'Tools' },
        { name: 'Enrollment', path: '/enrollment', icon: GraduationCap, role: ['student', 'admin', 'dean'], group: 'My Portal' },
        { name: 'Messages', path: '/messages', icon: MessageSquare, role: ['student', 'instructor', 'admin', 'dean'], group: 'Tools' },
        { name: 'Administration', path: '/admin', icon: Library, role: ['admin', 'dean'], group: 'Tools' },
        { name: 'Profile', path: '/profile', icon: User, role: ['student', 'instructor', 'admin', 'dean'], group: 'My Portal' },
    ];

    const filteredNavItems = navItems.filter(item => item.role.includes(user?.role));

    // Group items for display
    const groups = user?.role === 'student' ? ['My Portal'] : ['Main', 'Tools'];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const getPortalSubTitle = () => {
        if (user?.role === 'student') return 'Student Portal';
        if (user?.role === 'admin' || user?.role === 'dean') return 'Dean / Admin Portal';
        return 'Instructor Portal';
    };

    return (
        <div className="portal-container">
            <Particles />
            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`} id="sidebar">
                <div className="sidebar-logo">
                    <img src="/logo.png" alt="JMC" className="sidebar-logo-img" />
                    <div>
                        <div className="sidebar-brand">EvalTrack</div>
                        <div className="sidebar-brand-sub">{getPortalSubTitle()}</div>
                    </div>
                </div>
                
                {groups.map(groupName => (
                    <div className="nav-group" key={groupName}>
                        <div className="nav-group-label">{groupName}</div>
                        {filteredNavItems.filter(item => item.group === groupName).map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`nav-link ${isActive ? 'active' : ''}`}
                                >
                                    <span className="ni">
                                        <Icon size={16} />
                                    </span>
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                ))}

                <div className="sidebar-footer">
                    <div className="sidebar-user-card">
                        <div className="user-avatar">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div style={{ overflow: 'hidden', flex: 1 }}>
                            <div className="user-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user?.name || 'Loading...'}
                            </div>
                            <div className="user-role">
                                {user?.role === 'instructor' ? 'Instructor / Prg. Head' : 
                                 user?.role === 'student' ? `${user?.program || 'BSIT'} • ${user?.student_type || 'Regular'}` :
                                 user?.role === 'admin' || user?.role === 'dean' ? 'Dean / Administrator' : 'User'}
                            </div>
                        </div>
                    </div>
                    <button className="btn-signout" onClick={handleLogout}>
                        <LogOut size={14} style={{ marginRight: '8px' }} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div 
                    className="sidebar-overlay" 
                    onClick={() => setIsSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 250,
                        backdropFilter: 'blur(4px)'
                    }}
                ></div>
            )}

            {/* Topbar */}
            <header className="topbar">
                <div className="topbar-left">
                    <button 
                        className="mob-toggle" 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        style={{ display: 'flex' }}
                    >
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    <div className="topbar-breadcrumb">
                        <div className="topbar-crumb">
                            <Library size={12} />
                            <span>JMC</span>
                            <ChevronRight size={10} />
                        </div>
                        <div className="topbar-page capitalize">
                            {location.pathname === '/' ? 'Home' : location.pathname.substring(1)}
                        </div>
                    </div>
                </div>

                <div className="topbar-right">
                    <div className="tb-pill">
                        <div className="status-dot"></div>
                        <span>System Live</span>
                    </div>
                    <div className="tb-time">
                        <Clock size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                        {currentTime}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="main-wrap">
                <div className="section active">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AppLayout;
