// Load environment variables - try dotenvx first, fall back to regular dotenv
try {
  require('@dotenvx/dotenvx').config();
} catch (e) {
  require('dotenv').config();
}
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Groq AI - Loaded from environment variable
const axios = require('axios');

// GROQ API Keys - Read from environment variable (comma-separated)
const GROQ_API_KEYS = (process.env.GROQ_API_KEYS || '').split(',').map(k => k.trim()).filter(Boolean);

let groqLastIndex = 0;

async function requestGroq(messages, options = {}) {
  const model = options.model || 'llama3-8b-8192';
  const timeout = options.timeout || 25000;
  const maxRetries = options.maxRetriesPerKey || 2;

  for (let i = 0; i < GROQ_API_KEYS.length; i++) {
    const keyIdx = (groqLastIndex + i) % GROQ_API_KEYS.length;
    const apiKey = GROQ_API_KEYS[keyIdx];

    for (let retry = 0; retry < maxRetries; retry++) {
      try {
        const resp = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model,
            messages,
            temperature: 0.7,
            max_tokens: 2048
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout
          }
        );

        groqLastIndex = keyIdx;
        const content = resp?.data?.choices?.[0]?.message?.content || '';
        return { success: true, content, keyUsed: keyIdx };

      } catch (err) {
        const status = err?.response?.status;
        const errorMsg = err?.response?.data?.error?.message || err.message;
        console.error(`[GROQ] Key ${keyIdx} failed (retry ${retry}): ${status || 'network'} - ${errorMsg}`);

        if (status === 429 || !status) {
          await new Promise(r => setTimeout(r, 1000 * (retry + 1)));
          continue;
        }
        break;
      }
    }
  }

  return { success: false, message: 'All API keys exhausted' };
}

console.log(`✓ Groq AI initialized with ${GROQ_API_KEYS.length} API keys`);

const fs = require('fs');

// Firebase Admin SDK - New Project Configuration
let firebaseAdmin, firebaseInitialized;

try {
  const firebaseConfig = require('./firebase-admin-config');
  firebaseAdmin = firebaseConfig.firebaseAdmin;
  firebaseInitialized = firebaseConfig.firebaseInitialized;
} catch (error) {
  console.log('Firebase Admin SDK not available:', error.message);
  console.log('Note: Add firebase-service-account.json for Firebase features');
  firebaseAdmin = null;
  firebaseInitialized = false;
}

const app = express();
const PORT = process.env.PORT || 3000;

// Debug CORS config
console.log('=== CORS CONFIGURATION ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS);

const isProduction = process.env.NODE_ENV?.toString().toLowerCase().trim() === 'production';
// Default origins for local dev - always include these
const defaultOrigins = [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://127.0.0.1:3000', 
    'http://127.0.0.1:3001', 
    'http://localhost', 
    'http://127.0.0.1',
    'https://evaltrack-system.onrender.com',
    'https://evaltrack-system.netlify.app'
];
let allowedOrigins = isProduction 
    ? (process.env.ALLOWED_ORIGINS 
        ? [...defaultOrigins, ...process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim().replace(/\/$/, ''))]
        : defaultOrigins)
    : defaultOrigins;

console.log('isProduction:', isProduction);
console.log('allowedOrigins:', allowedOrigins);
console.log('==========================');

