import { auth, db, requireAuth } from './firebase.js';
import { 
    collection, 
    getDocs,
    query,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Initialize
requireAuth();

// DOM Elements
const totalUsersElement = document.getElementById('totalUsers');
const totalGamesElement = document.getElementById('totalGames');
const totalToolsElement = document.getElementById('totalTools');
const popularGamesElement = document.getElementById('popularGames');
const chartCanvas = document.getElementById('statsChart');
let chart = null;

// Load statistics
async function loadStatistics() {
    try {
        // Load users count
        const usersQuery = collection(db, "users");
        onSnapshot(usersQuery, (snapshot) => {
            totalUsersElement.textContent = snapshot.size;
        });
        
        // Load games count
        const gamesQuery = collection(db, "games");
        onSnapshot(gamesQuery, (snapshot) => {
            totalGamesElement.textContent = snapshot.size;
            updateChart(snapshot);
        });
        
        // Load tools count
        const toolsQuery = collection(db, "tools");
        onSnapshot(toolsQuery, (snapshot) => {
            totalToolsElement.textContent = snapshot.size;
        });
        
        // Load popular games
        const popularGamesQuery = query(
            collection(db, "games")
        );
        
        onSnapshot(popularGamesQuery, (snapshot) => {
            let games = [];
            snapshot.forEach(doc => {
                games.push(doc.data());
            });
            
            // Sort by plays (if available) or just show first 5
            games.sort((a, b) => (b.plays || 0) - (a.plays || 0));
            const topGames = games.slice(0, 3);
            
            popularGamesElement.innerHTML = topGames.map(game => 
                `<div class="popular-game">${game.icon || '🎮'} ${game.name}</div>`
            ).join('');
        });
        
    } catch (error) {
        console.error("Error loading statistics:", error);
    }
}

// Update chart
function updateChart(snapshot) {
    const categories = {
        fun: 0,
        visual: 0,
        multiplayer: 0
    };
    
    snapshot.forEach(doc => {
        const game = doc.data();
        if (categories.hasOwnProperty(game.category)) {
            categories[game.category]++;
        }
    });
    
    if (chart) {
        chart.destroy();
    }
    
    const ctx = chartCanvas.getContext('2d');
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Fun Games', 'Visual Games', 'Multiplayer Games'],
            datasets: [{
                data: [categories.fun, categories.visual, categories.multiplayer],
                backgroundColor: [
                    '#7c3aed',
                    '#9d6cff',
                    '#c4b5fd'
                ],
                borderWidth: 2,
                borderColor: '#160f2f'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#f3f4f6',
                        font: {
                            family: 'Poppins'
                        }
                    }
                }
            }
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadStatistics();
    
    // Load Chart.js library
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => {
        console.log('Chart.js loaded');
    };
    document.head.appendChild(script);
});