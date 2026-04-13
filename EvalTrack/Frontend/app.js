// app.js - Core functionality for EvalTrack Static Frontend (Phase 2)

const APP_NAME = "EvalTrack";

br// --- PROSPECTUS DATA (OFFICIAL JMC BSIT CURRICULUM) ---
// Ensure the global BSIT_PROSPECTUS exists and avoid redeclaring it if this script
// is loaded multiple times or another bundle defines it.
if (typeof window.BSIT_PROSPECTUS === 'undefined') {
    window.BSIT_PROSPECTUS = {
        "1-1": [
            { code: "GE 10", title: "Environmental Science", units: 3.0, prereq: "-" },
            { code: "GE 11", title: "The Entrepreneurial Mind", units: 3.0, prereq: "-" },
            { code: "GE 4", title: "Readings in Philippine History", units: 3.0, prereq: "-" },
            { code: "GE 5", title: "The Contemporary World", units: 3.0, prereq: "-" },
            { code: "GE 9", title: "Life and Works of Rizal", units: 3.0, prereq: "-" },
            { code: "IT 101", title: "Introduction to Computing", units: 3.0, prereq: "-" },
            { code: "IT 102", title: "Computer Programming 1", units: 3.0, prereq: "-" },
            { code: "NSTP 1", title: "National Service Training Program I", units: 3.0, prereq: "-" },
            { code: "PE 1", title: "Physical Education 1", units: 2.0, prereq: "-" },
            { code: "SF 1", title: "Student Formation 1", units: 1.0, prereq: "-" }
        ],
        "1-2": [
            { code: "GE 1", title: "Understanding the Self", units: 3.0, prereq: "-" },
            { code: "GE 2", title: "Mathematics in the Modern World", units: 3.0, prereq: "-" },
            { code: "GE 3", title: "Purposive Communication", units: 3.0, prereq: "-" },
            { code: "IT 103", title: "Computer Programming 2", units: 3.0, prereq: "IT 102" },
            { code: "IT 104", title: "Introduction to Human Computer Interaction", units: 3.0, prereq: "IT 101" },
            { code: "IT 105", title: "Discrete Mathematics 1", units: 3.0, prereq: "IT 102" },
            { code: "NSTP 2", title: "National Service Training Program II", units: 3.0, prereq: "NSTP 1" },
            { code: "PE 2", title: "Physical Education 2", units: 2.0, prereq: "PE 1" },
            { code: "SF 2", title: "Student Formation 2", units: 1.0, prereq: "SF 1" }
        ],
        "2-1": [
            { code: "GE 6", title: "Art Appreciation", units: 3.0, prereq: "-" },
            { code: "GE 7", title: "Science, Technology and Society", units: 3.0, prereq: "-" },
            { code: "GE 8", title: "Ethics", units: 3.0, prereq: "-" },
            { code: "IT 201", title: "Data Structures and Algorithms", units: 3.0, prereq: "IT 103" },
            { code: "IT 202", title: "Networking 1", units: 3.0, prereq: "IT 101" },
            { code: "IT Elect 1", title: "Object-Oriented Programming", units: 3.0, prereq: "IT 103" },
            { code: "IT Elect 2", title: "Platform Technologies", units: 3.0, prereq: "IT 101" },
            { code: "PE 3", title: "Physical Education 3", units: 2.0, prereq: "PE 2" },
            { code: "SF 3", title: "Student Formation 3", units: 1.0, prereq: "SF 1" }
        ],
        "2-2": [
            { code: "IT 203", title: "Information Management", units: 3.0, prereq: "-" },
            { code: "IT 204", title: "Quantitative Methods (Modeling & Simulation)", units: 3.0, prereq: "-" },
            { code: "IT 205", title: "Integrative Programming & Technologies", units: 3.0, prereq: "-" },
            { code: "IT 206", title: "Networking 2", units: 3.0, prereq: "IT 103" },
            { code: "IT 207", title: "Multimedia", units: 3.0, prereq: "IT 101" },
            { code: "IT Elect 3", title: "Web Systems and Technologies 1", units: 3.0, prereq: "IT 103" },
            { code: "PE 4", title: "Physical Education 4", units: 3.0, prereq: "IT 101" },
            { code: "SF 4", title: "Student Formation 4", units: 1.0, prereq: "-" }
        ],
        "3-1": [
            { code: "GE 12", title: "Reading Visual Art", units: 3.0, prereq: "-" },
            { code: "IT 301", title: "Advanced Database Systems", units: 3.0, prereq: "IT 203" },
            { code: "IT 302", title: "System Integration and Architecture", units: 3.0, prereq: "IT 203" },
            { code: "IT 303", title: "Event-Driven Programming", units: 3.0, prereq: "IT 203" },
            { code: "IT 304", title: "Information Assurance and Security 1", units: 3.0, prereq: "IT 205" },
            { code: "IT 305", title: "Mobile Application Development", units: 3.0, prereq: "IT 206" },
            { code: "IT 306", title: "Game Development", units: 3.0, prereq: "IT 205" },
            { code: "IT 307", title: "Web Systems and Technologies 2", units: 3.0, prereq: "-" },
            { code: "SF 5", title: "Student Formation 5", units: 1.0, prereq: "SF 1" }
        ],
        "3-2": [
            { code: "IT 308", title: "Information Assurance and Security 2", units: 3.0, prereq: "IT 304" },
            { code: "IT 309", title: "Application Development & Emerging Technologies", units: 3.0, prereq: "IT 303" },
            { code: "IT 310", title: "Data Science and Analytics", units: 3.0, prereq: "IT 301" },
            { code: "IT 311", title: "Technopreneurship", units: 3.0, prereq: "-" },
            { code: "IT 312", title: "Embedded Systems", units: 3.0, prereq: "IT 303" },
            { code: "IT Elect 4", title: "System Integration and Architecture 2", units: 3.0, prereq: "IT 302" },
            { code: "SF 6", title: "Student Formation 6", units: 1.0, prereq: "SF 1" }
        ],
        "summer": [
            { code: "CAP 101", title: "Capstone Project & Research 1", units: 3.0, prereq: "Third Year Standing" },
            { code: "SP 101", title: "Social and Professional Issues", units: 3.0, prereq: "Third Year Standing" }
        ],
        "4-1": [
            { code: "CAP 102", title: "Capstone Project & Research 2", units: 3.0, prereq: "CAP 101" },
            { code: "IT 401", title: "Systems Administration and Maintenance", units: 3.0, prereq: "IT 308" },
            { code: "SWT 101", title: "ICT Seminar & Workshop", units: 3.0, prereq: "-" }
        ],
        "4-2": [
            { code: "PRAC 101", title: "Practicum (486 Hours)", units: 6.0, prereq: "CAP 101 & IT 308" }
        ]
    };
}

