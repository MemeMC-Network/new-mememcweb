// ========================
// PUNISHMENTS PAGE SCRIPT
// ========================

// Configuration - UPDATE baseUrl WITH YOUR SERVER IP
const API_CONFIG = {
    // Change this to your Velocity server IP/domain and port (default: 8080)
    // Examples: 
    // - 'http://localhost:8080' (for testing)
    // - 'http://your-server-ip:8080' (direct connection)
    // - 'https://api.mememc.club' (with reverse proxy)
    baseUrl: 'http://nd.mememc.club:25570',
    
    endpoints: {
        bans: '/punishments/bans',
        mutes: '/punishments/mutes',
        blacklists: '/punishments/blacklists',
        warnings: '/punishments/warnings',
        kicks: '/punishments/kicks',
        all: '/punishments/all',
        player: '/punishments/player/', // + player name/uuid
        stats: '/punishments/stats'
    }
};

// State Management
const state = {
    currentFilter: 'all',
    currentPage: 1,
    itemsPerPage: 20,
    searchQuery: '',
    punishments: [],
    filteredPunishments: [],
    stats: {
        bans: 0,
        mutes: 0,
        blacklists: 0,
        warnings: 0
    }
};

// DOM Elements
const elements = {
    loadingState: document.getElementById('loadingState'),
    emptyState: document.getElementById('emptyState'),
    tableContainer: document.getElementById('tableContainer'),
    tableBody: document.getElementById('punishmentsTableBody'),
    searchInput: document.getElementById('playerSearch'),
    clearSearch: document.getElementById('clearSearch'),
    filterTabs: document.querySelectorAll('.filter-tab'),
    pagination: document.getElementById('pagination'),
    prevPage: document.getElementById('prevPage'),
    nextPage: document.getElementById('nextPage'),
    pageInfo: document.getElementById('pageInfo'),
    statNumbers: document.querySelectorAll('.stat-number')
};

// Initialize the page
async function init() {
    setupEventListeners();
    await loadStats();
    await loadPunishments();
}

// Setup Event Listeners
function setupEventListeners() {
    // Search input
    elements.searchInput.addEventListener('input', handleSearch);
    elements.clearSearch.addEventListener('click', clearSearch);

    // Filter tabs
    elements.filterTabs.forEach(tab => {
        tab.addEventListener('click', () => handleFilterChange(tab.dataset.filter));
    });

    // Pagination
    elements.prevPage.addEventListener('click', () => changePage(-1));
    elements.nextPage.addEventListener('click', () => changePage(1));
}

// Load Statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.stats}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const stats = await response.json();
        state.stats = stats;
        displayStats();
    } catch (error) {
        console.error('Error loading stats:', error);
        // Display zeros on error
        state.stats = {
            bans: 0,
            mutes: 0,
            blacklists: 0,
            warnings: 0
        };
        displayStats();
    }
}

// Display Statistics with animation
function displayStats() {
    elements.statNumbers.forEach(element => {
        const type = element.dataset.type;
        const value = state.stats[type] || 0;
        animateValue(element, 0, value, 1500);
    });
}

// Animate number counting
function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString();
    }, 16);
}

// Load Punishments
async function loadPunishments() {
    showLoading(true);

    try {
        const endpoint = state.currentFilter === 'all' 
            ? API_CONFIG.endpoints.all 
            : API_CONFIG.endpoints[state.currentFilter];
        
        const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const punishments = await response.json();
        
        state.punishments = punishments;
        applyFilters();
        displayPunishments();
        showLoading(false);
    } catch (error) {
        console.error('Error loading punishments:', error);
        console.error('Make sure the pxAPI plugin is running on your Velocity server');
        console.error('Check API_CONFIG.baseUrl is set correctly');
        showLoading(false);
        showEmpty(true);
    }
}

// Apply Filters
function applyFilters() {
    let filtered = [...state.punishments];

    // Filter by type (only if not already filtered by API)
    if (state.currentFilter !== 'all') {
        // The API already filtered by type, but we keep this for search functionality
        const filterType = state.currentFilter.endsWith('s') 
            ? state.currentFilter.slice(0, -1)  // Remove 's' from end (bans -> ban)
            : state.currentFilter;
        filtered = filtered.filter(p => p.type === filterType);
    }

    // Filter by search query
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(p => 
            p.player.toLowerCase().includes(query) ||
            p.reason.toLowerCase().includes(query) ||
            p.staff.toLowerCase().includes(query)
        );
    }

    state.filteredPunishments = filtered;
    state.currentPage = 1; // Reset to first page
}

