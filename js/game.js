class GameManager {
    constructor() {
        this.games = [];
        this.filteredGames = [];
        this.currentCategory = 'all';
        this.searchTerm = '';
        this.init();
    }

    init() {
        // Check authentication first
        if (!auth.currentUser) {
            window.location.href = 'index.html';
            return;
        }

        this.loadGames();
        this.initEventListeners();
    }

    initEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveFilter(e.target);
                this.filterGames();
            });
        });

        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.filterGames();
            });
        }
    }

    setActiveFilter(button) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
        this.currentCategory = button.dataset.category;
    }

    async loadGames() {
        try {
            this.showLoading();
            
            // Get games from Firestore
            const snapshot = await db.collection('games')
                .orderBy('createdAt', 'desc')
                .get();
            
            this.games = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            this.filterGames();
            
        } catch (error) {
            this.showToast('Error loading games: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    filterGames() {
        this.filteredGames = this.games.filter(game => {
            // Filter by category
            if (this.currentCategory !== 'all' && game.category !== this.currentCategory) {
                return false;
            }
            
            // Filter by search term
            if (this.searchTerm && !game.name.toLowerCase().includes(this.searchTerm)) {
                return false;
            }
            
            return true;
        });
        
        this.renderGames();
    }

    renderGames() {
        const gamesGrid = document.getElementById('gamesGrid');
        if (!gamesGrid) return;
        
        if (this.filteredGames.length === 0) {
            gamesGrid.innerHTML = `
                <div class="no-games">
                    <i class="fas fa-gamepad"></i>
                    <h3>Tidak ada game ditemukan</h3>
                    <p>Coba gunakan filter atau kata kunci yang berbeda</p>
                </div>
            `;
            return;
        }
        
        gamesGrid.innerHTML = this.filteredGames.map(game => this.createGameCard(game)).join('');
        
        // Add click event to play buttons
        gamesGrid.querySelectorAll('.btn-play').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const gameId = e.target.closest('.game-card').dataset.id;
                this.playGame(gameId);
            });
        });
    }

    createGameCard(game) {
        const icon = game.icon || 'fas fa-gamepad';
        const iconIsFa = icon.includes('fa-');
        
        return `
            <div class="game-card" data-id="${game.id}">
                <div class="card-header">
                    <div class="card-icon">
                        ${iconIsFa ? `<i class="${icon}"></i>` : `<img src="${icon}" alt="${game.name}">`}
                    </div>
                    <div class="card-content">
                        <h3>${game.name}</h3>
                        <span class="card-category">${this.getCategoryLabel(game.category)}</span>
                    </div>
                </div>
                <p class="card-description">${game.description || 'Game seru untuk dimainkan!'}</p>
                <div class="card-actions">
                    <button class="btn-play">
                        <i class="fas fa-play"></i> Mainkan
                    </button>
                </div>
            </div>
        `;
    }

    getCategoryLabel(category) {
        const labels = {
            'fun': 'Fun',
            'visual': 'Visual',
            'multiplayer': 'Multiplayer',
            'puzzle': 'Puzzle'
        };
        return labels[category] || category;
    }

    playGame(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (game && game.link) {
            // Open game in new tab
            window.open(game.link, '_blank');
            
            // Log play activity
            this.logGameActivity(gameId);
        }
    }

    async logGameActivity(gameId) {
        try {
            const user = auth.currentUser;
            if (!user) return;
            
            await db.collection('game_activity').add({
                userId: user.uid,
                gameId: gameId,
                playedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error logging game activity:', error);
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
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
}

// Initialize game manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('gamesGrid')) {
        window.gameManager = new GameManager();
    }
});