// Utilities
function generateSemesters() {
    let semesters = [];
    for (let y = 2003; y <= 2026; y++) {
        semesters.push(`${y} - First Semester`);
        semesters.push(`${y} - Second Semester`);
        semesters.push(`${y} - Summer`);
    }
    return semesters.reverse(); // Newest first
}

function getProspectusArray() {
    let all = [];
    Object.keys(BSIT_PROSPECTUS).forEach(k => {
        all = all.concat(BSIT_PROSPECTUS[k]);
    });
    return all;
}

// --- INITIALIZE LOCAL STORAGE ---
function initDB() {
    if (!localStorage.getItem('users')) {
        const defaultUsers = [
            { id: 'admin@jmc.edu.ph', name: 'Admin', email: 'admin@jmc.edu.ph', password: 'Admin', role: 'admin', status: 'Active' },
            { id: 'INS001', name: 'Jerwin Carreon', email: 'jerwin.carreon@jmc.edu.ph', password: 'password', role: 'instructor', status: 'Active' },
            { id: '20230001', name: 'Genesis G. Diaz', email: 'genesis.diaz@jmc.edu.ph', password: 'password', role: 'student', program: 'BSIT', type: 'regular', status: 'Active' }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }

    if (!localStorage.getItem('evaluations')) {
        localStorage.setItem('evaluations', JSON.stringify([]));
    }

    if (!localStorage.getItem('messages')) {
        localStorage.setItem('messages', JSON.stringify([]));
    }
}

// --- AUTHENTICATION (NODE.JS BACKEND VERSION) ---
const API_BASE_URL = 'http://localhost:5000/api';

async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success) {
            const userJSON = JSON.stringify(result.user);
            const token = result.token || '';
            
            // Standardize on currentUser and authToken
            localStorage.setItem('currentUser', userJSON);
            localStorage.setItem('user', userJSON);
            sessionStorage.setItem('currentUser', userJSON);
            sessionStorage.setItem('user', userJSON);
            
            localStorage.setItem('authToken', token);
            localStorage.setItem('token', token);
            sessionStorage.setItem('authToken', token);
            sessionStorage.setItem('token', token);

            if (result.user.must_change_password) {
                window.location.href = '../MustChangePasswordPage/must_change_password.html';
            } else {
                const role = (result.user.role || '').toLowerCase().replace(/[\s\-_]/g, '');
                if (role === 'admin' || role === 'dean') {
                    window.location.href = '../AdminPage/admin.html';
                } else if (role === 'programhead' || role === 'instructor' || role === 'faculty') {
                    window.location.href = '../ProgramHeadPage/ProgramHead.html';
                } else if (role === 'student') {
                    window.location.href = '../StudentPage/student.html';
                } else {
                    window.location.href = '../LoginPage/login.html';
                }
            }
            return { success: true, user: result.user };
        } else {
            return { success: false, message: result.message };
        }
    } catch (err) {
        console.error("Login Error:", err);
        return { success: false, message: 'Connection to server failed. Ensure EvalTrack_System Node.js server is running on port 5001.' };
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('user');
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('token');
    window.location.href = '../LoginPage/login.html';
}

