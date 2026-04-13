/**
 * EvalTrack Login JavaScript
 * Handles authentication, role switching, and UI interactions
 */

// ============================================
// FIREBASE CONFIGURATION
// ============================================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAfMBoYqOXmobanGUOBRE5u5tnrrbGuq_0",
  authDomain: "evaltrack-system-f04d3.firebaseapp.com",
  projectId: "evaltrack-system-f04d3",
  storageBucket: "evaltrack-system-f04d3.firebasestorage.app",
  messagingSenderId: "558838852861",
  appId: "1:558838852861:web:1f4e8f789adbb90b792294"
};

// Initialize Firebase
firebase.initializeApp(FIREBASE_CONFIG);
console.log('Firebase initialized successfully');

// ============================================
// ROLE SWITCHING
// ============================================
function switchRole(role) {
  document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.login-section').forEach(sec => sec.classList.remove('active'));

  event.target.classList.add('active');
  document.getElementById(role + '-section').classList.add('active');
}

// Role button event listeners
document.querySelectorAll('.role-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const role = this.getAttribute('data-role');

    document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.login-section').forEach(s => s.classList.remove('active'));

    this.classList.add('active');
    document.getElementById(role + '-section').classList.add('active');
  });
});

// ============================================
// PASSWORD TOGGLE
// ============================================
function togglePassword(inputId, iconId) {
  const passwordInput = document.getElementById(inputId);
  const toggleIcon = document.getElementById(iconId);

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleIcon.className = 'fa fa-eye-slash';
  } else {
    passwordInput.type = 'password';
    toggleIcon.className = 'fa fa-eye';
  }
}

// Password toggle event listeners
document.querySelectorAll('.password-toggle').forEach(btn => {
  btn.addEventListener('click', function() {
    const targetId = this.getAttribute('data-target');
    const iconId = this.getAttribute('data-icon');
    togglePassword(targetId, iconId);
  });
});

// ============================================
// CAPS LOCK DETECTION
// ============================================
const passwordInput = document.getElementById('faculty-password');
if (passwordInput) {
  passwordInput.addEventListener('keyup', function(e) {
    const warning = document.getElementById('faculty-caps-warning');
    if (e.getModifierState('CapsLock')) {
      warning.classList.add('show');
    } else {
      warning.classList.remove('show');
    }
  });

  passwordInput.addEventListener('blur', function() {
    document.getElementById('faculty-caps-warning').classList.remove('show');
  });
}

// ============================================
// FACULTY LOGIN HANDLER
// ============================================
document.getElementById('facultyLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('faculty-email').value;
  const password = document.getElementById('faculty-password').value;
  const submitBtn = e.target.querySelector('.login-btn');
  const originalText = submitBtn.innerHTML;

  hideError('faculty');
  submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Logging in...';
  submitBtn.disabled = true;

  try {
    const response = await fetch('https://evaltrack-system.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      // Store in ALL storage variants so all pages can find it
      const userJSON = JSON.stringify(data.user);
      const token = data.token || '';
      
      // Standardize on currentUser and authToken
      localStorage.setItem('currentUser', userJSON);
      localStorage.setItem('user', userJSON);
      sessionStorage.setItem('currentUser', userJSON);
      sessionStorage.setItem('user', userJSON);
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('token', token);
      sessionStorage.setItem('authToken', token);
      sessionStorage.setItem('token', token);
      
      // DEBUG: Verify storage worked
      console.log('DEBUG Login: Stored user and token in all storage locations');

      showToast('Login successful! Redirecting...', 'success');

      setTimeout(() => {
        const role = (data.user.role || '').toLowerCase().replace(/[\s\-_]/g, '');
        if (role === 'admin' || role === 'dean') {
          window.location.href = '../AdminPage/admin.html';
        } else if (role === 'programhead' || role === 'instructor' || role === 'faculty') {
          window.location.href = '../ProgramHeadPage/ProgramHead.html';
        } else if (role === 'student') {
          window.location.href = '../StudentPage/student.html';
        } else {
          window.location.href = '../LoginPage/login.html';
        }
      }, 1000);
    } else {
      showError('faculty', data.message || 'Invalid credentials');
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('faculty', 'Connection error. Please try again.');
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
});

// ============================================
// GOOGLE SIGN IN FOR STUDENTS
// ============================================
document.getElementById('google-signin-btn').addEventListener('click', signInWithGoogle);

async function signInWithGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');

    console.log('[Google Sign In] Opening popup...');
    const result = await firebase.auth().signInWithPopup(provider);
    const user = result.user;

    if (!user || !user.email) {
      throw new Error('Google account did not return an email address.');
    }

    console.log('[Google Sign In] Success, email:', user.email);

    const response = await fetch('https://evaltrack-system.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, isGoogleLogin: true })
    });

    const data = await response.json();

    if (data.success) {
      // Store in ALL storage variants so all pages can find it
      const userJSON = JSON.stringify(data.user);
      const token = data.token || '';
      
      // Standardize on currentUser and authToken
      localStorage.setItem('currentUser', userJSON);
      localStorage.setItem('user', userJSON);
      sessionStorage.setItem('currentUser', userJSON);
      sessionStorage.setItem('user', userJSON);
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('token', token);
      sessionStorage.setItem('authToken', token);
      sessionStorage.setItem('token', token);

      showToast('Login successful! Redirecting...', 'success');
      setTimeout(() => {
        const role = (data.user.role || '').toLowerCase().replace(/[\s\-_]/g, '');
        if (role === 'admin' || role === 'dean') {
          window.location.href = '../AdminPage/admin.html';
        } else if (role === 'programhead' || role === 'instructor' || role === 'faculty') {
          window.location.href = '../ProgramHeadPage/ProgramHead.html';
        } else if (role === 'student') {
          window.location.href = '../StudentPage/student.html';
        } else {
          window.location.href = '../LoginPage/login.html';
        }
      }, 1000);
      return;
    }

    // User not found - redirect to registration
    console.log('[Google Sign In] User not found in database, redirecting to registration');
    sessionStorage.setItem('tempGoogleUser', JSON.stringify({
      email: user.email,
      name: user.displayName || '',
      uid: user.uid,
      photoURL: user.photoURL || ''
    }));
    showToast('Google sign-in successful. Complete your student profile now.', 'info');
    window.location.href = '../RegisterPage/register.html';
  } catch (error) {
    console.error('[Google Sign In] Error:', error);
    
    // Handle specific Firebase errors
    let errorMessage = 'Google Sign In failed. Please try again.';
    
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Sign-in popup was closed. Please try again and keep the popup open until you complete the sign-in.';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'Sign-in popup was blocked by browser. Please allow popups for this site (check the address bar for blocked popup icon). Then refresh and try again.';
    } else if (error.code === 'auth/cancelled-popup-request') {
      errorMessage = 'Multiple sign-in requests detected. Please wait a moment and try again.';
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      errorMessage = 'An account with this email already exists with a different sign-in method.';
    } else if (error.code === 'auth/unauthorized-domain') {
      errorMessage = 'This domain is not authorized for Google Sign In. Please contact support.';
    } else if (error.message) {
      errorMessage = 'Google Sign In failed: ' + error.message;
    }
    
    showError('student', errorMessage);
  }
}