// CORS middleware with function-based origin checking
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        console.log('CORS check - Request origin:', origin);
        console.log('CORS check - Allowed origins:', allowedOrigins);
        
        // Check if origin matches allowed origins
        if (allowedOrigins === false) {
            // In production with no allowed origins set, be strict
            console.log('CORS: No allowed origins configured');
            return callback(new Error('CORS not configured'), false);
        }
        
        // Check for exact match or if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
            console.log('CORS: Origin allowed:', origin);
            return callback(null, true);
        }
        
        // Check without www prefix
        const originWithoutWww = origin.replace(/^https:\/\/www\./, 'https://');
        const originWithWww = origin.replace(/^https:\/\//, 'https://www.');
        
        if (allowedOrigins.includes(originWithoutWww) || allowedOrigins.includes(originWithWww)) {
            console.log('CORS: Origin allowed (www variant):', origin);
            return callback(null, true);
        }
        
        console.log('CORS: Origin NOT allowed:', origin);
        return callback(new Error('Not allowed by CORS'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// COOP Headers for Firebase Auth popup/redirect support
// Changed to unsafe-none to allow cross-origin popup communication for Google Sign In
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
});

app.use(bodyParser.json());

// Database connection
let db;
let isSQLite = false;

// Initialize SQLite for production (Render) or MySQL for local development
const initDatabase = () => {
    // Debug: Log all relevant env vars
    console.log('=== DATABASE CONFIGURATION ===');
    console.log('USE_SQLITE env var:', process.env.USE_SQLITE);
    console.log('USE_SQLITE type:', typeof process.env.USE_SQLITE);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('==============================');
    
    // Check if we should use SQLite (for Render deployment without external DB)
    const useSQLite = process.env.USE_SQLITE?.toString().toLowerCase().trim();
    const isProduction = process.env.NODE_ENV?.toString().toLowerCase().trim() === 'production';
    
    console.log('Parsed useSQLite:', useSQLite);
    console.log('isProduction:', isProduction);
    
    if (useSQLite === 'true' || (!process.env.DB_HOST && isProduction)) {
        console.log('✓ Using SQLite database...');
        isSQLite = true;
        
        // Check if we should reset the database (for fixing bad data on Render)
        if (process.env.RESET_DB === 'true') {
            console.log('RESET_DB is true - deleting existing SQLite database...');
            try {
                const dbPath = path.join(__dirname, 'evaltrack.db');
                if (fs.existsSync(dbPath)) {
                    fs.unlinkSync(dbPath);
                    console.log('Deleted existing database file');
                }
                const walPath = path.join(__dirname, 'evaltrack.db-shm');
                const walPath2 = path.join(__dirname, 'evaltrack.db-wal');
                if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
                if (fs.existsSync(walPath2)) fs.unlinkSync(walPath2);
            } catch (err) {
                console.error('Error deleting database:', err.message);
            }
        }
        
        // Initialize SQLite database
        const dbPath = path.join(__dirname, 'evaltrack.db');
        console.log('SQLite database path:', dbPath);
        
        const Database = require('better-sqlite3');
        db = new Database(dbPath);
        console.log('SQLite database initialized at:', dbPath);
        
        // Enable WAL mode for better concurrency
        db.pragma('journal_mode = WAL');
        
        // Initialize SQLite tables
        initSQLiteTables();
        return;
    } else {
        console.log('✗ Falling back to MySQL...');
        console.log('Reason: useSQLite !== "true" && (DB_HOST exists or not production)');
        // Otherwise use MySQL
        connectWithRetry(process.env.DB_HOST || 'localhost');
    }
};

const initSQLiteTables = () => {
    const initQueries = [
        `CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'student',
            program TEXT,
            student_type TEXT,
            year_level INTEGER DEFAULT 1,
            status TEXT DEFAULT 'Active',
            must_change_password INTEGER DEFAULT 0,
            last_seen DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS students (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            program_code TEXT,
            student_type TEXT DEFAULT 'regular',
            date_admitted DATETIME,
            enrollment_status TEXT DEFAULT 'active',
            year_level INTEGER DEFAULT 1,
            gpa REAL DEFAULT 0.0,
            total_units_earned REAL DEFAULT 0.0,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`,
        `CREATE TABLE IF NOT EXISTS ai_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT NOT NULL,
            report_text TEXT,
            report_html TEXT,
            metadata TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS ai_evaluation_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT NOT NULL,
            report_text TEXT,
            metadata TEXT,
            created_by TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS student_grades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT NOT NULL,
            course_code TEXT NOT NULL,
            preliminary_grade REAL,
            midterm_grade REAL,
            final_grade REAL,
            average_grade REAL,
            grade_status TEXT DEFAULT 'Pending',
            semester TEXT,
            term TEXT,
            remarks TEXT,
            instructor_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(student_id, course_code, term)
        )`,
        `CREATE TABLE IF NOT EXISTS student_enrollments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT NOT NULL,
            course_code TEXT NOT NULL,
            term TEXT NOT NULL,
            status TEXT DEFAULT 'Enrolled',
            enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS enrollment_audit (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT NOT NULL,
            action TEXT NOT NULL,
            course_code TEXT NOT NULL,
            term TEXT NOT NULL,
            performed_by TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS courses (
            code TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            units REAL DEFAULT 3.0,
            course_type TEXT,
            prerequisites TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS curriculum_courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            course_code TEXT NOT NULL,
            year_level INTEGER NOT NULL,
            semester TEXT NOT NULL,
            program TEXT DEFAULT 'BSIT',
            curriculum_id INTEGER
        )`,
        `CREATE TABLE IF NOT EXISTS course_offerings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            course_code TEXT NOT NULL,
            term TEXT NOT NULL,
            instructor_id TEXT,
            max_capacity INTEGER DEFAULT 30,
            current_enrolled INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1
        )`,
        `CREATE TABLE IF NOT EXISTS programs (
            code TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS curricula (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            program_code TEXT NOT NULL,
            version TEXT,
            is_active INTEGER DEFAULT 1,
            effective_year INTEGER
        )`
    ];
    
    initQueries.forEach(q => {
        try {
            db.exec(q);
        } catch (err) {
            console.error('Error initializing SQLite table:', err.message);
        }
    });
    
    // Migration: Add last_seen column if it doesn't exist (for existing databases)
    try {
        const tableInfo = db.prepare("PRAGMA table_info(users)").all();
        const hasLastSeen = tableInfo.some(col => col.name === 'last_seen');
        if (!hasLastSeen) {
            console.log('Migration: Adding last_seen column to users table...');
            db.exec('ALTER TABLE users ADD COLUMN last_seen DATETIME');
            console.log('Migration: last_seen column added successfully');
        }
    } catch (err) {
        console.error('Migration error:', err.message);
    }
    
    // Bootstrap curriculum data if empty
    const courseCount = db.prepare('SELECT COUNT(*) as count FROM courses').get();
    if (courseCount.count === 0) {
        console.log('Bootstrapping BSIT curriculum data into SQLite...');
        bootstrapSQLiteData();
    }
    
    // Bootstrap default users if empty
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (userCount.count === 0) {
        console.log('Bootstrapping default users into SQLite...');
        
        const insertUser = db.prepare(`INSERT OR IGNORE INTO users 
            (id, name, email, password, role, program, status, must_change_password) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        
        // Default admin user - password: "password"
        insertUser.run('admin-001', 'System Admin', 'admin@jmc.edu.ph', 
            '$2b$10$0wFmeDtdX9hk9ru9uMKFVexKESZma2nbwynXvTvH00kYlQkBdAIc.', 'admin', 'BSIT', 'Active', 0);
        
        // Default program head - password: "password"
        insertUser.run('ph-001', 'Jerwin Carreon', 'jerwin.carreon@jmc.edu.ph', 
            '$2b$10$0wFmeDtdX9hk9ru9uMKFVexKESZma2nbwynXvTvH00kYlQkBdAIc.', 'programhead', 'BSIT', 'Active', 0);
        
        // Default admin - Janette Claro - password: "password"
        insertUser.run('janette-001', 'Janette Claro', 'janette.claro@jmc.edu.ph', 
            '$2b$10$0wFmeDtdX9hk9ru9uMKFVexKESZma2nbwynXvTvH00kYlQkBdAIc.', 'admin', 'BSIT', 'Active', 0);
        
        console.log('Bootstrapped default users into SQLite');
    }
    
    // Add SQLite compatibility methods
    addSQLiteCompatibility();
};

const bootstrapSQLiteData = () => {
    const insertCourse = db.prepare('INSERT OR IGNORE INTO courses (code, title, units, prerequisites) VALUES (?, ?, ?, ?)');
    
    const bsitCurriculum = [
        // 1st Year - 1st Sem
        ['GE 10', 'Environmental Science', 3.0, '-'],
        ['GE 11', 'The Entrepreneurial Mind', 3.0, '-'],
        ['GE 4', 'Readings in Philippine History', 3.0, '-'],
        ['GE 5', 'The Contemporary World', 3.0, '-'],
        ['GE 9', 'Life and Works of Rizal', 3.0, '-'],
        ['IT 101', 'Introduction to Computing', 3.0, '-'],
        ['IT 102', 'Computer Programming 1', 3.0, '-'],
        ['NSTP 1', 'National Service Training Program I', 3.0, '-'],
        ['PE 1', 'Physical Education 1', 2.0, '-'],
        ['SF 1', 'Student Formation 1', 1.0, '-'],
        // 1st Year - 2nd Sem
        ['GE 1', 'Understanding the Self', 3.0, '-'],
        ['GE 2', 'Mathematics in the Modern World', 3.0, '-'],
        ['GE 3', 'Purposive Communication', 3.0, '-'],
        ['IT 103', 'Computer Programming 2', 3.0, 'IT 102'],
        ['IT 104', 'Introduction to Human Computer Interaction', 3.0, 'IT 101'],
        ['IT 105', 'Discrete Mathematics 1', 3.0, 'IT 102'],
        ['NSTP 2', 'National Service Training Program II', 3.0, 'NSTP 1'],
        ['PE 2', 'Physical Education 2', 2.0, 'PE 1'],
        ['SF 2', 'Student Formation 2', 1.0, 'SF 1'],
        // 2nd Year - 1st Sem
        ['GE 6', 'Art Appreciation', 3.0, '-'],
        ['GE 7', 'Science, Technology and Society', 3.0, '-'],
        ['GE 8', 'Ethics', 3.0, '-'],
        ['IT 201', 'Data Structures and Algorithms', 3.0, 'IT 103'],
        ['IT 202', 'Networking 1', 3.0, 'IT 101'],
        ['IT Elect 1', 'Object-Oriented Programming', 3.0, 'IT 103'],
        ['IT Elect 2', 'Platform Technologies', 3.0, 'IT 101'],
        ['PE 3', 'Physical Education 3', 2.0, 'PE 2'],
        ['SF 3', 'Student Formation 3', 1.0, 'SF 1'],
        // 2nd Year - 2nd Sem
        ['IT 203', 'Information Management', 3.0, '-'],
        ['IT 204', 'Quantitative Methods (Modeling & Simulation)', 3.0, '-'],
        ['IT 205', 'Integrative Programming & Technologies', 3.0, '-'],
        ['IT 206', 'Networking 2', 3.0, 'IT 103'],
        ['IT 207', 'Multimedia', 3.0, 'IT 101'],
        ['IT Elect 3', 'Web Systems and Technologies 1', 3.0, 'IT 103'],
        ['PE 4', 'Physical Education 4', 3.0, 'IT 101'],
        ['SF 4', 'Student Formation 4', 1.0, '-'],
        // 3rd Year - 1st Sem
        ['GE 12', 'Reading Visual Art', 3.0, '-'],
        ['IT 301', 'Advanced Database Systems', 3.0, 'IT 203'],
        ['IT 302', 'System Integration and Architecture', 3.0, 'IT 203'],
        ['IT 303', 'Event-Driven Programming', 3.0, 'IT 203'],
        ['IT 304', 'Information Assurance and Security 1', 3.0, 'IT 205'],
        ['IT 305', 'Mobile Application Development', 3.0, 'IT 206'],
        ['IT 306', 'Game Development', 3.0, 'IT 205'],
        ['IT 307', 'Web Systems and Technologies 2', 3.0, '-'],
        ['SF 5', 'Student Formation 5', 1.0, 'SF 1'],
        // 3rd Year - 2nd Sem
        ['IT 308', 'Information Assurance and Security 2', 3.0, 'IT 304'],
        ['IT 309', 'Application Development & Emerging Technologies', 3.0, 'IT 303'],
        ['IT 310', 'Data Science and Analytics', 3.0, 'IT 301'],
        ['IT 311', 'Technopreneurship', 3.0, '-'],
        ['IT 312', 'Embedded Systems', 3.0, 'IT 303'],
        ['IT Elect 4', 'System Integration and Architecture 2', 3.0, 'IT 302'],
        ['SF 6', 'Student Formation 6', 1.0, 'SF 1'],
        // Summer Term
        ['CAP 101', 'Capstone Project & Research 1', 3.0, 'Third Year Standing'],
        ['SP 101', 'Social and Professional Issues', 3.0, 'Third Year Standing'],
        // 4th Year - 1st Sem
        ['CAP 102', 'Capstone Project & Research 2', 3.0, 'CAP 101'],
        ['IT 401', 'Systems Administration and Maintenance', 3.0, 'IT 308'],
        ['SWT 101', 'ICT Seminar & Workshop', 3.0, '-'],
        ['IT 402', 'IT Project Management', 3.0, 'IT 302'],
        ['IT 403', 'Enterprise Architecture', 3.0, 'IT 302'],
        // 4th Year - 2nd Sem
        ['PRAC 101', 'Practicum (486 Hours)', 6.0, 'CAP 101, IT 308']
    ];
    
    const insertMany = db.transaction((courses) => {
        for (const course of courses) {
            insertCourse.run(course);
        }
    });
    
    insertMany(bsitCurriculum);
    console.log(`Bootstrapped ${bsitCurriculum.length} courses into SQLite`);
    
    // Bootstrap curriculum mapping
    const insertMapping = db.prepare('INSERT OR IGNORE INTO curriculum_courses (course_code, year_level, semester, program) VALUES (?, ?, ?, ?)');
    
    const mapping = [
        // 1st Year
        ...['GE 10','GE 11','GE 4','GE 5','GE 9','IT 101','IT 102','NSTP 1','PE 1','SF 1'].map(c => [c, 1, '1st', 'BSIT']),
        ...['GE 1','GE 2','GE 3','IT 103','IT 104','IT 105','NSTP 2','PE 2','SF 2'].map(c => [c, 1, '2nd', 'BSIT']),
        // 2nd Year
        ...['GE 6','GE 7','GE 8','IT 201','IT 202','IT Elect 1','IT Elect 2','PE 3','SF 3'].map(c => [c, 2, '1st', 'BSIT']),
        ...['IT 203','IT 204','IT 205','IT 206','IT 207','IT Elect 3','PE 4','SF 4'].map(c => [c, 2, '2nd', 'BSIT']),
        // 3rd Year
        ...['GE 12','IT 301','IT 302','IT 303','IT 304','IT 305','IT 306','IT 307','SF 5'].map(c => [c, 3, '1st', 'BSIT']),
        ...['IT 308','IT 309','IT 310','IT 311','IT 312','IT Elect 4','SF 6'].map(c => [c, 3, '2nd', 'BSIT']),
        // Summer
        ...['CAP 101','SP 101'].map(c => [c, 3, 'Summer', 'BSIT']),
        // 4th Year
        ...['CAP 102','IT 401','SWT 101','IT 402','IT 403'].map(c => [c, 4, '1st', 'BSIT']),
        ...['PRAC 101'].map(c => [c, 4, '2nd', 'BSIT'])
    ];
    
    const insertManyMappings = db.transaction((mappings) => {
        for (const m of mappings) {
            insertMapping.run(m);
        }
    });
    
    insertManyMappings(mapping);
    console.log(`Bootstrapped ${mapping.length} curriculum mappings into SQLite`);
    
    // Insert default programs
    const insertProgram = db.prepare('INSERT OR IGNORE INTO programs (code, name, description) VALUES (?, ?, ?)');
    insertProgram.run('BSIT', 'Bachelor of Science in Information Technology', 'BSIT Program');
    console.log('Bootstrapped programs into SQLite');
    
    // Insert default users (admin, program head, instructor)
    const insertUser = db.prepare(`INSERT OR IGNORE INTO users 
        (id, name, email, password, role, program, status, must_change_password) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    
    // Default admin user - password: "password"
    insertUser.run('admin-001', 'System Admin', 'admin@jmc.edu.ph', 
        '$2b$10$0wFmeDtdX9hk9ru9uMKFVexKESZma2nbwynXvTvH00kYlQkBdAIc.', 'admin', 'BSIT', 'Active', 0);
    
    // Default program head - password: "password"
    insertUser.run('ph-001', 'Jerwin Carreon', 'jerwin.carreon@jmc.edu.ph', 
        '$2b$10$0wFmeDtdX9hk9ru9uMKFVexKESZma2nbwynXvTvH00kYlQkBdAIc.', 'programhead', 'BSIT', 'Active', 0);
    
    // Default admin - Janette Claro - password: "password"
    insertUser.run('janette-001', 'Janette Claro', 'janette.claro@jmc.edu.ph', 
        '$2b$10$0wFmeDtdX9hk9ru9uMKFVexKESZma2nbwynXvTvH00kYlQkBdAIc.', 'admin', 'BSIT', 'Active', 0);
    
    console.log('Bootstrapped default users into SQLite');
};

const addSQLiteCompatibility = () => {
    // Add promise() method for SQLite to match MySQL API
    db.promise = () => {
        return {
            query: (sql, params = []) => {
                return new Promise((resolve, reject) => {
                    try {
                        let sqliteSql = sql;
                        const paramCount = (sql.match(/\?/g) || []).length;
                        
                        // Convert MySQL ? placeholders to SQLite numbered placeholders
                        if (paramCount > 0) {
                            let paramIndex = 1;
                            sqliteSql = sql.replace(/\?/g, () => `?${paramIndex++}`);
                        }
                        
                        // Handle SELECT queries
                        if (sqliteSql.trim().toLowerCase().startsWith('select')) {
                            const stmt = db.prepare(sqliteSql);
                            let results;
                            if (params.length > 0) {
                                results = stmt.all(...params);
                            } else {
                                results = stmt.all();
                            }
                            resolve([results]);
                        } else {
                            // For INSERT, UPDATE, DELETE
                            const stmt = db.prepare(sqliteSql);
                            let result;
                            if (params.length > 0) {
                                result = stmt.run(...params);
                            } else {
                                result = stmt.run();
                            }
                            resolve([result]);
                        }
                    } catch (err) {
                        reject(err);
                    }
                });
            },
            getConnection: () => {
                return new Promise((resolve) => {
                    resolve({
                        query: (sql, params) => db.promise().query(sql, params),
                        release: () => {}
                    });
                });
            },
            beginTransaction: () => {
                db.exec('BEGIN TRANSACTION');
                return Promise.resolve();
            },
            commit: () => {
                db.exec('COMMIT');
                return Promise.resolve();
            },
            rollback: () => {
                db.exec('ROLLBACK');
                return Promise.resolve();
            }
        };
    };
    
    // Add query method to match MySQL API
    db.query = (sql, params, callback) => {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        
        try {
            // Use SQL as-is with ? placeholders - better-sqlite3 handles them natively
            if (sql.trim().toLowerCase().startsWith('select')) {
                const stmt = db.prepare(sql);
                let results;
                if (params.length > 0) {
                    results = stmt.all(...params);
                } else {
                    results = stmt.all();
                }
                callback(null, results);
            } else {
                const stmt = db.prepare(sql);
                let result;
                if (params.length > 0) {
                    result = stmt.run(...params);
                } else {
                    result = stmt.run();
                }
                callback(null, result);
            }
        } catch (err) {
            callback(err);
        }
    };
    
    // Add getConnection method
    db.getConnection = (callback) => {
        callback(null, {
            query: db.query,
            release: () => {}
        });
    };
};

const connectWithRetry = (host) => {
    const dbConfig = {
        host: host,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'evaltrack_db',
        port: parseInt(process.env.DB_PORT || '3306')
    };

    console.log(`Connecting to database pool at ${host}...`);
    
    db = mysql.createPool({
        ...dbConfig,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
    
    // Check connection
    db.getConnection((err, connection) => {
        if (err) {
            console.error(`Error connecting to MySQL at ${host}:`, err.message);
            if (host === 'localhost') {
                console.log('Trying 127.0.0.1 instead...');
                connectWithRetry('127.0.0.1');
            } else if (host === '127.0.0.1') {
                console.log('Trying ::1 (IPv6) instead...');
                connectWithRetry('::1');
            } else {
                console.error('All connection attempts failed. Please ensure MySQL is running in XAMPP and the root password is correct.');
            }
            return;
        }
        console.log(`Successfully connected to MySQL database pool at ${host}`);
        connection.release();
        
        // Initialize tables if not exist
        const initQueries = [
            `CREATE TABLE IF NOT EXISTS ai_reports (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id VARCHAR(255) NOT NULL,
                report_text TEXT,
                report_html TEXT,
                metadata JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (student_id),
                INDEX (created_at)
            )`,
            `CREATE TABLE IF NOT EXISTS ai_evaluation_reports (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id VARCHAR(255) NOT NULL,
                report_text TEXT,
                metadata JSON,
                created_by VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (student_id),
                INDEX (created_at)
            )`,
            `CREATE TABLE IF NOT EXISTS student_grades (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id VARCHAR(255) NOT NULL,
                course_code VARCHAR(50) NOT NULL,
                grade DECIMAL(4,2) NOT NULL,
                grade_status VARCHAR(20) DEFAULT 'Pending',
                semester VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (student_id),
                INDEX (course_code),
                UNIQUE KEY unique_student_course (student_id, course_code, semester)
            )`,
            `CREATE TABLE IF NOT EXISTS student_enrollments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id VARCHAR(255) NOT NULL,
                course_code VARCHAR(50) NOT NULL,
                term VARCHAR(50) NOT NULL,
                status VARCHAR(20) DEFAULT 'Enrolled',
                enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (student_id),
                INDEX (term)
            )`,
            `CREATE TABLE IF NOT EXISTS enrollment_audit (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id VARCHAR(255) NOT NULL,
                action VARCHAR(20) NOT NULL,
                course_code VARCHAR(50) NOT NULL,
                term VARCHAR(50) NOT NULL,
                performed_by VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (student_id)
            )`,
            // Ensure curriculum tables exist
            `CREATE TABLE IF NOT EXISTS courses (
                code VARCHAR(50) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                units DECIMAL(3,1) DEFAULT 3.0,
                prerequisites TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS curriculum_courses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_code VARCHAR(50) NOT NULL,
                year_level INT NOT NULL,
                semester VARCHAR(20) NOT NULL,
                program VARCHAR(50) DEFAULT 'BSIT',
                INDEX (course_code),
                INDEX (year_level, semester)
            )`
        ];
        
        initQueries.forEach(q => {
            db.query(q, (err) => {
                if (err) console.error('Error initializing table:', err.message);
            });
        });

        // Bootstrap curriculum data if empty
        db.query('SELECT COUNT(*) as count FROM courses', (err, rows) => {
            if (!err && rows[0].count === 0) {
                console.log('Bootstrapping BSIT curriculum data into database...');
                const bsitCurriculum = [
                    // 1st Year - 1st Sem
                    ['GE 10', 'Environmental Science', 3.0, '-'],
                    ['GE 11', 'The Entrepreneurial Mind', 3.0, '-'],
                    ['GE 4', 'Readings in Philippine History', 3.0, '-'],
                    ['GE 5', 'The Contemporary World', 3.0, '-'],
                    ['GE 9', 'Life and Works of Rizal', 3.0, '-'],
                    ['IT 101', 'Introduction to Computing', 3.0, '-'],
                    ['IT 102', 'Computer Programming 1', 3.0, '-'],
                    ['NSTP 1', 'National Service Training Program I', 3.0, '-'],
                    ['PE 1', 'Physical Education 1', 2.0, '-'],
                    ['SF 1', 'Student Formation 1', 1.0, '-'],
                    // 1st Year - 2nd Sem
                    ['GE 1', 'Understanding the Self', 3.0, '-'],
                    ['GE 2', 'Mathematics in the Modern World', 3.0, '-'],
                    ['GE 3', 'Purposive Communication', 3.0, '-'],
                    ['IT 103', 'Computer Programming 2', 3.0, 'IT 102'],
                    ['IT 104', 'Introduction to Human Computer Interaction', 3.0, 'IT 101'],
                    ['IT 105', 'Discrete Mathematics 1', 3.0, 'IT 102'],
                    ['NSTP 2', 'National Service Training Program II', 3.0, 'NSTP 1'],
                    ['PE 2', 'Physical Education 2', 2.0, 'PE 1'],
                    ['SF 2', 'Student Formation 2', 1.0, 'SF 1'],
                    // 2nd Year - 1st Sem
                    ['GE 6', 'Art Appreciation', 3.0, '-'],
                    ['GE 7', 'Science, Technology and Society', 3.0, '-'],
                    ['GE 8', 'Ethics', 3.0, '-'],
                    ['IT 201', 'Data Structures and Algorithms', 3.0, 'IT 103'],
                    ['IT 202', 'Networking 1', 3.0, 'IT 101'],
                    ['IT Elect 1', 'Object-Oriented Programming', 3.0, 'IT 103'],
                    ['IT Elect 2', 'Platform Technologies', 3.0, 'IT 101'],
                    ['PE 3', 'Physical Education 3', 2.0, 'PE 2'],
                    ['SF 3', 'Student Formation 3', 1.0, 'SF 1'],
                    // 2nd Year - 2nd Sem
                    ['IT 203', 'Information Management', 3.0, '-'],
                    ['IT 204', 'Quantitative Methods (Modeling & Simulation)', 3.0, '-'],
                    ['IT 205', 'Integrative Programming & Technologies', 3.0, '-'],
                    ['IT 206', 'Networking 2', 3.0, 'IT 103'],
                    ['IT 207', 'Multimedia', 3.0, 'IT 101'],
                    ['IT Elect 3', 'Web Systems and Technologies 1', 3.0, 'IT 103'],
                    ['PE 4', 'Physical Education 4', 3.0, 'IT 101'],
                    ['SF 4', 'Student Formation 4', 1.0, '-'],
                    // 3rd Year - 1st Sem
                    ['GE 12', 'Reading Visual Art', 3.0, '-'],
                    ['IT 301', 'Advanced Database Systems', 3.0, 'IT 203'],
                    ['IT 302', 'System Integration and Architecture', 3.0, 'IT 203'],
                    ['IT 303', 'Event-Driven Programming', 3.0, 'IT 203'],
                    ['IT 304', 'Information Assurance and Security 1', 3.0, 'IT 205'],
                    ['IT 305', 'Mobile Application Development', 3.0, 'IT 206'],
                    ['IT 306', 'Game Development', 3.0, 'IT 205'],
                    ['IT 307', 'Web Systems and Technologies 2', 3.0, '-'],
                    ['SF 5', 'Student Formation 5', 1.0, 'SF 1'],
                    // 3rd Year - 2nd Sem
                    ['IT 308', 'Information Assurance and Security 2', 3.0, 'IT 304'],
                    ['IT 309', 'Application Development & Emerging Technologies', 3.0, 'IT 303'],
                    ['IT 310', 'Data Science and Analytics', 3.0, 'IT 301'],
                    ['IT 311', 'Technopreneurship', 3.0, '-'],
                    ['IT 312', 'Embedded Systems', 3.0, 'IT 303'],
                    ['IT Elect 4', 'System Integration and Architecture 2', 3.0, 'IT 302'],
                    ['SF 6', 'Student Formation 6', 1.0, 'SF 1'],
                    // Summer Term
                    ['CAP 101', 'Capstone Project & Research 1', 3.0, 'Third Year Standing'],
                    ['SP 101', 'Social and Professional Issues', 3.0, 'Third Year Standing'],
                    // 4th Year - 1st Sem
                    ['CAP 102', 'Capstone Project & Research 2', 3.0, 'CAP 101'],
                    ['IT 401', 'Systems Administration and Maintenance', 3.0, 'IT 308'],
                    ['SWT 101', 'ICT Seminar & Workshop', 3.0, '-'],
                    // 4th Year - 2nd Sem
                    ['PRAC 101', 'Practicum (486 Hours)', 6.0, 'CAP 101, IT 308'],
                    // Additional courses mentioned in error screenshots
                    ['IT 402', 'IT Project Management', 3.0, 'IT 302'],
                    ['IT 403', 'Enterprise Architecture', 3.0, 'IT 302']
                ];

                const courseInsert = 'INSERT IGNORE INTO courses (code, title, units, prerequisites) VALUES ?';
                db.query(courseInsert, [bsitCurriculum], (insErr) => {
                    if (insErr) console.error('Bootstrap error (courses):', insErr.message);
                    else {
                        // Bootstrap curriculum mapping
                        const mapping = [
                            // 1st Year
                            ...['GE 10','GE 11','GE 4','GE 5','GE 9','IT 101','IT 102','NSTP 1','PE 1','SF 1'].map(c => [c, 1, '1st', 'BSIT']),
                            ...['GE 1','GE 2','GE 3','IT 103','IT 104','IT 105','NSTP 2','PE 2','SF 2'].map(c => [c, 1, '2nd', 'BSIT']),
                            // 2nd Year
                            ...['GE 6','GE 7','GE 8','IT 201','IT 202','IT Elect 1','IT Elect 2','PE 3','SF 3'].map(c => [c, 2, '1st', 'BSIT']),
                            ...['IT 203','IT 204','IT 205','IT 206','IT 207','IT Elect 3','PE 4','SF 4'].map(c => [c, 2, '2nd', 'BSIT']),
                            // 3rd Year
                            ...['GE 12','IT 301','IT 302','IT 303','IT 304','IT 305','IT 306','IT 307','SF 5'].map(c => [c, 3, '1st', 'BSIT']),
                            ...['IT 308','IT 309','IT 310','IT 311','IT 312','IT Elect 4','SF 6'].map(c => [c, 3, '2nd', 'BSIT']),
                            // Summer
                            ...['CAP 101','SP 101'].map(c => [c, 3, 'Summer', 'BSIT']),
                            // 4th Year
                            ...['CAP 102','IT 401','SWT 101'].map(c => [c, 4, '1st', 'BSIT']),
                            ...['PRAC 101'].map(c => [c, 4, '2nd', 'BSIT']),
                            // Additional
                            ['IT 402', 4, '1st', 'BSIT'],
                            ['IT 403', 4, '1st', 'BSIT']
                        ];
                        const mapInsert = 'INSERT IGNORE INTO curriculum_courses (course_code, year_level, semester, program) VALUES ?';
                        db.query(mapInsert, [mapping], (mapErr) => {
                            if (mapErr) console.error('Bootstrap error (mapping):', mapErr.message);
                            else console.log('Successfully bootstrapped BSIT curriculum database.');
                        });
                    }
                });
            }
        });
    });
};

initDatabase();

// --- Load professional system prompt from promt.md (if available) ---
const programHeadCurriculumSystemPrompt = (() => {
  try {
    const promtPath = path.join(__dirname, '..', '..', 'promt.md');
    if (!fs.existsSync(promtPath)) return '';
    const md = fs.readFileSync(promtPath, 'utf8');
    const endpointMarker = '## Endpoint: ProgramHead_CurriculumEvaluation_BSIT';
    const posEndpoint = md.indexOf(endpointMarker);
    const posSystem = (posEndpoint !== -1) ? md.indexOf('### SYSTEM PROMPT', posEndpoint) : -1;
    if (posSystem === -1) return '';
    return md.slice(posSystem + '### SYSTEM PROMPT'.length).trim();
  } catch (e) {
    return '';
  }
})();

// Basic route
app.get('/', (req, res) => {
    res.send('EvalTrack API is running...');
});

// Middleware to parse both JSON and FormData
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- AUTH ROUTES ---

// Login - accepts both JSON and FormData (like PHP reference)
app.post('/api/auth/login', (req, res) => {
    console.log('=== LOGIN REQUEST ===');
    console.log('Request body:', req.body);
    
    const email = req.body.email || req.body.id || '';
    const password = req.body.password || '';
    const isGoogleLogin = req.body.isGoogleLogin || false;
    
    console.log('Email:', email);
    console.log('Password provided:', !!password);
    console.log('Is Google Login:', isGoogleLogin);
    
    if (!db) {
        console.log('ERROR: Database not connected');
        return res.status(503).json({ success: false, message: 'Database connecting, please try again in a few seconds' });
    }
    
    // Handle 'admin' shortcut like PHP reference
    let query;
    let params;
    
    if (email.toLowerCase() === 'admin') {
        query = "SELECT * FROM users WHERE role IN ('admin', 'dean') AND password = ?";
        params = [password];
    } else {
        query = 'SELECT * FROM users WHERE (LOWER(email) = LOWER(?) OR id = ?)';
        params = [email, email];
    }
    
    console.log('Query:', query);
    console.log('Params:', params);

    db.query(query, params, async (err, results) => {
        if (err) {
            console.error('Login database error:', err);
            return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
        }
        
        console.log('Query results:', results ? results.length : 0, 'rows');
        
        if (!results || results.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid username/email or password.' });
        }

        const user = results[0];
        console.log('User found:', user.email, 'Role:', user.role);
        
        if (user.status !== 'Active') {
            return res.status(401).json({ success: false, message: 'Your account is currently inactive.' });
        }
        
        if (email.toLowerCase() !== 'admin' && !isGoogleLogin) {
            try {
                const bcrypt = require('bcryptjs');
                const isMatch = await bcrypt.compare(password, user.password);
                console.log('Password match:', isMatch);
                if (!isMatch) {
                    return res.status(401).json({ success: false, message: 'Invalid username/email or password.' });
                }
            } catch (bcryptErr) {
                console.error('Bcrypt error:', bcryptErr);
                return res.status(500).json({ success: false, message: 'Password verification error' });
            }
        }
        
        console.log('Login successful for:', user.email);
        handleLoginSuccess(user, res);
    });
});

// Registration
app.post('/api/auth/register', (req, res) => {
    const { id, name, email, password, role, program, student_type, year_level } = req.body;
    
    console.log('=== REGISTRATION REQUEST ===');
    console.log('Request body:', { id, name, email, role, program, student_type, year_level });
    
    if (!db) return res.status(503).json({ success: false, message: 'Database not connected' });

    // Check if user already exists
    db.query('SELECT * FROM users WHERE email = ? OR id = ?', [email, id], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
        
        console.log('Existing users found:', results.length);
        
        if (results.length > 0) {
            console.log('User already exists:', results[0].email);
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const mustChange = (role === 'student' ? 1 : 0); // Students must change password from student ID
        
        // Insert user record (handle missing must_change_password column)
        let userQuery;
        let userParams;
        
        // Check if must_change_password column exists
        db.query('SHOW COLUMNS FROM users LIKE "must_change_password"', (colErr, colResults) => {
            if (colErr || colResults.length === 0) {
                // Column doesn't exist, use query without it
                userQuery = 'INSERT INTO users (id, name, email, password, role, program, student_type) VALUES (?, ?, ?, ?, ?, ?, ?)';
                userParams = [id, name, email, password, role, program || null, student_type || null];
            } else {
                // Column exists, use full query
                userQuery = 'INSERT INTO users (id, name, email, password, role, program, student_type, must_change_password, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "Active")';
                userParams = [id, name, email, password, role, program || null, student_type || null, mustChange];
            }
            
            db.query(userQuery, userParams, (insErr) => {
                if (insErr) {
                    console.error('User insertion error:', insErr);
                    return res.status(500).json({ success: false, message: 'Registration failed - User creation error' });
                }
                
                console.log('User created successfully');
                
                // If student, also create student record
                if (role === 'student') {
                    const studentQuery = `
                        INSERT INTO students (id, user_id, program_code, student_type, date_admitted, enrollment_status, year_level)
                        VALUES (?, ?, ?, ?, CURDATE(), 'active', ?)
                    `;
                    db.query(studentQuery, [id, id, program, student_type, year_level || 1], (studentErr) => {
                        if (studentErr) {
                            console.error('Student record creation error:', studentErr);
                            console.log('User registered but student record creation failed');
                        } else {
                            console.log('Student record created successfully');
                        }
                        
                        // Return user data for immediate login
                        const newUser = { id, name, email, role, program, student_type, year_level: year_level || 1, must_change_password: mustChange, status: 'Active' };
                        
                        const token = jwt.sign(
                            { id: newUser.id, role: newUser.role, email: newUser.email },
                            process.env.JWT_SECRET || 'your-secret-key',
                            { expiresIn: '24h' }
                        );

                        console.log('Registration successful, returning user & token');
                        res.json({ success: true, message: 'Registration successful', token: token, user: newUser });
                    });
                } else {
                    // Return user data for immediate login (non-student)
                    const newUser = { id, name, email, role, program, student_type, must_change_password: mustChange, status: 'Active' };
                    
                    const token = jwt.sign(
                        { id: newUser.id, role: newUser.role, email: newUser.email },
                        process.env.JWT_SECRET || 'your-secret-key',
                        { expiresIn: '24h' }
                    );

                    console.log('Registration successful (non-student), returning user & token');
                    res.json({ success: true, message: 'Registration successful', token: token, user: newUser });
                }
            });
        });
    });
});

// Get current user (for token validation)
app.get('/api/auth/me', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        if (!db) return res.status(503).json({ success: false, message: 'Database not connected' });
        
        const query = 'SELECT id, name, email, role, program, student_type, must_change_password, status FROM users WHERE id = ?';
        db.query(query, [decoded.id], (err, results) => {
            if (err) return res.status(500).json({ success: false, message: 'Server error' });
            if (results.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
            
            const user = results[0];
            res.json({ success: true, user });
        });
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
});

// Change Password
app.post('/api/auth/change-password', (req, res) => {
    const { id, new_password } = req.body;
    
    if (!db) return res.status(503).json({ success: false, message: 'Database not connected' });

    db.query('UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?', [new_password, id], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Update failed' });
        res.json({ success: true, message: 'Password updated' });
    });
});

const handleLoginSuccess = (user, res) => {
    const normalizedRole = (user.role || '').toString().toLowerCase();

    // Generate JWT token for the Flutter app
    const token = jwt.sign(
        { id: user.id, role: normalizedRole, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
    );

    const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: normalizedRole,
        status: user.status || 'Active',
        program: user.program,
        year_level: user.year_level || '1',
        student_type: user.student_type || 'regular',
        must_change_password: user.must_change_password ? true : false
    };

    return res.json({ 
        success: true, 
        message: "Login successful!",
        token: token,
        user: userResponse
    });
};

// Middleware to verify JWT and check role
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
        if (err) return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
        req.user = decoded;
        next();
    });
};

// Middleware to check if user is admin or program head
const requireAdmin = (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated.' });
    
    // Support various role names for program head, dean, etc.
    const userRole = (req.user.role || '').toString().toLowerCase().replace(/[\s\-_]/g, '');
    const allowedRoles = [
        'admin', 
        'programhead', 
        'dean', 
        'instructor', 
        'faculty', 
        'registrar', 
        'dean_office',
        'staff'
    ];
    
    if (!allowedRoles.includes(userRole)) {
        console.log(`Access denied for role: ${req.user.role} (normalized: ${userRole})`);
        return res.status(403).json({ 
            success: false, 
            message: `Access denied. Role: ${userRole} is not authorized.`,
            debug: { role: req.user.role, normalized: userRole }
        });
    }
    next();
};

// Middleware to check if user is accessing their own data or is admin
const requireSelfOrAdmin = (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated.' });
    
    const targetId = req.params.studentId || req.params.id || req.query.student_id;
    const userRole = (req.user.role || '').toString().toLowerCase().replace(/[\s\-_]/g, '');
    const isPrivileged = ['admin', 'programhead', 'dean', 'instructor', 'faculty', 'registrar'].includes(userRole);
    
    if (userRole === 'student' && targetId && targetId !== req.user.id && !isPrivileged) {
        return res.status(403).json({ success: false, message: 'Access denied. Can only access own data.' });
    }
    next();
};

// Input validation middleware
const validateRequest = (req, res, next) => {
    // Sanitize inputs - prevent SQL injection patterns
    const sanitize = (str) => {
        if (typeof str !== 'string') return str;
        return str.replace(/['";\-\-]/g, '');
    };
    
    // Apply to all body and query params
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') req.body[key] = sanitize(req.body[key]);
        });
    }
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            if (typeof req.query[key] === 'string') req.query[key] = sanitize(req.query[key]);
        });
    }
    next();
};