// Flag to prevent multiple redirects
let _authChecked = false;

function checkAuth(allowedRoles) {
    // Check ALL storage locations
    const userStr = sessionStorage.getItem('currentUser') 
                 || sessionStorage.getItem('user')
                 || localStorage.getItem('currentUser') 
                 || localStorage.getItem('user');
                 
    if (!userStr) {
        if (!_authChecked) {
            _authChecked = true;
            window.location.href = '../LoginPage/login.html';
        }
        return null;
    }
    
    let user;
    try {
        user = JSON.parse(userStr);
    } catch (e) {
        if (!_authChecked) {
            _authChecked = true;
            window.location.href = '../LoginPage/login.html';
        }
        return null;
    }

    const userRole = (user.role || '').toString().toLowerCase().replace(/[\s\-_]/g, '');
    
    if (allowedRoles) {
        const normalizedRoles = allowedRoles.map(r => r.toString().toLowerCase().replace(/[\s\-_]/g, ''));
        if (!normalizedRoles.includes(userRole)) {
            console.error('AUTH FAILED: Role', userRole, 'not in allowed:', normalizedRoles);
            if (!_authChecked) {
                _authChecked = true;
                window.location.href = '../LoginPage/login.html';
            }
            return null;
        }
    }
    
    _authChecked = true;
    return user;
}

function updateHeaderUser(user) {
    const subEl = document.querySelector('.topbar .sub');
    if (subEl && user) {
        const role = (user.role || '').toLowerCase().replace(/[\s\-_]/g, '');
        let roleDisplay = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        if (role === 'instructor' || role === 'programhead') roleDisplay = 'Instructor / Prg. Head';
        if (role === 'admin' || role === 'dean') roleDisplay = 'Dean / Admin';
        subEl.innerHTML = `${user.name} <span style="opacity:0.7; font-size:0.8rem; margin-left:5px;">(${roleDisplay})</span>`;
    }
}

