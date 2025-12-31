class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check auth state
        auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            this.handleAuthStateChange(user);
        });

        // Initialize event listeners
        this.initEventListeners();
    }

    initEventListeners() {
        // Tab switching for auth forms
        document.querySelectorAll('.tab-btn')?.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchAuthTab(tab);
            });
        });

        // Toggle password visibility
        document.querySelectorAll('.toggle-password')?.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.togglePasswordVisibility(e.target);
            });
        });

        // Login form
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        // Register form
        document.getElementById('registerForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.register();
        });

        // Logout button
        document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
    }

    togglePasswordVisibility(button) {
        const targetId = button.dataset.target;
        const input = document.getElementById(targetId);
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    switchAuthTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.toggle('active', form.id === `${tab}Form`);
        });
    }

    async login() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            this.showLoading();
            
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Get user role from Firestore
            const userDoc = await db.collection('users').doc(user.uid).get();
            const userData = userDoc.data();
            
            if (!userData) {
                // Create user document if it doesn't exist
                await this.createUserDocument(user, 'user');
            }
            
            this.showToast('Login berhasil!', 'success');
            
            // Redirect based on role
            setTimeout(() => {
                window.location.href = 'home-game.html';
            }, 1000);
            
        } catch (error) {
            this.handleAuthError(error);
        } finally {
            this.hideLoading();
        }
    }

    async register() {
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            this.showToast('Password tidak cocok!', 'error');
            return;
        }

        if (password.length < 6) {
            this.showToast('Password minimal 6 karakter!', 'error');
            return;
        }

        try {
            this.showLoading();
            
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Create user document with role 'user' by default
            await this.createUserDocument(user, 'user');
            
            this.showToast('Registrasi berhasil!', 'success');
            
            // Switch to login tab
            this.switchAuthTab('login');
            
            // Clear form
            document.getElementById('registerForm').reset();
            
        } catch (error) {
            this.handleAuthError(error);
        } finally {
            this.hideLoading();
        }
    }

    async createUserDocument(user, role = 'user') {
        try {
            await db.collection('users').doc(user.uid).set({
                email: user.email,
                role: role,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error creating user document:', error);
        }
    }

    async logout() {
        try {
            await auth.signOut();
            this.showToast('Logout berhasil!', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } catch (error) {
            this.showToast('Error saat logout', 'error');
        }
    }

    handleAuthStateChange(user) {
        if (!user) {
            // Not logged in
            const protectedPages = ['home-game.html', 'dashboard.html', 'tools.html', 'admin.html'];
            const currentPage = window.location.pathname.split('/').pop();
            
            if (protectedPages.includes(currentPage)) {
                window.location.href = 'index.html';
            }
        } else {
            // User is logged in
            const currentPage = window.location.pathname.split('/').pop();
            
            if (currentPage === 'index.html') {
                // Redirect from login page to home
                window.location.href = 'home-game.html';
            } else {
                // Check user role and show/hide admin elements
                this.checkUserRole(user);
            }
        }
    }

    async checkUserRole(user) {
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            const userData = userDoc.data();
            
            if (userData && userData.role === 'admin') {
                // Show admin-only elements
                document.querySelectorAll('.admin-only').forEach(el => {
                    el.classList.add('visible');
                });
                
                // Check if user is trying to access admin page without permission
                const currentPage = window.location.pathname.split('/').pop();
                if (currentPage === 'admin.html' && userData.role !== 'admin') {
                    this.showToast('Akses ditolak! Hanya admin yang bisa mengakses halaman ini.', 'error');
                    setTimeout(() => {
                        window.location.href = 'home-game.html';
                    }, 2000);
                }
            }
        } catch (error) {
            console.error('Error checking user role:', error);
        }
    }

    handleAuthError(error) {
        let message = 'Terjadi kesalahan';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                message = 'Email sudah terdaftar';
                break;
            case 'auth/invalid-email':
                message = 'Email tidak valid';
                break;
            case 'auth/user-not-found':
                message = 'User tidak ditemukan';
                break;
            case 'auth/wrong-password':
                message = 'Password salah';
                break;
            case 'auth/weak-password':
                message = 'Password terlalu lemah';
                break;
            default:
                message = error.message;
        }
        
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
    
    // Initialize hamburger menu
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('show');
            hamburger.innerHTML = navMenu.classList.contains('show') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
    }
});