// --- API ROUTES ---

// Apply input validation to all routes
app.use(validateRequest);

// Get current user - requires authentication
app.get('/api/auth/me', verifyToken, (req, res) => {
    if (!db) return res.status(503).json({ success: false, message: 'Database not connected' });
    
    const query = 'SELECT id, name, email, role, program, student_type, status FROM users WHERE id = ?';
    db.query(query, [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Server error' });
        if (results.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
        res.json(results[0]);
    });
});

// Get all users - ADMIN ONLY
app.get('/api/users', verifyToken, requireAdmin, (req, res) => {
    if (!db) return res.status(503).json([]);
    let query = 'SELECT id, name, email, role, status, program, student_type, created_at FROM users';
    let params = [];
    if (req.query.role) {
        query += ' WHERE role = ?';
        params.push(req.query.role);
    }
    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json([]);
        res.json(results);
    });
});

// Get all users for auth - ADMIN/PROGRAM HEAD ONLY (used by ProgramHead.html)
app.get('/api/auth/users', verifyToken, requireAdmin, (req, res) => {
    if (!db) return res.status(503).json([]);
    const query = 'SELECT id, name, email, role, program, year_level, student_type, status, last_seen FROM users';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json([]);
        }
        console.log(`Fetched ${results.length} users from database`);
        res.json(results);
    });
});

// Search students - ADMIN/PROGRAM HEAD ONLY
app.get('/api/students/search', verifyToken, requireAdmin, (req, res) => {
    if (!db) return res.status(503).json({ success: false, message: 'Database not connected' });
    
    const searchTerm = req.query.query || req.query.q || '';
    
    if (!searchTerm) {
        return res.status(400).json({ success: false, message: 'Search query required' });
    }
    
    console.log('Searching students for:', searchTerm);
    
    const sql = `
        SELECT id, name, email, role, program, year_level, student_type, status, last_seen 
        FROM users 
        WHERE role = 'student' 
        AND (name LIKE ? OR id LIKE ? OR email LIKE ?)
        LIMIT 20
    `;
    const formattedTerm = `%${searchTerm}%`;
    
    db.query(sql, [formattedTerm, formattedTerm, formattedTerm], (err, results) => {
        if (err) {
            console.error('Database search error:', err);
            return res.status(500).json({ success: false, message: 'Database search failed', error: err.message });
        }
        
        console.log(`Found ${results.length} students matching "${searchTerm}"`);
        res.json({ success: true, count: results.length, data: results });
    });
});

// Update user status - ADMIN ONLY
app.put('/api/users/:id/status', verifyToken, requireAdmin, (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    db.query('UPDATE users SET status = ? WHERE id = ?', [status, id], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Update failed' });
        res.json({ success: true, message: 'User status updated' });
    });
});

