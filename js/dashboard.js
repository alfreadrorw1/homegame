class DashboardManager {
    constructor() {
        this.stats = {
            totalUsers: 0,
            totalGames: 0,
            totalTools: 0,
            topGame: null,
            recentGames: [],
            recentUsers: []
        };
        this.gamesChart = null;
        this.activityChart = null;
        this.init();
    }

    async init() {
        // Check authentication first
        if (!auth.currentUser) {
            window.location.href = 'index.html';
            return;
        }

        await this.loadAllStats();
        this.initCharts();
        this.renderRecentItems();
    }

    async loadAllStats() {
        try {
            this.showLoading();
            
            // Load all stats in parallel
            await Promise.all([
                this.loadUserStats(),
                this.loadGameStats(),
                this.loadToolStats(),
                this.loadRecentGames(),
                this.loadRecentUsers()
            ]);
            
            this.updateStatsDisplay();
            
        } catch (error) {
            this.showToast('Error loading dashboard stats: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadUserStats() {
        const snapshot = await db.collection('users').get();
        this.stats.totalUsers = snapshot.size;
        
        // Get recent users
        this.stats.recentUsers = snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            .sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate())
            .slice(0, 5);
    }

    async loadGameStats() {
        const snapshot = await db.collection('games').get();
        this.stats.totalGames = snapshot.size;
        
        // Get recent games
        this.stats.recentGames = snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            .sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate())
            .slice(0, 5);
        
        // Find top game (simulated - in real app, track game plays)
        if (this.stats.recentGames.length > 0) {
            this.stats.topGame = this.stats.recentGames[0].name;
        }
    }

    async loadToolStats() {
        const snapshot = await db.collection('tools').get();
        this.stats.totalTools = snapshot.size;
    }

    async loadRecentGames() {
        const snapshot = await db.collection('games')
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();
        
        this.stats.recentGames = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    async loadRecentUsers() {
        const snapshot = await db.collection('users')
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();
        
        this.stats.recentUsers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    updateStatsDisplay() {
        // Update stat cards
        document.getElementById('totalUsers').textContent = this.stats.totalUsers;
        document.getElementById('totalGames').textContent = this.stats.totalGames;
        document.getElementById('totalTools').textContent = this.stats.totalTools;
        document.getElementById('topGame').textContent = this.stats.topGame || '-';
    }

    initCharts() {
        this.initGamesChart();
        this.initActivityChart();
    }

    initGamesChart() {
        const ctx = document.getElementById('gamesChart')?.getContext('2d');
        if (!ctx) return;

        // Mock data - in real app, get actual category distribution
        const categories = ['Fun', 'Visual', 'Multiplayer', 'Puzzle'];
        const data = [12, 8, 6, 4];

        this.gamesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        'rgba(124, 58, 237, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(167, 139, 250, 0.8)',
                        'rgba(196, 181, 253, 0.8)'
                    ],
                    borderColor: [
                        'rgba(124, 58, 237, 1)',
                        'rgba(139, 92, 246, 1)',
                        'rgba(167, 139, 250, 1)',
                        'rgba(196, 181, 253, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#cbd5e1',
                            font: {
                                family: "'Inter', sans-serif"
                            }
                        }
                    }
                }
            }
        });
    }

    initActivityChart() {
        const ctx = document.getElementById('activityChart')?.getContext('2d');
        if (!ctx) return;

        // Mock data - in real app, get actual activity data
        const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
        const activity = [65, 59, 80, 81, 56, 55, 40];

        this.activityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: days,
                datasets: [{
                    label: 'Aktivitas Pengguna',
                    data: activity,
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    borderColor: 'rgba(124, 58, 237, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: 'rgba(124, 58, 237, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#cbd5e1',
                            font: {
                                family: "'Inter', sans-serif"
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(203, 213, 225, 0.1)'
                        },
                        ticks: {
                            color: '#cbd5e1'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(203, 213, 225, 0.1)'
                        },
                        ticks: {
                            color: '#cbd5e1'
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    renderRecentItems() {
        this.renderRecentGames();
        this.renderRecentUsers();
    }

    renderRecentGames() {
        const container = document.getElementById('recentGames');
        if (!container) return;

        if (this.stats.recentGames.length === 0) {
            container.innerHTML = '<p class="no-data">Belum ada game</p>';
            return;
        }

        container.innerHTML = this.stats.recentGames.map(game => `
            <div class="recent-item">
                <div class="recent-icon">
                    <i class="${game.icon || 'fas fa-gamepad'}"></i>
                </div>
                <div class="recent-info">
                    <h4>${game.name}</h4>
                    <p>${this.formatDate(game.createdAt)}</p>
                </div>
            </div>
        `).join('');
    }

    renderRecentUsers() {
        const container = document.getElementById('recentUsers');
        if (!container) return;

        if (this.stats.recentUsers.length === 0) {
            container.innerHTML = '<p class="no-data">Belum ada pengguna</p>';
            return;
        }

        container.innerHTML = this.stats.recentUsers.map(user => `
            <div class="recent-item">
                <div class="recent-icon">
                    <i class="fas fa-user"></i>
                </div>
                <div class="recent-info">
                    <h4>${user.email}</h4>
                    <p>${user.role} • ${this.formatDate(user.createdAt)}</p>
                </div>
            </div>
        `).join('');
    }

    formatDate(timestamp) {
        if (!timestamp) return 'Tanggal tidak tersedia';
        
        const date = timestamp.toDate();
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Hari ini';
        } else if (diffDays === 1) {
            return 'Kemarin';
        } else if (diffDays < 7) {
            return `${diffDays} hari yang lalu`;
        } else {
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
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
        const overlay = document.getElementById('loadingOverview');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
}

// Initialize dashboard manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('gamesChart')) {
        window.dashboardManager = new DashboardManager();
    }
});