// --- CHATBOT UI SYSTEM ---
function openChatbot(title, introMessage) {
    console.log("Opening Chatbot:", title);
    let overlay = document.getElementById('chat-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'chat-overlay';
        overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:9998; display:none; align-items:center; justify-content:center; backdrop-filter:blur(3px);';

        const chatBox = document.createElement('div');
        chatBox.className = 'chat-modal';
        chatBox.style.cssText = 'background:#fff; width:90%; max-width:500px; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.3); overflow:hidden; display:flex; flex-direction:column; animation:fadeInUp 0.3s ease; height: 600px;';

        chatBox.innerHTML = `
            <div style="background:#1b5e20; color:white; padding:15px 20px; display:flex; justify-content:space-between; align-items:center;">
                <h3 id="chat-title" style="margin:0; font-size:1.1rem; display:flex; align-items:center; gap:10px; color:#fff;"><i class="fa fa-robot"></i> AI Assistant</h3>
                <i class="fa fa-times" onclick="document.getElementById('chat-overlay').style.display='none'" style="cursor:pointer; font-size:1.2rem;"></i>
            </div>
            <div id="chat-messages" style="flex:1; padding:20px; overflow-y:auto; background:#f9f9f9; display:flex; flex-direction:column; gap:15px;"></div>
            <div style="padding:15px; background:white; border-top:1px solid #eee; display:flex; gap:10px;">
                <input type="text" id="chat-input-text" class="form-control" placeholder="Ask something..." style="flex:1; padding:10px 15px;">
                <button class="btn btn-primary" id="chat-send-btn" style="padding:10px 20px; background:#1b5e20; border:none;"><i class="fa fa-paper-plane"></i></button>
            </div>
        `;
        overlay.appendChild(chatBox);
        document.body.appendChild(overlay);

        document.getElementById('chat-send-btn').addEventListener('click', handleChatSend);
        document.getElementById('chat-input-text').addEventListener('keypress', (e) => { if (e.key === 'Enter') handleChatSend(); });
    }

    const titleEl = document.getElementById('chat-title');
    const msgArea = document.getElementById('chat-messages');

    if (titleEl) titleEl.innerHTML = `<i class="fa fa-robot"></i> ${title}`;
    if (msgArea) {
        msgArea.innerHTML = '';
        overlay.style.display = 'flex';
        addChatBubble(introMessage || "Hello! How can I help you today?", 'bot');
    }
}

function handleChatSend() {
    const input = document.getElementById('chat-input-text');
    const text = input.value.trim();
    if (!text) return;

    addChatBubble(text, 'user');
    input.value = '';

    const thinkingId = 'thinking-' + Date.now();
    addChatBubble("Thinking...", 'bot', thinkingId);

    const title = document.getElementById('chat-title').textContent.trim();

    // Fix: point to Node.js backend AI chat endpoint
    fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: title, query: text })
    })
        .then(res => res.json())
        .then(data => {
            const thinkingBubble = document.getElementById(thinkingId);
            if (thinkingBubble) {
                // Node.js backend returns response in 'reply' or 'content'
                const reply = data.reply || data.content || "No response from AI.";
                thinkingBubble.innerHTML = String(reply).replace(/\n/g, '<br>');
            }
        })
        .catch(err => {
            const thinkingBubble = document.getElementById(thinkingId);
            if (thinkingBubble) {
                thinkingBubble.innerHTML = "Connection error. Is Node server running on port 5000?";
            }
        });
}

