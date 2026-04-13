import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
    Briefcase, 
    Calendar, 
    Target, 
    BookOpen, 
    Sparkle, 
    ArrowRight,
    Map,
    Flag,
    Search,
    MessageSquare,
    ChevronRight,
    Clock,
    LayoutDashboard,
    Zap,
    Users,
    TrendingUp,
    Shield,
    GraduationCap,
    AlertTriangle,
    BarChart3,
    Lightbulb,
    PieChart,
    LineChart
} from 'lucide-react';
import ChatbotModal from '../components/ChatbotModal';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ 
        students: '0', 
        pending: '0', 
        avg: '0',
        totalUsers: '0',
        irregular: '0',
        evaluations: '0'
    });
    const [chatbot, setChatbot] = useState({
        isOpen: false,
        title: '',
        intro: ''
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // PHP-style session auth - no JWT token needed
                const usersRes = await axios.get('http://localhost:5000/api/auth/users');
                const evalsRes = await axios.get('http://localhost:5000/api/evaluations');
                
                // Backend returns array directly (PHP-style)
                const allUsers = Array.isArray(usersRes.data) ? usersRes.data : [];
                const students = allUsers.filter(u => u.role === 'student');
                const evaluations = Array.isArray(evalsRes.data) ? evalsRes.data : [];

                // Mocking irregular status for stats (in a real app, this would come from a specific endpoint or field)
                const irregularCount = students.filter(s => s.student_type === 'irregular').length || '5';

                setStats({
                    totalUsers: allUsers.length.toString(),
                    students: students.length.toString(),
                    irregular: irregularCount.toString(),
                    evaluations: evaluations.length.toString(),
                    pending: '5', // placeholder
                    avg: (evaluations.reduce((acc, curr) => acc + parseFloat(curr.grade || 0), 0) / (evaluations.length || 1)).toFixed(1)
                });
            } catch (err) {
                console.error(err);
            }
        };
        fetchStats();
    }, [user]);

    const openChat = (title, intro) => {
        setChatbot({ isOpen: true, title, intro });
    };

    const instructorTools = [
        {
            icon: <Calendar size={22} />,
            color: 'ti-purple',
            title: 'Dean Scheduling',
            desc: 'Automate meeting coordination with the Dean\'s schedule using AI-powered planning.',
            intro: 'Hello Program Head! Let me know what times you are free to meet the Dean this week and I will help coordinate.',
            btnIcon: <Calendar size={16} />,
            btnText: 'Schedule Meeting'
        },
        {
            icon: <BookOpen size={22} />,
            color: 'ti-amber',
            title: 'Curriculum Resources',
            desc: 'Get curated links to teaching materials, syllabi, and reference books for your subjects.',
            intro: 'Hello Program Head! Which subject are you looking for reference materials or textbooks for?',
            btnIcon: <Search size={16} />,
            btnText: 'Find Materials'
        },
        {
            icon: <Target size={22} />,
            color: 'ti-teal',
            title: 'Teaching Goal Coach',
            desc: 'Set and track professional teaching goals, class performance targets, and curriculum milestones.',
            intro: 'Welcome, Program Head! Are you looking to improve class passing rates, reduce failure counts, or refine curriculum delivery?',
            btnIcon: <Flag size={16} />,
            btnText: 'Set Goals'
        },
        {
            icon: <Sparkle size={22} />,
            color: 'ti-mag',
            title: 'AI Exam Generator',
            desc: 'Paste a topic or syllabus block and instantly generate quizzes, MCQs, and rubrics.',
            intro: 'Hello Program Head! Paste your topic or syllabus block here and I will generate a structured 10-question quiz for it.',
            btnIcon: <Zap size={16} />,
            btnText: 'Generate Exam'
        }
    ];

    const studentTools = [
        {
            icon: <Briefcase size={22} />,
            color: 'ti-purple',
            title: 'Career Path Advisor',
            desc: 'Tell the AI your dream IT role — get a complete, personalized roadmap with required skills and certifications.',
            intro: 'Hello! What is your dream job within Information Technology? (e.g., Full-Stack Developer, Data Scientist, Cybersecurity Analyst). Let me map out a complete roadmap for you!',
            btnIcon: <Map size={16} />,
            btnText: 'Start Planning'
        },
        {
            icon: <Calendar size={22} />,
            color: 'ti-amber',
            title: 'Smart Schedule Builder',
            desc: 'Generate an optimized, printable study schedule. Tell the AI your subjects and it will build your week.',
            intro: 'Hi! To build your schedule, tell me: which subjects are you enrolled in this semester, and what days/hours are you free to study?',
            btnIcon: <Calendar size={16} />,
            btnText: 'Build Schedule'
        },
        {
            icon: <Target size={22} />,
            color: 'ti-teal',
            title: 'Study Goal Coach',
            desc: 'Set study goals, identify problem subjects, and get an accountability plan from the AI coach.',
            intro: 'Welcome! Are you struggling with a specific subject, or looking to build better study habits and improve your GPA?',
            btnIcon: <Flag size={16} />,
            btnText: 'Set My Goals'
        },
        {
            icon: <BookOpen size={22} />,
            color: 'ti-blue',
            title: 'Book & Resource Finder',
            desc: 'Get curated textbooks, free online courses, and educational resources based on your current subjects.',
            intro: 'Hello! What specific IT topic, programming language, or subject are you studying? I will recommend the best books and free online resources for you.',
            btnIcon: <Search size={16} />,
            btnText: 'Find Resources'
        }
    ];

    const instructorStats = [
        { label: 'Active Students', value: stats.students, icon: <Users size={20} />, class: 's-purple', iconClass: 'si-purple' },
        { label: 'Total Evaluations', value: stats.evaluations, icon: <BarChart3 size={20} />, class: 's-amber', iconClass: 'si-green' },
        { label: 'Class GPA (Avg)', value: stats.avg, icon: <LineChart size={20} />, class: 's-teal', iconClass: 'si-teal' },
    ];

    const adminStats = [
        { label: 'Total Users', value: stats.totalUsers, icon: <Users size={20} />, class: 's-purple', iconClass: 'si-purple' },
        { label: 'Total Students', value: stats.students, icon: <GraduationCap size={20} />, class: 's-teal', iconClass: 'si-teal' },
        { label: 'Irregular Students', value: stats.irregular, icon: <AlertTriangle size={20} />, class: 's-mag', iconClass: 'si-red' },
        { label: 'Evaluations', value: stats.evaluations, icon: <BarChart3 size={20} />, class: 's-amber', iconClass: 'si-green' },
    ];

    const adminTools = [
        {
            icon: <Shield size={22} />,
            color: 'ti-purple',
            title: 'Academic Strategy',
            desc: 'Simulate program expansion plans, improve enrollment retention, and project future KPIs.',
            intro: 'Hello Dean. Are you looking to expand program offerings, improve student retention, or optimize the BSIT curriculum?',
            btnIcon: <Lightbulb size={16} />,
            btnText: 'Strategy AI'
        },
        {
            icon: <Calendar size={22} />,
            color: 'ti-amber',
            title: 'Meeting Scheduler',
            desc: 'Coordinate meetings with Program Heads and faculty efficiently using AI scheduling.',
            intro: 'Hello Dean! Which Program Head or faculty member do you need to meet with? Tell me your available days and times.',
            btnIcon: <Calendar size={16} />,
            btnText: 'Schedule Meeting'
        },
        {
            icon: <PieChart size={22} />,
            color: 'ti-teal',
            title: 'KPI Tracker',
            desc: 'Track institutional KPIs — passing rates, enrollment trends, and retention statistics.',
            intro: 'Welcome, Dean. What metrics are you currently tracking for this semester? (e.g., passing rates, enrollment counts, irregular student reduction)',
            btnIcon: <Target size={16} />,
            btnText: 'Track KPIs'
        }
    ];

    const currentTools = user?.role === 'student' ? studentTools : (user?.role === 'admin' || user?.role === 'dean' ? adminTools : instructorTools);
    const currentStats = user?.role === 'admin' || user?.role === 'dean' ? adminStats : instructorStats;

    return (
        <div className="dashboard-content animate-in fade-in duration-700">
            {/* AI HUB HERO */}
            <div className="ai-hub" style={{
                background: user?.role === 'student' 
                    ? 'linear-gradient(135deg, #1a1a2e, #16213e)' 
                    : 'linear-gradient(135deg, #4a148c, #7b1fa2)',
                borderRadius: '24px',
                padding: '40px',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: '32px',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div className="stars"></div>
                <div className="ai-hub-header" style={{ position: 'relative', zIndex: 10 }}>
                    <div className="ai-hub-badge" style={{
                        background: 'rgba(255,255,255,0.1)',
                        padding: '6px 12px',
                        borderRadius: '100px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '11px',
                        fontWeight: '800',
                        color: 'white',
                        marginBottom: '20px',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                        <Sparkle size={14} />
                        AI Intelligence Hub
                    </div>
                    <h2 className="ai-hub-title" style={{ fontSize: '32px', fontWeight: '900', color: 'white', lineHeight: '1.2' }}>
                        {user?.role === 'student' ? 'AI Learning ' : (user?.role === 'admin' || user?.role === 'dean' ? 'Dean AI ' : 'Instructor AI ')}
                        <span style={{ color: '#ab47bc' }}>{user?.role === 'student' ? 'Assistants' : (user?.role === 'admin' || user?.role === 'dean' ? 'Command Center' : 'Tooling')}</span>
                        <small style={{ display: 'block', fontSize: '14px', fontWeight: '500', opacity: 0.7, marginTop: '8px' }}>
                            {user?.role === 'student' ? 'Personalized AI advisors to guide your academic and professional journey' : 
                             (user?.role === 'admin' || user?.role === 'dean' ? 'Executive-level AI assistants for institutional strategy & management' : 
                             'Quick-access AI assistants for Program Heads at Jose Maria College')}
                        </small>
                    </h2>
                </div>

                <div className="hub-panel" style={{
                    marginTop: '32px',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '24px',
                    borderRadius: '20px',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    position: 'relative',
                    zIndex: 10
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '8px' }}>
                        <div className="hub-avatar" style={{
                            width: '56px',
                            height: '56px',
                            background: 'linear-gradient(135deg, #ab47bc, #7b1fa2)',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            fontWeight: '900',
                            color: 'white'
                        }}>{user?.name?.charAt(0)}</div>
                        <div>
                            <div className="hub-greeting" style={{ fontSize: '18px', fontWeight: '800', color: 'white' }}>Welcome back, {user?.name?.split(' ')[0]}!</div>
                            <div className="hub-status" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                                {user?.role === 'student' 
                                    ? `${user?.program || 'BSIT'} · Year ${user?.year_level || '1'} · ${user?.student_type || 'Regular'} Student · ID: ${user?.id}` 
                                    : (user?.role === 'admin' || user?.role === 'dean' ? 'Dean / Administrator' : 'Instructor / Program Head')}
                            </div>
                        </div>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13.5px', lineHeight: '1.6', maxWidth: '500px', marginTop: '16px' }}>
                        {user?.role === 'student' 
                            ? 'Take control of your studies with personalized AI advisors. From career roadmaps to study schedules, your success is our priority.'
                            : (user?.role === 'admin' || user?.role === 'dean'
                                ? 'Drive institutional excellence with AI-powered strategy and management tools designed for high-level academic leadership.'
                                : 'Efficiently manage your curriculum and students with advanced AI automation designed for academic excellence.')}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <button className="btn btn-primary" onClick={() => openChat('General Assistant', `Hello! I am your ${user?.role} AI assistant. How can I help you today?`)} style={{
                            background: 'linear-gradient(135deg, #ab47bc, #7b1fa2)',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '12px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <Zap size={16} /> Get Quick Advice
                        </button>
                    </div>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="section-header" style={{ marginTop: '40px', marginBottom: '24px' }}>
                <h3 className="section-title">{user?.role === 'student' ? 'Academic AI Tools' : (user?.role === 'admin' || user?.role === 'dean' ? 'Executive AI Hub' : 'Faculty AI Tools')}</h3>
            </div>

            {user?.role !== 'student' && (
                <div className="stat-grid" style={{ marginBottom: '24px' }}>
                    {currentStats.map((stat, i) => (
                        <div key={i} className={`stat-card ${stat.class}`}>
                            <div className={`stat-icon ${stat.iconClass}`}>{stat.icon}</div>
                            <div className="stat-info">
                                <div className="stat-val">{stat.value}</div>
                                <div className="stat-lbl">{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="tool-grid">
                {currentTools.map((tool, i) => (
                    <div key={i} className="tool-card shadow-lg hover:shadow-2xl transition-all">
                        <div className={`tool-icon ${tool.color}`}>{tool.icon}</div>
                        <h4 className="tool-head">{tool.title}</h4>
                        <p className="tool-body">{tool.desc}</p>
                        <button 
                            className="btn btn-primary" 
                            style={{ width: '100%', marginTop: 'auto', padding: '12px 0' }}
                            onClick={() => openChat(tool.title, tool.intro)}
                        >
                            {tool.btnIcon} {tool.btnText}
                        </button>
                    </div>
                ))}
            </div>

            {/* ADDITIONAL INSIGHTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12" style={{ marginTop: '24px' }}>
                <div className="lg:col-span-2 space-y-6">
                    <div className="card" style={{ borderRadius: '24px' }}>
                        <div className="card-hd">
                            <div className="card-title">
                                <LineChart size={16} />
                                Recent Insights
                            </div>
                        </div>
                        <div className="p-12 text-center text-gray-400">
                            <Sparkle className="mx-auto mb-4 opacity-10" size={48} />
                            <p className="font-bold text-sm tracking-wide uppercase opacity-30">No new AI insights available for today</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="card" style={{ borderRadius: '24px' }}>
                        <div className="card-hd">
                            <div className="card-title">
                                <Shield size={16} />
                                System Health
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Database</span>
                                    <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-md">Online</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">AI Services</span>
                                    <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-md">Ready</span>
                                </div>
                                <div className="pt-4 border-t border-gray-50">
                                    <p className="text-[10px] text-gray-400">Last Sync: 2 mins ago</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CHATBOT MODAL */}
            <ChatbotModal 
                isOpen={chatbot.isOpen}
                onClose={() => setChatbot(prev => ({ ...prev, isOpen: false }))}
                title={chatbot.title}
                introMessage={chatbot.intro}
            />
        </div>
    );
};

export default Dashboard;