// ============================================
// FORGOT PASSWORD
// ============================================
document.getElementById('forgot-password-link').addEventListener('click', function(e) {
  e.preventDefault();
  const email = document.getElementById('faculty-email').value;
  if (!email) {
    showToast('Please enter your email or ID first', 'error');
    document.getElementById('faculty-email').focus();
    return;
  }
  showToast('Password reset link would be sent to: ' + email, 'info');
});

// ============================================
// ERROR HANDLING
// ============================================
function showError(section, message) {
  document.getElementById(section + '-error-text').textContent = message;
  document.getElementById(section + '-error').style.display = 'flex';
}

function hideError(section) {
  document.getElementById(section + '-error').style.display = 'none';
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast-item ${type}`;
  toast.innerHTML = `<i class="fa fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================
// PARTICLE BACKGROUND ANIMATION
// ============================================
const canvas = document.getElementById('particles');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticles() {
    particles = [];
    const particleCount = Math.min(50, Math.floor((canvas.width * canvas.height) / 15000));
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2
      });
    }
  }

  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
      ctx.fill();

      p.x += p.speedX;
      p.y += p.speedY;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
    });

    requestAnimationFrame(drawParticles);
  }

  resizeCanvas();
  createParticles();
  drawParticles();

  window.addEventListener('resize', () => {
    resizeCanvas();
    createParticles();
  });
}

// ============================================
// REMEMBER ME FUNCTIONALITY
// ============================================
const rememberCheckbox = document.getElementById('faculty-remember');
if (rememberCheckbox) {
  const savedEmail = localStorage.getItem('rememberedEmail');
  if (savedEmail) {
    document.getElementById('faculty-email').value = savedEmail;
    rememberCheckbox.checked = true;
  }

  document.getElementById('facultyLoginForm').addEventListener('submit', function() {
    if (rememberCheckbox.checked) {
      localStorage.setItem('rememberedEmail', document.getElementById('faculty-email').value);
    } else {
      localStorage.removeItem('rememberedEmail');
    }
  });
}

// ============================================
// GLASS CARD INTERACTIVE EFFECTS
// ============================================
const card = document.getElementById('glassCard');
const shine = document.getElementById('shine');

if (card && shine) {
  // UI Professional Hover Logic (3D Tilt & Light Reflection)
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Move the reflection spotlight
    card.style.setProperty('--x', `${(x / rect.width) * 100}%`);
    card.style.setProperty('--y', `${(y / rect.height) * 100}%`);

    // Calculate Tilt Angles
    const rotateX = ((y / rect.height) - 0.5) * -10; // Max 10 deg
    const rotateY = ((x / rect.width) - 0.5) * 10;
    
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  // Reset Tilt when mouse leaves
  card.addEventListener('mouseleave', () => {
    card.style.transform = `rotateX(0deg) rotateY(0deg)`;
  });

  // The "Break" Interactivity
  card.addEventListener('mousedown', (e) => {
    // Trigger Shake
    card.classList.add('impact');
    setTimeout(() => card.classList.remove('impact'), 200);

    // Create Shatter
    const crack = document.createElement('div');
    crack.className = 'crack';
    const rect = card.getBoundingClientRect();
    crack.style.left = (e.clientX - rect.left - 175) + 'px';
    crack.style.top = (e.clientY - rect.top - 175) + 'px';
    crack.style.transform = `rotate(${Math.random() * 360}deg)`;
    card.appendChild(crack);
  });
}