function addChatBubble(text, sender, id = null) {
    const msgs = document.getElementById('chat-messages');
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.justifyContent = sender === 'user' ? 'flex-end' : 'flex-start';

    const bubble = document.createElement('div');
    if (id) bubble.id = id;
    bubble.style.maxWidth = '80%';
    bubble.style.padding = '12px 16px';
    bubble.style.borderRadius = '15px';
    bubble.style.lineHeight = '1.4';
    bubble.style.fontSize = '0.9rem';

    if (sender === 'user') {
        bubble.style.background = 'var(--primary)';
        bubble.style.color = 'white';
        bubble.style.borderBottomRightRadius = '2px';
    } else {
        bubble.style.background = 'white';
        bubble.style.color = '#333';
        bubble.style.border = '1px solid #e1bee7';
        bubble.style.borderBottomLeftRadius = '2px';
        bubble.style.boxShadow = '0 2px 5px rgba(0,0,0,0.02)';
    }

    // Simple line break support
    if (!text) text = "No response from AI.";
    bubble.innerHTML = String(text).replace(/\n/g, '<br>');

    wrapper.appendChild(bubble);
    msgs.appendChild(wrapper);
    msgs.scrollTop = msgs.scrollHeight;
}

// --- AI EVALUATION AND RECOMMENDATION SYSTEM ---
function evaluateStudentForAI(studentId, completedSubjects, currentYear, currentSemester) {
    const allSubjects = getProspectusArray();
    const completedCodes = completedSubjects.map(s => s.code);
    
    // Find subjects the student hasn't taken yet
    const availableSubjects = allSubjects.filter(subject => 
        !completedCodes.includes(subject.code) &&
        checkPrerequisites(subject.code, completedCodes)
    );
    
    // Determine next year/semester based on current progress
    const recommendation = generateRecommendation(availableSubjects, currentYear, currentSemester, completedSubjects);
    
    return {
        studentId,
        evaluation: {
            completedSubjects: completedSubjects.length,
            totalUnits: completedSubjects.reduce((sum, s) => sum + (s.units || 3.0), 0),
            currentYear,
            currentSemester,
            academicStanding: calculateAcademicStanding(completedSubjects)
        },
        recommendation,
        availableSubjects
    };
}

function checkPrerequisites(subjectCode, completedCodes) {
    const subject = getProspectusArray().find(s => s.code === subjectCode);
    if (!subject || subject.prereq === "none") return true;
    
    // Check if prerequisite is completed
    return completedCodes.includes(subject.prereq);
}

function generateRecommendation(availableSubjects, currentYear, currentSemester, completedSubjects) {
    const totalCompleted = completedSubjects.length;
    const totalUnits = completedSubjects.reduce((sum, s) => sum + (s.units || 3.0), 0);
    
    // Determine next semester recommendation
    let nextSemester = "";
    let nextYear = currentYear;
    
    if (totalCompleted >= 40) {
        // Student has completed most subjects, recommend final year
        nextYear = "4";
        nextSemester = "4-1";
    } else if (totalCompleted >= 30) {
        // Student in third year level
        nextYear = "3";
        nextSemester = currentSemester === "3-1" ? "3-2" : "summer-3";
    } else if (totalCompleted >= 20) {
        // Student in second year level
        nextYear = "2";
        nextSemester = currentSemester === "2-1" ? "2-2" : "3-1";
    } else {
        // Student in first year level
        nextYear = "1";
        nextSemester = currentSemester === "1-1" ? "1-2" : "2-1";
    }
    
    // Filter subjects for recommended semester
    const recommendedSubjects = availableSubjects.filter(subject => {
        const [year, semester] = nextSemester.split('-');
        return subject.year === parseInt(year) && subject.semester === parseInt(semester);
    });
    
    return {
        nextYear,
        nextSemester,
        recommendedSubjects: recommendedSubjects.slice(0, 6), // Max 6 subjects per semester
        totalSubjectsCompleted: totalCompleted,
        academicStanding: calculateAcademicStanding(completedSubjects),
        message: generateRecommendationMessage(nextYear, nextSemester, recommendedSubjects)
    };
}

