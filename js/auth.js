import { 
    auth, 
    db,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    setDoc,
    doc,
    serverTimestamp,
    getDoc
} from './firebase.js';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authMessage = document.getElementById('authMessage');

// Show message
function showMessage(message, type = 'error') {
    if (!authMessage) return;
    
    authMessage.textContent = message;
    authMessage.className = `auth-message ${type}`;
    
    if (type === 'success') {
        setTimeout(() => {
            authMessage.className = 'auth-message';
        }, 3000);
    }
}

// Error messages mapping
const errorMessages = {
    'auth/email-already-in-use': 'Email already registered!',
    'auth/invalid-email': 'Invalid email address!',
    'auth/operation-not-allowed': 'Email/password authentication is not enabled!',
    'auth/weak-password': 'Password should be at least 6 characters!',
    'auth/user-not-found': 'User not found!',
    'auth/wrong-password': 'Wrong password!',
    'auth/network-request-failed': 'Network error! Check your connection.',
    'default': 'An error occurred. Please try again.'
};

// Get user-friendly error message
function getErrorMessage(error) {
    const code = error.code || '';
    return errorMessages[code] || errorMessages['default'];
}

// Login function
async function handleLogin(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update last login time
        await setDoc(doc(db, "users", user.uid), {
            lastLogin: serverTimestamp()
        }, { merge: true });
        
        showMessage('Login successful! Redirecting...', 'success');
        
        // Redirect based on role
        setTimeout(async () => {
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists() && userDoc.data().role === 'admin') {
                    window.location.href = '/admin.html';
                } else {
                    window.location.href = '/home-game.html';
                }
            } catch (error) {
                // Default redirect if role check fails
                window.location.href = '/home-game.html';
            }
        }, 1500);
        
    } catch (error) {
        console.error("Login error:", error);
        showMessage(getErrorMessage(error));
    }
}

// Register function
async function handleRegister(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Check if this is the first user (make admin)
        const usersSnapshot = await getDocs(collection(db, "users"));
        const isFirstUser = usersSnapshot.empty;
        
        // Create user document in Firestore
        await setDoc(doc(db, "users", user.uid), {
            email: email,
            role: isFirstUser ? 'admin' : 'user',
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
        });
        
        showMessage('Registration successful! Redirecting...', 'success');
        
        setTimeout(() => {
            window.location.href = isFirstUser ? '/admin.html' : '/home-game.html';
        }, 1500);
        
    } catch (error) {
        console.error("Registration error:", error);
        showMessage(getErrorMessage(error));
    }
}

// Event Listeners
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            showMessage('Please fill in all fields!');
            return;
        }
        
        await handleLogin(email, password);
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validation
        if (!email || !password || !confirmPassword) {
            showMessage('Please fill in all fields!');
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage('Passwords do not match!');
            return;
        }
        
        if (password.length < 6) {
            showMessage('Password must be at least 6 characters long!');
            return;
        }
        
        if (!validateEmail(email)) {
            showMessage('Please enter a valid email address!');
            return;
        }
        
        await handleRegister(email, password);
    });
}

// Email validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Auto-login for demo (optional)
window.addEventListener('DOMContentLoaded', () => {
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    
    if (loginEmail && loginPassword) {
        // Auto-fill demo credentials (optional)
        // loginEmail.value = 'admin@homegame.com';
        // loginPassword.value = 'password123';
    }
});

// Export for other scripts
export { showMessage, getErrorMessage, handleLogin, handleRegister };