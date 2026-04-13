import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
    Search, 
    User, 
    ChevronRight, 
    Table, 
    Plus, 
    RotateCcw, 
    Zap, 
    CheckCircle,
    Trash2,
    BookOpen
} from 'lucide-react';

const Evaluations = () => {
    const [step, setStep] = useState(1);
    const [students, setStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showResults, setShowResults] = useState(false);
    
    const [semester, setSemester] = useState('2025 - 1 semester');
    const [program, setProgram] = useState('BSIT');
    const [yearLevel, setYearLevel] = useState('1');
    const [studentType, setStudentType] = useState('regular');

    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(false);
    const [forecast, setForecast] = useState([]);

    const BSIT_PROSPECTUS = {
        // FIRST YEAR
        "1-1": [
            { code: "GE 4", desc: "Reading in Philippine History", prereq: "none" },
            { code: "GE 5", desc: "The Contemporary World", prereq: "none" },
            { code: "GE 11", desc: "Entrepreneurial Mind", prereq: "none" },
            { code: "GE 9", desc: "Life and Works of Rizal", prereq: "none" },
            { code: "GE 10", desc: "Environmental Science", prereq: "none" },
            { code: "CC 101", desc: "Introduction to Computing 1", prereq: "none" },
            { code: "CC 102", desc: "Computer Programming 1", prereq: "none" },
            { code: "PE 1", desc: "Physical Education", prereq: "none" },
            { code: "NSTP 1", desc: "National Service Training Program 1", prereq: "none" },
            { code: "SF 1", desc: "Student Formation 1", prereq: "none" }
        ],
        "1-2": [
            { code: "GE 1", desc: "Understanding the Self", prereq: "none" },
            { code: "GE 2", desc: "Mathematics in the Modern World", prereq: "none" },
            { code: "GE 3", desc: "Purposive Communication", prereq: "none" },
            { code: "CC 103", desc: "Introduction to Computing", prereq: "CC 102" },
            { code: "HCI 101", desc: "Computer Programming 1", prereq: "CC 101" },
            { code: "MS 101 A", desc: "Discrete Mathematics 1", prereq: "none" },
            { code: "WEBDEV", desc: "Web Development", prereq: "none" },
            { code: "PE 2", desc: "Physical Education 2", prereq: "PE 1" },
            { code: "NSTP 2", desc: "National Service Training Program 2", prereq: "NSTP 1" },
            { code: "SF 2", desc: "Student Formation 2", prereq: "SF 1" }
        ],
        "summer-2": [
            { code: "GE 12", desc: "Great Books", prereq: "none" },
            { code: "GE 7", desc: "Science Technology and Society", prereq: "none" }
        ],
        // SECOND YEAR
        "2-1": [
            { code: "GE 6", desc: "Art Appreciation", prereq: "none" },
            { code: "GE 8", desc: "Ethics", prereq: "none" },
            { code: "MS 101 B", desc: "Discrete Mathematics 2", prereq: "MS 101 A" },
            { code: "PF 101", desc: "Object Oriented Programming", prereq: "CC 103" },
            { code: "CC 104", desc: "Data Structure and Algorithms", prereq: "CC 103" },
            { code: "PT 101", desc: "Platform Technologies", prereq: "CC 103" },
            { code: "IT ELECT 1", desc: "IT Elective 1", prereq: "2nd Year Standing" },
            { code: "PE 3", desc: "Physical Education 3", prereq: "PE 2" },
            { code: "SF 3", desc: "Student Formation 3", prereq: "SF 2" }
        ],
        "2-2": [
            { code: "CC 105", desc: "Information Management", prereq: "CC 104 & PF 101" },
            { code: "MS 102", desc: "Quantitative Methods (inci. Modeling & Simulation)", prereq: "MS 101 B" },
            { code: "NET 101", desc: "Networking 1", prereq: "PT 101" },
            { code: "IPT 101", desc: "Integrative Programming & Technology", prereq: "PF 101 & PT 101" },
            { code: "OS 101", desc: "Operating Systems", prereq: "CC 104 & PF 101" },
            { code: "IT ELECT 2", desc: "IT Elective 2", prereq: "2nd Year Standing" },
            { code: "PE 4", desc: "Physical Education 4", prereq: "PE 3" },
            { code: "SF 4", desc: "Student Formation 4", prereq: "SF 3" }
        ],
        // THIRD YEAR
        "3-1": [
            { code: "IM 101", desc: "Advance Database System", prereq: "CC 105" },
            { code: "NET 102", desc: "Networking 2", prereq: "NET 101" },
            { code: "SIA 101", desc: "System Integration and Architecture", prereq: "NET 101" },
            { code: "EDP 101", desc: "Event - Driven Programming", prereq: "CC 104" },
            { code: "IAS 101", desc: "Information Assurance And Security 1", prereq: "CC 105" },
            { code: "MAP 101", desc: "Mobile Application Development 1", prereq: "CC 104 & PF 101" },
            { code: "SAD 101", desc: "System Analysis And Design", prereq: "CC 105" },
            { code: "IT ELECT 3", desc: "IT Elective 3", prereq: "3rd Year Standing" },
            { code: "SF 5", desc: "Student Formation 5", prereq: "SF 4" }
        ],
        "3-2": [
            { code: "IAS 102", desc: "Information Assurance And Security 2", prereq: "IAS 101" },
            { code: "SP 101", desc: "Social Issues And Professional Practice", prereq: "3rd Year Standing" },
            { code: "CC 106", desc: "Application Development And Emerging Technologies", prereq: "IM 101" },
            { code: "MAP 102", desc: "Mobile Application Development 2", prereq: "MAP 101" },
            { code: "IT ELECT 4", desc: "IT Elective 4", prereq: "3rd Year Standing" },
            { code: "TECHPRO", desc: "Technopreneurship", prereq: "3rd Year Standing" },
            { code: "PM 101", desc: "IT Project Management", prereq: "SAD 101" },
            { code: "SF 6", desc: "Student Formation 6", prereq: "SF 5" }
        ],
        "summer-4": [
            { code: "CAP 101", desc: "Capstone Project and Research 1", prereq: "4th Year Standing" }
        ],
        // FOURTH YEAR
        "4-1": [
            { code: "SA 101", desc: "System Administration And Maintenance", prereq: "IAS 102" },
            { code: "CAP 102", desc: "Capstone Project And Research 2", prereq: "CAP 101" },
            { code: "SWT 101", desc: "ICT Seminar & Workshop", prereq: "4th Year Standing" }
        ],
        "4-2": [
            { code: "PRAC 101", desc: "PRACTICUM (486 hours)", prereq: "4th Year Standing" },
            { code: "SF 8", desc: "Student Formation 8", prereq: "4th Year Standing" }
        ]
    };

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                // PHP-style session auth - no JWT token needed
                const res = await axios.get('http://localhost:5000/api/auth/users');
                // Backend returns array directly (PHP-style)
                const allUsers = Array.isArray(res.data) ? res.data : [];
                setStudents(allUsers.filter(u => u.role === 'student'));
            } catch (err) {
                console.error(err);
            }
        };
        fetchStudents();
    }, []);

    const filteredStudents = students.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.id.toString().includes(searchQuery)
    );

    const handleSelectStudent = (s) => {
        setSelectedStudent(s);
        setSearchQuery(s.name);
        setShowResults(false);
        setProgram(s.program || 'BSIT');
        setYearLevel(s.year_level || '1');
        setStudentType(s.student_type || 'regular');
        
        // Initialize grades table
        const key = `${s.year_level || '1'}-${semester.includes('2') ? '2' : '1'}`;
        const initialGrades = (BSIT_PROSPECTUS[key] || []).map(sub => ({
            ...sub,
            grade: '',
            sem: semester
        }));
        setGrades(initialGrades);
    };

    const handleGradeChange = (code, val) => {
        setGrades(prev => prev.map(g => g.code === code ? { ...g, grade: val } : g));
    };

    const handleSubmit = async () => {
        const validGrades = grades.filter(g => g.grade !== '');
        if (validGrades.length === 0) return alert('Enter at least one grade.');

        setLoading(true);
        try {
            // PHP-style session auth - no JWT token needed
            await axios.post('http://localhost:5000/api/evaluations', {
                studentId: selectedStudent.id,
                grades: validGrades.map(g => ({
                    code: g.code,
                    subject: g.desc,
                    grade: parseFloat(g.grade),
                    sem: g.sem
                }))
            });

            // Fetch forecast
            const fRes = await axios.get(`http://localhost:5000/api/enrollment/forecast?student_id=${selectedStudent.id}`);
            setForecast(fRes.data.recommendations || []);
            
            alert('AI Evaluation synced successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to sync grades.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="evaluations-content animate-in fade-in duration-500">
            <div className="ph">
                <div>
                    <div className="ph-title text-black">Evaluate & Grade</div>
                    <div className="ph-sub">Search a student → set semester → enter grades → sync AI automation</div>
                </div>
            </div>

            {/* STEP 1: FIND STUDENT */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="step-head" style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                    <div className="step-num" style={{ width: '32px', height: '32px', background: 'var(--p500)', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '14px' }}>1</div>
                    <div>
                        <div className="step-name" style={{ fontWeight: '900', color: 'var(--g900)' }}>Find Student</div>
                        <div className="step-desc" style={{ fontSize: '12px', color: 'var(--g400)' }}>Search by name or student ID</div>
                    </div>
                </div>

                <div style={{ position: 'relative' }}>
                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input 
                            type="text" 
                            className="fc" 
                            style={{ paddingLeft: '48px' }}
                            placeholder="Type student name or ID number..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowResults(true);
                            }}
                            onFocus={() => setShowResults(true)}
                        />
                    </div>
                    {showResults && searchQuery && (
                        <div className="card shadow-2xl animate-in slide-in-from-top-4 duration-300" style={{ 
                            position: 'absolute', 
                            width: '100%', 
                            zIndex: 100, 
                            marginTop: '12px', 
                            padding: '8px', 
                            overflow: 'hidden',
                            background: 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(24px)',
                            border: '1px solid rgba(255, 255, 255, 0.5)',
                            borderRadius: '24px'
                        }}>
                            {filteredStudents.length > 0 ? (
                                filteredStudents.slice(0, 8).map(s => (
                                    <div 
                                        key={s.id} 
                                        onClick={() => handleSelectStudent(s)}
                                        style={{ 
                                            padding: '14px 20px', 
                                            cursor: 'pointer', 
                                            borderRadius: '16px',
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '16px',
                                            transition: 'all 0.2s'
                                        }}
                                        className="hover:bg-p500 hover:text-white group"
                                    >
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--p100)', color: 'var(--p500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '14px' }} className="group-hover:bg-white/20 group-hover:text-white">{s.name.charAt(0)}</div>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: '800' }}>{s.name}</div>
                                            <div style={{ fontSize: '11px', opacity: 0.6 }}>ID: {s.id} · {s.program || 'BSIT'}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--g400)', fontSize: '13px', fontWeight: '600' }}>No matching students found</div>
                            )}
                        </div>
                    )}
                </div>

                {selectedStudent && (
                    <div style={{ marginTop: '24px', padding: '20px', background: 'var(--g50)', borderRadius: '16px', border: '1px solid var(--g100)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--p500)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '20px' }}>{selectedStudent.name.charAt(0)}</div>
                            <div>
                                <div style={{ fontSize: '16px', fontWeight: '900', color: 'var(--g900)' }}>{selectedStudent.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--g500)', fontWeight: '700' }}>ID: {selectedStudent.id} · {selectedStudent.program || 'BSIT'} · {selectedStudent.student_type || 'Regular'}</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                            <div className="field">
                                <label className="field-label" style={{ fontSize: '10px', fontWeight: '900', color: 'var(--g400)', textTransform: 'uppercase' }}>Program</label>
                                <select className="fc" value={program} onChange={e => setProgram(e.target.value)}>
                                    <option>BSIT</option><option>BSEMC</option>
                                </select>
                            </div>
                            <div className="field">
                                <label className="field-label" style={{ fontSize: '10px', fontWeight: '900', color: 'var(--g400)', textTransform: 'uppercase' }}>Year Level</label>
                                <select className="fc" value={yearLevel} onChange={e => setYearLevel(e.target.value)}>
                                    <option value="1">1st Year</option><option value="2">2nd Year</option>
                                    <option value="3">3rd Year</option><option value="4">4th Year</option>
                                </select>
                            </div>
                            <div className="field">
                                <label className="field-label" style={{ fontSize: '10px', fontWeight: '900', color: 'var(--g400)', textTransform: 'uppercase' }}>Student Type</label>
                                <select className="fc" value={studentType} onChange={e => setStudentType(e.target.value)}>
                                    <option value="regular">Regular</option><option value="irregular">Irregular</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {selectedStudent && (
                <>
                    {/* STEP 2: SELECT SEMESTER */}
                    <div className="card" style={{ marginBottom: '24px' }}>
                        <div className="step-head" style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                            <div className="step-num" style={{ width: '32px', height: '32px', background: 'var(--p500)', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '14px' }}>2</div>
                            <div>
                                <div className="step-name" style={{ fontWeight: '900', color: 'var(--g900)' }}>Select Semester</div>
                                <div className="step-desc" style={{ fontSize: '12px', color: 'var(--g400)' }}>Choose the target academic term to grade</div>
                            </div>
                        </div>
                        <div className="field" style={{ maxWidth: '300px' }}>
                            <select className="fc" value={semester} onChange={e => setSemester(e.target.value)}>
                                <option>2025 - 1 semester</option>
                                <option>2025 - 2 semester</option>
                                <option>2026 - 1 semester</option>
                            </select>
                        </div>
                    </div>

                    {/* STEP 3: GRADE TABLE */}
                    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                        <div className="card-hd" style={{ padding: '24px' }}>
                            <div>
                                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Table size={16} /> Grade Input
                                </div>
                                <div className="card-sub">Enter grades below for {selectedStudent.name}</div>
                            </div>
                            <span className="badge bg-purple">Regular Mode</span>
                        </div>

                        <div className="table-wrap" style={{ border: 'none' }}>
                            <table style={{ borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Subject</th>
                                        <th>Prerequisite</th>
                                        <th>Grade</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {grades.map((sub, i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: '900' }}>{sub.code}</td>
                                            <td>{sub.desc}</td>
                                            <td><span className="badge bg-gray">{sub.prereq}</span></td>
                                            <td>
                                                <input 
                                                    type="number" 
                                                    className="fc" 
                                                    style={{ width: '80px', padding: '6px 12px', height: 'auto', fontWeight: '900' }} 
                                                    placeholder="—"
                                                    value={sub.grade}
                                                    onChange={(e) => handleGradeChange(sub.code, e.target.value)}
                                                />
                                            </td>
                                            <td><button className="btn btn-ghost" style={{ padding: '4px' }}><Trash2 size={14} className="text-red-400" /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {forecast.length > 0 && (
                            <div style={{ padding: '24px', background: 'rgba(124,58,237,0.02)', borderTop: '1px dashed var(--g200)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--p500)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '12px' }}>
                                    <Zap size={14} /> AI Enrollment Recommendation
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {forecast.map((f, i) => (
                                        <div key={i} style={{ background: 'white', border: '1px solid var(--p100)', borderRadius: '10px', padding: '8px 12px', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <BookOpen size={10} style={{ color: 'var(--p400)' }} /> {f.code}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ padding: '24px' }}>
                            <button 
                                onClick={handleSubmit}
                                disabled={loading}
                                className="btn btn-primary" 
                                style={{ width: '100%', padding: '16px', fontSize: '14px' }}
                            >
                                {loading ? 'Syncing...' : <><Zap size={16} /> Generate n8n Automation & Sync AI Records</>}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Evaluations;
