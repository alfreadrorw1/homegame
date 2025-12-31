import { auth, db, requireAuth } from './firebase.js';
import { 
    collection, 
    getDocs, 
    query, 
    orderBy,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    serverTimestamp,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Initialize
requireAuth();

// DOM Elements
const gamesGrid = document.querySelector('.games-grid');
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

// Load games
async function loadGames() {
    try {
        const gamesQuery = query(
            collection(db, "games"),
            orderBy("createdAt", "desc")
        );
        
        onSnapshot(gamesQuery, (snapshot) => {
            gamesGrid.innerHTML = '';
            
            if (snapshot.empty) {
                gamesGrid.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🎮</div>
                        <div class="empty-text">No games available</div>
                        <div class="empty-subtext">Games will appear here once added by admin</div>
                    </div>
                `;
                return;
            }
            
            snapshot.forEach((doc) => {
                const game = doc.data();
                game.id = doc.id;
                createGameCard(game);
            });
            
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
        });
        
    } catch (error) {
        console.error("Error loading games:", error);
        showMessage('Error loading games');
    }
}

// Create game card
function createGameCard(game) {
    const card = document.createElement('div');
    card.className = 'game-card';
    
    const categoryClass = game.category === 'multiplayer' ? 'game-category multiplayer' : 
                         game.category === 'visual' ? 'game-category visual' : 'game-category fun';
    
    card.innerHTML = `
        <div class="game-icon">${game.icon || '🎮'}</div>
        <h3 class="game-title">${game.name}</h3>
        <span class="${categoryClass}">${game.category}</span>
        <p class="game-description">Click play to start gaming!</p>
        <button class="btn-play" onclick="playGame('${game.link}')">Play Now</button>
    `;
    
    gamesGrid.appendChild(card);
}

// Play game
window.playGame = function(url) {
    if (!url) {
        showMessage('Game link not available');
        return;
    }
    
    if (!url.startsWith('http')) {
        url = 'https://' + url;
    }
    
    window.open(url, '_blank');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadGames();
    
    // Check if user is admin
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userRole = await getUserRole(user.uid);
            if (userRole === 'admin') {
                // Add admin panel link
                const navMenu = document.querySelector('.nav-menu');
                if (navMenu && !document.querySelector('.nav-link[href="admin.html"]')) {
                    const adminLink = document.createElement('a');
                    adminLink.href = 'admin.html';
                    adminLink.className = 'nav-link';
                    adminLink.textContent = 'Admin Panel';
                    navMenu.insertBefore(adminLink, navMenu.lastElementChild);
                }
            }
        }
    });
});

// Export for other scripts
export { loadGames, createGameCard };