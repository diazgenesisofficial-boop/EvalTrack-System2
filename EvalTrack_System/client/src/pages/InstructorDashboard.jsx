import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LayoutDashboard, ClipboardCheck, BarChart3, UserPlus, Users, 
  Wand2, MessageSquare, LogOut, Search, Calendar, BookOpen, 
  Target, Sparkles, ChevronRight, Clock, Menu, X, Send, 
  GraduationCap, Layers, CreditCard, Mail, CheckCircle, 
  Clock3, Trash2, History, Bot, FileText, Lightbulb, 
  Plus, Minus, RotateCcw, Check, Filter, RefreshCw,
  ChevronDown, Eye, Download, User, Bell
} from 'lucide-react';
import '../styles/ProgramHead.css';

const InstructorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Navigation state
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  
  // Dashboard states
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatbotTitle, setChatbotTitle] = useState('AI Assistant');
  const [chatbotIntro, setChatbotIntro] = useState('Hello! How can I help?');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // Evaluate & Grade states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [academicTerm, setAcademicTerm] = useState('');
  const [program, setProgram] = useState('BSIT');
  const [yearLevel, setYearLevel] = useState('');
  const [studentType, setStudentType] = useState('regular');
  const [gradingMode, setGradingMode] = useState('regular');
  const [subjects, setSubjects] = useState([]);
  const [showGradingArea, setShowGradingArea] = useState(false);
  const [enrollmentForecast, setEnrollmentForecast] = useState([]);
  
  // AI Reports states
  const [reportProgram, setReportProgram] = useState('BSIT');
  const [reportSemester, setReportSemester] = useState('');
  const [reportYearLevel, setReportYearLevel] = useState('');
  const [reportStudentType, setReportStudentType] = useState('');
  const [reportStudentSearch, setReportStudentSearch] = useState('');
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedReportStudent, setSelectedReportStudent] = useState('');
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [activeReportTab, setActiveReportTab] = useState('recommendations');
  const [recommendations, setRecommendations] = useState([]);
  const [gradeReportData, setGradeReportData] = useState([]);
  
  // Enrollment states
  const [enrollmentSearchQuery, setEnrollmentSearchQuery] = useState('');
  const [enrollmentSearchResults, setEnrollmentSearchResults] = useState([]);
  const [selectedEnrollmentStudent, setSelectedEnrollmentStudent] = useState(null);
  const [enrollmentRecommendations, setEnrollmentRecommendations] = useState([]);
  const [subjectLoad, setSubjectLoad] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubjectToAdd, setSelectedSubjectToAdd] = useState('');
  const [enrollmentHistory, setEnrollmentHistory] = useState([]);
  const [totalUnits, setTotalUnits] = useState(0);
  const [enrollmentStatus, setEnrollmentStatus] = useState('Pending');
  const [targetSemester, setTargetSemester] = useState('Pending');
  
  // Student Monitoring states
  const [monitoringFilters, setMonitoringFilters] = useState({
    program: '',
    year: '',
    academicYear: '',
    status: '',
    search: ''
  });
  const [monitoringStudents, setMonitoringStudents] = useState([]);
  const [selectedMonitoringStudent, setSelectedMonitoringStudent] = useState(null);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [studentDetails, setStudentDetails] = useState(null);
  const [subjectView, setSubjectView] = useState('current');
  const [monitoringStats, setMonitoringStats] = useState({
    total: 0,
    enrolled: 0,
    pending: 0,
    graduated: 0
  });
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  
  // Evaluation result modal
  const [showEvalModal, setShowEvalModal] = useState(false);
  
  const chatEndRef = useRef(null);
  
  // Page titles mapping
  const pageTitles = {
    dashboard: 'Dashboard',
    evaluate: 'Evaluate / Grade',
    reports: 'AI Reports',
    enrollment: 'Enrollment',
    monitoring: 'Student Monitoring',
    exams: 'AI Exam Generator',
    messages: 'Admin Messages'
  };
  
  // Clock effect
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Load chat history on mount
  useEffect(() => {
    const history = getChatHistory();
    setChatHistory(history);
  }, []);
  
  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  // Toast helper
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000);
  };
  
  // Chat History Functions
  const getChatHistory = () => {
    try {
      const data = localStorage.getItem('evaltrack_chat_history');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading chat history:', e);
      return [];
    }
  };
  
  const saveChatMessage = (topic, sender, message) => {
    if (!message || message.includes('typing-dot')) return;
    
    const history = getChatHistory();
    const sessionIndex = history.findIndex(s => s.topic === topic);
    const timestamp = new Date().toISOString();
    
    if (sessionIndex >= 0) {
      history[sessionIndex].messages.push({ sender, message, timestamp });
      history[sessionIndex].lastUpdated = timestamp;
    } else {
      history.push({
        topic,
        messages: [{ sender, message, timestamp }],
        createdAt: timestamp,
        lastUpdated: timestamp
      });
    }
    
    if (history.length > 50) history.shift();
    localStorage.setItem('evaltrack_chat_history', JSON.stringify(history));
    setChatHistory(history);
  };
  
  const deleteChatSession = (topic) => {
    let history = getChatHistory();
    history = history.filter(s => s.topic !== topic);
    localStorage.setItem('evaltrack_chat_history', JSON.stringify(history));
    setChatHistory(history);
  };
  
  const clearAllChatHistory = () => {
    localStorage.removeItem('evaltrack_chat_history');
    setChatHistory([]);
  };
  
  const loadChatHistory = (topic) => {
    const history = getChatHistory();
    const session = history.find(s => s.topic === topic);
    if (!session || !session.messages) return;
    
    const messagesToLoad = session.messages.slice(-20).map(msg => ({
      role: msg.sender,
      content: msg.message
    }));
    setChatMessages(messagesToLoad);
  };
  
  // AI Chatbot Functions
  const openAIChatbot = (title, intro) => {
    const cleanTitle = title.replace(/&amp;/g, '&');
    setChatbotTitle(cleanTitle);
    setChatbotIntro(intro);
    setChatbotOpen(true);
    
    const history = getChatHistory();
    const session = history.find(s => s.topic === cleanTitle);
    
    if (session && session.messages && session.messages.length > 0) {
      loadChatHistory(cleanTitle);
    } else {
      setChatMessages([{ role: 'bot', content: intro || 'Hello! How can I help?' }]);
    }
  };
  
  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    saveChatMessage(chatbotTitle, 'user', userMsg);
    setChatInput('');
    
    // Add typing indicator
    const typingId = Date.now();
    setChatMessages(prev => [...prev, { role: 'bot', content: 'typing', id: typingId }]);
    
    try {
      const res = await axios.post('http://localhost:5000/api/ai/chat', {
        topic: chatbotTitle,
        query: userMsg,
        context: chatbotTitle,
        userRole: 'Program Head'
      });
      
      // Remove typing indicator
      setChatMessages(prev => prev.filter(msg => msg.id !== typingId));
      
      const reply = res.data?.reply || 'No response';
      setChatMessages(prev => [...prev, { 
        role: 'bot', 
        content: reply,
        reportHtml: res.data?.report?.pdf_ready_html,
        reportFilename: res.data?.report?.pdf_download_filename
      }]);
      saveChatMessage(chatbotTitle, 'bot', reply);
    } catch (err) {
      setChatMessages(prev => prev.filter(msg => msg.id !== typingId));
      setChatMessages(prev => [...prev, { 
        role: 'bot', 
        content: `Connection Error: ${err.message}` 
      }]);
    }
  };
  
  const downloadAIReport = (html, filename) => {
    try {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'report.html';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download report error', e);
      showToast('Failed to download report', 'error');
    }
  };
  
  // Student Search Functions
  const searchStudents = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/students/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data || []);
    } catch (err) {
      console.error('Search error:', err);
      showToast('Failed to search students', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const selectStudentForGrading = (student) => {
    setSelectedStudent(student);
    setSearchResults([]);
    setSearchQuery('');
  };
  
  // Sync Profile & Load Subjects
  const syncProfileAndLoadSubjects = async () => {
    if (!selectedStudent || !academicTerm || !yearLevel) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      // Determine subjects based on program, year, and student type
      let subjectsToLoad = [];
      
      if (studentType === 'regular') {
        // Load regular curriculum subjects
        subjectsToLoad = getRegularSubjects(program, yearLevel, academicTerm);
      } else if (studentType === 'irregular') {
        // For irregular students, we might load failed subjects or allow custom selection
        subjectsToLoad = await getIrregularSubjects(selectedStudent.id);
      } else {
        // Transferee - empty list to start
        subjectsToLoad = [];
      }
      
      setSubjects(subjectsToLoad.map(s => ({ ...s, grade: '', status: '' })));
      setShowGradingArea(true);
      
      // Calculate enrollment forecast
      const forecast = calculateEnrollmentForecast(subjectsToLoad);
      setEnrollmentForecast(forecast);
      
      showToast('Profile synced successfully', 'success');
    } catch (err) {
      console.error('Sync error:', err);
      showToast('Failed to sync profile', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper to get regular subjects (simplified - in real app this comes from curriculum data)
  const getRegularSubjects = (prog, year, term) => {
    // This would typically load from window.BSIT_PROSPECTUS or similar
    const mockSubjects = {
      BSIT: {
        1: {
          '1st Semester': [
            { code: 'IT101', description: 'Introduction to Computing', units: 3, prerequisite: 'None' },
            { code: 'IT102', description: 'Computer Programming 1', units: 3, prerequisite: 'None' },
            { code: 'GE101', description: 'Mathematics in the Modern World', units: 3, prerequisite: 'None' },
          ],
          '2nd Semester': [
            { code: 'IT103', description: 'Computer Programming 2', units: 3, prerequisite: 'IT102' },
            { code: 'IT104', description: 'Data Structures', units: 3, prerequisite: 'IT102' },
          ]
        },
        2: {
          '1st Semester': [
            { code: 'IT201', description: 'Object-Oriented Programming', units: 3, prerequisite: 'IT103' },
            { code: 'IT202', description: 'Database Management', units: 3, prerequisite: 'IT104' },
          ]
        }
      }
    };
    
    return mockSubjects[prog]?.[year]?.[term] || [];
  };
  
  const getIrregularSubjects = async (studentId) => {
    // Fetch failed subjects for irregular students
    try {
      const res = await axios.get(`http://localhost:5000/api/students/${studentId}/failed-subjects`);
      return res.data || [];
    } catch (err) {
      return [];
    }
  };
  
  const calculateEnrollmentForecast = (currentSubjects) => {
    // Predict next semester subjects based on grades
    const forecast = [];
    currentSubjects.forEach(subj => {
      if (subj.grade && parseFloat(subj.grade) <= 3.0) {
        // Student passed, could take next level subjects
        forecast.push({ ...subj, nextLevel: true });
      }
    });
    return forecast;
  };
  
  // Grade Input Functions
  const updateSubjectGrade = (index, grade) => {
    const updated = [...subjects];
    updated[index].grade = grade;
    updated[index].status = parseFloat(grade) <= 3.0 ? 'Passed' : 'Failed';
    setSubjects(updated);
  };
  
  const addExtraSubject = () => {
    if (!selectedSubjectToAdd) return;
    const subject = availableSubjects.find(s => s.code === selectedSubjectToAdd);
    if (subject) {
      setSubjects([...subjects, { ...subject, grade: '', status: '' }]);
      setSelectedSubjectToAdd('');
    }
  };
  
  const submitGrades = async () => {
    if (!selectedStudent) return;
    
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/evaluations/submit', {
        studentId: selectedStudent.id,
        academicTerm,
        program,
        yearLevel,
        studentType,
        subjects
      });
      
      showToast('Grades submitted and AI reports generated', 'success');
      setShowEvalModal(true);
    } catch (err) {
      console.error('Submit error:', err);
      showToast('Failed to submit grades', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Enrollment Functions
  const searchEnrollmentStudents = async () => {
    if (!enrollmentSearchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/students/search?q=${encodeURIComponent(enrollmentSearchQuery)}`);
      setEnrollmentSearchResults(res.data || []);
    } catch (err) {
      showToast('Failed to search students', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const selectEnrollmentStudent = (student) => {
    setSelectedEnrollmentStudent(student);
    setEnrollmentSearchResults([]);
    setEnrollmentSearchQuery('');
    loadEnrollmentRecommendations(student);
  };
  
  const loadEnrollmentRecommendations = async (student) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/students/${student.id}/recommendations`);
      setEnrollmentRecommendations(res.data || []);
    } catch (err) {
      setEnrollmentRecommendations([]);
    }
  };
  
  const addSubjectToEnrollment = () => {
    if (!selectedSubjectToAdd) return;
    const subject = availableSubjects.find(s => s.code === selectedSubjectToAdd);
    if (subject && !subjectLoad.find(s => s.code === subject.code)) {
      setSubjectLoad([...subjectLoad, subject]);
      setTotalUnits(prev => prev + (subject.units || 0));
      setSelectedSubjectToAdd('');
    }
  };
  
  const dropSubject = (index) => {
    const subject = subjectLoad[index];
    setSubjectLoad(subjectLoad.filter((_, i) => i !== index));
    setTotalUnits(prev => prev - (subject.units || 0));
  };
  
  const resetEnrollment = () => {
    setSubjectLoad([]);
    setTotalUnits(0);
    setEnrollmentStatus('Pending');
  };
  
  const finalizeEnrollment = async () => {
    if (!selectedEnrollmentStudent || subjectLoad.length === 0) {
      showToast('Please select a student and add subjects', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/enrollment/finalize', {
        studentId: selectedEnrollmentStudent.id,
        subjects: subjectLoad,
        totalUnits,
        status: 'Enrolled'
      });
      
      showToast('Enrollment finalized successfully', 'success');
      setEnrollmentStatus('Enrolled');
      loadEnrollmentHistory();
    } catch (err) {
      showToast('Failed to finalize enrollment', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const loadEnrollmentHistory = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/enrollment/history');
      setEnrollmentHistory(res.data || []);
    } catch (err) {
      setEnrollmentHistory([]);
    }
  };
  
  // Student Monitoring Functions
  const filterMonitoringStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (monitoringFilters.program) params.append('program', monitoringFilters.program);
      if (monitoringFilters.year) params.append('year', monitoringFilters.year);
      if (monitoringFilters.academicYear) params.append('academicYear', monitoringFilters.academicYear);
      if (monitoringFilters.status) params.append('status', monitoringFilters.status);
      if (monitoringFilters.search) params.append('search', monitoringFilters.search);
      
      const res = await axios.get(`http://localhost:5000/api/students?${params.toString()}`);
      setMonitoringStudents(res.data?.students || []);
      setMonitoringStats(res.data?.stats || { total: 0, enrolled: 0, pending: 0, graduated: 0 });
    } catch (err) {
      showToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const openStudentDetails = async (student) => {
    setSelectedMonitoringStudent(student);
    setShowStudentDetails(true);
    
    try {
      const res = await axios.get(`http://localhost:5000/api/students/${student.id}/details`);
      setStudentDetails(res.data);
    } catch (err) {
      setStudentDetails(null);
    }
  };
  
  const closeStudentDetails = () => {
    setShowStudentDetails(false);
    setSelectedMonitoringStudent(null);
    setStudentDetails(null);
  };
  
  // Navigation Handler
  const handleNavigate = (section) => {
    setActiveSection(section);
    setSidebarOpen(false);
    
    if (section === 'monitoring') {
      filterMonitoringStudents();
    } else if (section === 'enrollment') {
      loadEnrollmentHistory();
    }
  };
  
  // Logout Handler
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Render Functions
  const renderDashboard = () => (
    <div className="section-content">
      <div className="ph">
        <div>
          <div className="ph-title">Instructor AI Tooling</div>
          <div className="ph-sub">Quick-access AI assistants for Program Heads at Jose Maria College</div>
        </div>
      </div>

      <div className="tool-grid">
        <div className="tool-card" onClick={() => openAIChatbot('Schedule Manager', 'Hello Instructor! Let me know what times you are free to meet Dean this week and I will help coordinate.')}>
          <div className="tool-icon ti-purple"><Calendar size={24} /></div>
          <div className="tool-head">Dean Scheduling</div>
          <div className="tool-body">Automate meeting coordination with Dean's schedule using AI-powered planning.</div>
          <button className="btn btn-primary">
            <Calendar size={16} /> Schedule Meeting
          </button>
        </div>
        
        <div className="tool-card" onClick={() => openAIChatbot('Library AI', 'Hello Instructor! Which subject are you looking for reference materials or textbooks for?')}>
          <div className="tool-icon ti-amber"><BookOpen size={24} /></div>
          <div className="tool-head">Curriculum Resources</div>
          <div className="tool-body">Get curated links to teaching materials, syllabi, and reference books.</div>
          <button className="btn btn-primary">
            <Search size={16} /> Find Materials
          </button>
        </div>
        
        <div className="tool-card" onClick={() => openAIChatbot('Goal Coach', 'Welcome, Instructor! Are you looking to improve class passing rates, reduce failure counts, or refine curriculum delivery?')}>
          <div className="tool-icon ti-teal"><Target size={24} /></div>
          <div className="tool-head">Teaching Goal Coach</div>
          <div className="tool-body">Set and track professional teaching goals, class performance targets.</div>
          <button className="btn btn-primary">
            <Target size={16} /> Set Goals
          </button>
        </div>
        
        <div className="tool-card" onClick={() => openAIChatbot('Exam & Quiz Bot', 'Hello! Paste your topic or syllabus block here and I will generate a structured 10-question quiz for it.')}>
          <div className="tool-icon ti-mag"><Wand2 size={24} /></div>
          <div className="tool-head">AI Exam Generator</div>
          <div className="tool-body">Paste a topic or syllabus block and instantly generate quizzes, MCQs.</div>
          <button className="btn btn-primary">
            <Sparkles size={16} /> Generate Exam
          </button>
        </div>
      </div>
    </div>
  );
  
  const renderEvaluate = () => (
    <div className="section-content">
      <div className="ph">
        <div>
          <div className="ph-title">Evaluate & Grade</div>
          <div className="ph-sub">Search a student → set semester → enter grades → sync AI automation</div>
        </div>
      </div>

      {/* Step 1: Find Student */}
      <div className="card">
        <div className="step-head">
          <div className="step-num">1</div>
          <div className="step-info">
            <div className="step-name">Find Student</div>
            <div className="step-desc">Search by Student ID, Name, or Email</div>
          </div>
        </div>
        <div className="student-enrollment-search" style={{ marginTop: 16 }}>
          <div className="search-wrapper" style={{ display: 'flex', gap: 10 }}>
            <input 
              type="text" 
              className="form-control" 
              style={{ flex: 1 }} 
              placeholder="Search by Student ID, Name, or Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchStudents()}
            />
            <button className="btn btn-primary" onClick={searchStudents}>
              <Search size={16} /> Search
            </button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="student-search-results">
              {searchResults.map(student => (
                <div key={student.id} className="student-result-item" onClick={() => selectStudentForGrading(student)}>
                  <div className="student-result-avatar">{student.name?.charAt(0) || '?'}</div>
                  <div className="student-result-info">
                    <div className="student-result-name">{student.name}</div>
                    <div className="student-result-meta">{student.id} • {student.program} • {student.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {selectedStudent && (
            <div className="selected-student-banner">
              <div className="student-avatar">{selectedStudent.name?.charAt(0)}</div>
              <div className="student-info">
                <div className="student-name">{selectedStudent.name}</div>
                <div className="student-meta">{selectedStudent.id} • {selectedStudent.program}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedStudent(null)}>Change</button>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Academic Configuration */}
      <div className="card">
        <div className="step-head">
          <div className="step-num">2</div>
          <div className="step-info">
            <div className="step-name">Academic Configuration</div>
            <div className="step-desc">Configure semester settings and synchronize student profile</div>
          </div>
        </div>
        
        <div className="form-grid">
          <div className="form-group">
            <div className="form-label"><Calendar size={14} /> Academic Term</div>
            <select className="form-control" value={academicTerm} onChange={(e) => setAcademicTerm(e.target.value)}>
              <option value="">Select Academic Term</option>
              <option value="1st Semester">1st Semester</option>
              <option value="2nd Semester">2nd Semester</option>
              <option value="Summer">Summer</option>
            </select>
          </div>
          
          <div className="form-group">
            <div className="form-label"><GraduationCap size={14} /> Program</div>
            <select className="form-control" value={program} onChange={(e) => setProgram(e.target.value)}>
              <option value="BSIT">BSIT</option>
              <option value="BSEMC" disabled>BSEMC (Coming Soon)</option>
            </select>
          </div>
          
          <div className="form-group">
            <div className="form-label"><Layers size={14} /> Year Level</div>
            <select className="form-control" value={yearLevel} onChange={(e) => setYearLevel(e.target.value)}>
              <option value="">Select Year</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
          
          <div className="form-group">
            <div className="form-label"><User size={14} /> Student Type</div>
            <select className="form-control" value={studentType} onChange={(e) => setStudentType(e.target.value)}>
              <option value="regular">Regular</option>
              <option value="irregular">Irregular</option>
              <option value="transferee">Transferee</option>
            </select>
          </div>
        </div>
        
        <div className="form-actions">
          <button className="btn btn-primary" onClick={syncProfileAndLoadSubjects} disabled={!selectedStudent || loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Sync Profile & Load Subjects
          </button>
        </div>
      </div>

      {/* Step 3: Grade Table */}
      {showGradingArea && (
        <div className="card">
          <div className="card-hd">
            <div>
              <div className="card-title"><ClipboardCheck size={18} /> Grade Input</div>
              <div className="card-sub">Enter grades below</div>
            </div>
            <span className="badge bg-purple">{studentType === 'regular' ? 'Regular Mode' : 'Irregular Mode'}</span>
          </div>

          <div className="table-wrap" style={{ maxHeight: 420, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Subject</th>
                  <th>Prerequisite</th>
                  <th>Grade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subj, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 800 }}>{subj.code}</td>
                    <td>{subj.description}</td>
                    <td>{subj.prerequisite}</td>
                    <td>
                      <input 
                        type="number" 
                        className="grade-input" 
                        min="1" 
                        max="5" 
                        step="0.01"
                        value={subj.grade}
                        onChange={(e) => updateSubjectGrade(idx, e.target.value)}
                        placeholder="0.00"
                      />
                    </td>
                    <td>
                      {subj.status && (
                        <span className={`badge ${subj.status === 'Passed' ? 'bg-green' : 'bg-red'}`}>
                          {subj.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Extra Subject */}
          <div className="add-subject-row">
            <div className="field" style={{ flex: 1 }}>
              <div className="field-label">Add Extra Subject</div>
              <select className="form-control" value={selectedSubjectToAdd} onChange={(e) => setSelectedSubjectToAdd(e.target.value)}>
                <option value="">Select Subject to Add</option>
                {availableSubjects.map(s => (
                  <option key={s.code} value={s.code}>{s.code} - {s.description}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={addExtraSubject}>
              <Plus size={16} /> Add Subject
            </button>
          </div>

          {/* Enrollment Forecast */}
          {enrollmentForecast.length > 0 && (
            <div className="enroll-preview">
              <div className="enroll-preview-label"><Sparkles size={14} /> AI Enrollment Recommendation</div>
              <div className="enroll-preview-sub">Based on passed subjects, student is eligible for these next semester:</div>
              <div className="enroll-chips">
                {enrollmentForecast.map((subj, idx) => (
                  <span key={idx} className="enroll-chip">{subj.code}</span>
                ))}
              </div>
            </div>
          )}

          <button className="btn btn-success" onClick={submitGrades} disabled={loading} style={{ width: '100%', marginTop: 16 }}>
            <Wand2 size={18} /> Evaluate & Generate AI Reports
          </button>
        </div>
      )}
    </div>
  );

  const renderReports = () => (
    <div className="section-content">
      <div className="ph">
        <div>
          <div className="ph-title">AI Reports</div>
          <div className="ph-sub">Generate comprehensive AI-powered academic reports and analytics</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-hd">
          <div>
            <div className="card-title"><Filter size={18} /> Filter Criteria</div>
            <div className="card-sub">Select program and academic parameters</div>
          </div>
        </div>
        
        <div className="form-grid">
          <div className="form-group">
            <div className="form-label"><GraduationCap size={14} /> Program</div>
            <select className="form-control" value={reportProgram} onChange={(e) => setReportProgram(e.target.value)}>
              <option value="BSIT">BSIT</option>
              <option value="BSEMC" disabled>BSEMC (Coming Soon)</option>
            </select>
          </div>
          
          <div className="form-group">
            <div className="form-label"><Calendar size={14} /> Semester</div>
            <select className="form-control" value={reportSemester} onChange={(e) => setReportSemester(e.target.value)}>
              <option value="">All Semesters</option>
              <option value="1st Semester">1st Semester</option>
              <option value="2nd Semester">2nd Semester</option>
              <option value="Summer">Summer</option>
            </select>
          </div>
          
          <div className="form-group">
            <div className="form-label"><Layers size={14} /> Year Level</div>
            <select className="form-control" value={reportYearLevel} onChange={(e) => setReportYearLevel(e.target.value)}>
              <option value="">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
          
          <div className="form-group">
            <div className="form-label"><User size={14} /> Student Type</div>
            <select className="form-control" value={reportStudentType} onChange={(e) => setReportStudentType(e.target.value)}>
              <option value="">All Types</option>
              <option value="regular">Regular</option>
              <option value="irregular">Irregular</option>
              <option value="transferee">Transferee</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student Search */}
      <div className="card">
        <div className="card-hd">
          <div>
            <div className="card-title"><Search size={18} /> Find Student</div>
            <div className="card-sub">Search for a specific student to generate their report</div>
          </div>
        </div>
        
        <div className="search-wrapper" style={{ display: 'flex', gap: 10 }}>
          <input 
            type="text" 
            className="form-control" 
            style={{ flex: 1 }} 
            placeholder="Search by Student ID, Name, or Email..."
            value={reportStudentSearch}
            onChange={(e) => setReportStudentSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchStudents()}
          />
          <button className="btn btn-primary" onClick={searchStudents}>
            <Search size={16} /> Search
          </button>
        </div>
        
        {selectedReportStudent && (
          <div className="selected-student-banner" style={{ marginTop: 16 }}>
            <div className="student-avatar">{selectedReportStudent.name?.charAt(0)}</div>
            <div className="student-info">
              <div className="student-name">{selectedReportStudent.name}</div>
              <div className="student-meta">{selectedReportStudent.id} • {selectedReportStudent.program}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedReportStudent('')}>
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Hub Tabs */}
      <div className="hub-tabs">
        <button className={`hub-tab ${activeReportTab === 'recommendations' ? 'active-rec' : ''}`} onClick={() => setActiveReportTab('recommendations')}>
          <Lightbulb size={16} /> Recommendations
        </button>
        <button className={`hub-tab ${activeReportTab === 'grade-report' ? 'active-rep' : ''}`} onClick={() => setActiveReportTab('grade-report')}>
          <FileText size={16} /> Grade Reports
        </button>
        <button className={`hub-tab ${activeReportTab === 'chat' ? 'active-chat' : ''}`} onClick={() => setActiveReportTab('chat')}>
          <MessageSquare size={16} /> AI Chat
        </button>
      </div>

      {/* Recommendations View */}
      {activeReportTab === 'recommendations' && (
        <div className="card">
          <div className="card-hd">
            <div>
              <div className="card-title"><Lightbulb size={18} /> AI Recommendations</div>
              <div className="card-sub">Smart suggestions based on student performance</div>
            </div>
          </div>
          
          {recommendations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Lightbulb size={48} /></div>
              <div className="empty-title">No Recommendations Yet</div>
              <div className="empty-text">Select a student and generate their evaluation to see AI recommendations.</div>
            </div>
          ) : (
            <div className="recommendations-list">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="recommendation-card">
                  <div className="rec-icon">{rec.icon}</div>
                  <div className="rec-content">
                    <div className="rec-title">{rec.title}</div>
                    <div className="rec-desc">{rec.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grade Reports View */}
      {activeReportTab === 'grade-report' && (
        <div className="card">
          <div className="card-hd">
            <div>
              <div className="card-title"><FileText size={18} /> Grade Reports</div>
              <div className="card-sub">Downloadable grade reports in various formats</div>
            </div>
          </div>
          
          {gradeReportData.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><FileText size={48} /></div>
              <div className="empty-title">No Reports Available</div>
              <div className="empty-text">Submit grades for a student to generate their grade report.</div>
            </div>
          ) : (
            <div className="reports-list">
              {gradeReportData.map((report, idx) => (
                <div key={idx} className="report-item">
                  <div className="report-info">
                    <div className="report-title">{report.title}</div>
                    <div className="report-meta">{report.date} • {report.semester}</div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => downloadAIReport(report.html, report.filename)}>
                    <Download size={14} /> Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Chat View */}
      {activeReportTab === 'chat' && (
        <div className="card">
          <div className="card-hd">
            <div>
              <div className="card-title"><Bot size={18} /> AI Assistant</div>
              <div className="card-sub">Chat with AI about student reports and analytics</div>
            </div>
          </div>
          
          <div className="ai-chat-section">
            <button className="btn btn-primary" onClick={() => openAIChatbot('Report Assistant', 'Hello! I can help you understand student reports and generate insights. Ask me anything about the data!')}>
              <Bot size={16} /> Open AI Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderEnrollment = () => (
    <div className="section-content">
      <div className="ph">
        <div>
          <div className="ph-title">Enrollment</div>
          <div className="ph-sub">Manage student course enrollment - ADD and DROP subjects</div>
        </div>
      </div>

      {/* Step 1: Find Student */}
      <div className="card">
        <div className="step-head">
          <div className="step-num">1</div>
          <div className="step-info">
            <div className="step-name">Find Student</div>
            <div className="step-desc">Search for student to manage enrollment</div>
          </div>
        </div>
        
        <div className="search-wrapper" style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <input 
            type="text" 
            className="form-control" 
            style={{ flex: 1 }} 
            placeholder="Search by Student ID, Name, or Email..."
            value={enrollmentSearchQuery}
            onChange={(e) => setEnrollmentSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchEnrollmentStudents()}
          />
          <button className="btn btn-primary" onClick={searchEnrollmentStudents}>
            <Search size={16} /> Search
          </button>
        </div>
        
        {enrollmentSearchResults.length > 0 && (
          <div className="student-search-results">
            {enrollmentSearchResults.map(student => (
              <div key={student.id} className="student-result-item" onClick={() => selectEnrollmentStudent(student)}>
                <div className="student-result-avatar">{student.name?.charAt(0) || '?'}</div>
                <div className="student-result-info">
                  <div className="student-result-name">{student.name}</div>
                  <div className="student-result-meta">{student.id} • {student.program}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {selectedEnrollmentStudent && (
          <div className="selected-student-banner" style={{ marginTop: 16 }}>
            <div className="student-avatar">{selectedEnrollmentStudent.name?.charAt(0)}</div>
            <div className="student-info">
              <div className="student-name">{selectedEnrollmentStudent.name}</div>
              <div className="student-meta">{selectedEnrollmentStudent.id} • {selectedEnrollmentStudent.program}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedEnrollmentStudent(null)}>Change</button>
          </div>
        )}
      </div>

      {/* Step 2: Subject Load Management */}
      {selectedEnrollmentStudent && (
        <div className="card">
          <div className="step-head">
            <div className="step-num">2</div>
            <div className="step-info">
              <div className="step-name">Subject Load Management</div>
              <div className="step-desc">Add or remove subjects from enrollment</div>
            </div>
          </div>

          <div className="enrollment-status-bar">
            <div className="status-item">
              <span className="status-label">Status:</span>
              <span className={`status-badge ${enrollmentStatus === 'Enrolled' ? 'active' : 'pending'}`}>{enrollmentStatus}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Target Semester:</span>
              <span className="status-value">{targetSemester}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Total Units:</span>
              <span className="status-value">{totalUnits}</span>
            </div>
          </div>

          {/* Subject Table */}
          <div className="table-wrap" style={{ maxHeight: 420, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Subject</th>
                  <th>Units</th>
                  <th>Prerequisite</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjectLoad.map((subj, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 800 }}>{subj.code}</td>
                    <td>{subj.description}</td>
                    <td>{subj.units}</td>
                    <td>{subj.prerequisite}</td>
                    <td>
                      <button className="btn btn-danger-soft btn-sm" onClick={() => dropSubject(idx)}>
                        <Minus size={14} /> Drop
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Subject */}
          <div className="add-subject-row">
            <div className="field" style={{ flex: 1 }}>
              <div className="field-label">Add Subject</div>
              <select className="form-control" value={selectedSubjectToAdd} onChange={(e) => setSelectedSubjectToAdd(e.target.value)}>
                <option value="">Select Subject to Add</option>
                {availableSubjects.map(s => (
                  <option key={s.code} value={s.code}>{s.code} - {s.description}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={addSubjectToEnrollment}>
              <Plus size={16} /> Add
            </button>
          </div>

          {/* Enrollment Recommendations */}
          {enrollmentRecommendations.length > 0 && (
            <div className="enroll-preview">
              <div className="enroll-preview-label"><Sparkles size={14} /> AI Recommended Subjects</div>
              <div className="enroll-chips">
                {enrollmentRecommendations.map((subj, idx) => (
                  <span key={idx} className="enroll-chip clickable" onClick={() => {
                    if (!subjectLoad.find(s => s.code === subj.code)) {
                      setSubjectLoad([...subjectLoad, subj]);
                      setTotalUnits(prev => prev + (subj.units || 0));
                    }
                  }}>
                    + {subj.code}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button className="btn btn-ghost" onClick={resetEnrollment}>
              <RotateCcw size={16} /> Reset
            </button>
            <button className="btn btn-success" onClick={finalizeEnrollment} disabled={loading}>
              <Check size={16} /> Finalize Enrollment
            </button>
          </div>
        </div>
      )}

      {/* Enrollment History */}
      <div className="card">
        <div className="card-hd">
          <div>
            <div className="card-title"><History size={18} /> Enrollment History</div>
            <div className="card-sub">Recent enrollment transactions</div>
          </div>
        </div>
        
        {enrollmentHistory.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><History size={48} /></div>
            <div className="empty-title">No Enrollment History</div>
            <div className="empty-text">Enrollment transactions will appear here.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Subjects</th>
                  <th>Units</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {enrollmentHistory.map((entry, idx) => (
                  <tr key={idx}>
                    <td>{entry.date}</td>
                    <td>{entry.studentName}</td>
                    <td>{entry.subjectCount} subjects</td>
                    <td>{entry.totalUnits}</td>
                    <td>
                      <span className={`badge ${entry.status === 'Enrolled' ? 'bg-green' : 'bg-amber'}`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderMonitoring = () => (
    <div className="section-content">
      <div className="ph">
        <div>
          <div className="ph-title">Student Monitoring</div>
          <div className="ph-sub">Track student enrollment, progress, and academic status</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-hd">
          <div>
            <div className="card-title"><Filter size={18} /> Filter Students</div>
            <div className="card-sub">Use filters to find specific students</div>
          </div>
        </div>
        
        <div className="form-grid">
          <div className="form-group">
            <div className="form-label"><GraduationCap size={14} /> Program</div>
            <select className="form-control" value={monitoringFilters.program} onChange={(e) => setMonitoringFilters({...monitoringFilters, program: e.target.value})}>
              <option value="">All Programs</option>
              <option value="BSIT">BSIT</option>
            </select>
          </div>
          
          <div className="form-group">
            <div className="form-label"><Layers size={14} /> Year Level</div>
            <select className="form-control" value={monitoringFilters.year} onChange={(e) => setMonitoringFilters({...monitoringFilters, year: e.target.value})}>
              <option value="">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
          
          <div className="form-group">
            <div className="form-label"><Calendar size={14} /> Academic Year</div>
            <select className="form-control" value={monitoringFilters.academicYear} onChange={(e) => setMonitoringFilters({...monitoringFilters, academicYear: e.target.value})}>
              <option value="">All Academic Years</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2023-2024">2023-2024</option>
            </select>
          </div>
          
          <div className="form-group">
            <div className="form-label"><CheckCircle size={14} /> Status</div>
            <select className="form-control" value={monitoringFilters.status} onChange={(e) => setMonitoringFilters({...monitoringFilters, status: e.target.value})}>
              <option value="">All Status</option>
              <option value="enrolled">Enrolled</option>
              <option value="pending">Pending</option>
              <option value="graduated">Graduated</option>
            </select>
          </div>
        </div>
        
        <div className="search-wrapper" style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <input 
            type="text" 
            className="form-control" 
            style={{ flex: 1 }} 
            placeholder="Search by Student ID or Name..."
            value={monitoringFilters.search}
            onChange={(e) => setMonitoringFilters({...monitoringFilters, search: e.target.value})}
          />
          <button className="btn btn-primary" onClick={filterMonitoringStudents}>
            <Filter size={16} /> Apply Filters
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="card">
        <div className="card-hd">
          <div>
            <div className="card-title"><BarChart3 size={18} /> Monitoring Statistics</div>
            <div className="card-sub">Overview of student enrollment statistics</div>
          </div>
        </div>
        
        <div className="statistics-grid">
          <div className="stat-card">
            <div className="stat-icon"><Users size={24} /></div>
            <div className="stat-info">
              <div className="stat-value">{monitoringStats.total}</div>
              <div className="stat-label">Total Students</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><CheckCircle size={24} /></div>
            <div className="stat-info">
              <div className="stat-value">{monitoringStats.enrolled}</div>
              <div className="stat-label">Currently Enrolled</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><Clock3 size={24} /></div>
            <div className="stat-info">
              <div className="stat-value">{monitoringStats.pending}</div>
              <div className="stat-label">Pending Enrollment</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><GraduationCap size={24} /></div>
            <div className="stat-info">
              <div className="stat-value">{monitoringStats.graduated}</div>
              <div className="stat-label">Graduated</div>
            </div>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="card">
        <div className="card-hd">
          <div>
            <div className="card-title"><Users size={18} /> Students List</div>
            <div className="card-sub">Click on a student to view details</div>
          </div>
        </div>
        
        {monitoringStudents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Users size={48} /></div>
            <div className="empty-title">No Students Found</div>
            <div className="empty-text">Adjust your filters to find students.</div>
          </div>
        ) : (
          <div className="student-list">
            {monitoringStudents.map((student, idx) => (
              <div key={idx} className="student-list-item" onClick={() => openStudentDetails(student)}>
                <div className="student-avatar">{student.name?.charAt(0)}</div>
                <div className="student-info">
                  <div className="student-name">{student.name}</div>
                  <div className="student-meta">{student.id} • {student.program} • {student.yearLevel}</div>
                </div>
                <div className="student-status">
                  <span className={`badge ${student.status === 'enrolled' ? 'bg-green' : student.status === 'pending' ? 'bg-amber' : 'bg-blue'}`}>
                    {student.status}
                  </span>
                </div>
                <Eye size={18} className="view-icon" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Details Modal */}
      {showStudentDetails && selectedMonitoringStudent && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) closeStudentDetails();
        }}>
          <div className="modal-box" style={{ width: 800, maxHeight: '90vh' }}>
            <div className="modal-header">
              <h3><User size={18} /> Student Details</h3>
              <button onClick={closeStudentDetails}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {studentDetails && (
                <div className="student-details-content">
                  {/* Student Header */}
                  <div className="student-basic-info">
                    <div className="student-profile-header">
                      <div className="student-avatar-large">{studentDetails.name?.charAt(0)}</div>
                      <div className="student-profile-info">
                        <h3>{studentDetails.name}</h3>
                        <div className="student-meta">
                          <span className="meta-item"><CreditCard size={14} /> {studentDetails.id}</span>
                          <span className="meta-item"><GraduationCap size={14} /> {studentDetails.program}</span>
                          <span className="meta-item"><Layers size={14} /> {studentDetails.yearLevel}</span>
                          <span className="meta-item"><Mail size={14} /> {studentDetails.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Academic Info Grid */}
                  <div className="enrollment-info-grid">
                    <div className="info-card">
                      <div className="info-label">Academic Year</div>
                      <div className="info-value">{studentDetails.academicYear || '-'}</div>
                    </div>
                    <div className="info-card">
                      <div className="info-label">Semester</div>
                      <div className="info-value">{studentDetails.semester || '-'}</div>
                    </div>
                    <div className="info-card">
                      <div className="info-label">Enrollment Date</div>
                      <div className="info-value">{studentDetails.enrollmentDate || '-'}</div>
                    </div>
                    <div className="info-card">
                      <div className="info-label">Status</div>
                      <div className="info-value">
                        <span className={`status-badge ${studentDetails.status || 'unknown'}`}>{studentDetails.status || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Subject Tabs */}
                  <div className="subject-enrollment-details">
                    <div className="section-header">
                      <h4><BookOpen size={14} /> Subject Enrollment Details</h4>
                      <div className="subject-tabs">
                        <button className={`subject-tab ${subjectView === 'current' ? 'active' : ''}`} onClick={() => setSubjectView('current')}>Current Subjects</button>
                        <button className={`subject-tab ${subjectView === 'previous' ? 'active' : ''}`} onClick={() => setSubjectView('previous')}>Previous Year</button>
                        <button className={`subject-tab ${subjectView === 'next' ? 'active' : ''}`} onClick={() => setSubjectView('next')}>Next Year</button>
                      </div>
                    </div>
                    
                    <div className="subjects-container">
                      {(studentDetails.subjects || []).length === 0 ? (
                        <div style={{ padding: 20, textAlign: 'center', color: 'var(--g400)' }}>No subjects to display</div>
                      ) : (
                        <table>
                          <thead>
                            <tr>
                              <th>Code</th>
                              <th>Subject</th>
                              <th>Units</th>
                              <th>Grade</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentDetails.subjects.map((subj, idx) => (
                              <tr key={idx}>
                                <td>{subj.code}</td>
                                <td>{subj.description}</td>
                                <td>{subj.units}</td>
                                <td>{subj.grade || '-'}</td>
                                <td>
                                  <span className={`badge ${subj.status === 'Passed' ? 'bg-green' : subj.status === 'Failed' ? 'bg-red' : 'bg-amber'}`}>
                                    {subj.status || 'Pending'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  {/* Progress Metrics */}
                  <div className="academic-progress-summary">
                    <h4><BarChart3 size={14} /> Academic Progress Summary</h4>
                    <div className="progress-metrics">
                      <div className="metric-card">
                        <div className="metric-icon"><BookOpen size={20} /></div>
                        <div className="metric-info">
                          <div className="metric-label">Total Units Completed</div>
                          <div className="metric-value">{studentDetails.unitsCompleted || 0}</div>
                        </div>
                      </div>
                      <div className="metric-card">
                        <div className="metric-icon"><CheckCircle size={20} /></div>
                        <div className="metric-info">
                          <div className="metric-label">Current GPA</div>
                          <div className="metric-value">{studentDetails.gpa || '0.00'}</div>
                        </div>
                      </div>
                      <div className="metric-card">
                        <div className="metric-icon"><Target size={20} /></div>
                        <div className="metric-info">
                          <div className="metric-label">Completion Rate</div>
                          <div className="metric-value">{studentDetails.completionRate || '0%'}</div>
                        </div>
                      </div>
                      <div className="metric-card">
                        <div className="metric-icon"><Calendar size={20} /></div>
                        <div className="metric-info">
                          <div className="metric-label">Expected Graduation</div>
                          <div className="metric-value">{studentDetails.expectedGraduation || '-'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderExams = () => (
    <div className="section-content">
      <div className="card">
        <div className="empty-state">
          <div className="empty-icon"><Wand2 size={48} /></div>
          <div className="empty-title">AI Exam & Quiz Generator</div>
          <div className="empty-text">Paste any syllabus topic, chapter title, or learning objective. The AI will generate structured quizzes, MCQs, true/false sets, essay prompts, and rubrics instantly.</div>
          <button className="btn btn-primary" style={{ padding: '12px 28px', fontSize: 14 }} onClick={() => openAIChatbot('Exam & Quiz Bot', 'Hello Instructor! I can generate quizzes, multiple-choice tests, fill-in-the-blank sets, and rubrics. What topic or subject would you like to create an exam for?')}>
            <Sparkles size={18} /> Launch AI Exam Generator
          </button>
        </div>
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="section-content">
      <div className="ph">
        <div className="ph-title">Admin Messages</div>
        <div className="ph-sub">Real-time communication with Dean and Admin</div>
      </div>
      <div className="card">
        <div className="empty-state">
          <div className="empty-icon"><MessageSquare size={48} /></div>
          <div className="empty-title">Messages</div>
          <div className="empty-text">Open the AI chat to communicate with the admin team.</div>
          <button className="btn btn-primary" onClick={() => openAIChatbot('Admin Messages', 'Hello! This is your communication channel with the Dean and Admin team. How can I help you today?')}>
            <MessageSquare size={16} /> Open Message Chat
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="instructor-portal">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-item ${toast.type}`}>
          {toast.type === 'success' && <CheckCircle size={18} />}
          {toast.type === 'error' && <X size={18} />}
          {toast.type === 'warning' && <Bell size={18} />}
          {toast.type === 'info' && <CheckCircle size={18} />}
          {toast.message}
        </div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img className="sidebar-logo-img" src="/logo.png" alt="JMC Logo" />
          <div>
            <div className="sidebar-brand">EvalTrack</div>
            <div className="sidebar-brand-sub">Instructor Portal</div>
          </div>
        </div>

        <div className="nav-group">
          <div className="nav-group-label">Main</div>
          <button className={`nav-link ${activeSection === 'dashboard' ? 'active' : ''}`} onClick={() => handleNavigate('dashboard')}>
            <span className="ni"><LayoutDashboard size={18} /></span>
            <span>Dashboard</span>
          </button>
          <button className={`nav-link ${activeSection === 'evaluate' ? 'active' : ''}`} onClick={() => handleNavigate('evaluate')}>
            <span className="ni"><ClipboardCheck size={18} /></span>
            <span>Evaluate / Grade</span>
          </button>
          <button className={`nav-link ${activeSection === 'reports' ? 'active' : ''}`} onClick={() => handleNavigate('reports')}>
            <span className="ni"><BarChart3 size={18} /></span>
            <span>AI Reports</span>
          </button>
          <button className={`nav-link ${activeSection === 'enrollment' ? 'active' : ''}`} onClick={() => handleNavigate('enrollment')}>
            <span className="ni"><UserPlus size={18} /></span>
            <span>Enrollment</span>
          </button>
          <button className={`nav-link ${activeSection === 'monitoring' ? 'active' : ''}`} onClick={() => handleNavigate('monitoring')}>
            <span className="ni"><Users size={18} /></span>
            <span>Student Monitoring</span>
          </button>
        </div>

        <div className="nav-group">
          <div className="nav-group-label">Tools</div>
          <button className={`nav-link ${activeSection === 'exams' ? 'active' : ''}`} onClick={() => handleNavigate('exams')}>
            <span className="ni"><Wand2 size={18} /></span>
            <span>AI Exam Generator</span>
          </button>
          <button className={`nav-link ${activeSection === 'messages' ? 'active' : ''}`} onClick={() => handleNavigate('messages')}>
            <span className="ni"><MessageSquare size={18} /></span>
            <span>Admin Messages</span>
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="user-avatar">{user?.name?.charAt(0) || 'I'}</div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div className="user-name">{user?.name || 'Instructor'}</div>
              <div className="user-role">Instructor / Prg. Head</div>
            </div>
          </div>
          <button className="btn-signout" onClick={handleLogout}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-left">
          <button className="mob-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={20} />
          </button>
          <div className="topbar-breadcrumb">
            <span className="topbar-crumb"><GraduationCap size={14} /> JMC</span>
            <ChevronRight size={12} style={{ color: 'var(--g300)' }} />
            <span className="topbar-page">{pageTitles[activeSection]}</span>
          </div>
        </div>
        <div className="topbar-right">
          <div className="tb-pill">
            <span className="status-dot"></span>
            <span>{user?.name || 'Loading'}</span>
          </div>
          <div className="tb-time">{currentTime}</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-wrap">
        {activeSection === 'dashboard' && renderDashboard()}
        {activeSection === 'evaluate' && renderEvaluate()}
        {activeSection === 'reports' && renderReports()}
        {activeSection === 'enrollment' && renderEnrollment()}
        {activeSection === 'monitoring' && renderMonitoring()}
        {activeSection === 'exams' && renderExams()}
        {activeSection === 'messages' && renderMessages()}
      </main>

      {/* AI Chatbot Modal */}
      {chatbotOpen && (
        <div className="chat-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setChatbotOpen(false);
        }}>
          <div className="chat-modal-box">
            <div className="chat-modal-header">
              <div className="chat-modal-title">
                <Bot size={18} />
                <span>{chatbotTitle}</span>
                <span className="ai-dot"></span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="chat-modal-close" onClick={() => setShowHistoryModal(true)} title="Chat History">
                  <History size={18} />
                </button>
                <button className="chat-modal-close" onClick={() => setChatbotOpen(false)}>
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="chat-modal-msgs">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`chat-message ${msg.role}`}>
                  {msg.content === 'typing' ? (
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  ) : (
                    <>
                      {msg.role === 'bot' && (
                        <div className="bot-header">
                          <Bot size={12} /> EvalTrack AI
                        </div>
                      )}
                      <div className="message-content" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br>') }} />
                      {msg.reportHtml && (
                        <div style={{ marginTop: 12 }}>
                          <button 
                            className="btn btn-sm btn-primary" 
                            onClick={() => downloadAIReport(msg.reportHtml, msg.reportFilename)}
                          >
                            <Download size={14} /> Download Report (HTML)
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="chat-modal-input-row">
              <input 
                type="text" 
                className="fc" 
                style={{ flex: 1 }} 
                placeholder="Ask anything..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
              />
              <button className="btn btn-primary" onClick={sendChatMessage}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat History Modal */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowHistoryModal(false);
        }}>
          <div className="modal-box" style={{ width: 500, maxHeight: 600 }}>
            <div className="modal-header">
              <h3><History size={18} /> Chat History</h3>
              <button onClick={() => setShowHistoryModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: 400, overflowY: 'auto' }}>
              {chatHistory.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><Inbox size={48} /></div>
                  <p>No chat history yet</p>
                </div>
              ) : (
                chatHistory.slice().reverse().map((session, idx) => (
                  <div key={idx} className="history-item">
                    <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => {
                      loadChatHistory(session.topic);
                      setChatbotTitle(session.topic);
                      setShowHistoryModal(false);
                      setChatbotOpen(true);
                    }}>
                      <div style={{ fontWeight: 600 }}>{session.topic}</div>
                      <div style={{ fontSize: 12, color: 'var(--g400)' }}>
                        <MessageSquare size={12} /> {session.messages?.length || 0} messages
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteChatSession(session.topic)}
                      style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger-soft" onClick={clearAllChatHistory}>
                <Trash2 size={14} /> Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evaluation Result Modal */}
      {showEvalModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowEvalModal(false);
        }}>
          <div className="modal-box" style={{ width: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <CheckCircle style={{ color: 'var(--p500)' }} size={22} />
              <div style={{ fontWeight: 700, fontSize: 16 }}>AI Evaluation Complete</div>
            </div>
            <div style={{ color: 'var(--g600)', marginBottom: 18 }}>
              An AI report was generated for the selected student. Would you like to view the report now?
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowEvalModal(false)}>Later</button>
              <button className="btn btn-primary" onClick={() => {
                setShowEvalModal(false);
                setActiveSection('reports');
              }}>View Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorDashboard;
