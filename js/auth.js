import { 
    auth, 
    db,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    setDoc,
    doc,
    serverTimestamp,
    getDoc,
    collection,
    getDocs
} from './firebase.js';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authMessage = document.getElementById('authMessage');

// Enable debug mode
const DEBUG = true;

// Show message
function showMessage(message, type = 'error') {
    if (!authMessage) return;
    
    if (DEBUG) console.log(`[${type.toUpperCase()}] ${message}`);
    
    authMessage.textContent = message;
    authMessage.className = `auth-message ${type}`;
    
    if (type === 'success') {
        setTimeout(() => {
            authMessage.className = 'auth-message';
        }, 3000);
    }
}

// Debug function
function logDebug(...args) {
    if (DEBUG) {
        console.log('[DEBUG]', ...args);
    }
}

// Test Firebase Connection
async function testFirebaseConnection() {
    try {
        logDebug('Testing Firebase connection...');
        
        // Test 1: Check if Firebase is initialized
        if (!auth || !db) {
            throw new Error('Firebase not initialized');
        }
        
        // Test 2: Try to access auth state
        logDebug('Firebase initialized:', !!auth, 'DB initialized:', !!db);
        
        return true;
    } catch (error) {
        logDebug('Firebase connection test failed:', error);
        return false;
    }
}

// Login function
async function handleLogin(email, password) {
    logDebug('Login attempt:', { email, passwordLength: password?.length });
    
    try {
        // Test connection first
        const isConnected = await testFirebaseConnection();
        if (!isConnected) {
            throw new Error('Firebase connection failed');
        }
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        logDebug('Login successful:', user.email);
        
        // Update last login time
        await setDoc(doc(db, "users", user.uid), {
            lastLogin: serverTimestamp()
        }, { merge: true });
        
        showMessage('Login successful! Redirecting...', 'success');
        
        // Redirect based on role
        setTimeout(async () => {
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                const role = userDoc.exists() ? userDoc.data().role : 'user';
                logDebug('User role:', role);
                
                if (role === 'admin') {
                    window.location.href = '/admin.html';
                } else {
                    window.location.href = '/home-game.html';
                }
            } catch (error) {
                logDebug('Role check error, default redirect:', error);
                window.location.href = '/home-game.html';
            }
        }, 1500);
        
    } catch (error) {
        logDebug('Login error details:', {
            code: error.code,
            message: error.message,
            fullError: error
        });
        
        let errorMsg = 'An error occurred. Please try again.';
        
        if (error.code) {
            switch(error.code) {
                case 'auth/invalid-email':
                    errorMsg = 'Invalid email format!';
                    break;
                case 'auth/user-disabled':
                    errorMsg = 'This account has been disabled!';
                    break;
                case 'auth/user-not-found':
                    errorMsg = 'User not found!';
                    break;
                case 'auth/wrong-password':
                    errorMsg = 'Incorrect password!';
                    break;
                case 'auth/too-many-requests':
                    errorMsg = 'Too many attempts. Try again later!';
                    break;
                case 'auth/operation-not-allowed':
                    errorMsg = 'Email/password login is disabled! Please enable in Firebase Console.';
                    break;
                case 'auth/network-request-failed':
                    errorMsg = 'Network error! Check your internet connection.';
                    break;
            }
        }
        
        showMessage(errorMsg);
    }
}

// Register function
async function handleRegister(email, password) {
    logDebug('Register attempt:', { email, passwordLength: password?.length });
    
    try {
        // Test connection first
        const isConnected = await testFirebaseConnection();
        if (!isConnected) {
            throw new Error('Firebase connection failed');
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        logDebug('Registration successful:', user.email, 'UID:', user.uid);
        
        // Check if this is the first user (make admin)
        const usersSnapshot = await getDocs(collection(db, "users"));
        const isFirstUser = usersSnapshot.empty;
        
        logDebug('Is first user?', isFirstUser);
        
        // Create user document in Firestore
        await setDoc(doc(db, "users", user.uid), {
            email: email,
            role: isFirstUser ? 'admin' : 'user',
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            displayName: email.split('@')[0]
        });
        
        logDebug('User document created in Firestore');
        
        showMessage('Registration successful! Redirecting...', 'success');
        
        setTimeout(() => {
            if (isFirstUser) {
                logDebug('Redirecting to admin (first user)');
                window.location.href = '/admin.html';
            } else {
                logDebug('Redirecting to home');
                window.location.href = '/home-game.html';
            }
        }, 1500);
        
    } catch (error) {
        logDebug('Registration error details:', {
            code: error.code,
            message: error.message,
            fullError: error
        });
        
        let errorMsg = 'An error occurred. Please try again.';
        
        if (error.code) {
            switch(error.code) {
                case 'auth/email-already-in-use':
                    errorMsg = 'Email already registered!';
                    break;
                case 'auth/invalid-email':
                    errorMsg = 'Invalid email format!';
                    break;
                case 'auth/operation-not-allowed':
                    errorMsg = 'Registration is disabled! Please enable in Firebase Console.';
                    break;
                case 'auth/weak-password':
                    errorMsg = 'Password too weak! Use at least 6 characters.';
                    break;
                case 'auth/network-request-failed':
                    errorMsg = 'Network error! Check your internet connection.';
                    break;
            }
        }
        
        showMessage(errorMsg);
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

// Initialize debug info on load
window.addEventListener('DOMContentLoaded', async () => {
    logDebug('Page loaded');
    
    // Test Firebase connection
    const connected = await testFirebaseConnection();
    logDebug('Firebase connection test:', connected ? '✅ Connected' : '❌ Failed');
    
    // Check if user is already logged in
    const { onAuthStateChanged } = await import('./firebase.js');
    
    onAuthStateChanged(auth, (user) => {
        if (user) {
            logDebug('User already logged in:', user.email);
            // Auto-redirect if already logged in
            setTimeout(() => {
                window.location.href = '/home-game.html';
            }, 1000);
        } else {
            logDebug('No user logged in');
        }
    });
});

// Export for other scripts
export { showMessage, handleLogin, handleRegister, logDebug };