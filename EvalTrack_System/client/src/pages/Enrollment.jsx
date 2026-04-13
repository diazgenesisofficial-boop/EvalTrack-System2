import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    GraduationCap, 
    Sparkle, 
    BookOpen, 
    Info, 
    Clock, 
    CheckCircle,
    ChevronRight,
    Search,
    Printer
} from 'lucide-react';

const Enrollment = () => {
    const [view, setView] = useState('next'); // 'next' or 'full'
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchForecast = async () => {
            try {
                // PHP-style session auth - no JWT token needed
                const res = await axios.get('http://localhost:5000/api/enrollment/forecast');
                if (res.data.success) {
                    setRecommendations(res.data.recommendations);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchForecast();
    }, []);

    const prospectus = [
        { code: "GE 10", title: "Environmental Science", prereq: "none", year: 1, sem: 1 },
        { code: "GE 11", title: "The Entrepreneurial Mind", prereq: "none", year: 1, sem: 1 },
        { code: "GE 4", title: "Readings in the Philippine History", prereq: "none", year: 1, sem: 1 },
        { code: "GE 5", title: "The Contemporary World", prereq: "none", year: 1, sem: 1 },
        { code: "GE 9", title: "Life and Works of Rizal", prereq: "none", year: 1, sem: 1 },
        { code: "IT 101", title: "Introduction to Computing", prereq: "none", year: 1, sem: 1 },
        { code: "IT 102", title: "Computer Programming 1", prereq: "none", year: 1, sem: 1 },
        { code: "NSTP 1", title: "National Service Training Program I", prereq: "none", year: 1, sem: 1 },
        { code: "PE 1", title: "Physical Education 1", prereq: "none", year: 1, sem: 1 },
        { code: "SF 1", title: "Student Formation 1", prereq: "none", year: 1, sem: 1 },
        { code: "GE 1", title: "Understanding the Self", prereq: "none", year: 1, sem: 2 },
        { code: "GE 2", title: "Mathematics in the Modern World", prereq: "none", year: 1, sem: 2 },
        { code: "GE 3", title: "Purposive Communication", prereq: "none", year: 1, sem: 2 },
        { code: "IT 103", title: "Computer Programming 2", prereq: "IT 102", year: 1, sem: 2 },
        { code: "IT 104", title: "Introduction to Human Computer Interaction", prereq: "IT 101", year: 1, sem: 2 },
        { code: "IT 105", title: "Discrete Mathematics 1", prereq: "IT 102", year: 1, sem: 2 },
        { code: "NSTP 2", title: "National Service Training Program II", prereq: "NSTP 1", year: 1, sem: 2 },
        { code: "PE 2", title: "Physical Education 2", prereq: "PE 1", year: 1, sem: 2 },
        { code: "SF 2", title: "Student Formation 2", prereq: "SF 1", year: 1, sem: 2 },
        { code: "GE 6", title: "Art Appreciation", prereq: "none", year: 2, sem: 1 },
        { code: "GE 7", title: "Science, Technology and Society", prereq: "none", year: 2, sem: 1 },
        { code: "GE 8", title: "Ethics", prereq: "none", year: 2, sem: 1 },
        { code: "IT 201", title: "Data Structures and Algorithms", prereq: "IT 103", year: 2, sem: 1 },
        { code: "IT 202", title: "Networking 1", prereq: "IT 101", year: 2, sem: 1 },
        { code: "IT Elect 1", title: "Object Oriented Programming", prereq: "IT 103", year: 2, sem: 1 },
        { code: "IT Elect 2", title: "Platform Technologies", prereq: "IT 101", year: 2, sem: 1 },
        { code: "PE 3", title: "Physical Education 3", prereq: "PE 2", year: 2, sem: 1 },
        { code: "SF 3", title: "Student Formation 3", prereq: "SF 1", year: 2, sem: 1 },
        { code: "IT 203", title: "Information Management", prereq: "none", year: 2, sem: 2 },
        { code: "IT 204", title: "Quantitative Methods", prereq: "none", year: 2, sem: 2 },
        { code: "IT 205", title: "Integrative Programming & Tech", prereq: "none", year: 2, sem: 2 },
        { code: "IT 206", title: "Networking 2", prereq: "IT 103", year: 2, sem: 2 },
        { code: "IT 207", title: "Multimedia", prereq: "IT 101", year: 2, sem: 2 },
        { code: "IT Elect 3", title: "Web Systems & Tech 1", prereq: "IT 103", year: 2, sem: 2 },
        { code: "PE 4", title: "Physical Education 4", prereq: "IT 101", year: 2, sem: 2 },
        { code: "SF 4", title: "Student Formation 4", prereq: "none", year: 2, sem: 2 }
    ];

    return (
        <div className="enrollment-content animate-in fade-in duration-500">
            <div className="ph">
                <div>
                    <div className="ph-title text-black">Enrollment Forecast</div>
                    <div className="ph-sub">Auto-generated subjects based on prerequisite eligibility</div>
                </div>
                <div className="ph-actions">
                    <button className="btn btn-ghost">
                        <Printer size={16} /> Print Prospectus
                    </button>
                </div>
            </div>

            {/* AI Banner */}
            <div className="card" style={{ 
                background: 'linear-gradient(135deg, var(--p900), #2d1b3d)', 
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '32px',
                marginBottom: '32px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <div style={{ 
                        width: '64px', 
                        height: '64px', 
                        borderRadius: '16px', 
                        background: 'linear-gradient(135deg, var(--p500), var(--mag))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 10px 20px rgba(124,58,237,0.3)',
                        flexShrink: 0
                    }}>
                        <Sparkle size={32} className="text-white" />
                    </div>
                    <div>
                        <h3 style={{ color: 'white', fontWeight: '900', fontSize: '20px', marginBottom: '6px' }}>AI Enrollment Advisor</h3>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: '1.6', maxWidth: '600px' }}>
                            Our algorithm has analyzed your <strong>Academic History</strong> and <strong>Prerequisite Map</strong>. 
                            Below are the subjects you are legally eligible to enroll in for the next semester.
                        </p>
                    </div>
                </div>
                <div style={{ 
                    position: 'absolute', 
                    top: '-50px', 
                    right: '-50px', 
                    width: '200px', 
                    height: '200px', 
                    borderRadius: '50%', 
                    background: 'radial-gradient(circle, rgba(124,58,237,0.15), transparent 70%)'
                }}></div>
            </div>

            <div className="card" style={{ padding: '0' }}>
                <div style={{ 
                    display: 'flex', 
                    background: 'var(--g100)', 
                    padding: '4px', 
                    borderRadius: '12px', 
                    margin: '24px', 
                    width: 'fit-content' 
                }}>
                    <button 
                        onClick={() => setView('next')}
                        style={{ 
                            padding: '10px 24px', 
                            borderRadius: '10px', 
                            fontSize: '13px', 
                            fontWeight: '800', 
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            background: view === 'next' ? 'white' : 'transparent',
                            color: view === 'next' ? 'var(--p500)' : 'var(--g500)',
                            boxShadow: view === 'next' ? 'var(--sh1)' : 'none'
                        }}
                    >
                        Eligible Subjects
                    </button>
                    <button 
                        onClick={() => setView('full')}
                        style={{ 
                            padding: '10px 24px', 
                            borderRadius: '10px', 
                            fontSize: '13px', 
                            fontWeight: '800', 
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            background: view === 'full' ? 'white' : 'transparent',
                            color: view === 'full' ? 'var(--p500)' : 'var(--g500)',
                            boxShadow: view === 'full' ? 'var(--sh1)' : 'none'
                        }}
                    >
                        Full Prospectus
                    </button>
                </div>

                <div className="table-wrap" style={{ border: 0 }}>
                    <table>
                        <thead>
                            <tr>
                                {view === 'next' ? (
                                    <>
                                        <th>Subject Code</th>
                                        <th>Description</th>
                                        <th>Year / Sem</th>
                                        <th>Status</th>
                                    </>
                                ) : (
                                    <>
                                        <th>Subject Code</th>
                                        <th>Description</th>
                                        <th>Year / Sem</th>
                                        <th>Prerequisite</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {view === 'next' ? (
                                loading ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '48px' }}><div className="loading-spinner"></div></td></tr>
                                ) : recommendations.length === 0 ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '48px', color: 'var(--g400)' }}>No eligible subjects found.</td></tr>
                                ) : (
                                    recommendations.map((sub, i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: '800' }}>{sub.code}</td>
                                            <td>{sub.title}</td>
                                            <td><span className="badge bg-gray">Yr{sub.year} · Sem{sub.sem}</span></td>
                                            <td><span className="badge bg-green">Eligible</span></td>
                                        </tr>
                                    ))
                                )
                            ) : (
                                prospectus.map((sub, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: '800' }}>{sub.code}</td>
                                        <td>{sub.title}</td>
                                        <td><span className="badge bg-gray">Yr{sub.year} · Sem{sub.sem}</span></td>
                                        <td><span className={`badge ${sub.prereq === 'none' ? 'bg-green' : 'bg-gray'}`}>{sub.prereq}</span></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Enrollment;
