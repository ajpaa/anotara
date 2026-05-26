// ============================================================
// auth.js — handles login and signup on the index.html page
// ============================================================

// Grab all the elements we need from the HTML
const authForm         = document.getElementById('authForm');
const authTitle        = document.getElementById('auth-title');
const authSubtitle     = document.getElementById('auth-subtitle');
const authMessage      = document.getElementById('auth-message');
const submitBtn        = document.getElementById('submit-btn');
const confirmPassGroup = document.getElementById('confirm-pass-group');
const roleSection      = document.getElementById('role-section');
const togglePassIcon   = document.getElementById('togglePass');
const toggleText       = document.getElementById('toggle-text');

// false = Signup mode (what you see when the page first loads)
// true  = Login mode
let isLogin = true;

// ============================================================
// SWITCH BETWEEN LOGIN AND SIGNUP
// ============================================================
function toggleAuth() {
    isLogin = !isLogin; // flip the mode

    if (isLogin) {
        authTitle.innerText            = 'Welcome back!';
        authSubtitle.innerText         = 'Log in to continue your journey.';
        submitBtn.innerText            = 'Log In';
        toggleText.innerHTML           = "Don't have an account? <span onclick='toggleAuth()'>Sign Up</span>";
        confirmPassGroup.style.display = 'none';  // hide confirm password
        roleSection.style.display      = 'none';  // hide role picker
    } else {
        authTitle.innerText            = 'Book your perfect vacation!';
        authSubtitle.innerText         = 'Create an account to get started.';
        submitBtn.innerText            = 'Create Account';
        toggleText.innerHTML           = "Already have an account? <span onclick='toggleAuth()'>Log In</span>";
        confirmPassGroup.style.display = 'block'; // show confirm password
        roleSection.style.display      = 'block'; // show role picker
    }

    clearMessages();
    authForm.reset();
}

// ============================================================
// SHOW / CLEAR MESSAGES
// ============================================================

// Shows a colored banner at the top of the form
function showMessage(text, type = 'error') {
    authMessage.innerText     = text;
    authMessage.style.display = 'block';
    authMessage.className     = 'auth-message ' + type; // 'error' = red, 'success' = green
}

// Clears the banner and all small field errors
function clearMessages() {
    authMessage.style.display = 'none';
    authMessage.innerText     = '';
    document.querySelectorAll('.field-error').forEach(el => el.innerText = '');
}

// Shows a small red message under a specific field
// fieldId should match the id="err-___" in the HTML
function showFieldError(fieldId, message) {
    const el = document.getElementById('err-' + fieldId);
    if (el) el.innerText = message;
}

// ============================================================
// PASSWORD SHOW/HIDE (the eye icon)
// ============================================================
togglePassIcon.addEventListener('click', () => {
    const passInput = document.getElementById('password');
    if (passInput.type === 'password') {
        passInput.type = 'text';
        togglePassIcon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passInput.type = 'password';
        togglePassIcon.classList.replace('fa-eye-slash', 'fa-eye');
    }
});

document.getElementById('toggleConfirm').addEventListener('click', () => {
    const confirmInput = document.getElementById('confirmPassword');
    const toggleConfirmIcon = document.getElementById('toggleConfirm');
    if (confirmInput.type === 'password') {
        confirmInput.type = 'text';
        toggleConfirmIcon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        confirmInput.type = 'password';
        toggleConfirmIcon.classList.replace('fa-eye-slash', 'fa-eye');
    }
});

// ============================================================
// VALIDATION — checks fields before sending to server
// Returns true if everything is fine, false if something is wrong
// ============================================================
function validateForm(data) {
    let valid = true;

    if (!data.username || data.username.trim() === '') {
        showFieldError('username', 'Username is required.');
        valid = false;
    }

    if (data.username.includes(' ')) {
        showFieldError('username', 'Username cannot contain spaces.');
        valid = false;
    }

    if (!data.password || data.password.trim() === '') {
        showFieldError('password', 'Password is required.');
        valid = false;
    }

    // These checks only apply during signup, not login
    if (!isLogin) {
        if (data.password !== data.confirmPassword) {
            showFieldError('confirm', 'Passwords do not match.');
            valid = false;
        }
        if (!data.role || data.role === '') {
            showFieldError('role', 'Please select Guest or Host.');
            valid = false;
        }
    }

    return valid;
}

// ============================================================
// FORM SUBMIT — sends the data to the backend
// ============================================================
authForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // stop page from refreshing on submit

    clearMessages();

    // Collect values from the form fields
    const data = {
        username:        document.getElementById('username').value.trim(),
        password:        document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword')?.value || '',
        role:            document.getElementById('role')?.value || ''
    };

    // Admin override — keeps your hardcoded admin logic
    const ADMIN_NAMES = ['princess', 'callista', 'erin', 'jeremie'];
    if (data.username && ADMIN_NAMES.includes(data.username.toLowerCase())) {
        data.role = 'admin';
    }

    // Stop here if validation failed
    if (!validateForm(data)) return;

    // Disable button while waiting for server response
    submitBtn.disabled  = true;
    submitBtn.innerText = isLogin ? 'Logging in...' : 'Creating account...';

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            showMessage(
                isLogin ? 'Login successful! Redirecting...' : 'Account created! Redirecting...',
                'success'
            );

            // Save user info so other pages know who is logged in
            localStorage.setItem('user', JSON.stringify(result));

            // Short pause so user sees the success message, then redirect
            setTimeout(() => {
                if (result.role === 'admin') {
                    window.location.href = '/admin.html';
                } else if (result.role === 'host') {
                    window.location.href = '/host.html';
                } else {
                    window.location.href = '/guest.html';
                }
            }, 1000);

        } else {
            if (response.status === 401 || response.status === 404) {
                showMessage('No account found. Please sign up first or check your password.');
            } else if (response.status === 400) {
                showMessage(result.message || 'That username is already taken. Try logging in instead.');
            } else {
                showMessage(result.message || 'Something went wrong. Please try again.');
            }
        }

    } catch (err) {
        showMessage('Cannot reach the server. Make sure it is running.');
    } finally {
        // Always re-enable the button when done
        submitBtn.disabled  = false;
        submitBtn.innerText = isLogin ? 'Log In' : 'Create Account';
    }
});

// This runs once when the page loads
if (isLogin) {
    document.getElementById('confirm-pass-group').style.display = 'none';
    document.getElementById('role-section').style.display = 'none';
    document.getElementById('auth-title').innerText = 'Welcome back!';
    document.getElementById('auth-subtitle').innerText = 'Log in to continue your journey.';
    document.getElementById('submit-btn').innerText = 'Log In';
    document.getElementById('toggle-text').innerHTML = "Don't have an account? <span onclick='toggleAuth()'>Sign Up</span>";
}