function calculateAcademicStanding(completedSubjects) {
    const totalSubjects = completedSubjects.length;
    
    if (totalSubjects >= 45) return "Excellent";
    if (totalSubjects >= 35) return "Good";
    if (totalSubjects >= 25) return "Satisfactory";
    return "Needs Improvement";
}

function generateRecommendationMessage(year, semester, subjects) {
    const semesterNames = {
        "1-1": "First Semester",
        "1-2": "Second Semester", 
        "2-1": "First Semester",
        "2-2": "Second Semester",
        "3-1": "First Semester",
        "3-2": "Second Semester",
        "summer-3": "Summer",
        "4-1": "First Semester",
        "4-2": "Second Semester"
    }; 
    
    const yearNames = {
        "1": "First Year",
        "2": "Second Year", 
        "3": "Third Year",
        "4": "Fourth Year"
    };
    
    return `Based on your academic progress, we recommend enrolling in ${yearNames[year]} - ${semesterNames[semester]} with the following subjects: ${subjects.map(s => s.code).join(", ")}`;
}

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed; top:20px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:10px;';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    const colors = { success: '#2d8f6b', error: '#c0392b', info: '#6a1b9a' };
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };

    toast.style.cssText = `
        background: rgba(255,255,255,0.95);
        border-left: 4px solid ${colors[type]};
        box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        padding: 12px 20px;
        border-radius: 8px;
        color: #333;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
        backdrop-filter: blur(5px);
    `;
    toast.innerHTML = `<i class="fa ${icons[type]}" style="color:${colors[type]}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// --- PARTICLES ---
function initParticles() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = [];
    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + 20;
            this.size = Math.random() * 2 + 1;
            this.speed = Math.random() * 1 + 0.3;
        }
        update() {
            this.y -= this.speed;
            if (this.y < -20) this.reset();
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,.1)';
            ctx.fill();
        }
    }
    for (let i = 0; i < 50; i++) particles.push(new Particle());
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }
    animate();
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// --- ADVANCED CHAT SYSTEM ---
function initAdvancedChat(containerId, currentUser) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Create advanced chat UI
    container.innerHTML = `
        <div class="chat-container">
            <div class="chat-header">
                <div class="chat-header-left">
                    <div class="chat-title">Messages</div>
                    <div class="chat-subtitle">Communicate with instructors and administrators</div>
                </div>
                <div class="chat-header-right">
                    <button class="chat-btn" onclick="toggleChatContacts()">
                        <i class="fa fa-users"></i>
                    </button>
                    <button class="chat-btn" onclick="clearChatMessages()">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="chat-body">
                <div class="chat-sidebar" id="chat-contacts">
                    <div class="sidebar-section">
                        <div class="sidebar-title">Contacts</div>
                        <div class="contacts-list" id="contacts-list">
                            <div class="contact-loading">Loading contacts...</div>
                        </div>
                    </div>
                </div>
                <div class="chat-main">
                    <div class="chat-messages" id="chat-messages">
                        <div class="welcome-message">
                            <i class="fa fa-comments"></i>
                            <p>Welcome to the messaging system. Select a contact to start chatting.</p>
                        </div>
                    </div>
                    <div class="chat-input-area">
                        <div class="input-group">
                            <input type="text" id="message-input" placeholder="Type your message..." class="chat-input">
                            <button class="send-btn" onclick="sendMessage()">
                                <i class="fa fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Load contacts
    loadChatContacts(currentUser);
    
    // Setup message input
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
}

