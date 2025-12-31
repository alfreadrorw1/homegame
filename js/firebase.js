import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBvr6owbrZS_9ltSIk_FJQ2XVva5fQjyr0",
    authDomain: "gabutan-alfread.firebaseapp.com",
    databaseURL: "https://gabutan-alfread-default-rtdb.firebaseio.com",
    projectId: "gabutan-alfread",
    storageBucket: "gabutan-alfread.firebasestorage.app",
    messagingSenderId: "626320232424",
    appId: "1:626320232424:web:7e292f036d8090a6b41e5d",
    measurementId: "G-P8FNLHHYX9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export modules
export { auth, db, onAuthStateChanged };

// Check authentication state
export function checkAuth() {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                resolve(user);
            } else {
                reject(new Error('No user logged in'));
            }
        });
    });
}

// Get user role
export async function getUserRole(userId) {
    try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            return userDoc.data().role || "user";
        }
        return "user";
    } catch (error) {
        console.error("Error getting user role:", error);
        return "user";
    }
}

// Redirect if not authenticated
export function requireAuth(requiredRole = null) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = '/index.html';
            return;
        }

        if (requiredRole) {
            const userRole = await getUserRole(user.uid);
            if (userRole !== requiredRole) {
                if (requiredRole === 'admin') {
                    window.location.href = '/home-game.html';
                }
                return;
            }
        }
    });
}