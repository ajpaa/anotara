const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('auth-title');
const roleSection = document.getElementById('role-section');
const toggleText = document.getElementById('toggle-text');
const submitBtn = document.getElementById('submit-btn');

let isLogin = false; // Initial state is Sign Up ("Start")

function toggleAuth() {
    isLogin = !isLogin;
    authTitle.innerText = isLogin ? "Welcome Back" : "Start your perfect trip";
    
    // Role selection only appears during Registration
    roleSection.style.display = isLogin ? "none" : "block";
    
    if (isLogin) {
        toggleText.innerHTML = 'Don\'t have an account? <span onclick="toggleAuth()">Sign Up</span>';
        submitBtn.innerText = "Log In";
    } else {
        toggleText.innerHTML = 'Already have an account? <span onclick="toggleAuth()">Log In</span>';
        submitBtn.innerText = "Start";
    }
}

authForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 

    const formData = new FormData(authForm);
    const data = Object.fromEntries(formData.entries());

    // 1. FIXED ADMIN LOGIC
    const ADMIN_NAMES = ['princess', 'callista', 'erin', 'jeremie']; 
    if (data.username && ADMIN_NAMES.includes(data.username.toLowerCase())) {
        data.role = 'admin';
    }

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            localStorage.setItem('user', JSON.stringify(result));
            
            // Redirect based on the assigned role
            if (result.role === 'admin') {
                window.location.href = '/admin.html';
            } else if (result.role === 'host') {
                window.location.href = '/host.html';
            } else {
                window.location.href = '/guest.html';
            }
        } else {
            // 2. "NO ACCOUNT -> NEED SIGN UP" MSG
            if (isLogin && response.status === 404) {
                alert("Account not found! You need to sign up first.");
                toggleAuth(); // Automatically switch the user to the Sign Up form
            } else {
                // Handles duplicates or wrong passwords from backend
                alert(result.message || "Action failed. Please check your details.");
            }
        }
    } catch (err) {
        alert("Server error. Make sure your backend is running.");
    }
});