// Change password - authenticated user only (self or admin)
app.post('/api/auth/change-password', verifyToken, (req, res) => {
    const { id, new_password } = req.body;
    // Only allow changing own password or if admin
    const userRole = (req.user.role || '').toString().toLowerCase().replace(/[\s\-_]/g, '');
    const isPrivileged = ['admin', 'programhead', 'dean', 'instructor', 'faculty', 'registrar'].includes(userRole);
    
    if (req.user.id !== id && !isPrivileged) {
        return res.status(403).json({ success: false, message: 'Can only change own password' });
    }
    db.query(
        'UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?', 
        [new_password, id], 
        (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Password update failed' });
            res.json({ success: true, message: 'Password updated successfully' });
        }
    );
});

// Update user metadata - self or admin
app.put('/api/users/:id/metadata', verifyToken, (req, res) => {
    const { program, year_level, student_type } = req.body;
    const { id } = req.params;
    
    // Only allow updating own profile or if admin/program_head/instructor/programhead
    const userRole = (req.user.role || '').toString().toLowerCase().replace(/[\s\-_]/g, '');
    const isPrivileged = ['admin', 'programhead', 'dean', 'instructor', 'faculty', 'registrar'].includes(userRole);

    if (req.user.id !== id && !isPrivileged) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    db.query(
        'UPDATE users SET program = ?, student_type = ? WHERE id = ?', 
        [program, student_type, id], 
        (err) => {
            if (err) {
                console.error('Error updating user metadata:', err);
                return res.status(500).json({ success: false, message: 'Update failed: ' + err.message });
            }
            
            db.query(
                'UPDATE students SET program_code = ?, student_type = ?, year_level = ? WHERE user_id = ?',
                [program, student_type, year_level || 1, id],
                (studentErr) => {
                    if (studentErr) {
                        console.log('Student record update (may not exist):', studentErr.message);
                    }
                    res.json({ success: true, message: 'User metadata updated' });
                }
            );
        }
    );
});

// Get all student standings - ADMIN/PROGRAM HEAD ONLY
app.get('/api/standing/all', verifyToken, requireAdmin, async (req, res) => {
    if (!db) return res.status(503).json([]);
    try {
        const [students] = await db.promise().query(`
            SELECT u.id, u.name, u.program, s.year_level, s.enrollment_status 
            FROM users u 
            LEFT JOIN students s ON u.id = s.user_id 
            WHERE u.role = 'student'
        `);
        const standings = [];

        for (const student of students) {
            const [grades] = await db.promise().query('SELECT course_code, grade_status FROM student_grades WHERE student_id = ?', [student.id]);
            let hasFailed = grades.some(g => g.grade_status === 'Failed');
            
            let standing = 'Regular';
            if (student.enrollment_status === 'graduated') {
                standing = 'Graduated';
            } else if (hasFailed) {
                standing = 'Irregular';
            }

            let reason = standing === 'Graduated' ? 'Successfully completed all requirements.' : (hasFailed ? 'Student has failed subjects in history.' : 'All prerequisites met.');

            standings.push({
                student_id: student.id,
                name: student.name,
                program: student.program,
                year_level: student.year_level,
                standing,
                reason
            });
        }
        res.json(standings);
    } catch (err) {
        console.error(err);
        res.status(500).json([]);
    }
});

// Get evaluations/grades - ADMIN/PROGRAM HEAD or own data
app.get('/api/evaluations', verifyToken, async (req, res) => {
    if (!db) return res.status(503).json([]);
    
    let query = `
        SELECT 
            g.*, 
            u.name as student_name,
            u.program,
            s.year_level
        FROM student_grades g
        JOIN users u ON g.student_id = u.id
        LEFT JOIN students s ON u.id = s.user_id
    `;
    let params = [];
    
    // If student, only show their own grades
    const userRole = (req.user.role || '').toString().toLowerCase().replace(/[\s\-_]/g, '');
    if (userRole === 'student') {
        query += ' WHERE g.student_id = ?';
        params.push(req.user.id);
    }
    
    query += ' ORDER BY g.id DESC';
    
    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json([]);
        res.json(results);
    });
});

// Get student standing - own data or admin
app.get('/api/standing/student/:id', verifyToken, requireSelfOrAdmin, (req, res) => {
    const studentId = req.params.id;
    const queryStudent = `
        SELECT u.name, u.program, u.year_level, s.year_level as student_year, s.enrollment_status 
        FROM users u 
        LEFT JOIN students s ON u.id = s.user_id 
        WHERE u.id = ? AND u.role = "student"
    `;
    db.query(queryStudent, [studentId], (err, users) => {
        if (err || users.length === 0) return res.status(404).json({ standing: 'Unknown', reason: 'Student not found' });
        const student = users[0];
        const yearLevel = student.year_level || student.student_year || 1;
        const enrollmentStatus = student.enrollment_status || 'active';
        
        const queryGrades = 'SELECT course_code, grade_status FROM student_grades WHERE student_id = ?';
        db.query(queryGrades, [studentId], (err, grades) => {
            if (err) return res.status(500).json({ standing: 'Unknown', reason: 'Error fetching grades' });
            
            db.query('SELECT metadata FROM ai_reports WHERE student_id = ? ORDER BY created_at DESC LIMIT 1', [studentId], (aiErr, aiReports) => {
                let hasFailed = grades.some(g => g.grade_status === 'Failed');
                let standing = hasFailed ? 'Irregular' : 'Regular';
                
                // If student is already marked as graduated in DB, override standing
                if (enrollmentStatus === 'graduated') {
                    standing = 'Graduated';
                }

                let reason = hasFailed ? 'Student has failed subjects in history.' : 'All prerequisites met.';
                
                if (enrollmentStatus === 'graduated') {
                    reason = 'Student has successfully completed all requirements and is graduated.';
                } else if (!aiErr && aiReports.length > 0) {
                    const metadata = typeof aiReports[0].metadata === 'string' ? JSON.parse(aiReports[0].metadata) : aiReports[0].metadata;
                    if (metadata && metadata.standing) {
                        standing = metadata.standing;
                        reason = `AI Evaluation: Student is in ${standing} standing.`;
                    }
                }

                res.json({ 
                    name: student.name,
                    program: student.program,
                    year_level: yearLevel,
                    enrollment_status: enrollmentStatus,
                    standing, 
                    reason 
                });
            });
        });
    });
});

// Save evaluations - no JWT required, session based like PHP
app.post('/api/evaluations', async (req, res) => {
    const { studentId, grades } = req.body;
    if (!studentId || !grades || !Array.isArray(grades)) return res.status(400).json({ success: false, message: 'Invalid payload' });
    
    try {
        // Validate each subject exists before saving (using courses table from schema)
        for (const g of grades) {
            const [subjects] = await db.promise().query('SELECT code FROM courses WHERE code = ?', [g.code]);
            if (subjects.length === 0) {
                throw new Error(`Subject code '${g.code}' does not exist in the institutional database.`);
            }
        }
        
        for (const g of grades) {
            const gradeVal = parseFloat(g.grade);
            const status = gradeVal >= 75 ? 'Passed' : 'Failed';
            
            // Get student name for AI insight
            const [users] = await db.promise().query('SELECT name FROM users WHERE id = ?', [studentId]);
            const studentName = users.length > 0 ? users[0].name : 'Student';
            
            // Generate AI insight
            const remarks = await generateAIInsight(studentName, g.code, gradeVal, status);
            
            // Map to student_grades table as per schema
            const query = `
                INSERT INTO student_grades (student_id, course_code, final_grade, grade_status, remarks, term) 
                VALUES (?, ?, ?, ?, ?, ?) 
                ON DUPLICATE KEY UPDATE 
                    final_grade = VALUES(final_grade), 
                    grade_status = VALUES(grade_status), 
                    remarks = VALUES(remarks), 
                    term = VALUES(term)
            `;
            await db.promise().query(query, [studentId, g.code, gradeVal, status, remarks, g.sem]);
        }
        res.json({ success: true, message: 'Evaluations saved and AI insights generated.' });
    } catch (err) {
        console.error('Save evaluation error:', err);
        res.status(500).json({ success: false, message: 'Database error: ' + err.message });
    }
});

// AI Insight generator - Real AI via Groq
async function generateAIInsight(studentName, subjectCode, grade, status) {
    try {
        // Check if AI service is available
        if (!requestGroq) {
            throw new Error('AI service not configured');
        }
        
        const systemPrompt = "You are an AI Academic Counselor at JMC. Provide a concise (max 30 words), personalized academic remark for a student based on their grade. Be professional and encouraging.";
        const userPrompt = `Student Name: ${studentName}, Subject: ${subjectCode}, Grade: ${grade}, Status: ${status}.`;
        
        const response = await requestGroq([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ], { model: "llama-3.3-70b-versatile" });

        if (response.success && response.content) {
            return response.content.trim();
        }
        
        // Fallback to basic random list if AI fails
        throw new Error('AI generation failed');
    } catch (err) {
        console.error('[AI_INSIGHT] Fallback to mock:', err.message);
        const insights = {
            'Passed': [
                `Excellent performance by ${studentName} in ${subjectCode}. Strong grasp of concepts demonstrated.`,
                `${studentName} has successfully mastered ${subjectCode} with solid results.`,
                `Good work by ${studentName} in ${subjectCode}. Keep maintaining this standard.`
            ],
            'Failed': [
                `${studentName} needs additional support in ${subjectCode}. Consider remedial classes.`,
                `Performance in ${subjectCode} indicates need for review. ${studentName} should consult instructor.`,
                `${studentName} requires more effort in ${subjectCode}. Re-enrollment recommended.`
            ]
        };
        const list = insights[status] || insights['Passed'];
        return list[Math.floor(Math.random() * list.length)];
    }
}

// Enrollment Forecast (Eligibility Check) - no JWT required
app.get('/api/enrollment/forecast', async (req, res) => {
    if (!db) return res.status(503).json({ success: false, message: 'Database not connected' });
    const studentId = req.query.student_id || req.query.id;
    if (!studentId) return res.status(400).json({ success: false, message: 'Student ID required' });
    
    try {
        // 1. Get student info
        const [users] = await db.promise().query('SELECT program, year_level FROM users WHERE id = ?', [studentId]);
        if (users.length === 0) return res.status(404).json({ success: false, message: 'Student not found.' });
        const student = users[0];
        const studentYear = parseInt(student.year_level) || 1;
        
        // 2. Get academic history (passed and failed)
        const [grades] = await db.promise().query('SELECT course_code, grade_status FROM student_grades WHERE student_id = ?', [studentId]);
        const passedCodes = grades.filter(g => g.grade_status === "Passed").map(g => g.course_code);
        const failedCodes = grades.filter(g => g.grade_status === "Failed").map(g => g.course_code);
        
        // 3. Get recent AI evaluations for retake recommendations and standing
        const [aiReports] = await db.promise().query('SELECT metadata FROM ai_reports WHERE student_id = ? ORDER BY created_at DESC LIMIT 1', [studentId]);
        let aiRecommendations = [];
        let aiStanding = null;
        if (aiReports.length > 0) {
            const metadata = typeof aiReports[0].metadata === 'string' ? JSON.parse(aiReports[0].metadata) : aiReports[0].metadata;
            aiRecommendations = metadata?.recommendations || [];
            aiStanding = metadata?.standing;
        }

        // 4. Get all subjects
        const [allSubs] = await db.promise().query('SELECT code, title, units, prerequisites FROM courses');

        // If AI produced explicit recommendations, prefer and return them (mapped to our structure)
        if (aiRecommendations && Array.isArray(aiRecommendations) && aiRecommendations.length > 0) {
            const mapped = [];
            for (const rec of aiRecommendations) {
                try {
                    // Look up course info to enrich AI recommendation
                    const [courseRows] = await db.promise().query('SELECT code, title, units, prerequisites FROM courses WHERE code = ? LIMIT 1', [rec.code]);
                    const course = courseRows[0] || {};

                    // Determine if prerequisites are satisfied
                    let canTake = true;
                    let missingPrereq = null;
                    const prerequisites = (course.prerequisites || '').toString();
                    if (prerequisites && prerequisites !== '-') {
                        const prereqArray = prerequisites.split(',').map(p => p.trim()).filter(Boolean);
                        for (const p of prereqArray) {
                            if (p !== '-' && !passedCodes.includes(p)) {
                                canTake = false;
                                missingPrereq = p;
                                break;
                            }
                        }
                    }

                    // Try to get curriculum year/sem
                    const [curriculumInfo] = await db.promise().query('SELECT year_level, semester FROM curriculum_courses WHERE course_code = ? LIMIT 1', [rec.code]);
                    const subYear = curriculumInfo[0]?.year_level || null;
                    const subSem = curriculumInfo[0]?.semester || null;

                    mapped.push({
                        code: rec.code,
                        title: rec.title || course.title || rec.name || '',
                        units: rec.units || course.units || 3.0,
                        year: subYear || rec.year || studentYear,
                        sem: subSem || rec.sem || '1st',
                        is_retake: failedCodes.includes(rec.code),
                        reason: rec.reason || `AI Recommended: ${rec.note || rec.reason || ''}`,
                        can_enroll: canTake,
                        missing_prereq: missingPrereq || null,
                        source: 'ai'
                    });
                } catch (e) {
                    console.error('Error mapping AI recommendation', rec, e);
                }
            }

            // preserve ordering from AI and respond
            return res.json({ success: true, recommendations: mapped, standing: aiStanding || (failedCodes.length > 0 ? 'Irregular' : 'Regular'), student_year: studentYear });
        }

        const recommendations = [];
        for (const sub of allSubs) {
            // Skip if already passed
            if (passedCodes.includes(sub.code)) continue;
            
            // Priority 1: AI Retake Recommendations
            const aiRec = aiRecommendations.find(r => r.code === sub.code);
            
            // Check prerequisites
            const prerequisites = sub.prerequisites;
            let canTake = true;
            let missingPrereq = null;

            if (prerequisites && prerequisites !== '-') {
                const prereqArray = prerequisites.split(',').map(p => p.trim());
                for (const p of prereqArray) {
                    if (p !== '-' && !passedCodes.includes(p)) {
                        canTake = false;
                        missingPrereq = p;
                        break;
                    }
                }
            }
            
            // Get curriculum info
            const [curriculumInfo] = await db.promise().query('SELECT year_level, semester FROM curriculum_courses WHERE course_code = ? LIMIT 1', [sub.code]);
            const subYear = curriculumInfo[0]?.year_level || 1;
            const subSem = curriculumInfo[0]?.semester || '1st';

            // Filtering logic:
            // - Always include if AI explicitly recommended it
            // - Include if prerequisites are met AND (it's a retake OR it's within student's current year OR next semester)
            const isRetake = failedCodes.includes(sub.code);
            
            // A 3rd year student should see 3rd year subjects primarily, or retakes.
            const isAppropriateLevel = subYear === studentYear || subYear === studentYear + 1 || (studentYear === 4 && subYear === 4);

            if (aiRec || (canTake && (isRetake || isAppropriateLevel))) {
                recommendations.push({
                    code: sub.code,
                    title: sub.title,
                    units: sub.units || 3.0,
                    year: subYear,
                    sem: subSem,
                    is_retake: isRetake,
                    reason: aiRec ? `AI Recommended: ${aiRec.reason}` : (isRetake ? 'Retake required' : 'Prerequisites satisfied'),
                    can_enroll: canTake,
                    missing_prereq: missingPrereq
                });
            }
        }
        
        // Sort: AI recommendations first, then Retakes, then by Year and Sem
        recommendations.sort((a, b) => {
            const aIsAi = aiRecommendations.some(r => r.code === a.code);
            const bIsAi = aiRecommendations.some(r => r.code === b.code);
            if (aIsAi !== bIsAi) return bIsAi - aIsAi;
            if (a.is_retake !== b.is_retake) return b.is_retake - a.is_retake;
            if (a.year !== b.year) return a.year - b.year;
            return a.sem.localeCompare(b.sem);
        });
        
        res.json({ 
            success: true, 
            recommendations, 
            standing: aiStanding || (failedCodes.length > 0 ? 'Irregular' : 'Regular'),
            student_year: studentYear
        });
    } catch (err) {
        console.error('Forecast error:', err);
        res.status(500).json({ success: false, message: 'Server error processing forecast' });
    }
});

