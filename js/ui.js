// ===================================
// UI FUNCTIONALITY & UTILITIES
// ===================================

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Function to scroll to specific round
function scrollToRound(roundNum) {
    const roundElement = document.querySelector(`[data-round="${roundNum}"]`);
    if (roundElement) {
        const bracketContainer = document.querySelector('.bracket-container');
        const scrollLeft = roundElement.offsetLeft - bracketContainer.offsetLeft - 20;
        
        bracketContainer.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
        });

        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelector(`.nav-tab[data-round="${roundNum}"]`)?.classList.add('active');

        // Highlight the round briefly
        roundElement.style.transition = 'transform 0.3s ease';
        roundElement.style.transform = 'scale(1.02)';
        setTimeout(() => {
            roundElement.style.transform = 'scale(1)';
        }, 300);
    }
}

// ===================================
// DRAG TO SCROLL FUNCTIONALITY
// ===================================

function initDragToScroll() {
    const bracketContainer = document.querySelector('.bracket-container');
    if (!bracketContainer) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    const isInteractiveTarget = (target) => {
        return Boolean(target.closest('input, button, .team, .score-input, .edit-date-input, .confirm-btn, .edit-date-btn'));
    };

    const endDrag = () => {
        if (!isDown) return;
        isDown = false;
        bracketContainer.classList.remove('dragging');
        bracketContainer.style.scrollBehavior = 'smooth';
    };

    bracketContainer.addEventListener('mousedown', (e) => {
        // Don't drag if clicking on interactive elements
        if (isInteractiveTarget(e.target)) {
            return;
        }
        
        isDown = true;
        bracketContainer.classList.add('dragging');
        startX = e.pageX - bracketContainer.offsetLeft;
        scrollLeft = bracketContainer.scrollLeft;
        bracketContainer.style.scrollBehavior = 'auto';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();

        const x = e.pageX - bracketContainer.offsetLeft;
        const walk = (x - startX) * 1.8;
        bracketContainer.scrollLeft = scrollLeft - walk;
    });

    document.addEventListener('mouseup', endDrag);
    window.addEventListener('blur', endDrag);
}

// ===================================
// INDIVIDUAL MATCH DATE MANAGEMENT
// ===================================

function updateMatchDate(matchId) {
    const matchElement = document.querySelector(`[data-match="${matchId}"]`);
    const dateInput = matchElement.querySelector('.edit-date-input');
    const dateBtn = matchElement.querySelector('.edit-date-btn');
    const newDate = dateInput.value.trim();
    
    if (!newDate) {
        alert('Por favor, insira uma data válida!');
        return;
    }
    
    // Get team names
    const teams = matchElement.querySelectorAll('.team');
    const team1 = teams[0]?.querySelector('.team-name')?.textContent || 'TBD';
    const team2 = teams[1]?.querySelector('.team-name')?.textContent || 'TBD';
    const round = matchElement.dataset.round;
    
    // Save to localStorage
    const matchDates = JSON.parse(localStorage.getItem('matchDates') || '{}');
    matchDates[`match${matchId}`] = newDate;
    localStorage.setItem('matchDates', JSON.stringify(matchDates));
    
    // Visual feedback
    dateBtn.textContent = '✓';
    dateBtn.style.background = 'rgb(17, 222, 251)';
    dateBtn.style.color = 'rgb(2, 7, 170)';
    setTimeout(() => {
        dateBtn.textContent = '✓';
    }, 1000);
    
    // Show success notification
    showNotification(`✓ Data da partida ${matchId} atualizada!`, 'success');
    
    // Send to Discord webhook
    sendMatchDateToDiscord(matchId, newDate, team1, team2, round);
}

function loadMatchDates() {
    const matchDates = JSON.parse(localStorage.getItem('matchDates') || '{}');
    
    Object.keys(matchDates).forEach(key => {
        const matchId = key.replace('match', '');
        const matchElement = document.querySelector(`[data-match="${matchId}"]`);
        if (matchElement) {
            const dateInput = matchElement.querySelector('.edit-date-input');
            if (dateInput) {
                dateInput.value = matchDates[key];
            }
        }
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 25px',
        borderRadius: '10px',
        color: 'white',
        fontWeight: '600',
        fontSize: '1rem',
        zIndex: '10000',
        animation: 'slideIn 0.3s ease-out',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        maxWidth: '400px'
    });

    if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, rgb(17, 222, 251), rgb(3, 9, 240))';
        notification.style.color = 'rgb(2, 7, 170)';
    } else if (type === 'error') {
        notification.style.background = 'linear-gradient(135deg, rgb(3, 9, 240), rgb(2, 7, 170))';
    } else {
        notification.style.background = 'linear-gradient(135deg, rgb(3, 9, 240), rgb(17, 222, 251))';
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
