// Configuration
const baseUrl = 'https://api.mememc.club';
let allPunishments = [];
let filteredPunishments = [];
let currentFilter = 'all';
let currentPage = 1;
const itemsPerPage = 10;
let playerName = '';
let playerUUID = '';

// Get player name from URL
function getPlayerFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('user') || urlParams.get('player');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    playerName = getPlayerFromURL();
    
    if (!playerName) {
        showError('No player specified in URL');
        return;
    }
    
    document.getElementById('playerSubtitle').textContent = `Viewing punishment history for ${playerName}`;
    fetchPlayerPunishments();
    setupFilters();
});

// Copy to Clipboard Function (from other pages)
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert(`Copied "${text}" to clipboard!`);
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Fetch player punishments
async function fetchPlayerPunishments() {
    try {
        console.log('Fetching punishments for player:', playerName);
        const url = `${baseUrl}/punishments/player/${encodeURIComponent(playerName)}`;
        console.log('API URL:', url);
        
        const response = await fetch(url);
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 404) {
                showPlayerNotFound();
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', data);
        
        allPunishments = data.punishments || [];
        console.log('Total punishments loaded:', allPunishments.length);
        
        // Check if player has ever joined (has any punishments or exists in system)
        if (allPunishments.length === 0) {
            showPlayerNotFound();
            return;
        }
        
        // Extract UUID from first punishment
        if (allPunishments.length > 0 && allPunishments[0].uuid) {
            playerUUID = allPunishments[0].uuid;
            console.log('Player UUID:', playerUUID);
        } else {
            console.warn('No UUID found in punishment data');
        }
        
        displayProfileCard();
        applyFilter();
        
    } catch (error) {
        console.error('Error fetching player punishments:', error);
        showError('Failed to load player data. Please try again later.');
    }
}

// Show player not found message
function showPlayerNotFound() {
    const profileCard = document.getElementById('profileCard');
    profileCard.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
            <i class="fas fa-user-slash" style="font-size: 4rem; color: var(--text-secondary); opacity: 0.5; margin-bottom: 1rem;"></i>
            <h2 style="color: var(--text); margin-bottom: 0.5rem;">Player Not Found</h2>
            <p style="color: var(--text-secondary); margin-bottom: 2rem;">
                The player "${playerName}" hasn't joined the server yet or has no punishment history.
            </p>
            <a href="punishments.html" class="back-link">
                <i class="fas fa-arrow-left"></i>
                Back to All Punishments
            </a>
        </div>
    `;
    
    // Hide filter section and table
    document.getElementById('filterSection').style.display = 'none';
    document.querySelector('.punishments-list').style.display = 'none';
}

// Display profile card with stats
function displayProfileCard() {
    const profileCard = document.getElementById('profileCard');
    
    console.log('Displaying profile card for:', playerName);
    console.log('All punishments:', allPunishments);
    console.log('Player UUID from data:', playerUUID);
    
    // Calculate statistics
    const stats = {
        total: allPunishments.length,
        active: allPunishments.filter(p => p.active).length,
        bans: allPunishments.filter(p => p.type && p.type.toLowerCase() === 'ban').length,
        mutes: allPunishments.filter(p => p.type && p.type.toLowerCase() === 'mute').length,
        blacklists: allPunishments.filter(p => p.type && p.type.toLowerCase() === 'blacklist').length,
        warnings: allPunishments.filter(p => p.type && p.type.toLowerCase() === 'warn').length,
        kicks: allPunishments.filter(p => p.type && p.type.toLowerCase() === 'kick').length
    };
    
    console.log('Stats calculated:', stats);

    // Use Crafatar for skin rendering - more reliable than mc-heads.net
    let skinUrl = `https://skins.mcstats.com/body/front/40f99169-b826-4317-9a64-5e2211638c7d?w=1920&q=75`;
    
    if (playerUUID) {
        const cleanUUID = playerUUID.replace(/-/g, '');
        skinUrl = `https://skins.mcstats.com/body/front/${cleanUUID}?w=1920&q=75`;
        console.log('Using player UUID for skin:', cleanUUID);
    } else {
        // Try Minotar as fallback using player name
        skinUrl = `https://minotar.net/armor/body/${playerName}/250`;
        console.log('Using player name for skin:', playerName);
    }
    
    console.log('Final skin URL:', skinUrl);

    profileCard.innerHTML = `
        <div class="profile-skin-section">
            <img src="${skinUrl}" alt="${playerName}" class="profile-skin" 
                 onerror="console.error('Skin failed to load:', this.src); this.src='https://crafatar.com/renders/body/steve?overlay&scale=10'">
            <div class="profile-name">${playerName}</div>
            ${playerUUID ? `<div class="profile-uuid">${playerUUID}</div>` : ''}
        </div>
        <div class="profile-info">
            <div class="profile-stats-grid">
                <div class="profile-stat">
                    <div class="profile-stat-number" style="color: #4caf50;">${stats.total}</div>
                    <div class="profile-stat-label">Total</div>
                </div>
                <div class="profile-stat">
                    <div class="profile-stat-number" style="color: #f44336;">${stats.active}</div>
                    <div class="profile-stat-label">Active</div>
                </div>
                <div class="profile-stat">
                    <div class="profile-stat-number" style="color: #f44336;">${stats.bans}</div>
                    <div class="profile-stat-label">Bans</div>
                </div>
                <div class="profile-stat">
                    <div class="profile-stat-number" style="color: #ff9800;">${stats.mutes}</div>
                    <div class="profile-stat-label">Mutes</div>
                </div>
                <div class="profile-stat">
                    <div class="profile-stat-number" style="color: #9c27b0;">${stats.blacklists}</div>
                    <div class="profile-stat-label">Blacklists</div>
                </div>
                <div class="profile-stat">
                    <div class="profile-stat-number" style="color: #ffc107;">${stats.warnings}</div>
                    <div class="profile-stat-label">Warnings</div>
                </div>
                <div class="profile-stat">
                    <div class="profile-stat-number" style="color: #03a9f4;">${stats.kicks}</div>
                    <div class="profile-stat-label">Kicks</div>
                </div>
            </div>
        </div>
    `;
    
    // Show filter section
    document.getElementById('filterSection').style.display = 'block';
}