// Display Punishments
function displayPunishments() {
    const start = (state.currentPage - 1) * state.itemsPerPage;
    const end = start + state.itemsPerPage;
    const pageData = state.filteredPunishments.slice(start, end);

    if (pageData.length === 0) {
        showEmpty(true);
        return;
    }

    showEmpty(false);
    elements.tableContainer.style.display = 'block';
    elements.pagination.style.display = 'flex';

    // Clear existing rows
    elements.tableBody.innerHTML = '';

    // Add new rows
    pageData.forEach(punishment => {
        const row = createPunishmentRow(punishment);
        elements.tableBody.appendChild(row);
    });

    updatePagination();
}

// Create Punishment Row
function createPunishmentRow(punishment) {
    const row = document.createElement('tr');
    row.className = 'animate__animated animate__fadeIn';
    
    // Use Crafatar for player avatars - more reliable
    const cleanUUID = punishment.uuid ? punishment.uuid.replace(/-/g, '') : '';
    const avatarUrl = cleanUUID 
        ? `https://skins.mcstats.com/skull/${cleanUUID}`
        : `https://minotar.net/avatar/${punishment.player}/32`;
    
    const formattedDate = new Date(punishment.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    row.innerHTML = `
        <td>
            <div class="player-info">
                <img src="${avatarUrl}" alt="${punishment.player}" class="player-avatar" onerror="this.src='https://skins.mcstats.com/skull/40f99169-b826-4317-9a64-5e2211638c7d'">
                <a href="profile.html?user=${encodeURIComponent(punishment.player)}" class="player-name" style="color: #667eea; text-decoration: none; cursor: pointer; transition: all 0.3s ease;">
                    ${punishment.player}
                </a>
            </div>
        </td>
        <td>
            <span class="punishment-type ${punishment.type}">
                <i class="fas fa-${getTypeIcon(punishment.type)}"></i>
                ${punishment.type}
            </span>
        </td>
        <td>${punishment.reason}</td>
        <td>${punishment.staff}</td>
        <td>${punishment.duration}</td>
        <td>${formattedDate}</td>
        <td>
            <span class="punishment-status ${punishment.status}">
                <i class="fas fa-${getStatusIcon(punishment.status)}"></i>
                ${punishment.status}
            </span>
        </td>
    `;

    return row;
}

// Get Type Icon
function getTypeIcon(type) {
    const icons = {
        ban: 'ban',
        mute: 'volume-mute',
        blacklist: 'user-slash',
        warning: 'exclamation-triangle',
        kick: 'door-open'
    };
    return icons[type] || 'gavel';
}

// Get Status Icon
function getStatusIcon(status) {
    const icons = {
        active: 'circle',
        expired: 'check-circle',
        pardoned: 'undo'
    };
    return icons[status] || 'circle';
}

// Update Pagination
function updatePagination() {
    const totalPages = Math.ceil(state.filteredPunishments.length / state.itemsPerPage);
    
    elements.pageInfo.textContent = `Page ${state.currentPage} of ${totalPages}`;
    elements.prevPage.disabled = state.currentPage === 1;
    elements.nextPage.disabled = state.currentPage === totalPages || totalPages === 0;
}

// Change Page
function changePage(direction) {
    state.currentPage += direction;
    displayPunishments();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Handle Search
function handleSearch(e) {
    state.searchQuery = e.target.value.trim();
    
    if (state.searchQuery) {
        elements.clearSearch.style.display = 'flex';
    } else {
        elements.clearSearch.style.display = 'none';
    }

    applyFilters();
    displayPunishments();
}

// Clear Search
function clearSearch() {
    elements.searchInput.value = '';
    state.searchQuery = '';
    elements.clearSearch.style.display = 'none';
    applyFilters();
    displayPunishments();
}

// Handle Filter Change
function handleFilterChange(filter) {
    state.currentFilter = filter;

    // Update active tab
    elements.filterTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.filter === filter);
    });

    // Reload punishments from API with new filter
    loadPunishments();
}

// Show/Hide Loading State
function showLoading(show) {
    elements.loadingState.style.display = show ? 'flex' : 'none';
}

// Show/Hide Empty State
function showEmpty(show) {
    elements.emptyState.style.display = show ? 'flex' : 'none';
    elements.tableContainer.style.display = show ? 'none' : 'block';
    elements.pagination.style.display = show ? 'none' : 'flex';
}

// Copy to Clipboard Function (from other pages)
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert(`Copied "${text}" to clipboard!`);
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}