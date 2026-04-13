import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
    FileText, 
    Search, 
    Filter, 
    CheckCircle, 
    XCircle, 
    Sparkle,
    ChevronRight,
    Search as SearchIcon,
    Zap,
    GraduationCap,
    Clock,
    User,
    Table,
    MessageSquare,
    Cpu,
    Plus,
    Send
} from 'lucide-react';

const Reports = () => {
    const { user } = useAuth();
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    
    // Instructor/Admin specific
    const [activeTab, setActiveTab] = useState('rec');
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [chatInput, setChatInput] = useState('');
    const [standings, setStandings] = useState([]);
    const [chatMessages, setChatMessages] = useState([
        { role: 'bot', text: 'Hello! Select a student from the filters above and I can answer detailed questions about their academic performance, standing, and enrollment eligibility.' }
    ]);

    const tryParseAiJson = (raw) => {
        if (typeof raw !== 'string') return null;
        const t = raw.trim();
        if (!t.startsWith('{')) return null;
        try { return JSON.parse(t); } catch (e) { return null; }
    };

    const formatCurriculumJsonForChat = (payload) => {
        const report = payload?.report;
        const rec = payload?.recommendation;
        if (!report || !rec) return null;

        const h = report.student_header || {};
        const standing = report.summary_remarks?.current_standing || 'N/A';
        const gradeRows = Array.isArray(report.grade_table) ? report.grade_table : [];
        const gradePreview = gradeRows.slice(0, 10).map((r, i) => {
            const code = r.subject_code || 'N/A';
            const title = r.subject_title ? ` - ${r.subject_title}` : '';
            const units = r.units !== undefined && r.units !== null ? r.units : 'N/A';
            const grade = r.grade !== undefined && r.grade !== null ? r.grade : 'N/A';
            const status = r.status || 'N/A';
            return `${i + 1}. ${code}${title} | Units: ${units} | Grade: ${grade} | ${status}`;
        }).join('\n');

        const eligible = rec.next_semester?.eligible_subjects || [];
        const notEligible = rec.next_semester?.not_eligible_subjects || [];
        const target = rec.next_semester?.target_semester || 'N/A';

        const add = rec.enrollment_process?.add_drop_plan?.add || [];
        const drop = rec.enrollment_process?.add_drop_plan?.drop || [];

        const eligiblePreview = eligible.length ? eligible.map(s => `${s.code}${s.title ? ' - ' + s.title : ''}`).slice(0, 10).join('\n') : 'None';
        const notEligiblePreview = notEligible.length ? notEligible.map(s => `${s.code}${s.title ? ' - ' + s.title : ''}`).slice(0, 10).join('\n') : 'None';
        const addPreview = add.length ? add.map(s => `${s.code}${s.title ? ' - ' + s.title : ''}`).join('\n') : 'None';
        const dropPreview = drop.length ? drop.map(s => `${s.code}${s.title ? ' - ' + s.title : ''}`).join('\n') : 'None';

        return [
            `ACADEMIC PROGRESS REPORT (BSIT)`,
            `Student: ${h.student_name || 'N/A'} (${h.student_id || 'N/A'})`,
            `Program: ${h.program || 'BSIT'} | Year Level: ${h.year_level || 'N/A'} | Semester: ${h.semester || 'N/A'}`,
            `Current Standing: ${standing}`,
            ``,
            `Grade Table (preview):`,
            gradePreview || 'No grade rows provided.',
            ``,
            `Next Semester Recommendation: ${target}`,
            `Eligible:\n${eligiblePreview}`,
            ``,
            `Not Eligible:\n${notEligiblePreview}`,
            ``,
            `Enrollment (Add/Drop):`,
            `Add:\n${addPreview}`,
            ``,
            `Drop:\n${dropPreview}`
        ].join('\n');
    };

    const downloadHtmlReport = (html, filename) => {
        if (!html) return;
        const safeName = (filename && filename.trim()) ? filename.trim() : 'academic_report.html';
        const normalized = safeName.toLowerCase().endsWith('.html') ? safeName : safeName.replace(/\.pdf$/i, '.html');
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = normalized;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // PHP-style session auth - no JWT token needed
                const [evalsRes, usersRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/evaluations'),
                    user?.role !== 'student' ? axios.get('http://localhost:5000/api/auth/users') : Promise.resolve({ data: [] })
                ]);

                // Backend returns array directly (PHP-style)
                setEvaluations(Array.isArray(evalsRes.data) ? evalsRes.data : []);
                const allUsers = Array.isArray(usersRes.data) ? usersRes.data : [];
                setStudents(allUsers.filter(u => u.role === 'student'));

                if (user?.role === 'admin' || user?.role === 'dean') {
                    const standingsRes = await axios.get('http://localhost:5000/api/standing/all');
                    setStandings(Array.isArray(standingsRes.data) ? standingsRes.data : []);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const filteredEvaluations = evaluations.filter(ev => {
        const matchesSearch = (ev.subject_code || '').toLowerCase().includes(search.toLowerCase()) || 
                             (ev.subject_desc || '').toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === '' || ev.status === statusFilter;
        const matchesStudent = user?.role === 'student' || selectedStudent === '' || ev.student_id?.toString() === selectedStudent;
        return matchesSearch && matchesStatus && matchesStudent;
    });

    const handleSendChat = async () => {
        if (!chatInput.trim()) return;
        const newMsg = { role: 'user', text: chatInput };
        setChatMessages(prev => [...prev, newMsg]);
        setChatInput('');
        
        try {
            // PHP-style session auth - no JWT token needed
            const res = await axios.post('http://localhost:5000/api/ai/chat', {
                topic: 'Student Evaluation',
                query: chatInput
            });
            const parsed = tryParseAiJson(res.data?.reply);
            if (parsed) {
                const formatted = formatCurriculumJsonForChat(parsed);
                setChatMessages(prev => [
                    ...prev,
                    {
                        role: 'bot',
                        text: formatted || res.data.reply,
                        reportHtml: parsed?.report?.pdf_ready_html,
                        reportFilename: parsed?.report?.pdf_download_filename
                    }
                ]);
            } else {
                setChatMessages(prev => [...prev, { role: 'bot', text: res.data.reply }]);
            }
        } catch (err) {
            setChatMessages(prev => [...prev, { role: 'bot', text: 'Error connecting to AI service.' }]);
        }
    };

    if (user?.role === 'student') {
        return (
            <div className="reports-content animate-in fade-in duration-500">
                <div className="ph">
                    <div>
                        <div className="ph-title text-black">My Evaluation Reports</div>
                        <div className="ph-sub">AI-generated performance records synced from JMC Faculty</div>
                    </div>
                </div>

                <div className="filter-bar" style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div className="field" style={{ flex: 2, minWidth: '200px' }}>
                        <div className="field-label" style={{ fontWeight: '800', color: 'var(--g400)', textTransform: 'uppercase', fontSize: '10px', marginBottom: '8px' }}>Search Subject</div>
                        <div className="relative">
                            <SearchIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input type="text" className="fc" style={{ paddingLeft: '40px' }} placeholder="Code or Subject Name..." value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                    </div>
                    <div className="field" style={{ flex: 1, minWidth: '150px' }}>
                        <div className="field-label" style={{ fontWeight: '800', color: 'var(--g400)', textTransform: 'uppercase', fontSize: '10px', marginBottom: '8px' }}>Grade Status</div>
                        <select className="fc" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="">All Statuses</option>
                            <option value="Passed">Passed</option>
                            <option value="Failed">Failed</option>
                        </select>
                    </div>
                </div>

                <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div className="table-wrap" style={{ border: 'none' }}>
                        <table>
                            <thead>
                                <tr><th>Semester</th><th>Code</th><th>Subject</th><th>Grade</th><th>Status</th><th>AI Feedback</th></tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '48px' }}><div className="loading-spinner"></div></td></tr>
                                ) : filteredEvaluations.length === 0 ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: 'var(--g400)' }}>No academic records found.</td></tr>
                                ) : (
                                    filteredEvaluations.map((ev, i) => (
                                        <tr key={i}>
                                            <td><span className="badge bg-purple">{ev.semester_taken || '1st Sem'}</span></td>
                                            <td style={{ fontWeight: '900' }}>{ev.subject_code}</td>
                                            <td><span style={{ fontSize: '12px' }}>{ev.subject_desc || 'Subject Description'}</span></td>
                                            <td><span style={{ fontWeight: '900', color: ev.status === 'Passed' ? 'var(--g800)' : 'var(--ember)' }}>{ev.grade}</span></td>
                                            <td><span className={`badge ${ev.status === 'Passed' ? 'bg-green' : 'bg-red'}`}>{ev.status}</span></td>
                                            <td>
                                                <div style={{ fontSize: '11px', background: 'rgba(124,58,237,0.03)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(124,58,237,0.1)', maxWidth: '280px', color: 'var(--g700)' }}>
                                                    <div style={{ fontSize: '9px', fontWeight: '900', color: 'var(--p500)', textTransform: 'uppercase', marginBottom: '4px' }}>AI Insight</div>
                                                    {ev.remarks || 'No insight available.'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // INSTRUCTOR AI HUB
    return (
        <div className="reports-content animate-in fade-in duration-500">
            <div className="ph" style={{ marginBottom: '24px' }}>
                <div>
                    <div className="ph-title text-black">AI Evaluation Reports</div>
                    <div className="ph-sub">Advanced student analytics and academic insights</div>
                </div>
            </div>

            {/* Hub Interface */}
            <div className="ai-hub" style={{ padding: '0', overflow: 'hidden', background: 'linear-gradient(135deg, #1a1a2e, #16213e)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="stars"></div>
                <div className="ai-hub-top" style={{ padding: '32px', display: 'flex', flexWrap: 'wrap', gap: '32px', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'relative', zIndex: 10 }}>
                    <div className="ai-hub-brand" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div className="ai-hub-icon" style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, #ab47bc, #7b1fa2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkle size={24} className="text-white" /></div>
                        <div>
                            <div className="ai-hub-title" style={{ fontSize: '18px', fontWeight: '900', color: 'white' }}>AI Intelligence Hub</div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>EvalTrack Smart Engine · Gemini 2.0 Flash</div>
                        </div>
                    </div>
                    <div className="hub-tabs" style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px', marginLeft: 'auto' }}>
                        {(user?.role === 'admin' || user?.role === 'dean') && (
                            <button onClick={() => setActiveTab('sta')} className={`hub-tab ${activeTab === 'sta' ? 'active-sta' : ''}`} style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', border: 0, cursor: 'pointer', transition: 'all 0.2s', background: activeTab === 'sta' ? 'linear-gradient(135deg, #ab47bc, #ef4444)' : 'transparent', color: 'white' }}>STANDING</button>
                        )}
                        <button onClick={() => setActiveTab('rec')} className={`hub-tab ${activeTab === 'rec' ? 'active-rec' : ''}`} style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', border: 0, cursor: 'pointer', transition: 'all 0.2s', background: activeTab === 'rec' ? 'linear-gradient(135deg, #ab47bc, #7b1fa2)' : 'transparent', color: 'white' }}>RECOMMENDATIONS</button>
                        <button onClick={() => setActiveTab('rep')} className={`hub-tab ${activeTab === 'rep' ? 'active-rep' : ''}`} style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', border: 0, cursor: 'pointer', transition: 'all 0.2s', background: activeTab === 'rep' ? 'linear-gradient(135deg, #ab47bc, #26a69a)' : 'transparent', color: 'white' }}>GRADE REPORTS</button>
                        <button onClick={() => setActiveTab('chat')} className={`hub-tab ${activeTab === 'chat' ? 'active-chat' : ''}`} style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', border: 0, cursor: 'pointer', transition: 'all 0.2s', background: activeTab === 'chat' ? 'linear-gradient(135deg, #ab47bc, #42a5f5)' : 'transparent', color: 'white' }}>AI CHAT</button>
                    </div>
                </div>

                <div className="hub-panel" style={{ padding: '32px', minHeight: '400px', position: 'relative', zIndex: 10 }}>
                    {activeTab === 'sta' && (user?.role === 'admin' || user?.role === 'dean') && (
                        <div id="view-sta" className="table-wrap" style={{ border: 0, padding: 0 }}>
                            <table style={{ background: 'transparent' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <th style={{ color: 'rgba(255,255,255,0.4)' }}>Student ID</th>
                                        <th style={{ color: 'rgba(255,255,255,0.4)' }}>Name</th>
                                        <th style={{ color: 'rgba(255,255,255,0.4)' }}>Program</th>
                                        <th style={{ color: 'rgba(255,255,255,0.4)' }}>Standing</th>
                                        <th style={{ color: 'rgba(255,255,255,0.4)' }}>Reason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {standings.map((s, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ color: 'white', fontWeight: '800' }}>{s.student_id}</td>
                                            <td style={{ color: 'white', fontWeight: '700' }}>{s.name}</td>
                                            <td style={{ color: 'rgba(255,255,255,0.6)' }}>{s.program}</td>
                                            <td>
                                                <span className={`badge ${s.standing === 'Regular' ? 'bg-green' : 'bg-red'}`} style={{
                                                    padding: '4px 12px', borderRadius: '100px', fontSize: '10px', fontWeight: '900', color: 'white', background: s.standing === 'Regular' ? '#26a69a' : '#ef5350'
                                                }}>
                                                    {s.standing}
                                                </span>
                                            </td>
                                            <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{s.reason}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'rec' && (
                        <div id="view-rec" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                                <div style={{ flex: 1, minWidth: '300px' }}>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', textTransform: 'uppercase' }}>Filter by Student</label>
                                    <select 
                                        className="fc" 
                                        value={selectedStudent} 
                                        onChange={(e) => setSelectedStudent(e.target.value)}
                                        style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                                    >
                                        <option value="">All Students...</option>
                                        {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                                    </select>
                                </div>
                                <div style={{ flex: 1, minWidth: '300px' }}>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', textTransform: 'uppercase' }}>Academic Cycle</label>
                                    <select className="fc" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <option>2nd Semester 2023-2024</option>
                                        <option>1st Semester 2023-2024</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '24px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(171, 71, 188, 0.1)', color: '#ab47bc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}><Cpu size={20} /></div>
                                    <h4 style={{ color: 'white', fontWeight: '800', marginBottom: '8px' }}>Enrollment Eligibility</h4>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', lineHeight: '1.6' }}>AI analyzed prerequisite paths. 85% of students are eligible for all major subjects in the next cycle.</p>
                                </div>
                                <div className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '24px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(38, 166, 154, 0.1)', color: '#26a69a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}><GraduationCap size={20} /></div>
                                    <h4 style={{ color: 'white', fontWeight: '800', marginBottom: '8px' }}>Retention Forecast</h4>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', lineHeight: '1.6' }}>Based on current GPA trends, retention rate is projected at 92% for the upcoming academic year.</p>
                                </div>
                                <div className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '24px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(66, 165, 245, 0.1)', color: '#42a5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}><Zap size={20} /></div>
                                    <h4 style={{ color: 'white', fontWeight: '800', marginBottom: '8px' }}>Strategic Insight</h4>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', lineHeight: '1.6' }}>Highly recommended to increase faculty focus on Networking 1 to improve overall program passing rates.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'rep' && (
                        <div id="view-rep" className="table-wrap" style={{ border: 0, padding: 0 }}>
                            <div style={{ marginBottom: '24px', display: 'flex', gap: '16px' }}>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <SearchIcon style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} size={16} className="text-white" />
                                    <input 
                                        type="text" 
                                        className="fc" 
                                        placeholder="Search grades or subjects..." 
                                        value={search} 
                                        onChange={(e) => setSearch(e.target.value)}
                                        style={{ paddingLeft: '48px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                </div>
                            </div>
                            <table style={{ background: 'transparent' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <th style={{ color: 'rgba(255,255,255,0.4)' }}>Student ID</th>
                                        <th style={{ color: 'rgba(255,255,255,0.4)' }}>Subject</th>
                                        <th style={{ color: 'rgba(255,255,255,0.4)' }}>Grade</th>
                                        <th style={{ color: 'rgba(255,255,255,0.4)' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEvaluations.map((ev, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ color: 'white', fontWeight: '800' }}>{ev.student_id}</td>
                                            <td style={{ color: 'white' }}>
                                                <div style={{ fontWeight: '700' }}>{ev.subject_code}</div>
                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{ev.subject_desc}</div>
                                            </td>
                                            <td style={{ color: 'white', fontWeight: '900' }}>{ev.grade}</td>
                                            <td>
                                                <span className={`badge ${ev.status === 'Passed' ? 'bg-green' : 'bg-red'}`} style={{
                                                    padding: '4px 12px', borderRadius: '100px', fontSize: '10px', fontWeight: '900', color: 'white', background: ev.status === 'Passed' ? '#26a69a' : '#ef5350'
                                                }}>
                                                    {ev.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'chat' && (
                        <div id="view-chat" style={{ height: '500px', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)', borderRadius: '24px', overflow: 'hidden' }}>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }} className="custom-scrollbar">
                                {chatMessages.map((m, i) => (
                                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} mb-6`}>
                                        <div className={`max-w-[80%] p-4 rounded-2xl ${m.role === 'user' ? 'bg-p500 text-white rounded-br-none' : 'bg-white/10 text-white rounded-bl-none'}`}>
                                            {m.role === 'bot' && <div style={{ fontSize: '10px', fontWeight: '900', color: '#ab47bc', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><Cpu size={12} /> EvalTrack AI</div>}
                                            <div style={{ fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{m.text}</div>
                                            {m.role === 'bot' && m.reportHtml && (
                                                <div style={{ marginTop: 12 }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => downloadHtmlReport(m.reportHtml, m.reportFilename)}
                                                        className="px-3 py-2 text-xs font-black rounded-xl bg-p500 text-white hover:bg-p800 transition-all"
                                                    >
                                                        Download Report (HTML)
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        className="fc" 
                                        placeholder="Ask the AI about academic trends..." 
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                                        style={{ paddingRight: '60px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                    <button onClick={handleSendChat} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', width: '40px', height: '40px', borderRadius: '12px', background: 'var(--p500)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 0, cursor: 'pointer' }}>
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="hub-input-row" style={{ padding: '20px 32px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '16px', alignItems: 'center', position: 'relative', zIndex: 10 }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <MessageSquare size={16} className="text-white opacity-30 absolute left-4 top-1/2 -translate-y-1/2" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input 
                            type="text" 
                            className="fc" 
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', paddingLeft: '48px', fontSize: '13px' }} 
                            placeholder="Ask about a student's grades, performance, or eligibility..."
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleSendChat()}
                        />
                    </div>
                    <button onClick={handleSendChat} className="hub-send" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--p500)', border: 0, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Send size={18} /></button>
                </div>
            </div>
        </div>
    );
};

export default Reports;