// Messaging - no JWT required
app.get('/api/messages', (req, res) => {
    const userId = req.query.user_id || req.headers['x-user-id'];
    if (!userId) return res.status(400).json([]);
    const query = 'SELECT m.*, u.name as sender_name FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.receiver_id = ? ORDER BY m.created_at DESC';
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json([]);
        res.json(results);
    });
});

app.post('/api/messages', (req, res) => {
    const { sender_id, receiver_id, message_text, subject } = req.body;
    db.query('INSERT INTO messages (sender_id, receiver_id, subject, message_text) VALUES (?, ?, ?, ?)', [sender_id, receiver_id, subject, message_text], (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
});

// Helper to parse AI JSON response robustly
function parseAIJSON(content) {
  if (!content) return null;
  if (typeof content === 'object') return content;
  
  // Clean up content: remove markdown code blocks and leading/trailing whitespace
  let cleanContent = content.trim();
  
  // Remove ```json and ``` blocks
  if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.replace(/^```(json)?/, '').replace(/```$/, '').trim();
  }
  
  // Remove "json" word if it's at the very beginning (some models do this)
  if (cleanContent.toLowerCase().startsWith('json')) {
    cleanContent = cleanContent.substring(4).trim();
  }

  try {
    return JSON.parse(cleanContent);
  } catch (e) {
    // Try to extract JSON from markdown or text if direct parse fails
    const start = cleanContent.indexOf('{');
    const end = cleanContent.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const extracted = cleanContent.slice(start, end + 1);
      try {
        // One last cleanup for common AI mistakes like trailing commas in arrays/objects
        const sanitized = extracted.replace(/,\s*([\]}])/g, '$1');
        return JSON.parse(sanitized);
      } catch (e2) {
        console.error('[PARSE_AI_JSON_ERROR] Failed to parse extracted JSON:', e2.message);
        console.error('[PARSE_AI_JSON_RAW]', cleanContent.substring(0, 200));
      }
    }
    return null;
  }
}

// Fallback report generator when AI fails
async function buildFallbackReport(student, allGrades, recentGrades) {
  const passedCount = allGrades.filter(g => g.grade_status === 'Passed').length;
  const failedCount = allGrades.filter(g => g.grade_status === 'Failed').length;
  const totalCourses = 50; // Estimated total for BSIT
  const passRate = totalCourses > 0 ? passedCount / totalCourses : 0;
  
  const standing = failedCount > 0 ? 'Irregular' : (student.year_level >= 4 && passedCount >= 45 ? 'Graduated' : 'Regular');
  
  const summary = standing === 'Graduated' 
    ? `Congratulations! ${student.name} has successfully completed all academic requirements and is eligible for graduation.`
    : `Academic evaluation for ${student.name}. The student is currently in ${standing} standing with ${passedCount} subjects completed. ${failedCount > 0 ? `Attention required for ${failedCount} failed subjects.` : 'Maintaining good academic progress.'}`;
  
  // Basic recommendations
  let recommendations = [];
  if (standing === 'Graduated') {
    recommendations = [
      { code: 'GRAD', title: 'Graduation Clearance', reason: 'Process institutional and department clearance.' },
      { code: 'ALUM', title: 'Alumni Registration', reason: 'Join the JMC Alumni Association.' }
    ];
  } else {
    const failedSubjects = allGrades.filter(g => g.grade_status === 'Failed');
    recommendations = failedSubjects.map(s => ({
      code: s.course_code,
      title: 'Retake Subject',
      reason: 'Subject was previously failed and must be cleared.'
    }));
    
    if (recommendations.length < 3) {
      recommendations.push({
        code: 'GE 10',
        title: 'General Education',
        reason: 'Recommended elective to fulfill credit requirements.'
      });
    }
  }

  const html_report = `
    <div style="font-family: sans-serif; color: #333;">
      <h2 style="color: #6a1b9a; border-bottom: 2px solid #6a1b9a; padding-bottom: 10px;">Academic Evaluation Report</h2>
      <div style="background: ${standing === 'Graduated' ? '#e8f5e9' : '#f3e5f5'}; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p><strong>Student:</strong> ${student.name}</p>
        <p><strong>Program:</strong> ${student.program || 'BSIT'}</p>
        <p><strong>Standing:</strong> <span style="color: ${standing === 'Graduated' ? '#2e7d32' : (standing === 'Regular' ? '#2e7d32' : '#c62828')}; font-weight: bold;">${standing}</span></p>
      </div>
      <h3>Evaluation Summary</h3>
      <p>${summary}</p>
      <h3>Recommendations</h3>
      <ul>
        ${recommendations.map(r => `<li><strong>${r.code}</strong>: ${r.reason}</li>`).join('')}
      </ul>
      <div style="margin-top: 20px; font-size: 12px; color: #666; font-style: italic;">
        Note: This is an automated fallback report generated because the AI service returned an invalid response.
      </div>
    </div>
  `;

  return {
    summary,
    recommendations,
    standing,
    html_report,
    metadata: {
      total_completed: passedCount,
      pass_rate: passRate,
      confidence: 0.5,
      fallback: true
    }
  };
}

// Real Internal AI Evaluation Workflow - PROGRAM HEAD ONLY
app.post('/api/ai/evaluate', verifyToken, requireAdmin, async (req, res) => {
  const { studentId, grades } = req.body;
  if (!studentId || !grades || !Array.isArray(grades)) {
    return res.status(400).json({ success: false, message: 'Invalid payload' });
  }

  try {
    // 1. Save grades (Reuse existing logic)
    for (const g of grades) {
      const gradeVal = parseFloat(g.grade);
      const status = gradeVal >= 75 ? 'Passed' : 'Failed';
      
      const [users] = await db.promise().query('SELECT name FROM users WHERE id = ?', [studentId]);
      const studentName = users.length > 0 ? users[0].name : 'Student';
      const remarks = await generateAIInsight(studentName, g.code, gradeVal, status);
      
      const query = `
          INSERT INTO student_grades (student_id, course_code, final_grade, grade_status, remarks, term) 
          VALUES (?, ?, ?, ?, ?, ?) 
          ON DUPLICATE KEY UPDATE 
              final_grade = VALUES(final_grade), 
              grade_status = VALUES(grade_status), 
              remarks = VALUES(remarks), 
              term = VALUES(term)
      `;
      await db.promise().query(query, [studentId, g.code, gradeVal, status, remarks, g.sem]);
    }

    // 2. Gather student context for full AI report
    const [studentProfile] = await db.promise().query(`
      SELECT u.name, u.program, s.year_level 
      FROM users u 
      LEFT JOIN students s ON u.id = s.user_id 
      WHERE u.id = ?
    `, [studentId]);

    const [allGrades] = await db.promise().query(`
      SELECT course_code, final_grade, grade_status, term 
      FROM student_grades 
      WHERE student_id = ?
    `, [studentId]);

    // 3. Call AI for comprehensive report
    const systemPrompt = `You are EvalTrack's Senior Academic Evaluator at Jose Maria College (JMC).
Your task is to analyze a student's academic history and provide a comprehensive evaluation report based on the official BSIT curriculum.

Context:
- Curriculum: BSIT (Bachelor of Science in Information Technology)
- Institutional Brand: JMC (Purple & Cream colors)
- Graduation Rule: A 4th-year student who has passed all 2nd-semester subjects and has no remaining failed subjects is eligible for "Graduated" standing.

Official BSIT Curriculum (JMC):
- 1st Year / 1st Sem: GE 10, GE 11, GE 4, GE 5, GE 9, IT 101, IT 102, NSTP 1, PE 1, SF 1
- 1st Year / 2nd Sem: GE 1, GE 2, GE 3, IT 103 (Prereq: IT 102), IT 104 (Prereq: IT 101), IT 105 (Prereq: IT 102), NSTP 2 (Prereq: NSTP 1), PE 2 (Prereq: PE 1), SF 2 (Prereq: SF 1)
- 2nd Year / 1st Sem: GE 6, GE 7, GE 8, IT 201 (Prereq: IT 103), IT 202 (Prereq: IT 101), IT Elect 1 (Prereq: IT 103), IT Elect 2 (Prereq: IT 101), PE 3 (Prereq: PE 2), SF 3 (Prereq: SF 1)
- 2nd Year / 2nd Sem: IT 203, IT 204, IT 205, IT 206 (Prereq: IT 103), IT 207 (Prereq: IT 101), IT Elect 3 (Prereq: IT 103), PE 4 (Prereq: IT 101), SF 4
- 3rd Year / 1st Sem: GE 12, IT 301 (Prereq: IT 203), IT 302 (Prereq: IT 203), IT 303 (Prereq: IT 203), IT 304 (Prereq: IT 205), IT 305 (Prereq: IT 206), IT 306 (Prereq: IT 205), IT 307, SF 5 (Prereq: SF 1)
- 3rd Year / 2nd Sem: IT 308 (Prereq: IT 304), IT 309 (Prereq: IT 303), IT 310 (Prereq: IT 301), IT 311, IT 312 (Prereq: IT 303), IT Elect 4 (Prereq: IT 302), SF 6 (Prereq: SF 1)
- Summer: CAP 101 (Prereq: 3rd Year Standing), SP 101 (Prereq: 3rd Year Standing)
- 4th Year / 1st Sem: CAP 102 (Prereq: CAP 101), IT 401 (Prereq: IT 308), SWT 101
- 4th Year / 2nd Sem: PRAC 101 (Prereq: CAP 101 & IT 308)

Output Requirement:
You MUST return a JSON object with the following fields:
{
  "summary": "A professional summary of the student's performance (max 100 words).",
  "recommendations": [
    { "code": "IT 103", "title": "Computer Programming 2", "units": 3.0, "reason": "Recommended next subject as student passed IT 102." }
  ],
  "standing": "Regular" | "Irregular" | "Warning" | "Graduated",
  "html_report": "A beautifully formatted HTML report using inline styles suitable for display in a dashboard. Use JMC colors (Purple: #6a1b9a).",
  "metadata": {
    "total_completed": number,
    "pass_rate": number,
    "confidence": number
  }
}

Rules:
- Base recommendations on prerequisites and the BSIT curriculum above.
- If a student has failed subjects, prioritize retaking them first.
- If the student is a 4th-year 2nd-semester student with all subjects passed, set standing to "Graduated".
- Keep the tone professional, encouraging, and data-driven.`;

    const userPrompt = `Student Profile: ${JSON.stringify(studentProfile[0])}
Recent Grades Input: ${JSON.stringify(grades)}
All Academic History: ${JSON.stringify(allGrades)}

Generate the full academic evaluation and enrollment recommendation report.`;

    // Check if AI service is available
    if (!requestGroq) {
      console.warn('[AI_EVALUATION] AI service not configured, using fallback report.');
      const fallbackReport = await buildFallbackReport(studentProfile[0], allGrades, grades);
      return res.json({ 
        success: true, 
        report: {
          ...fallbackReport,
          fallback: true
        }
      });
    }

    const aiResponse = await requestGroq([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ], { model: "llama-3.3-70b-versatile", response_format: { type: "json_object" } });

    let reportData = null;
    if (aiResponse.success) {
      reportData = parseAIJSON(aiResponse.content);
    }

    // 4. Fallback if AI failed or returned invalid JSON
    if (!reportData) {
      console.warn('[AI_EVALUATION] AI failed or returned invalid JSON, using fallback logic.');
      reportData = await buildFallbackReport(studentProfile[0], allGrades, grades);
    }

    // 5. Persist the report
    const [result] = await db.promise().query(`
      INSERT INTO ai_reports (student_id, report_text, report_html, metadata) 
      VALUES (?, ?, ?, ?)
    `, [
      studentId, 
      reportData.summary, 
      reportData.html_report, 
      JSON.stringify({ 
        ...reportData.metadata, 
        recommendations: reportData.recommendations,
        standing: reportData.standing
      })
    ]);

    // 6. Update student enrollment status if graduated
    if (reportData.standing === 'Graduated') {
      console.log(`[AI_EVALUATION] Student ${studentId} marked as GRADUATED. Updating database...`);
      await db.promise().query(`
        UPDATE students SET enrollment_status = 'graduated' WHERE id = ?
      `, [studentId]);
    }

    res.json({ 
      success: true, 
      report: {
        id: result.insertId,
        ...reportData
      }
    });

  } catch (err) {
    console.error('AI evaluation error:', err);
    res.status(500).json({ success: false, message: 'Server error during evaluation: ' + err.message });
  }
});

// ── ENROLLMENT API - PROTECTED ──

// Get enrollment history - ADMIN/PROGRAM HEAD ONLY
app.get('/api/enrollment/history', verifyToken, requireAdmin, async (req, res) => {
    const studentId = req.query.student_id;
    try {
        let query = `
            SELECT 
                a.student_id, 
                u.name as student_name, 
                a.term, 
                a.action, 
                a.course_code, 
                a.created_at, 
                c.units 
            FROM enrollment_audit a
            JOIN users u ON a.student_id = u.id
            LEFT JOIN courses c ON a.course_code = c.code
        `;
        
        const params = [];
        if (studentId) {
            query += ' WHERE a.student_id = ?';
            params.push(studentId);
        }
        
        query += ' ORDER BY a.created_at DESC';
        
        const [results] = await db.promise().query(query, params);
        res.json(results);
    } catch (err) {
        console.error('Error fetching enrollment history:', err);
        res.status(500).json([]);
    }
});

