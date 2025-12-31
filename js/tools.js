class ToolsManager {
    constructor() {
        this.tools = [];
        this.filteredTools = [];
        this.currentCategory = 'all';
        this.searchTerm = '';
        this.isAdmin = false;
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
        
        this.loadTools();
        this.initEventListeners();
    }

    async checkAdminStatus() {
        try {
            const user = auth.currentUser;
            const userDoc = await db.collection('users').doc(user.uid).get();
            const userData = userDoc.data();
            
            this.isAdmin = userData && userData.role === 'admin';
            
            // Show admin-only elements
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
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveFilter(e.target);
                this.filterTools();
            });
        });

        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.filterTools();
            });
        }

        // Add tool button (admin only)
        const addToolBtn = document.getElementById('addToolBtn');
        if (addToolBtn) {
            addToolBtn.addEventListener('click', () => {
                this.showAddToolModal();
            });
        }

        // Modal handling
        const modal = document.getElementById('addToolModal');
        if (modal) {
            // Close modal buttons
            modal.querySelectorAll('.close-modal').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.hideModal(modal);
                });
            });

            // Close modal on outside click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal);
                }
            });

            // Tool form submission
            const toolForm = document.getElementById('toolForm');
            if (toolForm) {
                toolForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.addTool();
                });
            }
        }
    }

    setActiveFilter(button) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
        this.currentCategory = button.dataset.category;
    }

    async loadTools() {
        try {
            this.showLoading();
            
            // Get tools from Firestore
            const snapshot = await db.collection('tools')
                .orderBy('createdAt', 'desc')
                .get();
            
            this.tools = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            this.filterTools();
            
        } catch (error) {
            this.showToast('Error loading tools: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    filterTools() {
        this.filteredTools = this.tools.filter(tool => {
            // Filter by category
            if (this.currentCategory !== 'all' && tool.category !== this.currentCategory) {
                return false;
            }
            
            // Filter by search term
            if (this.searchTerm && !tool.name.toLowerCase().includes(this.searchTerm)) {
                return false;
            }
            
            return true;
        });
        
        this.renderTools();
    }

    renderTools() {
        const toolsGrid = document.getElementById('toolsGrid');
        if (!toolsGrid) return;
        
        if (this.filteredTools.length === 0) {
            toolsGrid.innerHTML = `
                <div class="no-tools">
                    <i class="fas fa-tools"></i>
                    <h3>Tidak ada tools ditemukan</h3>
                    <p>Coba gunakan filter atau kata kunci yang berbeda</p>
                </div>
            `;
            return;
        }
        
        toolsGrid.innerHTML = this.filteredTools.map(tool => this.createToolCard(tool)).join('');
        
        // Add click events
        toolsGrid.querySelectorAll('.btn-use').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const toolId = e.target.closest('.tool-card').dataset.id;
                this.useTool(toolId);
            });
        });

        // Add delete events for admin
        if (this.isAdmin) {
            toolsGrid.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const toolId = e.target.closest('.tool-card').dataset.id;
                    this.confirmDeleteTool(toolId);
                });
            });
        }
    }

    createToolCard(tool) {
        const icon = tool.icon || 'fas fa-tools';
        const iconIsFa = icon.includes('fa-');
        
        return `
            <div class="tool-card" data-id="${tool.id}">
                <div class="card-header">
                    <div class="card-icon">
                        ${iconIsFa ? `<i class="${icon}"></i>` : `<img src="${icon}" alt="${tool.name}">`}
                    </div>
                    <div class="card-content">
                        <h3>${tool.name}</h3>
                        <span class="card-category">${this.getCategoryLabel(tool.category)}</span>
                    </div>
                </div>
                <p class="card-description">${tool.description || 'Tool bermanfaat untuk gaming!'}</p>
                <div class="card-actions">
                    <button class="btn-use">
                        <i class="fas fa-external-link-alt"></i> Gunakan
                    </button>
                    ${this.isAdmin ? `
                        <button class="btn-delete">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getCategoryLabel(category) {
        const labels = {
            'utility': 'Utility',
            'converter': 'Converter',
            'generator': 'Generator',
            'editor': 'Editor',
            'other': 'Lainnya'
        };
        return labels[category] || category;
    }

    useTool(toolId) {
        const tool = this.tools.find(t => t.id === toolId);
        if (tool && tool.link) {
            // Open tool in new tab
            window.open(tool.link, '_blank');
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

            // Add tool to Firestore
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
            
            // Hide modal and refresh tools
            this.hideModal(document.getElementById('addToolModal'));
            this.loadTools();
            
        } catch (error) {
            this.showToast('Error adding tool: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    confirmDeleteTool(toolId) {
        const tool = this.tools.find(t => t.id === toolId);
        if (!tool) return;

        if (confirm(`Apakah Anda yakin ingin menghapus tool "${tool.name}"?`)) {
            this.deleteTool(toolId);
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

// Initialize tools manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('toolsGrid')) {
        window.toolsManager = new ToolsManager();
    }
});