// Setup filter buttons
function setupFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active from all tabs
            filterTabs.forEach(t => t.classList.remove('active'));
            // Add active to clicked tab
            tab.classList.add('active');
            // Apply filter
            currentFilter = tab.dataset.filter;
            currentPage = 1;
            applyFilter();
        });
    });
}

// Apply filter and display punishments
function applyFilter() {
    if (currentFilter === 'all') {
        filteredPunishments = [...allPunishments];
    } else {
        filteredPunishments = allPunishments.filter(p => 
            p.type.toLowerCase() === currentFilter.toLowerCase()
        );
    }
    
    displayPunishments();
}

// Display punishments in table
function displayPunishments() {
    const tbody = document.getElementById('punishmentsTableBody');
    
    if (filteredPunishments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 3rem;">
                    <div style="opacity: 0.6;">
                        <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                        <p>No ${currentFilter === 'all' ? '' : currentFilter} punishments found</p>
                    </div>
                </td>
            </tr>
        `;
        document.getElementById('paginationContainer').style.display = 'none';
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredPunishments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedPunishments = filteredPunishments.slice(startIndex, endIndex);
    
    // Display punishments
    tbody.innerHTML = paginatedPunishments.map(punishment => createPunishmentRow(punishment)).join('');
    
    // Update pagination
    updatePagination(totalPages);
}

// Create table row for punishment
function createPunishmentRow(punishment) {
    const formattedDate = new Date(punishment.issuedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    let duration = 'Permanent';
    if (!punishment.permanent && punishment.duration > 0) {
        duration = formatDuration(punishment.duration);
    }

    const typeClass = punishment.type.toLowerCase();
    const statusClass = punishment.active ? 'active' : 'inactive';
    
    return `
        <tr class="animate__animated animate__fadeIn">
            <td>
                <span class="punishment-type ${typeClass}">
                    <i class="fas fa-${getTypeIcon(typeClass)}"></i>
                    ${punishment.type}
                </span>
            </td>
            <td>${punishment.reason || 'No reason provided'}</td>
            <td>${punishment.issuedBy || 'Console'}</td>
            <td>${duration}</td>
            <td>${formattedDate}</td>
            <td>
                <span class="punishment-status ${statusClass}">
                    <i class="fas fa-${statusClass === 'active' ? 'check-circle' : 'times-circle'}"></i>
                    ${statusClass.charAt(0).toUpperCase() + statusClass.slice(1)}
                </span>
            </td>
        </tr>
    `;
}

// Get icon for punishment type
function getTypeIcon(type) {
    const icons = {
        'ban': 'ban',
        'mute': 'volume-mute',
        'blacklist': 'user-slash',
        'warn': 'exclamation-triangle',
        'kick': 'door-open'
    };
    return icons[type.toLowerCase()] || 'gavel';
}

// Format duration in milliseconds to readable format
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
}

// Update pagination controls
function updatePagination(totalPages) {
    if (totalPages <= 1) {
        document.getElementById('paginationContainer').style.display = 'none';
        return;
    }
    
    document.getElementById('paginationContainer').style.display = 'flex';
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    
    // Setup pagination button listeners (only once)
    if (!prevBtn.hasAttribute('data-listener')) {
        prevBtn.setAttribute('data-listener', 'true');
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayPunishments();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }
    
    if (!nextBtn.hasAttribute('data-listener')) {
        nextBtn.setAttribute('data-listener', 'true');
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                displayPunishments();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }
}
