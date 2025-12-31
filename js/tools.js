import { auth, db, requireAuth } from './firebase.js';
import { 
    collection, 
    getDocs, 
    query, 
    orderBy,
    addDoc,
    deleteDoc,
    doc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Initialize
requireAuth();

// DOM Elements
const toolsGrid = document.querySelector('.tools-grid');
const loadingElement = document.querySelector('.loading');
const messageElement = document.querySelector('.message');

// Show message
function showMessage(message, type = 'error') {
    messageElement.textContent = message;
    messageElement.className = `message ${type} show`;
    
    setTimeout(() => {
        messageElement.className = 'message';
    }, 3000);
}

// Load tools
async function loadTools() {
    try {
        const toolsQuery = query(
            collection(db, "tools"),
            orderBy("createdAt", "desc")
        );
        
        onSnapshot(toolsQuery, (snapshot) => {
            toolsGrid.innerHTML = '';
            
            if (snapshot.empty) {
                toolsGrid.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🛠️</div>
                        <div class="empty-text">No tools available</div>
                        <div class="empty-subtext">Tools will appear here once added by admin</div>
                    </div>
                `;
                return;
            }
            
            snapshot.forEach((doc) => {
                const tool = doc.data();
                tool.id = doc.id;
                createToolCard(tool);
            });
            
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
        });
        
    } catch (error) {
        console.error("Error loading tools:", error);
        showMessage('Error loading tools');
    }
}

// Create tool card
function createToolCard(tool) {
    const card = document.createElement('div');
    card.className = 'tool-card';
    
    card.innerHTML = `
        <div class="tool-icon">${tool.icon || '🛠️'}</div>
        <h3 class="tool-title">${tool.name}</h3>
        <span class="tool-category">${tool.category}</span>
        <p class="tool-description">Useful tool for gamers</p>
        <button class="btn-use" onclick="useTool('${tool.link}')">Use Tool</button>
    `;
    
    toolsGrid.appendChild(card);
}

// Use tool
window.useTool = function(url) {
    if (!url) {
        showMessage('Tool link not available');
        return;
    }
    
    if (!url.startsWith('http')) {
        url = 'https://' + url;
    }
    
    window.open(url, '_blank');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTools();
});

export { loadTools, createToolCard };