// Get current enrollment - own data or admin
app.get('/api/enrollment/current/:studentId', verifyToken, requireSelfOrAdmin, async (req, res) => {
    const { studentId } = req.params;
    console.log(`[GET /api/enrollment/current/${studentId}] Fetching current enrollment...`);
    
    try {
        if (!db) {
            console.error('[GET /api/enrollment/current] Database connection missing');
            return res.status(503).json({ success: false, message: 'Database not connected' });
        }
        
        // Using db.promise().query with standardized column names
        const query = `
            SELECT e.course_code, c.title, c.units, e.term, e.status
            FROM student_enrollments e
            JOIN courses c ON e.course_code = c.code
            WHERE e.student_id = ? AND e.status = 'Enrolled'
        `;
        
        console.log(`[GET /api/enrollment/current] Running query for student: ${studentId}`);
        const [results] = await db.promise().query(query, [studentId]);
        console.log(`[GET /api/enrollment/current] Found ${results.length} enrollment records`);
        
        res.json(results);
    } catch (err) {
        console.error('[GET /api/enrollment/current] FATAL ERROR:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Database error: ' + err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// Add subject to enrollment - PROGRAM HEAD ONLY
app.post('/api/enrollment/add', verifyToken, requireAdmin, async (req, res) => {
    const { studentId, courseCode, term, performedBy, subjects } = req.body;
    
    // Support both single subject and batch subjects array
    const toAdd = Array.isArray(subjects) ? subjects : (courseCode ? [{ code: courseCode, term }] : []);
    
    if (!studentId || toAdd.length === 0) {
        return res.status(400).json({ success: false, message: 'studentId and subjects required' });
    }

    let connection;
    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        const results = { added: [], failed: [] };

        // Load student's passed subjects once for prerequisite checking (normalize codes)
        const [passedRows] = await connection.query('SELECT course_code FROM student_grades WHERE student_id = ? AND grade_status = "Passed"', [studentId]);
        const passedCodesNormalized = passedRows.map(r => (r.course_code || '').toString().toUpperCase().replace(/\s+/g, ''));
        const passedSet = new Set(passedCodesNormalized);

        for (const s of toAdd) {
            const code = (s.code || s.courseCode || '').toString().trim();
            const currentTerm = s.term || term || 'Current';

            // Normalize input code for comparisons
            const codeNorm = code.toUpperCase().replace(/\s+/g, '');

            // 1. Check if already passed (use normalized comparison)
            if (passedSet.has(codeNorm)) {
                results.failed.push({ code, reason: 'Already passed this subject' });
                continue;
            }

            // 2. Lookup course in DB with tolerant matching (allow codes with/without spaces)
            const [courseRows] = await connection.query(
                'SELECT code, title, prerequisites FROM courses WHERE code = ? OR REPLACE(UPPER(code), " ", "") = ? LIMIT 1',
                [code, codeNorm]
            );
            if (courseRows.length === 0) {
                results.failed.push({ code, reason: 'Course not found in database' });
                continue;
            }

            const dbCode = courseRows[0].code; // canonical code stored in DB
            const prereqs = courseRows[0].prerequisites;
            if (prereqs && prereqs !== '-') {
                const prereqArray = prereqs.split(',').map(p => p.trim());
                const unmet = prereqArray.filter(p => p !== '-' && !passedSet.has(p.toUpperCase().replace(/\s+/g, '')));
                if (unmet.length > 0) {
                    results.failed.push({ code: dbCode, reason: `Prerequisite(s) not satisfied: ${unmet.join(', ')}` });
                    continue;
                }
            }

            // 3. Check for duplicate enrollment in same term
            const [existing] = await connection.query(
                'SELECT id FROM student_enrollments WHERE student_id = ? AND course_code = ? AND term = ? AND status = "Enrolled"',
                [studentId, dbCode, currentTerm]
            );
            if (existing.length > 0) {
                results.failed.push({ code: dbCode, reason: 'Already enrolled in this term' });
                continue;
            }

            // 4. Perform enrollment
            await connection.query(
                'INSERT INTO student_enrollments (student_id, course_code, term, status) VALUES (?, ?, ?, "Enrolled")',
                [studentId, dbCode, currentTerm]
            );

            // 5. Log audit trail
            await connection.query(
                'INSERT INTO enrollment_audit (student_id, action, course_code, term, performed_by) VALUES (?, "ADD", ?, ?, ?)',
                [studentId, dbCode, currentTerm, performedBy || 'Program Head']
            );

            results.added.push(dbCode);
        }

        await connection.commit();
        res.json({ success: true, results });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Enrollment transaction error:', err);
        res.status(500).json({ success: false, message: 'Server error during enrollment: ' + err.message });
    } finally {
        if (connection) connection.release();
    }
});

// Drop subject from enrollment - PROGRAM HEAD ONLY
app.post('/api/enrollment/drop', verifyToken, requireAdmin, async (req, res) => {
    const { studentId, courseCode, term, performedBy } = req.body;
    if (!studentId || !courseCode || !term) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    try {
        // 1. Update status to Dropped
        const [result] = await db.promise().query(
            'UPDATE student_enrollments SET status = "Dropped" WHERE student_id = ? AND course_code = ? AND term = ? AND status = "Enrolled"',
            [studentId, courseCode, term]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Enrollment record not found.' });
        }

        // 2. Log audit action
        await db.promise().query(
            'INSERT INTO enrollment_audit (student_id, action, course_code, term, performed_by) VALUES (?, "DROP", ?, ?, ?)',
            [studentId, courseCode, term, performedBy || 'Program Head']
        );

        res.json({ success: true, message: `Successfully dropped ${courseCode}` });
    } catch (err) {
        console.error('Error dropping enrollment:', err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// Get all student standings for monitoring - REMOVED (duplicate of protected endpoint above)

// Get enrollment audit history for a specific student
app.get('/api/enrollment/audit/:studentId', async (req, res) => {
    const { studentId } = req.params;
    try {
        const query = `
            SELECT action, course_code, term, created_at 
            FROM enrollment_audit 
            WHERE student_id = ? 
            ORDER BY created_at ASC
        `;
        const [results] = await db.promise().query(query, [studentId]);
        res.json(results);
    } catch (err) {
        console.error('Error fetching student audit:', err);
        res.status(500).json([]);
    }
});

// Get latest AI report - own data or admin
app.get('/api/ai/reports/:studentId', verifyToken, requireSelfOrAdmin, async (req, res) => {
  const { studentId } = req.params;
  try {
    const [reports] = await db.promise().query(`
      SELECT * FROM ai_reports 
      WHERE student_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [studentId]);

    if (reports.length === 0) {
      return res.status(404).json({ success: false, message: 'No reports found for this student.' });
    }

    const report = reports[0];
    res.json({ 
      success: true, 
      report: {
        ...report,
        metadata: typeof report.metadata === 'string' ? JSON.parse(report.metadata) : report.metadata
      }
    });
  } catch (err) {
    console.error('Error fetching AI report:', err);
    res.status(500).json({ success: false, message: 'Server error fetching report' });
  }
});

// Get all AI reports summary - ADMIN/PROGRAM HEAD ONLY
app.get('/api/ai/reports', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [reports] = await db.promise().query(`
      SELECT r.id, r.student_id, r.report_text, r.created_at, u.name as student_name 
      FROM ai_reports r
      JOIN users u ON r.student_id = u.id
      ORDER BY r.created_at DESC
    `);
    res.json({ success: true, reports });
  } catch (err) {
    console.error('Error fetching AI reports:', err);
    res.status(500).json({ success: false, message: 'Server error fetching reports' });
  }
});

// AI Chat Handler - authenticated users only
app.post('/api/ai/chat', verifyToken, async (req, res) => {
  const { topic = 'General', query = '', student_id, student_name } = req.body;
  
  if (!query || query.trim() === '') {
    return res.status(400).json({ success: false, message: 'Query required' });
  }

  // Strict EvalTrack AI Hub system prompt - JSON-only output
  const systemPrompt = `You are EvalTrack's AI Hub, an advanced academic intelligence system for Jose Maria College Foundation, Inc. (JMC).
You assist Program Heads and Instructors in evaluating the BSIT (Bachelor of Science in Information Technology) curriculum.

Context:
- Curriculum: BSIT (4 Years + Summer Term)
- Institutional Brand: JMC (Purple & Cream colors)
- Primary Goal: Student academic success, prerequisite tracking, and automated evaluation.

Capabilities:
1. Student Evaluation: Analyze grades, identify failed subjects, and check prerequisites (e.g., IT 102 is required for IT 103).
2. Enrollment Forecasting: Recommend subjects for the next semester based on passed courses.
3. Exam Generation: Create quizzes, MCQs, and rubrics from syllabus topics.
4. Professional Coaching: Help instructors set teaching goals and class performance targets.

Response Schema (Always reply ONLY with a single JSON object):
{
  "reply": string,           // Concise, professional, and encouraging response (max 600 words). Use HTML line breaks <br> for structure.
  "report"?: {              // Optional structured report for printing/downloading.
    "pdf_ready_html"?: string,
    "pdf_download_filename"?: string
  },
  "metadata"?: {            // Optional metadata.
    "source": "JMC Academic Database",
    "confidence": number    // 0.0 - 1.0
  }
}

Rules:
- Return EXACTLY one top-level JSON object. No commentary outside the JSON.
- If data is missing (e.g., student ID not provided for a specific query), ask a short clarification question in "reply".
- Keep "reply" action-oriented and aligned with JMC academic standards.
- If generating an exam, use clear numbering and provide an answer key at the end of the "reply".
End.`;

  // Build messages array
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: query }
  ];

  try {
    // Check if AI service is available
    if (!requestGroq) {
      return res.status(503).json({ 
        success: false, 
        message: 'AI service not configured. Please contact administrator.' 
      });
    }

    // Use the Groq rotator with automatic key rotation
    const result = await requestGroq(messages, { 
      model: 'llama-3.3-70b-versatile',
      timeout: 25000
    });

    if (!result.success) {
      console.error('[GROQ] All keys exhausted:', result.message);
      return res.status(502).json({ 
        success: false, 
        message: 'AI service unavailable (all API keys exhausted)' 
      });
    }

    console.log(`[GROQ] Request served with key index: ${result.keyUsed}`);

    // Parse the JSON response from the model
    let parsed;
    try {
      parsed = JSON.parse(result.content);
    } catch (e) {
      // Try to extract JSON if wrapped in other text
      const start = result.content.indexOf('{');
      const end = result.content.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        try {
          parsed = JSON.parse(result.content.slice(start, end + 1));
        } catch (e2) {
          console.error('[GROQ] Failed to parse AI response as JSON:', result.content.substring(0, 200));
          return res.status(502).json({ 
            success: false, 
            message: 'AI returned invalid JSON format' 
          });
        }
      } else {
        console.error('[GROQ] No JSON object found in AI response');
        return res.status(502).json({ 
          success: false, 
          message: 'AI response did not contain valid JSON' 
        });
      }
    }

    // Forward the parsed JSON to client with extra metadata
    return res.json({ 
      success: true, 
      ...parsed,
      metadata: {
        ...(parsed.metadata || {}),
        model: 'llama-3.3-70b-versatile',
        source: 'groq',
        key_index: result.keyUsed
      }
    });

  } catch (err) {
    console.error('[GROQ] AI handler error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error connecting to AI service' 
    });
  }
});

// Get all programs
app.get('/api/programs', (req, res) => {
    if (!db) return res.status(503).json({ success: false, message: 'Database not connected' });
    
    const query = 'SELECT * FROM programs ORDER BY code';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Server error' });
        res.json({ success: true, data: results });
    });
});

// Get curriculum by program
app.get('/api/curriculum/:programCode', (req, res) => {
    if (!db) return res.status(503).json({ success: false, message: 'Database not connected' });
    
    const { programCode } = req.params;
    const query = `
        SELECT cc.*, c.title, c.units, c.course_type, c.prerequisites 
        FROM curriculum_courses cc 
        JOIN courses c ON cc.course_code = c.code 
        JOIN curricula cur ON cc.curriculum_id = cur.id 
        WHERE cur.program_code = ? AND cur.is_active = 1 
        ORDER BY cc.year_level, FIELD(cc.semester, '1st', '2nd', 'Summer'), cc.sequence_order
    `;
    
    db.query(query, [programCode], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Server error' });
        res.json({ success: true, data: results });
    });
});

// Get student's curriculum evaluation
app.get('/api/student/evaluation/:studentId', (req, res) => {
    if (!db) return res.status(503).json({ success: false, message: 'Database not connected' });
    
    const { studentId } = req.params;
    
    // Get student info and curriculum
    const studentQuery = `
        SELECT s.*, p.name as program_name 
        FROM students s 
        JOIN programs p ON s.program_code = p.code 
        WHERE s.id = ?
    `;
    
    db.query(studentQuery, [studentId], (err, studentResults) => {
        if (err) return res.status(500).json({ success: false, message: 'Server error' });
        if (studentResults.length === 0) return res.status(404).json({ success: false, message: 'Student not found' });
        
        const student = studentResults[0];
        
        // Get curriculum courses
        const curriculumQuery = `
            SELECT cc.*, c.title, c.units, c.course_type, c.prerequisites 
            FROM curriculum_courses cc 
            JOIN courses c ON cc.course_code = c.code 
            JOIN curricula cur ON cc.curriculum_id = cur.id 
            WHERE cur.program_code = ? AND cur.is_active = 1 
            ORDER BY cc.year_level, FIELD(cc.semester, '1st', '2nd', 'Summer'), cc.sequence_order
        `;
        
        db.query(curriculumQuery, [student.program_code], (err, curriculumResults) => {
            if (err) return res.status(500).json({ success: false, message: 'Server error' });
            
            // Get student grades
            const gradesQuery = `
                SELECT sg.*, c.title as course_title 
                FROM student_grades sg 
                JOIN courses c ON sg.course_code = c.code 
                WHERE sg.student_id = ?
            `;
            
            db.query(gradesQuery, [studentId], (err, gradesResults) => {
                if (err) return res.status(500).json({ success: false, message: 'Server error' });
                
                // Combine curriculum with grades
                const evaluation = curriculumResults.map(course => {
                    const grade = gradesResults.find(g => g.course_code === course.course_code);
                    return {
                        ...course,
                        grade: grade ? grade.final_grade : null,
                        grade_status: grade ? grade.grade_status : null,
                        term: grade ? grade.term : null,
                        remarks: grade ? grade.remarks : null
                    };
                });
                
                // Calculate statistics
                const completedCourses = evaluation.filter(c => c.grade_status === 'passed').length;
                const totalCourses = evaluation.length;
                const totalUnitsEarned = evaluation
                    .filter(c => c.grade_status === 'passed')
                    .reduce((sum, c) => sum + parseFloat(c.units), 0);
                
                res.json({
                    success: true,
                    data: {
                        student,
                        curriculum: evaluation,
                        statistics: {
                            completedCourses,
                            totalCourses,
                            totalUnitsEarned,
                            completionRate: ((completedCourses / totalCourses) * 100).toFixed(2)
                        }
                    }
                });
            });
        });
    });
});

// Get student grades by term
app.get('/api/student/grades/:studentId', (req, res) => {
    if (!db) return res.status(503).json({ success: false, message: 'Database not connected' });
    
    const { studentId } = req.params;
    const { term } = req.query;
    
    let query = `
        SELECT sg.*, c.title, c.units, c.course_type 
        FROM student_grades sg 
        JOIN courses c ON sg.course_code = c.code 
        WHERE sg.student_id = ?
    `;
    let params = [studentId];
    
    if (term) {
        query += ' AND sg.term = ?';
        params.push(term);
    }
    
    query += ' ORDER BY sg.term, c.course_type, c.code';
    
    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Server error' });
        res.json({ success: true, data: results });
    });
});

// Update student grade
app.post('/api/student/grades', (req, res) => {
    if (!db) return res.status(503).json({ success: false, message: 'Database not connected' });
    
    const { studentId, courseCode, term, preliminaryGrade, midtermGrade, finalGrade, gradeStatus, remarks, instructorId } = req.body;
    
    // Check if grade record exists
    const checkQuery = 'SELECT id FROM student_grades WHERE student_id = ? AND course_code = ? AND term = ?';
    db.query(checkQuery, [studentId, courseCode, term], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Server error' });
        
        const averageGrade = finalGrade || ((preliminaryGrade + midtermGrade) / 2);
        
        if (results.length > 0) {
            // Update existing record
            const updateQuery = `
                UPDATE student_grades 
                SET preliminary_grade = ?, midterm_grade = ?, final_grade = ?, average_grade = ?, 
                    grade_status = ?, remarks = ?, instructor_id = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            db.query(updateQuery, [preliminaryGrade, midtermGrade, finalGrade, averageGrade, gradeStatus, remarks, instructorId, results[0].id], (err) => {
                if (err) return res.status(500).json({ success: false, message: 'Server error' });
                res.json({ success: true, message: 'Grade updated successfully' });
            });
        } else {
            // Insert new record
            const insertQuery = `
                INSERT INTO student_grades 
                (student_id, course_code, term, preliminary_grade, midterm_grade, final_grade, average_grade, grade_status, remarks, instructor_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            db.query(insertQuery, [studentId, courseCode, term, preliminaryGrade, midtermGrade, finalGrade, averageGrade, gradeStatus, remarks, instructorId], (err) => {
                if (err) return res.status(500).json({ success: false, message: 'Server error' });
                res.json({ success: true, message: 'Grade added successfully' });
            });
        }
    });
});

// Get available course offerings
app.get('/api/course-offerings', (req, res) => {
    if (!db) return res.status(503).json({ success: false, message: 'Database not connected' });
    
    const { term, programCode } = req.query;
    
    let query = `
        SELECT co.*, c.title, c.units, c.course_type, u.name as instructor_name 
        FROM course_offerings co 
        JOIN courses c ON co.course_code = c.code 
        LEFT JOIN users u ON co.instructor_id = u.id 
        WHERE co.is_active = 1
    `;
    let params = [];
    
    if (term) {
        query += ' AND co.term = ?';
        params.push(term);
    }
    
    query += ' ORDER BY co.term, c.course_type, c.code';
    
    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Server error' });
        res.json({ success: true, data: results });
    });
});

// Enroll student in course
app.post('/api/student/enroll', (req, res) => {
    if (!db) return res.status(503).json({ success: false, message: 'Database not connected' });
    
    const { studentId, courseOfferingId } = req.body;
    
    // Check if already enrolled
    const checkQuery = 'SELECT id FROM student_enrollments WHERE student_id = ? AND course_offering_id = ?';
    db.query(checkQuery, [studentId, courseOfferingId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Server error' });
        if (results.length > 0) return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
        
        // Get course offering details
        const offeringQuery = 'SELECT * FROM course_offerings WHERE id = ?';
        db.query(offeringQuery, [courseOfferingId], (err, offeringResults) => {
            if (err) return res.status(500).json({ success: false, message: 'Server error' });
            if (offeringResults.length === 0) return res.status(404).json({ success: false, message: 'Course offering not found' });
            
            const offering = offeringResults[0];
            
            if (offering.current_enrolled >= offering.max_capacity) {
                return res.status(400).json({ success: false, message: 'Course is full' });
            }
            
            // Create enrollment
            const enrollQuery = `
                INSERT INTO student_enrollments (student_id, course_offering_id, enrollment_date, status)
                VALUES (?, ?, CURDATE(), 'enrolled')
            `;
            db.query(enrollQuery, [studentId, courseOfferingId], (err) => {
                if (err) return res.status(500).json({ success: false, message: 'Server error' });
                
                // Update enrollment count
                const updateCountQuery = 'UPDATE course_offerings SET current_enrolled = current_enrolled + 1 WHERE id = ?';
                db.query(updateCountQuery, [courseOfferingId], (err) => {
                    if (err) return res.status(500).json({ success: false, message: 'Server error' });
                    res.json({ success: true, message: 'Enrollment successful' });
                });
            });
        });
    });
});

// Get prerequisite validation for course enrollment
app.get('/api/prerequisites/check/:studentId/:courseCode', (req, res) => {
    if (!db) return res.status(503).json({ success: false, message: 'Database not connected' });
    
    const { studentId, courseCode } = req.params;
    
    // Get course prerequisites
    const courseQuery = 'SELECT prerequisites FROM courses WHERE code = ?';
    db.query(courseQuery, [courseCode], (err, courseResults) => {
        if (err) return res.status(500).json({ success: false, message: 'Server error' });
        if (courseResults.length === 0) return res.status(404).json({ success: false, message: 'Course not found' });
        
        const course = courseResults[0];
        if (!course.prerequisites) {
            return res.json({ success: true, canEnroll: true, prerequisites: [] });
        }
        
        const prerequisites = JSON.parse(course.prerequisites);
        
        // Check if student has passed prerequisites
        const gradesQuery = `
            SELECT course_code, grade_status 
            FROM student_grades 
            WHERE student_id = ? AND grade_status = 'passed'
        `;
        
        db.query(gradesQuery, [studentId], (err, gradesResults) => {
            if (err) return res.status(500).json({ success: false, message: 'Server error' });
            
            const passedCourses = gradesResults.map(g => g.course_code);
            const missingPrereqs = prerequisites.filter(prereq => !passedCourses.includes(prereq));
            
            res.json({
                success: true,
                canEnroll: missingPrereqs.length === 0,
                prerequisites: prerequisites,
                missingPrerequisites: missingPrereqs,
                passedCourses: passedCourses
            });
        });
    });
});

// Generate curriculum evaluation report
app.get('/api/student/report/:studentId', (req, res) => {
    if (!db) return res.status(503).json({ success: false, message: 'Database not connected' });
    
    const { studentId } = req.params;
    
    // This would generate a detailed report similar to the curriculum evaluation document
    const query = `
        SELECT 
            s.*,
            p.name as program_name,
            (SELECT COUNT(*) FROM student_grades WHERE student_id = s.id AND grade_status = 'passed') as passed_courses,
            (SELECT SUM(units) FROM student_grades sg JOIN courses c ON sg.course_code = c.code WHERE sg.student_id = s.id AND sg.grade_status = 'passed') as total_units
        FROM students s 
        JOIN programs p ON s.program_code = p.code 
        WHERE s.id = ?
    `;
    
    db.query(query, [studentId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Server error' });
        if (results.length === 0) return res.status(404).json({ success: false, message: 'Student not found' });
        
        res.json({ success: true, data: results[0] });
    });
});

// --- ADDITIONAL API ENDPOINTS FOR ADMIN DASHBOARD ---

// Get all students
app.get('/api/students', (req, res) => {
    if (!db) return res.status(503).json({ success: false, message: 'Database not connected' });
    
    const query = `
        SELECT s.*, u.name, u.email, p.name as program_name 
        FROM students s 
        JOIN users u ON s.user_id = u.id 
        LEFT JOIN programs p ON s.program_code = p.code 
        ORDER BY s.id
    `;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Server error' });
        res.json({ success: true, data: results });
    });
});

// Get all courses
app.get('/api/courses', (req, res) => {
    if (!db) return res.status(503).json({ success: false, message: 'Database not connected' });
    
    const query = 'SELECT * FROM courses ORDER BY course_type, code';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Server error' });
        res.json({ success: true, data: results });
    });
});

// Create new student
app.post('/api/students', (req, res) => {
    if (!db) return res.status(503).json({ success: false, message: 'Database not connected' });
    
    const { id, name, email, password, role, programCode, studentType } = req.body;
    
    // First create user
    const userQuery = 'INSERT INTO users (id, name, email, password, role, program, student_type) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(userQuery, [id, name, email, password, role || 'student', programCode, studentType], (err, userResult) => {
        if (err) return res.status(500).json({ success: false, message: 'Server error' });
        
        // Then create student record
        const studentQuery = `
            INSERT INTO students (id, user_id, program_code, student_type, date_admitted) 
            VALUES (?, ?, ?, ?, CURDATE())
        `;
        db.query(studentQuery, [id, id, programCode, studentType], (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Server error' });
            res.json({ success: true, message: 'Student created successfully' });
        });
    });
});

// Get student details with grades
app.get('/api/students/:id/details', (req, res) => {
    if (!db) return res.status(503).json({ success: false, message: 'Database not connected' });
    
    const { id } = req.params;
    
    // Get student info
    const studentQuery = `
        SELECT s.*, u.name, u.email, p.name as program_name 
        FROM students s 
        JOIN users u ON s.user_id = u.id 
        LEFT JOIN programs p ON s.program_code = p.code 
        WHERE s.id = ?
    `;
    
    db.query(studentQuery, [id], (err, studentResults) => {
        if (err) return res.status(500).json({ success: false, message: 'Server error' });
        if (studentResults.length === 0) return res.status(404).json({ success: false, message: 'Student not found' });
        
        // Get student grades
        const gradesQuery = `
            SELECT sg.*, c.title, c.units, c.course_type 
            FROM student_grades sg 
            JOIN courses c ON sg.course_code = c.code 
            WHERE sg.student_id = ?
            ORDER BY sg.term, c.course_type, c.code
        `;
        
        db.query(gradesQuery, [id], (err, gradesResults) => {
            if (err) return res.status(500).json({ success: false, message: 'Server error' });
            
            res.json({
                success: true,
                data: {
                    student: studentResults[0],
                    grades: gradesResults
                }
            });
        });
    });
});

// Update student grade
app.put('/api/students/:studentId/grades/:courseCode', (req, res) => {
    if (!db) return res.status(503).json({ success: false, message: 'Database not connected' });
    
    const { studentId, courseCode } = req.params;
    const { term, preliminaryGrade, midtermGrade, finalGrade, gradeStatus, remarks, instructorId } = req.body;
    
    const averageGrade = finalGrade || ((preliminaryGrade + midtermGrade) / 2);
    
    // Check if grade record exists
    const checkQuery = 'SELECT id FROM student_grades WHERE student_id = ? AND course_code = ? AND term = ?';
    db.query(checkQuery, [studentId, courseCode, term], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Server error' });
        
        if (results.length > 0) {
            // Update existing record
            const updateQuery = `
                UPDATE student_grades 
                SET preliminary_grade = ?, midterm_grade = ?, final_grade = ?, average_grade = ?, 
                    grade_status = ?, remarks = ?, instructor_id = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            db.query(updateQuery, [preliminaryGrade, midtermGrade, finalGrade, averageGrade, gradeStatus, remarks, instructorId, results[0].id], (err) => {
                if (err) return res.status(500).json({ success: false, message: 'Server error' });
                res.json({ success: true, message: 'Grade updated successfully' });
            });
        } else {
            // Insert new record
            const insertQuery = `
                INSERT INTO student_grades 
                (student_id, course_code, term, preliminary_grade, midterm_grade, final_grade, average_grade, grade_status, remarks, instructor_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            db.query(insertQuery, [studentId, courseCode, term, preliminaryGrade, midtermGrade, finalGrade, averageGrade, gradeStatus, remarks, instructorId], (err) => {
                if (err) return res.status(500).json({ success: false, message: 'Server error' });
                res.json({ success: true, message: 'Grade added successfully' });
            });
        }
    });
});

// Get available terms for grading
app.get('/api/terms', (req, res) => {
    if (!db) return res.status(503).json({ success: false, message: 'Database not connected' });
    
    const query = `
        SELECT DISTINCT term 
        FROM student_grades 
        ORDER BY term DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Server error' });
        res.json({ success: true, data: results.map(r => r.term) });
    });
});

// Get curriculum statistics
app.get('/api/statistics/curriculum', (req, res) => {
    if (!db) return res.status(503).json({ success: false, message: 'Database not connected' });
    
    const query = `
        SELECT 
            p.code as program_code,
            p.name as program_name,
            COUNT(s.id) as total_students,
            COUNT(CASE WHEN s.enrollment_status = 'active' THEN 1 END) as active_students,
            AVG(s.gpa) as average_gpa,
            AVG(s.total_units_earned) as average_units_earned
        FROM programs p
        LEFT JOIN students s ON p.code = s.program_code
        GROUP BY p.code, p.name
        ORDER BY p.code
    `;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Server error' });
        res.json({ success: true, data: results });
    });
});


// Firebase Admin test endpoint
app.get('/api/firebase/status', (req, res) => {
    res.json({
        firebaseInitialized: firebaseInitialized,
        message: firebaseInitialized ? 'Firebase Admin SDK is active' : 'Firebase Admin SDK not initialized - service account key missing'
    });
});

// Sync user to Firebase Firestore endpoint
app.post('/api/firebase/sync-user', async (req, res) => {
    if (!firebaseInitialized) {
        return res.status(503).json({ success: false, message: 'Firebase Admin not initialized' });
    }
    
    const { userId, userData } = req.body;
    if (!userId || !userData) {
        return res.status(400).json({ success: false, message: 'userId and userData required' });
    }
    
    try {
        const result = await firebaseAdmin.syncUserToFirestore(userId, userData);
        if (result) {
            res.json({ success: true, message: 'User synced to Firebase' });
        } else {
            res.status(500).json({ success: false, message: 'Failed to sync user' });
        }
    } catch (error) {
        console.error('Firebase sync error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Check user role endpoint for Google Sign In flow - now creates users if not found
app.all('/api/check-role', (req, res) => {
    // Handle GET for testing
    if (req.method === 'GET') {
        return res.json({ 
            message: "Server is running! Use POST to check roles.",
            example: { method: "POST", body: { email: "user@example.com" } }
        });
    }
    
    // Handle POST for actual login
    if (!db) return res.status(503).json({ success: false, message: 'Database not connected' });
    
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    
    const query = 'SELECT id, name, email, role, program, student_type, status FROM users WHERE email = ?';
    db.query(query, [email], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Server error' });
        
        if (results.length === 0) {
            // User not found - create new Google user as student
            const newUserId = 'GOOGLE_' + Date.now();
            const newUserName = name || email.split('@')[0];
            const insertQuery = 'INSERT INTO users (id, name, email, password, role, program, student_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            const insertParams = [newUserId, newUserName, email, 'google_auth', 'student', 'BSIT', 'regular', 'Active'];
            
            db.query(insertQuery, insertParams, (insertErr) => {
                if (insertErr) {
                    console.error('Failed to create Google user:', insertErr);
                    // Return default role even if creation fails
                    return res.json({ 
                        success: true, 
                        role: 'student',
                        isNewUser: true,
                        message: 'New user - defaulting to student role'
                    });
                }
                
                console.log('Created new Google user:', email);
                res.json({ 
                    success: true, 
                    role: 'student',
                    user: { id: newUserId, name: newUserName, email, role: 'student', program: 'BSIT', student_type: 'regular', status: 'Active' },
                    isNewUser: true,
                    message: 'New user created as student'
                });
            });
            return;
        }
        
        const user = results[0];
        res.json({ 
            success: true, 
            role: user.role,
            user: user,
            isNewUser: false
        });
    });
});

// --- ENROLLMENT API ENDPOINTS ---

// Get current enrollment audit (alias for history)
app.get('/api/enrollment/audit/all', verifyToken, requireAdmin, (req, res) => {
    if (!db) return res.status(503).json([]);
    const query = `
        SELECT ea.*, u.name as student_name, c.title, c.units
        FROM enrollment_audit ea
        JOIN users u ON ea.student_id = u.id
        LEFT JOIN courses c ON ea.course_code = c.code
        ORDER BY ea.created_at DESC LIMIT 100
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json([]);
        res.json(results);
    });
});


// Add enrollment (single or batch)
app.post('/api/enrollment/add-legacy', verifyToken, requireAdmin, async (req, res) => {
    if (!db) return res.status(503).json({ success: false, message: 'Database not connected' });
    
    const { studentId, courseCode, term, performedBy, subjects } = req.body;
    
    // Support both single subject and batch enrollment
    const subjectsToAdd = subjects || (courseCode ? [{ code: courseCode, term }] : []);
    
    if (!studentId || subjectsToAdd.length === 0) {
        return res.status(400).json({ success: false, message: 'Student ID and subjects required' });
    }
    
    const results = { added: [], failed: [] };
    const dbPromise = db.promise();
    
    try {
        for (const subject of subjectsToAdd) {
            const subjCode = subject.code || subject.courseCode;
            const subjTerm = subject.term || term || 'Current';
            
            // Check if course exists
            const [courseRows] = await dbPromise.query('SELECT * FROM courses WHERE code = ?', [subjCode]);
            if (courseRows.length === 0) {
                results.failed.push({ code: subjCode, reason: 'Course not found in database' });
                continue;
            }
            
            const course = courseRows[0];
            
            // Check if already enrolled
            const [existing] = await dbPromise.query(
                'SELECT * FROM student_enrollments WHERE student_id = ? AND course_code = ? AND status = "Enrolled"',
                [studentId, subjCode]
            );
            if (existing.length > 0) {
                results.failed.push({ code: subjCode, reason: 'Already enrolled' });
                continue;
            }
            
            // Add enrollment
            await dbPromise.query(
                'INSERT INTO student_enrollments (student_id, course_code, term, status) VALUES (?, ?, ?, "Enrolled")',
                [studentId, subjCode, subjTerm]
            );
            
            // Add audit entry
            await dbPromise.query(
                'INSERT INTO enrollment_audit (student_id, action, course_code, term, performed_by) VALUES (?, "ADD", ?, ?, ?)',
                [studentId, subjCode, subjTerm, performedBy || 'System']
            );
            
            results.added.push({ code: subjCode, title: course.title, units: course.units });
        }
        
        res.json({ 
            success: true, 
            message: `Added ${results.added.length} subjects${results.failed.length > 0 ? `, ${results.failed.length} failed` : ''}`,
            results 
        });
    } catch (err) {
        console.error('Enrollment add error:', err);
        res.status(500).json({ success: false, message: 'Server error during enrollment', error: err.message });
    }
});

// Drop enrollment
app.post('/api/enrollment/drop-legacy', verifyToken, requireAdmin, async (req, res) => {
    if (!db) return res.status(503).json({ success: false, message: 'Database not connected' });
    
    const { studentId, courseCode, term, performedBy } = req.body;
    
    if (!studentId || !courseCode) {
        return res.status(400).json({ success: false, message: 'Student ID and course code required' });
    }
    
    const dbPromise = db.promise();
    
    try {
        // Check if enrolled
        const [existing] = await dbPromise.query(
            'SELECT * FROM student_enrollments WHERE student_id = ? AND course_code = ? AND status = "Enrolled"',
            [studentId, courseCode]
        );
        if (existing.length === 0) {
            return res.json({ success: false, message: 'Not currently enrolled in this course' });
        }
        
        // Drop enrollment
        await dbPromise.query(
            'UPDATE student_enrollments SET status = "Dropped" WHERE student_id = ? AND course_code = ?',
            [studentId, courseCode]
        );
        
        // Add audit entry
        await dbPromise.query(
            'INSERT INTO enrollment_audit (student_id, action, course_code, term, performed_by) VALUES (?, "DROP", ?, ?, ?)',
            [studentId, courseCode, term || 'Current', performedBy || 'System']
        );
        
        res.json({ success: true, message: `${courseCode} dropped successfully` });
    } catch (err) {
        console.error('Enrollment drop error:', err);
        res.status(500).json({ success: false, message: 'Server error during drop' });
    }
});

// Get enrollment forecast/recommendations
app.get('/api/enrollment/forecast', async (req, res) => {
    if (!db) return res.status(503).json([]);
    const studentId = req.query.student_id;
    if (!studentId) return res.status(400).json({ success: false, message: 'Student ID required' });
    
    const dbPromise = db.promise();
    
    try {
        // Get student info
        const [students] = await dbPromise.query(
            'SELECT u.*, s.year_level FROM users u LEFT JOIN students s ON u.id = s.user_id WHERE u.id = ? AND u.role = "student"',
            [studentId]
        );
        if (students.length === 0) return res.json([]);
        
        const student = students[0];
        const yearLevel = parseInt(student.year_level) || 1;
        
        // Get passed courses
        const [grades] = await dbPromise.query(
            'SELECT course_code, grade_status FROM student_grades WHERE student_id = ? AND grade_status = "Passed"',
            [studentId]
        );
        const passedCourses = grades.map(g => g.course_code);
        
        // Get curriculum for next semester
        const [curriculum] = await dbPromise.query(
            `SELECT cc.*, c.title, c.units, c.prerequisites 
             FROM curriculum_courses cc
             JOIN courses c ON cc.course_code = c.code
             WHERE cc.year_level = ? AND cc.program = ?
             ORDER BY cc.semester, cc.sequence_order`,
            [yearLevel, student.program || 'BSIT']
        );
        
        // Filter recommendations
        const recommendations = curriculum.map(course => {
            const isRetake = grades.some(g => g.course_code === course.course_code && g.grade_status === 'Failed');
            const canEnroll = !course.prerequisites || course.prerequisites === '-' || 
                             course.prerequisites.split(',').every(p => passedCourses.includes(p.trim()));
            
            return {
                code: course.course_code,
                title: course.title,
                units: course.units,
                year: course.year_level,
                sem: course.semester,
                is_retake: isRetake,
                can_enroll: canEnroll,
                missing_prereq: canEnroll ? null : course.prerequisites,
                reason: isRetake ? 'Retake required' : (canEnroll ? 'Prerequisite met' : `Missing: ${course.prerequisites}`)
            };
        }).filter(r => !passedCourses.includes(r.code) || r.is_retake);
        
        res.json(recommendations);
    } catch (err) {
        console.error('Forecast error:', err);
        res.status(500).json([]);
    }
});

// --- AI EVALUATION ENDPOINTS ---

// Submit grades and generate AI evaluation
app.post('/api/ai/evaluate', async (req, res) => {
    if (!db) return res.status(503).json({ success: false, message: 'Database not connected' });
    
    const { studentId, grades } = req.body;
    if (!studentId || !Array.isArray(grades) || grades.length === 0) {
        return res.status(400).json({ success: false, message: 'Student ID and grades array required' });
    }
    
    const dbPromise = db.promise();
    
    try {
        // Get student info
        const [students] = await dbPromise.query(
            'SELECT u.*, s.year_level, s.student_type FROM users u LEFT JOIN students s ON u.id = s.user_id WHERE u.id = ?',
            [studentId]
        );
        if (students.length === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        const student = students[0];
        
        // Store grades and evaluate
        const evaluationResults = [];
        const passedSubjects = [];
        const failedSubjects = [];
        
        for (const gradeEntry of grades) {
            const { code, subject, sem, grade } = gradeEntry;
            const numericGrade = parseFloat(grade);
            
            // Determine pass/fail (1.0-3.0 = pass, 3.1+ = fail)
            const status = numericGrade <= 3.0 ? 'Passed' : 'Failed';
            
            // Get course details
            const [courseRows] = await dbPromise.query('SELECT * FROM courses WHERE code = ?', [code]);
            const course = courseRows[0] || { title: subject, units: 3 };
            
            evaluationResults.push({
                code,
                title: course.title || subject,
                grade: numericGrade,
                status,
                units: course.units || 3
            });
            
            if (status === 'Passed') passedSubjects.push(code);
            else failedSubjects.push(code);
            
            // Save to database
            await dbPromise.query(
                `INSERT INTO student_grades (student_id, course_code, grade, grade_status, semester) 
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE grade = ?, grade_status = ?, semester = ?`,
                [studentId, code, numericGrade, status, sem, numericGrade, status, sem]
            );
        }
        
        // Calculate standing
        const totalUnits = evaluationResults.reduce((sum, r) => sum + r.units, 0);
        const passedUnits = evaluationResults.filter(r => r.status === 'Passed').reduce((sum, r) => sum + r.units, 0);
        const gwa = evaluationResults.reduce((sum, r) => sum + (r.grade * r.units), 0) / totalUnits;
        
        let standing = 'Good Standing';
        if (gwa > 3.0) standing = 'Probationary';
        if (failedSubjects.length > 3) standing = 'At Risk';
        
        // Generate recommendations based on curriculum
        const yearLevel = parseInt(student.year_level) || 1;
        const [curriculum] = await dbPromise.query(
            `SELECT cc.*, c.title, c.units, c.prerequisites 
             FROM curriculum_courses cc
             JOIN courses c ON cc.course_code = c.code
             WHERE cc.year_level = ? AND cc.program = ?
             ORDER BY cc.semester`,
            [yearLevel, student.program || 'BSIT']
        );
        
        const recommendations = [];
        
        // Add retake recommendations first
        for (const failedCode of failedSubjects) {
            const course = curriculum.find(c => c.course_code === failedCode);
            if (course) {
                recommendations.push({
                    code: failedCode,
                    title: course.title,
                    reason: 'Retake required - Failed previous attempt',
                    priority: 'high'
                });
            }
        }
        
        // Add next subjects
        for (const course of curriculum) {
            if (passedSubjects.includes(course.course_code)) continue;
            if (failedSubjects.includes(course.course_code)) continue;
            
            const prereqs = course.prerequisites ? course.prerequisites.split(',').map(p => p.trim()) : [];
            const hasPrereqs = prereqs.every(p => p === '-' || passedSubjects.includes(p));
            
            if (hasPrereqs) {
                recommendations.push({
                    code: course.course_code,
                    title: course.title,
                    reason: `Next: ${course.semester} Semester`,
                    priority: 'normal'
                });
            }
        }
        
        // Generate AI report text
        const reportText = generateEvaluationReport(student, evaluationResults, recommendations, gwa, standing);
        
        // Save AI report
        const metadata = JSON.stringify({
            standing,
            gwa: gwa.toFixed(2),
            pass_rate: passedUnits / totalUnits,
            recommendations,
            total_subjects: evaluationResults.length,
            passed: passedSubjects.length,
            failed: failedSubjects.length
        });
        
        await dbPromise.query(
            `INSERT INTO ai_evaluation_reports (student_id, report_text, metadata, created_by) 
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE report_text = ?, metadata = ?, created_at = NOW()`,
            [studentId, reportText, metadata, 'Program Head', reportText, metadata]
        );
        
        res.json({
            success: true,
            message: 'Evaluation completed',
            report: {
                student_name: student.name,
                student_id: studentId,
                standing,
                gwa: gwa.toFixed(2),
                results: evaluationResults,
                recommendations,
                report_text: reportText
            }
        });
        
    } catch (err) {
        console.error('AI Evaluation error:', err);
        res.status(500).json({ success: false, message: 'Evaluation failed', error: err.message });
    }
});

// Get all AI evaluation reports
app.get('/api/ai/reports', async (req, res) => {
    if (!db) return res.status(503).json({ success: false, message: 'Database not connected' });
    
    try {
        const [reports] = await db.promise().query(
            `SELECT r.*, u.name as student_name 
             FROM ai_evaluation_reports r
             JOIN users u ON r.student_id = u.id
             ORDER BY r.created_at DESC`
        );
        
        const formatted = reports.map(r => ({
            id: r.id,
            student_id: r.student_id,
            student_name: r.student_name,
            report_text: r.report_text,
            metadata: JSON.parse(r.metadata || '{}'),
            created_at: r.created_at
        }));
        
        res.json({ success: true, reports: formatted });
    } catch (err) {
        console.error('Get reports error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch reports' });
    }
});

// Get single student AI report
app.get('/api/ai/reports/:studentId', async (req, res) => {
    if (!db) return res.status(503).json({ success: false, message: 'Database not connected' });
    
    const { studentId } = req.params;
    
    try {
        const [reports] = await db.promise().query(
            `SELECT r.*, u.name as student_name 
             FROM ai_evaluation_reports r
             JOIN users u ON r.student_id = u.id
             WHERE r.student_id = ?
             ORDER BY r.created_at DESC
             LIMIT 1`,
            [studentId]
        );
        
        if (reports.length === 0) {
            return res.status(404).json({ success: false, message: 'No report found for this student' });
        }
        
        const report = reports[0];
        res.json({
            success: true,
            report: {
                id: report.id,
                student_id: report.student_id,
                student_name: report.student_name,
                report_text: report.report_text,
                metadata: JSON.parse(report.metadata || '{}'),
                created_at: report.created_at
            }
        });
    } catch (err) {
        console.error('Get report error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch report' });
    }
});

// Helper function to generate evaluation report
function generateEvaluationReport(student, results, recommendations, gwa, standing) {
    const passed = results.filter(r => r.status === 'Passed');
    const failed = results.filter(r => r.status === 'Failed');
    
    let report = `ACADEMIC EVALUATION REPORT\n`;
    report += `Student: ${student.name} (${student.id})\n`;
    report += `Program: ${student.program || 'BSIT'} | Year: ${student.year_level || 'N/A'}\n`;
    report += `Status: ${standing} | GWA: ${gwa.toFixed(2)}\n\n`;
    
    report += `EVALUATED SUBJECTS:\n`;
    results.forEach(r => {
        report += `- ${r.code}: ${r.title} = ${r.grade} (${r.status})\n`;
    });
    
    report += `\nSUMMARY:\n`;
    report += `- Passed: ${passed.length} subjects\n`;
    report += `- Failed: ${failed.length} subjects\n`;
    report += `- Overall Standing: ${standing}\n`;
    
    if (recommendations.length > 0) {
        report += `\nRECOMMENDATIONS:\n`;
        recommendations.forEach(rec => {
            report += `- ${rec.code}: ${rec.title} (${rec.reason})\n`;
        });
    }
    
    return report;
}

// --- STATIC FILES & SPA ROUTING ---
// Determine frontend path - works both locally and on Render
let frontendPath;

// Try multiple possible paths
const possiblePaths = [
    process.env.FRONTEND_PATH,  // Explicit env var
    path.join(__dirname, '..', '..', 'EvalTrack', 'Frontend'),  // Local dev structure
    path.join(__dirname, '..', '..', '..', 'EvalTrack', 'Frontend'),  // One level deeper
    path.join(process.cwd(), 'EvalTrack', 'Frontend'),  // From cwd
    path.join(process.cwd(), '..', 'EvalTrack', 'Frontend'),  // From cwd parent
    '/opt/render/project/src/EvalTrack/Frontend',  // Common Render path
];

// Find first path that exists
for (const testPath of possiblePaths) {
    if (testPath && fs.existsSync(testPath)) {
        frontendPath = testPath;
        console.log('✓ Found frontend at:', frontendPath);
        break;
    }
}

// Fallback to default if none found
if (!frontendPath) {
    frontendPath = process.env.FRONTEND_PATH || path.join(__dirname, '..', '..', 'EvalTrack', 'Frontend');
    console.log('⚠ Using default frontend path (may not exist):', frontendPath);
}

// Log directory contents for debugging
console.log('Checking frontend directory...');
try {
    if (fs.existsSync(frontendPath)) {
        const contents = fs.readdirSync(frontendPath);
        console.log('Frontend directory contents:', contents);
    } else {
        console.log('Frontend directory does NOT exist at:', frontendPath);
        // Try to find EvalTrack directory anywhere
        const cwd = process.cwd();
        console.log('Current working directory:', cwd);
        console.log('__dirname:', __dirname);
    }
} catch (err) {
    console.error('Error reading frontend directory:', err.message);
}

// Serve static frontend files (must be after all API routes)
app.use(express.static(frontendPath));

// Handle subdirectory routes - serve actual HTML files if they exist
app.get('/LoginPage/:file', (req, res) => {
    const filePath = path.join(frontendPath, 'LoginPage', req.params.file);
    console.log('LoginPage request for:', req.params.file, '-> checking:', filePath);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Not found: ' + filePath);
    }
});

app.get('/AdminPage/:file', (req, res) => {
    const filePath = path.join(frontendPath, 'AdminPage', req.params.file);
    console.log('AdminPage request for:', req.params.file, '-> checking:', filePath);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Not found: ' + filePath);
    }
});

app.get('/ProgramHeadPage/:file', (req, res) => {
    const filePath = path.join(frontendPath, 'ProgramHeadPage', req.params.file);
    console.log('ProgramHeadPage request for:', req.params.file, '-> checking:', filePath);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Not found: ' + filePath);
    }
});

app.get('/StudentPage/:file', (req, res) => {
    const filePath = path.join(frontendPath, 'StudentPage', req.params.file);
    console.log('StudentPage request for:', req.params.file, '-> checking:', filePath);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Not found: ' + filePath);
    }
});

app.get('/RegisterPage/:file', (req, res) => {
    const filePath = path.join(frontendPath, 'RegisterPage', req.params.file);
    console.log('RegisterPage request for:', req.params.file, '-> checking:', filePath);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Not found: ' + filePath);
    }
});

// Handle root SPA routing - serve index.html for root and unknown paths
// Use a middleware that checks if the request wasn't handled by previous routes
app.use((req, res, next) => {
    // Don't interfere with API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ success: false, message: 'API endpoint not found' });
    }
    // Serve the frontend's index.html for all other routes (SPA behavior)
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Firebase Admin SDK: ${firebaseInitialized ? 'Initialized' : 'Not initialized (service account key missing)'}`);
});
