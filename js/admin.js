class AdminManager {
    constructor() {
        this.games = [];
        this.tools = [];
        this.users = [];
        this.isAdmin = false;
        this.currentTab = 'games';
        this.init();
    }

    async init() {
        // Check authentication first
        if (!auth.currentUser) {
            window.location.href = 'index.html';
            return;
        }

        // Check if user is admin
        await this.checkAdminStatus();
        if (!this.isAdmin) {
            this.showToast('Akses ditolak! Hanya admin yang bisa mengakses halaman ini.', 'error');
            setTimeout(() => {
                window.location.href = 'home-game.html';
            }, 2000);
            return;
        }

        this.initEventListeners();
        this.loadData();
    }

    async checkAdminStatus() {
        try {
            const user = auth.currentUser;
            const userDoc = await db.collection('users').doc(user.uid).get();
            const userData = userDoc.data();
            
            this.isAdmin = userData && userData.role === 'admin';
            
            if (this.isAdmin) {
                document.querySelectorAll('.admin-only').forEach(el => {
                    el.classList.add('visible');
                });
            }
        } catch (error) {
            console.error('Error checking admin status:', error);
        }
    }

    initEventListeners() {
        // Tab switching
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Add buttons
        document.getElementById('addGameBtn')?.addEventListener('click', () => {
            this.showAddGameModal();
        });

        document.getElementById('addToolBtnAdmin')?.addEventListener('click', () => {
            this.showAddToolModal();
        });

        // Modal handling
        this.initModalHandlers();
    }

    initModalHandlers() {
        // Game modal
        const gameModal = document.getElementById('addGameModal');
        if (gameModal) {
            gameModal.querySelectorAll('.close-modal').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.hideModal(gameModal);
                });
            });

            gameModal.addEventListener('click', (e) => {
                if (e.target === gameModal) {
                    this.hideModal(gameModal);
                }
            });

            document.getElementById('gameForm')?.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addGame();
            });
        }

        // Tool modal (reuse from tools.js)
        const toolModal = document.getElementById('addToolModal');
        if (toolModal) {
            toolModal.querySelectorAll('.close-modal').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.hideModal(toolModal);
                });
            });

            toolModal.addEventListener('click', (e) => {
                if (e.target === toolModal) {
                    this.hideModal(toolModal);
                }
            });

            document.getElementById('toolForm')?.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addTool();
            });
        }

        // Delete confirmation modal
        const deleteModal = document.getElementById('deleteModal');
        if (deleteModal) {
            deleteModal.querySelectorAll('.close-modal').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.hideModal(deleteModal);
                });
            });

            deleteModal.addEventListener('click', (e) => {
                if (e.target === deleteModal) {
                    this.hideModal(deleteModal);
                }
            });
        }
    }

    switchTab(tab) {
        this.currentTab = tab;
        
        // Update tab buttons
        document.querySelectorAll('.admin-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });
        
        // Update tab content
        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tab}Tab`);
        });
        
        // Load data for tab if not loaded yet
        if (tab === 'games' && this.games.length === 0) {
            this.loadGames();
        } else if (tab === 'tools' && this.tools.length === 0) {
            this.loadTools();
        } else if (tab === 'users' && this.users.length === 0) {
            this.loadUsers();
        }
    }

    async loadData() {
        await Promise.all([
            this.loadGames(),
            this.loadTools(),
            this.loadUsers()
        ]);
    }

    async loadGames() {
        try {
            this.showLoading();
            
            const snapshot = await db.collection('games')
                .orderBy('createdAt', 'desc')
                .get();
            
            this.games = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            this.renderGamesTable();
            
        } catch (error) {
            this.showToast('Error loading games: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadTools() {
        try {
            this.showLoading();
            
            const snapshot = await db.collection('tools')
                .orderBy('createdAt', 'desc')
                .get();
            
            this.tools = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            this.renderToolsTable();
            
        } catch (error) {
            this.showToast('Error loading tools: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadUsers() {
        try {
            this.showLoading();
            
            const snapshot = await db.collection('users')
                .orderBy('createdAt', 'desc')
                .get();
            
            this.users = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            this.renderUsersTable();
            
        } catch (error) {
            this.showToast('Error loading users: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    renderGamesTable() {
        const tbody = document.getElementById('gamesTable');
        if (!tbody) return;

        if (this.games.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="no-data">
                        <i class="fas fa-gamepad"></i>
                        <p>Belum ada game</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.games.map(game => `
            <tr>
                <td>
                    <div class="table-item">
                        <i class="${game.icon || 'fas fa-gamepad'}"></i>
                        <span>${game.name}</span>
                    </div>
                </td>
                <td>
                    <span class="table-badge">${this.getCategoryLabel(game.category)}</span>
                </td>
                <td>${this.formatDate(game.createdAt)}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-action btn-edit" data-id="${game.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-action btn-delete" data-id="${game.id}">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Add event listeners
        tbody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const gameId = e.target.closest('.btn-delete').dataset.id;
                this.confirmDelete('game', gameId);
            });
        });
    }

    renderToolsTable() {
        const tbody = document.getElementById('toolsTable');
        if (!tbody) return;

        if (this.tools.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="no-data">
                        <i class="fas fa-tools"></i>
                        <p>Belum ada tools</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.tools.map(tool => `
            <tr>
                <td>
                    <div class="table-item">
                        <i class="${tool.icon || 'fas fa-tools'}"></i>
                        <span>${tool.name}</span>
                    </div>
                </td>
                <td>
                    <span class="table-badge">${this.getCategoryLabel(tool.category)}</span>
                </td>
                <td>${this.formatDate(tool.createdAt)}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-action btn-edit" data-id="${tool.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-action btn-delete" data-id="${tool.id}">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Add event listeners
        tbody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const toolId = e.target.closest('.btn-delete').dataset.id;
                this.confirmDelete('tool', toolId);
            });
        });
    }

    renderUsersTable() {
        const tbody = document.getElementById('usersTable');
        if (!tbody) return;

        if (this.users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="no-data">
                        <i class="fas fa-users"></i>
                        <p>Belum ada pengguna</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.users.map(user => `
            <tr>
                <td>
                    <div class="table-item">
                        <i class="fas fa-user"></i>
                        <span>${user.email}</span>
                    </div>
                </td>
                <td>
                    <span class="table-badge ${user.role === 'admin' ? 'admin-badge' : 'user-badge'}">
                        ${user.role}
                    </span>
                </td>
                <td>${this.formatDate(user.createdAt)}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-action btn-edit" data-id="${user.id}">
                            <i class="fas fa-edit"></i> Edit Role
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getCategoryLabel(category) {
        const labels = {
            'fun': 'Fun',
            'visual': 'Visual',
            'multiplayer': 'Multiplayer',
            'puzzle': 'Puzzle',
            'utility': 'Utility',
            'converter': 'Converter',
            'generator': 'Generator',
            'editor': 'Editor',
            'other': 'Lainnya'
        };
        return labels[category] || category;
    }

    formatDate(timestamp) {
        if (!timestamp) return 'Tanggal tidak tersedia';
        
        const date = timestamp.toDate();
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showAddGameModal() {
        const modal = document.getElementById('addGameModal');
        if (modal) {
            modal.classList.add('show');
            document.getElementById('gameForm').reset();
        }
    }

    showAddToolModal() {
        const modal = document.getElementById('addToolModal');
        if (modal) {
            modal.classList.add('show');
            document.getElementById('toolForm').reset();
        }
    }

    hideModal(modal) {
        modal.classList.remove('show');
    }

    async addGame() {
        try {
            const name = document.getElementById('gameName').value;
            const icon = document.getElementById('gameIcon').value;
            const category = document.getElementById('gameCategory').value;
            const link = document.getElementById('gameLink').value;
            const description = document.getElementById('gameDescription').value;

            if (!name || !icon || !category || !link) {
                this.showToast('Harap isi semua field yang wajib!', 'warning');
                return;
            }

            this.showLoading();

            const gameData = {
                name: name,
                icon: icon,
                category: category,
                link: link,
                description: description,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: auth.currentUser.uid
            };

            await db.collection('games').add(gameData);
            
            this.showToast('Game berhasil ditambahkan!', 'success');
            
            this.hideModal(document.getElementById('addGameModal'));
            this.loadGames();
            
        } catch (error) {
            this.showToast('Error adding game: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async addTool() {
        try {
            const name = document.getElementById('toolName').value;
            const icon = document.getElementById('toolIcon').value;
            const category = document.getElementById('toolCategory').value;
            const link = document.getElementById('toolLink').value;
            const description = document.getElementById('toolDescription').value;

            if (!name || !icon || !category || !link) {
                this.showToast('Harap isi semua field yang wajib!', 'warning');
                return;
            }

            this.showLoading();

            const toolData = {
                name: name,
                icon: icon,
                category: category,
                link: link,
                description: description,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: auth.currentUser.uid
            };

            await db.collection('tools').add(toolData);
            
            this.showToast('Tool berhasil ditambahkan!', 'success');
            
            this.hideModal(document.getElementById('addToolModal'));
            this.loadTools();
            
        } catch (error) {
            this.showToast('Error adding tool: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    confirmDelete(type, id) {
        let name = '';
        if (type === 'game') {
            const game = this.games.find(g => g.id === id);
            name = game?.name || 'Game';
        } else if (type === 'tool') {
            const tool = this.tools.find(t => t.id === id);
            name = tool?.name || 'Tool';
        }

        const modal = document.getElementById('deleteModal');
        const message = document.getElementById('deleteMessage');
        const confirmBtn = document.getElementById('confirmDelete');

        if (modal && message && confirmBtn) {
            message.textContent = `Apakah Anda yakin ingin menghapus ${type === 'game' ? 'game' : 'tool'} "${name}"?`;
            
            confirmBtn.onclick = () => {
                if (type === 'game') {
                    this.deleteGame(id);
                } else if (type === 'tool') {
                    this.deleteTool(id);
                }
                this.hideModal(modal);
            };
            
            modal.classList.add('show');
        }
    }

    async deleteGame(gameId) {
        try {
            this.showLoading();
            
            await db.collection('games').doc(gameId).delete();
            
            this.showToast('Game berhasil dihapus!', 'success');
            this.loadGames();
            
        } catch (error) {
            this.showToast('Error deleting game: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async deleteTool(toolId) {
        try {
            this.showLoading();
            
            await db.collection('tools').doc(toolId).delete();
            
            this.showToast('Tool berhasil dihapus!', 'success');
            this.loadTools();
            
        } catch (error) {
            this.showToast('Error deleting tool: ' + error.message, 'error');
        } finally {
            this.hideLoading();
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

// Initialize admin manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.admin-tabs')) {
        window.adminManager = new AdminManager();
    }
});