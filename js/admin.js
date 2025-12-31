import { auth, db, requireAuth, getUserRole } from './firebase.js';
import { 
    collection, 
    getDocs, 
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    serverTimestamp,
    onSnapshot,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Initialize with admin requirement
requireAuth('admin');

// DOM Elements
const addGameForm = document.getElementById('addGameForm');
const addToolForm = document.getElementById('addToolForm');
const gamesTable = document.getElementById('gamesTable');
const toolsTable = document.getElementById('toolsTable');
const messageElement = document.querySelector('.message');

// Show message
function showMessage(message, type = 'success') {
    messageElement.textContent = message;
    messageElement.className = `message ${type} show`;
    
    setTimeout(() => {
        messageElement.className = 'message';
    }, 3000);
}

// Load games for admin
async function loadGamesForAdmin() {
    try {
        const gamesQuery = query(
            collection(db, "games"),
            orderBy("createdAt", "desc")
        );
        
        onSnapshot(gamesQuery, (snapshot) => {
            const tbody = gamesTable.querySelector('tbody');
            tbody.innerHTML = '';
            
            snapshot.forEach((doc) => {
                const game = doc.data();
                game.id = doc.id;
                createGameRow(game, tbody);
            });
        });
        
    } catch (error) {
        console.error("Error loading games:", error);
        showMessage('Error loading games', 'error');
    }
}

// Load tools for admin
async function loadToolsForAdmin() {
    try {
        const toolsQuery = query(
            collection(db, "tools"),
            orderBy("createdAt", "desc")
        );
        
        onSnapshot(toolsQuery, (snapshot) => {
            const tbody = toolsTable.querySelector('tbody');
            tbody.innerHTML = '';
            
            snapshot.forEach((doc) => {
                const tool = doc.data();
                tool.id = doc.id;
                createToolRow(tool, tbody);
            });
        });
        
    } catch (error) {
        console.error("Error loading tools:", error);
        showMessage('Error loading tools', 'error');
    }
}

// Create game row for admin table
function createGameRow(game, tbody) {
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td>${game.icon || '🎮'}</td>
        <td>${game.name}</td>
        <td><span class="game-category">${game.category}</span></td>
        <td><a href="${game.link}" target="_blank">${game.link.substring(0, 30)}...</a></td>
        <td>${game.createdAt?.toDate().toLocaleDateString() || 'N/A'}</td>
        <td>
            <button class="btn-action btn-edit" onclick="editGame('${game.id}')">Edit</button>
            <button class="btn-action btn-delete" onclick="deleteGame('${game.id}')">Delete</button>
        </td>
    `;
    
    tbody.appendChild(row);
}

// Create tool row for admin table
function createToolRow(tool, tbody) {
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td>${tool.icon || '🛠️'}</td>
        <td>${tool.name}</td>
        <td><span class="tool-category">${tool.category}</span></td>
        <td><a href="${tool.link}" target="_blank">${tool.link.substring(0, 30)}...</a></td>
        <td>${tool.createdAt?.toDate().toLocaleDateString() || 'N/A'}</td>
        <td>
            <button class="btn-action btn-edit" onclick="editTool('${tool.id}')">Edit</button>
            <button class="btn-action btn-delete" onclick="deleteTool('${tool.id}')">Delete</button>
        </td>
    `;
    
    tbody.appendChild(row);
}

// Add new game
if (addGameForm) {
    addGameForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('gameName').value;
        const icon = document.getElementById('gameIcon').value;
        const category = document.getElementById('gameCategory').value;
        const link = document.getElementById('gameLink').value;
        
        if (!name || !category || !link) {
            showMessage('Please fill all required fields', 'error');
            return;
        }
        
        try {
            await addDoc(collection(db, "games"), {
                name: name,
                icon: icon || '🎮',
                category: category,
                link: link,
                createdAt: serverTimestamp(),
                plays: 0
            });
            
            showMessage('Game added successfully!');
            addGameForm.reset();
            
        } catch (error) {
            console.error("Error adding game:", error);
            showMessage('Error adding game', 'error');
        }
    });
}

// Add new tool
if (addToolForm) {
    addToolForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('toolName').value;
        const icon = document.getElementById('toolIcon').value;
        const category = document.getElementById('toolCategory').value;
        const link = document.getElementById('toolLink').value;
        
        if (!name || !category || !link) {
            showMessage('Please fill all required fields', 'error');
            return;
        }
        
        try {
            await addDoc(collection(db, "tools"), {
                name: name,
                icon: icon || '🛠️',
                category: category,
                link: link,
                createdAt: serverTimestamp(),
                uses: 0
            });
            
            showMessage('Tool added successfully!');
            addToolForm.reset();
            
        } catch (error) {
            console.error("Error adding tool:", error);
            showMessage('Error adding tool', 'error');
        }
    });
}

// Delete game
window.deleteGame = async function(gameId) {
    if (!confirm('Are you sure you want to delete this game?')) return;
    
    try {
        await deleteDoc(doc(db, "games", gameId));
        showMessage('Game deleted successfully!');
    } catch (error) {
        console.error("Error deleting game:", error);
        showMessage('Error deleting game', 'error');
    }
};

// Delete tool
window.deleteTool = async function(toolId) {
    if (!confirm('Are you sure you want to delete this tool?')) return;
    
    try {
        await deleteDoc(doc(db, "tools", toolId));
        showMessage('Tool deleted successfully!');
    } catch (error) {
        console.error("Error deleting tool:", error);
        showMessage('Error deleting tool', 'error');
    }
};

// Edit game (placeholder - implement as needed)
window.editGame = function(gameId) {
    showMessage('Edit feature coming soon!', 'success');
};

// Edit tool (placeholder - implement as needed)
window.editTool = function(toolId) {
    showMessage('Edit feature coming soon!', 'success');
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadGamesForAdmin();
    loadToolsForAdmin();
});