import { auth, db } from './firebase.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { 
    doc, 
    setDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authMessage = document.getElementById('authMessage');

// Show message
function showMessage(message, type = 'error') {
    authMessage.textContent = message;
    authMessage.className = `auth-message ${type}`;
    
    if (type === 'success') {
        setTimeout(() => {
            authMessage.className = 'auth-message';
        }, 3000);
    }
}

// Login
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            showMessage('Login successful! Redirecting...', 'success');
            
            // Redirect based on role
            setTimeout(async () => {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
                
                if (userDoc.exists() && userDoc.data().role === 'admin') {
                    window.location.href = '/admin.html';
                } else {
                    window.location.href = '/home-game.html';
                }
            }, 1500);
            
        } catch (error) {
            console.error("Login error:", error);
            showMessage(error.message);
        }
    });
}

// Register
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            showMessage('Passwords do not match!');
            return;
        }
        
        if (password.length < 6) {
            showMessage('Password must be at least 6 characters long!');
            return;
        }
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Create user document in Firestore
            await setDoc(doc(db, "users", user.uid), {
                email: email,
                role: email === 'admin@homegame.com' ? 'admin' : 'user',
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp()
            });
            
            showMessage('Registration successful! Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = '/home-game.html';
            }, 1500);
            
        } catch (error) {
            console.error("Registration error:", error);
            showMessage(error.message);
        }
    });
}

// Auto-login for demo
window.addEventListener('DOMContentLoaded', () => {
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    
    if (loginEmail && loginPassword) {
        // Auto-fill demo credentials
        loginEmail.value = 'admin@homegame.com';
        loginPassword.value = 'password123';
    }
});