function loadChatContacts(currentUser) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const contactsList = document.getElementById('contacts-list');
    if (!contactsList) return;

    const currentUserData = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    // Filter out self and only show Staff/Admins as contacts
    const validContacts = users.filter(u => u.id !== currentUserData.id && (u.role === 'admin' || u.role === 'instructor'));

    if (validContacts.length === 0) {
        contactsList.innerHTML = '<div class="no-contacts">No contacts available</div>';
        return;
    }

    contactsList.innerHTML = validContacts.map(contact => `
        <div class="contact-item" onclick="selectContact('${contact.id}', '${contact.name}', '${contact.role}')">
            <div class="contact-avatar">${contact.name.charAt(0).toUpperCase()}</div>
            <div class="contact-info">
                <div class="contact-name">${contact.name}</div>
                <div class="contact-role">${contact.role === 'admin' ? 'Administrator' : 'Instructor'}</div>
            </div>
        </div>
    `).join('');
}

function selectContact(contactId, contactName, contactRole) {
    // Update active contact
    document.querySelectorAll('.contact-item').forEach(item => item.classList.remove('active'));
    event.currentTarget.classList.add('active');

    // Update chat header
    const chatTitle = document.querySelector('.chat-title');
    if (chatTitle) chatTitle.textContent = `Chat with ${contactName}`;

    // Load chat history
    loadChatHistory(contactId);
}

function loadChatHistory(contactId) {
    const messages = JSON.parse(localStorage.getItem('messages') || '[]');
    const contactMessages = messages.filter(m => 
        (m.sender === contactId && m.receiver === getCurrentUserId()) ||
        (m.sender === getCurrentUserId() && m.receiver === contactId)
    );

    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    if (contactMessages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <i class="fa fa-comments"></i>
                <p>No messages yet. Start the conversation!</p>
            </div>
        `;
        return;
    }

    messagesContainer.innerHTML = contactMessages.map(msg => `
        <div class="message ${msg.sender === getCurrentUserId() ? 'sent' : 'received'}">
            <div class="message-content">${msg.message}</div>
            <div class="message-time">${new Date(msg.timestamp).toLocaleString()}</div>
        </div>
    `).join('');

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Register function for Node.js Backend API
async function register(formData) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: formData.id,
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role || 'student',
        program: formData.program,
        student_type: formData.student_type || 'regular',
        year_level: formData.year_level,
        contact_number: formData.contact_number
      })
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      if (result.token) {
        localStorage.setItem('token', result.token);
      }
      return { success: true, message: 'Registration successful', user: result.user };
    } else {
      return { success: false, message: result.message || 'Registration failed' };
    }
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: 'Connection error. Please try again.' };
  }
}

function getCurrentUserId() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    return currentUser.id;
}

function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    if (!message) return;

    const activeContact = document.querySelector('.contact-item.active');
    if (!activeContact) {
        showToast('Please select a contact first', 'warning');
        return;
    }

    const contactId = activeContact.dataset.contactId || activeContact.getAttribute('onclick').match(/'([^']+)'/)[1];
    const currentUser = getCurrentUserId();

    // Save message
    const messages = JSON.parse(localStorage.getItem('messages') || '[]');
    messages.push({
        id: Date.now(),
        sender: currentUser,
        receiver: contactId,
        message: message,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('messages', JSON.stringify(messages));

    // Clear input and refresh chat
    input.value = '';
    loadChatHistory(contactId);
}

function toggleChatContacts() {
    const sidebar = document.querySelector('.chat-sidebar');
    const main = document.querySelector('.chat-main');
    if (sidebar && main) {
        sidebar.classList.toggle('hidden');
        main.classList.toggle('full-width');
    }
}

function clearChatMessages() {
    if (confirm('Are you sure you want to clear all chat messages?')) {
        localStorage.setItem('messages', JSON.stringify([]));
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = `
                <div class="welcome-message">
                    <i class="fa fa-comments"></i>
                    <p>All messages cleared. Select a contact to start chatting.</p>
                </div>
            `;
        }
    }
}

// --- SERVICE WORKER REGISTRATION (PWA) ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('Service Worker registered with scope:', reg.scope))
            .catch(err => console.warn('Service Worker registration failed:', err));
    });
}



