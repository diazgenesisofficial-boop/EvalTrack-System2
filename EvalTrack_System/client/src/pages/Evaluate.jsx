import React, { useState, useEffect } from 'react';
import { 
    Search, 
    User, 
    ChevronRight, 
    RotateCcw, 
    Plus, 
    Trash2, 
    Zap,
    CheckCircle,
    ClipboardList,
    GraduationCap,
    Info
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../components/AppLayout';

const Evaluate = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedSemester, setSelectedSemester] = useState('2026 - 1 semester');
    const [gradingRows, setGradingRows] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [recommendations, setRecommendations] = useState([]);

    const semesters = [
        '1 semester', 
        '2 semester', 
        'summer'
    ];

    // BSIT Prospectus - Updated to match JMCF BSIT Curriculum
    const prospectus = [
        // FIRST YEAR / FIRST SEMESTER
        { code: "GE 10", desc: "Environmental Science", prereq: "none" },
        { code: "GE 11", desc: "The Entrepreneurial Mind", prereq: "none" },
        { code: "GE 4", desc: "Readings in the Philippine History", prereq: "none" },
        { code: "GE 5", desc: "The Contemporary World", prereq: "none" },
        { code: "GE 9", desc: "Life and Works of Rizal", prereq: "none" },
        { code: "IT 101", desc: "Introduction to Computing", prereq: "none" },
        { code: "IT 102", desc: "Computer Programming 1", prereq: "none" },
        { code: "NSTP 1", desc: "National Service Training Program I", prereq: "none" },
        { code: "PE 1", desc: "Physical Education 1", prereq: "none" },
        { code: "SF 1", desc: "Student Formation 1", prereq: "none" },
        // FIRST YEAR / SECOND SEMESTER
        { code: "GE 1", desc: "Understanding the Self", prereq: "none" },
        { code: "GE 2", desc: "Mathematics in the Modern World", prereq: "none" },
        { code: "GE 3", desc: "Purposive Communication", prereq: "none" },
        { code: "IT 103", desc: "Computer Programming 2", prereq: "IT 102" },
        { code: "IT 104", desc: "Introduction to Human Computer Interaction", prereq: "IT 101" },
        { code: "IT 105", desc: "Discrete Mathematics 1", prereq: "IT 102" },
        { code: "NSTP 2", desc: "National Service Training Program II", prereq: "NSTP 1" },
        { code: "PE 2", desc: "Physical Education 2", prereq: "PE 1" },
        { code: "SF 2", desc: "Student Formation 2", prereq: "SF 1" },
        // SECOND YEAR / FIRST SEMESTER
        { code: "GE 6", desc: "Art Appreciation", prereq: "none" },
        { code: "GE 7", desc: "Science, Technology and Society", prereq: "none" },
        { code: "GE 8", desc: "Ethics", prereq: "none" },
        { code: "IT 201", desc: "Data Structures and Algorithms", prereq: "IT 103" },
        { code: "IT 202", desc: "Networking 1", prereq: "IT 101" },
        { code: "IT Elect 1", desc: "Object Oriented Programming", prereq: "IT 103" },
        { code: "IT Elect 2", desc: "Platform Technologies", prereq: "IT 101" },
        { code: "PE 3", desc: "Physical Education 3", prereq: "PE 2" },
        { code: "SF 3", desc: "Student Formation 3", prereq: "SF 1" },
        // SECOND YEAR / SECOND SEMESTER
        { code: "IT 203", desc: "Information Management", prereq: "none" },
        { code: "IT 204", desc: "Quantitative Methods (Incl. Modeling & Simulation)", prereq: "none" },
        { code: "IT 205", desc: "Integrative Programming & Technologies", prereq: "none" },
        { code: "IT 206", desc: "Networking 2", prereq: "IT 103" },
        { code: "IT 207", desc: "Multimedia", prereq: "IT 101" },
        { code: "IT Elect 3", desc: "Web Systems and Technologies 1", prereq: "IT 103" },
        { code: "PE 4", desc: "Physical Education 4", prereq: "IT 101" },
        { code: "SF 4", desc: "Student Formation 4", prereq: "none" },
        // THIRD YEAR / FIRST SEMESTER
        { code: "GE 12", desc: "Reading Visual Art", prereq: "none" },
        { code: "IT 301", desc: "Advance Database Systems", prereq: "IT 203" },
        { code: "IT 302", desc: "System Integration and Architecture", prereq: "IT 203" },
        { code: "IT 303", desc: "Event-Driven Programming", prereq: "IT 203" },
        { code: "IT 304", desc: "Information Assurance and Security 1", prereq: "IT 205" },
        { code: "IT 305", desc: "Mobile Application Development", prereq: "IT 206" },
        { code: "IT 306", desc: "Game Development", prereq: "IT 205" },
        { code: "IT 307", desc: "Web Systems and Technologies 2", prereq: "none" },
        { code: "SF 5", desc: "Student Formation 5", prereq: "SF 1" },
        // THIRD YEAR / SECOND SEMESTER
        { code: "IT 308", desc: "Information Assurance and Security 2", prereq: "IT 304" },
        { code: "IT 309", desc: "Application Development and Emerging Technologies", prereq: "IT 303" },
        { code: "IT 310", desc: "Data Science and Analytics", prereq: "IT 301" },
        { code: "IT 311", desc: "Technopreneurship", prereq: "none" },
        { code: "IT 312", desc: "Embedded Systems", prereq: "IT 303" },
        { code: "IT Elect 4", desc: "System Integration and Architecture 2", prereq: "IT 302" },
        { code: "SF 6", desc: "Student Formation 6", prereq: "SF 1" },
        // SUMMER
        { code: "CAP 101", desc: "Capstone Project and Research 1", prereq: "3rd Year Standing" },
        { code: "SP 101", desc: "Social and Professional Issues", prereq: "3rd Year Standing" },
        // FOURTH YEAR / FIRST SEMESTER
        { code: "CAP 102", desc: "Capstone Project and Research 2", prereq: "CAP 101" },
        { code: "IT 401", desc: "Systems Administration and Maintenance", prereq: "IT 308" },
        { code: "SWT 101", desc: "ICT Seminar & Workshop", prereq: "none" },
        // FOURTH YEAR / SECOND SEMESTER
        { code: "PRAC 101", desc: "PRACTICUM (486 HOURS)", prereq: "CAP 101 & IT 308" }
    ];

    const BSIT_PROSPECTUS = {
        "1-1": prospectus.slice(0, 10),
        "1-2": prospectus.slice(10, 19),
        "2-1": prospectus.slice(19, 28),
        "2-2": prospectus.slice(28, 36),
        "3-1": prospectus.slice(36, 45),
        "3-2": prospectus.slice(45, 52),
        "summer": prospectus.slice(52, 54),
        "4-1": prospectus.slice(54, 57),
        "4-2": prospectus.slice(57, 58)
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

    useEffect(() => {
        if (!searchQuery) {
            setFilteredStudents([]);
            return;
        }
        const hits = students.filter(s => 
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            s.id.toString().includes(searchQuery)
        );
        setFilteredStudents(hits);
    }, [searchQuery, students]);

    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        setSearchQuery(`${student.name} (${student.id})`);
        setFilteredStudents([]);
        
        // Initialize grades table based on year/sem
        const key = `${student.year_level || '1'}-${selectedSemester.includes('2') ? '2' : '1'}`;
        const initialGrades = (BSIT_PROSPECTUS[key] || []).map(sub => ({
            ...sub,
            grade: '',
            sem: selectedSemester
        }));
        setGradingRows(initialGrades);
    };

    const handleAddSubject = (e) => {
        const code = e.target.value;
        const sub = prospectus.find(p => p.code === code);
        if (sub && !gradingRows.find(r => r.code === code)) {
            setGradingRows([...gradingRows, { ...sub, grade: '' }]);
        }
    };

    const handleGradeChange = (code, val) => {
        setGradingRows(rows => rows.map(r => r.code === code ? { ...r, grade: val } : r));
    };

    const handleSubmit = async () => {
        if (!selectedStudent || gradingRows.every(r => !r.grade)) return;
        
        setSyncing(true);
        try {
            // PHP-style session auth - no JWT token needed
            const evals = gradingRows.filter(r => r.grade).map(r => ({
                code: r.code,
                grade: parseFloat(r.grade),
                sem: r.sem || selectedSemester
            }));
            
            const res = await axios.post('http://localhost:5000/api/evaluations', {
                studentId: selectedStudent.id,
                grades: evals
            });

            if (res.data.success) {
                // Enrollment forecast
                try {
                    // PHP-style session auth - no JWT token needed
                    const forecastRes = await axios.get(`http://localhost:5000/api/standing/all`);
                    // Filter recommendations for the current student
                    const studentStanding = forecastRes.data.find(s => s.student_id === selectedStudent.id);
                    if (studentStanding) {
                        setRecommendations([
                            { code: 'Eligible', title: studentStanding.reason }
                        ]);
                    }
                } catch (e) {
                    console.error('Forecast error:', e);
                }
                alert('AI Evaluation synced successfully!');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to sync evaluation.');
        } finally {
            setSyncing(false);
        }
    };


    return (
        <AppLayout title="Evaluate / Grade">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Step 1: Search */}
                <div className="bg-white rounded-[32px] p-8 border border-[#f0edf9] shadow-sm overflow-visible relative z-20">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-[#7c3aed1a] text-[#7c3aed] flex items-center justify-center font-bold">1</div>
                        <div>
                            <h3 className="text-lg font-black text-[#1a0838]">Find Student</h3>
                            <p className="text-xs text-[#9490c0] font-medium">Search by name or ID number to begin evaluation</p>
                        </div>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c4bfe0] group-focus-within:text-[#7c3aed] transition-colors" size={20} />
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Type student name or ID..."
                            className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border-2 border-[#f0edf9] rounded-2xl focus:border-[#7c3aed] focus:bg-white transition-all outline-none font-medium placeholder:text-[#c4bfe0]"
                        />
                        
                        <AnimatePresence>
                            {filteredStudents.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-[#f0edf9] overflow-hidden"
                                >
                                    {filteredStudents.map(s => (
                                        <div 
                                            key={s.id}
                                            onClick={() => handleSelectStudent(s)}
                                            className="p-4 hover:bg-[#7c3aed0a] cursor-pointer flex items-center gap-4 border-b border-[#f0edf9] last:border-none group"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#db2777] text-white flex items-center justify-center font-bold">{s.name.charAt(0)}</div>
                                            <div className="flex-1">
                                                <p className="font-bold text-[#1a0838]">{s.name}</p>
                                                <p className="text-xs text-[#9490c0]">ID: {s.id} • {s.program} • Year {s.year_level}</p>
                                            </div>
                                            <ChevronRight size={16} className="text-[#c4bfe0] group-hover:translate-x-1 transition-all" />
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {selectedStudent && (
                        <div className="mt-8 p-6 bg-[#f9f8fd] rounded-2xl border border-[#f0edf9] flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-2xl font-black text-[#1a0838] shadow-sm">
                                {selectedStudent.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-lg font-black text-[#1a0838] leading-tight">{selectedStudent.name}</h4>
                                <p className="text-sm text-[#9490c0] font-medium mt-1">ID: {selectedStudent.id} • {selectedStudent.program} • {selectedStudent.type}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/10">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                    Active
                                </span>
                                <button className="p-2.5 bg-white border border-[#f0edf9] rounded-xl text-[#9490c0] hover:text-[#7c3aed] transition-all shadow-sm"><RotateCcw size={16} /></button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Step 2: Semester */}
                {selectedStudent && (
                    <div className="bg-white rounded-[32px] p-8 border border-[#f0edf9] shadow-sm">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-[#db27771a] text-[#db2777] flex items-center justify-center font-bold">2</div>
                            <div>
                                <h3 className="text-lg font-black text-[#1a0838]">Select Semester</h3>
                                <p className="text-xs text-[#9490c0] font-medium">Choose target term to record academic performance</p>
                            </div>
                        </div>

                        <div className="max-w-xs">
                             <select 
                                value={selectedSemester} 
                                onChange={(e) => setSelectedSemester(e.target.value)}
                                className="w-full px-4 py-4 bg-gray-50/50 border-2 border-[#f0edf9] rounded-2xl focus:border-[#db2777] focus:bg-white transition-all outline-none font-bold text-[#1a0838]"
                             >
                                {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                        </div>
                    </div>
                )}

                {/* Step 3: Grade Table */}
                {selectedStudent && (
                    <div className="bg-white rounded-[32px] p-8 border border-[#f0edf9] shadow-sm overflow-hidden">
                        <div className="flex items-start gap-4 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-[#0d94881a] text-[#0d9488] flex items-center justify-center font-bold">3</div>
                            <div className="flex-1">
                                <h3 className="text-lg font-black text-[#1a0838]">Grade Input</h3>
                                <p className="text-xs text-[#9490c0] font-medium">Record numerical grades for the selected semester</p>
                            </div>
                            <div className="px-3 py-1 bg-[#7c3aed1a] text-[#7c3aed] text-[10px] font-black uppercase tracking-widest rounded-lg border border-[#7c3aed1a]">
                                Regular Mode
                            </div>
                        </div>

                        <div className="overflow-x-auto -mx-2">
                            <table className="w-full border-separate border-spacing-y-2">
                                <thead>
                                    <tr className="text-[#9490c0] text-[11px] font-black uppercase tracking-widest">
                                        <th className="px-4 py-2 text-left">Code</th>
                                        <th className="px-4 py-2 text-left">Subject</th>
                                        <th className="px-4 py-2 text-left">Prereq</th>
                                        <th className="px-4 py-2 text-center w-32">Grade</th>
                                        <th className="px-4 py-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {gradingRows.map(row => (
                                        <tr key={row.code} className="bg-gray-50/50 group hover:bg-white hover:shadow-md transition-all rounded-2xl">
                                            <td className="px-4 py-4 font-black text-[#1a0838] rounded-l-2xl border-y border-[#f0edf9] border-l">{row.code}</td>
                                            <td className="px-4 py-4 text-sm font-medium text-[#6b67a0] border-y border-[#f0edf9]">{row.desc}</td>
                                            <td className="px-4 py-4 border-y border-[#f0edf9]">
                                                <span className="px-2.5 py-1 bg-white border border-[#f0edf9] rounded-lg text-[10px] font-bold text-[#c4bfe0]">{row.prereq}</span>
                                            </td>
                                            <td className="px-4 py-4 border-y border-[#f0edf9] text-center">
                                                <input 
                                                    type="number" 
                                                    value={row.grade}
                                                    onChange={(e) => handleGradeChange(row.code, e.target.value)}
                                                    placeholder="—"
                                                    className="w-20 px-3 py-2 bg-white border-2 border-[#f0edf9] rounded-xl text-center font-bold focus:border-[#7c3aed] outline-none"
                                                />
                                            </td>
                                            <td className="px-4 py-4 rounded-r-2xl border-y border-[#f0edf9] border-r">
                                                <button 
                                                    onClick={() => setGradingRows(rows => rows.filter(r => r.code !== row.code))}
                                                    className="p-2 text-[#c4bfe0] hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 p-4 bg-gray-50 border-2 border-dashed border-[#f0edf9] rounded-2xl flex items-center gap-4">
                            <div className="flex-1">
                                <select 
                                    className="w-full bg-transparent border-none outline-none font-bold text-sm text-[#1a0838]"
                                    onChange={handleAddSubject}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Add extra subject to record...</option>
                                    {prospectus.map(p => <option key={p.code} value={p.code}>{p.code} — {p.desc}</option>)}
                                </select>
                            </div>
                            <button className="px-4 py-2 bg-white border border-[#f0edf9] text-[#7c3aed] rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm hover:bg-[#7c3aed] hover:text-white transition-all">
                                <Plus size={14} /> Add Subject
                            </button>
                        </div>

                        {recommendations.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-8 p-6 bg-gradient-to-br from-[#1a0838] to-[#0f0520] rounded-2xl text-white overflow-hidden"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <Zap className="text-[#db2777]" size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#a78bfa]">AI Enrollment Recommendation</span>
                                </div>
                                <p className="text-xs text-white/60 mb-4 font-medium leading-relaxed">Based on recorded performance, the student is eligible for:</p>
                                <div className="flex flex-wrap gap-2">
                                    {recommendations.map(r => (
                                        <div key={r.code} className="px-4 py-2 bg-white/10 border border-white/10 rounded-xl flex items-center gap-2 text-xs font-bold">
                                            <CheckCircle size={14} className="text-green-400" />
                                            {r.code} — {r.title}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        <button 
                            disabled={syncing || gradingRows.length === 0}
                            onClick={handleSubmit}
                            className="mt-8 w-full py-5 bg-gradient-to-r from-[#0d9488] to-[#14b8a6] text-white font-bold rounded-2xl shadow-lg shadow-[#0d948833] hover:scale-[1.01] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {syncing ? (
                                <><RotateCcw className="animate-spin" size={20} /> Syncing Records...</>
                            ) : (
                                <><Plus size={20} /> Sync Evaluation & Generate AI Intelligence</>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default Evaluate;
