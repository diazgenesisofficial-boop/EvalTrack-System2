/**
 * Student Authentication JavaScript Enhancements
 * Add this to login.js or include as a separate script after the existing login code
 */

// ─────────────────────────────────────────────────────────
// STUDENT AUTH TOGGLE
// ─────────────────────────────────────────────────────────

function switchStudentAuth(method) {
  // Update toggle buttons
  document.querySelectorAll('.auth-toggle-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Show/hide sections
  const googleSection = document.getElementById('student-google-section');
  const emailSection = document.getElementById('student-email-section');
  
  if (method === 'google') {
    googleSection.style.display = 'block';
    emailSection.style.display = 'none';
  } else {
    googleSection.style.display = 'none';
    emailSection.style.display = 'block';
  }
}

// ─────────────────────────────────────────────────────────
// STUDENT EMAIL/PASSWORD LOGIN
// ─────────────────────────────────────────────────────────

document.getElementById('studentLoginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('student-auth-email').value.trim();
  const password = document.getElementById('student-auth-password').value;
  const submitBtn = e.target.querySelector('.login-btn');
  const originalText = submitBtn.innerHTML;
  
  hideError('student');
  submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Signing in...';
  submitBtn.disabled = true;
  
  try {
    const response = await fetch('https://evaltrack-system.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email, 
        password,
        role: 'student' // Explicitly indicate student login
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store auth data
      sessionStorage.setItem('currentUser', JSON.stringify(data.user));
      sessionStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('authToken', data.token);
      
      showToast('Login successful! Welcome back.', 'success');
      
      setTimeout(() => {
        window.location.href = '../StudentPage/student.html';
      }, 1000);
    } else {
      if (data.requiresGoogleLink) {
        // Show link account modal
        showLinkAccountModal(email, data.googleUid);
      } else {
        showError('student', data.message || 'Invalid email or password');
      }
    }
  } catch (error) {
    console.error('Student login error:', error);
    showError('student', 'Connection error. Please try again.');
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
});

// ─────────────────────────────────────────────────────────
// ENHANCED GOOGLE SIGN-IN WITH ACCOUNT LINKING
// ─────────────────────────────────────────────────────────

async function signInWithGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');

    const result = await firebase.auth().signInWithPopup(provider);
    const user = result.user;
    
    if (!user || !user.email) {
      throw new Error('Google account did not return an email address.');
    }

    // First, try to login with Google
    const loginResponse = await fetch('https://evaltrack-system.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: user.email, 
        isGoogleLogin: true,
        googleUid: user.uid 
      })
    });

    const loginData = await loginResponse.json();
    
    if (loginData.success) {
      // Existing user - successful login
      sessionStorage.setItem('currentUser', JSON.stringify(loginData.user));
      sessionStorage.setItem('token', loginData.token);
      localStorage.setItem('user', JSON.stringify(loginData.user));
      localStorage.setItem('authToken', loginData.token);
      
      showToast('Login successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = '../StudentPage/student.html';
      }, 800);
      return;
    }
    
    // Check if account exists but needs linking
    if (loginData.accountExists) {
      // Show link account modal
      showLinkAccountModal(user.email, user.uid, user.displayName, user.photoURL);
      return;
    }
    
    // New user - redirect to registration with pre-filled data
    sessionStorage.setItem('tempGoogleUser', JSON.stringify({
      email: user.email,
      name: user.displayName || '',
      uid: user.uid,
      photoURL: user.photoURL || ''
    }));
    
    showToast('Please complete your student registration', 'info');
    window.location.href = '../RegisterPage/register.html';
    
  } catch (error) {
    console.error('Google Sign In error:', error);
    showError('student', 'Google Sign In failed: ' + (error.message || 'Please try again.'));
  }
}

// ─────────────────────────────────────────────────────────
// LINK ACCOUNT MODAL FUNCTIONS
// ─────────────────────────────────────────────────────────

let pendingLinkData = null;

function showLinkAccountModal(email, googleUid, name = '', photoURL = '') {
  pendingLinkData = { email, googleUid, name, photoURL };
  document.getElementById('link-modal-email').textContent = email;
  document.getElementById('linkAccountModal').classList.add('active');
}

function closeLinkModal() {
  document.getElementById('linkAccountModal').classList.remove('active');
  pendingLinkData = null;
  
  // Reset form
  document.getElementById('link-account-password').value = '';
  document.getElementById('link-account-form').style.display = 'block';
  document.getElementById('link-success').style.display = 'none';
}

async function confirmLinkAccount() {
  if (!pendingLinkData) return;
  
  const password = document.getElementById('link-account-password').value;
  if (!password) {
    showToast('Please enter your password', 'warning');
    return;
  }
  
  try {
    const response = await fetch('https://evaltrack-system.onrender.com/api/auth/link-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: pendingLinkData.email,
        googleUid: pendingLinkData.googleUid,
        password: password
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Show success state
      document.getElementById('link-account-form').style.display = 'none';
      document.getElementById('link-success').style.display = 'block';
      
      // Auto login after short delay
      setTimeout(() => {
        sessionStorage.setItem('currentUser', JSON.stringify(data.user));
        sessionStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('authToken', data.token);
        
        window.location.href = '../StudentPage/student.html';
      }, 2000);
    } else {
      showToast(data.message || 'Failed to link accounts', 'error');
    }
  } catch (error) {
    console.error('Link account error:', error);
    showToast('Connection error. Please try again.', 'error');
  }
}

async function sendVerificationEmail() {
  if (!pendingLinkData) return;
  
  try {
    const response = await fetch('https://evaltrack-system.onrender.com/api/auth/send-link-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: pendingLinkData.email,
        googleUid: pendingLinkData.googleUid
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('link-account-form').style.display = 'none';
      document.getElementById('link-success').style.display = 'block';
      document.querySelector('#link-success h4').textContent = 'Verification Email Sent!';
      document.querySelector('#link-success p').textContent = 
        'Please check your email and click the verification link to complete the account linking.';
    } else {
      showToast(data.message || 'Failed to send verification email', 'error');
    }
  } catch (error) {
    console.error('Send verification error:', error);
    showToast('Connection error. Please try again.', 'error');
  }
}

// ─────────────────────────────────────────────────────────
// FORGOT PASSWORD FUNCTIONS
// ─────────────────────────────────────────────────────────

function showForgotPasswordModal() {
  document.getElementById('forgotPasswordModal').classList.add('active');
}

function closeForgotModal() {
  document.getElementById('forgotPasswordModal').classList.remove('active');
  
  // Reset form
  document.getElementById('forgotPasswordForm').reset();
  document.getElementById('forgotPasswordForm').style.display = 'block';
  document.getElementById('forgot-success').style.display = 'none';
}

document.getElementById('forgotPasswordForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('forgot-email').value.trim();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  
  submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Sending...';
  submitBtn.disabled = true;
  
  try {
    const response = await fetch('https://evaltrack-system.onrender.com/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role: 'student' })
    });
    
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('forgotPasswordForm').style.display = 'none';
      document.getElementById('forgot-success').style.display = 'block';
    } else {
      showToast(data.message || 'Failed to send reset email', 'error');
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    showToast('Connection error. Please try again.', 'error');
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
});

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
});
