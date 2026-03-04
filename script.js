// Tournament Bracket Management System
class TournamentBracket {
    constructor() {
        this.matches = new Map();
        this.results = new Map();
        this.init();
    }

    init() {
        this.loadProgress();
        this.setupEventListeners();
        this.updateBracketDisplay();
    }

    setupEventListeners() {
        // Confirm buttons for each match
        document.querySelectorAll('.confirm-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const matchElement = e.target.closest('.match');
                const matchId = matchElement.dataset.match;
                const round = matchElement.dataset.round;
                this.confirmMatch(matchId, round, matchElement);
            });
        });

        // Score inputs - enable confirm button when both scores are entered
        document.querySelectorAll('.score-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const matchElement = e.target.closest('.match');
                this.validateMatch(matchElement);
            });
        });

        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => {
            if (confirm('Tem certeza que deseja resetar todo o torneio? Esta ação não pode ser desfeita.')) {
                this.resetTournament();
            }
        });

        // Save button
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveProgress();
            this.showNotification('Progresso guardado com sucesso!', 'success');
        });

        // Top 3 button
        document.getElementById('top3Btn').addEventListener('click', () => {
            this.showTop3Modal();
        });

        // Discord config button
        document.getElementById('discordConfigBtn').addEventListener('click', () => {
            showDiscordConfigModal();
        });
    }

    validateMatch(matchElement) {
        const inputs = matchElement.querySelectorAll('.score-input:not(:disabled)');
        const confirmBtn = matchElement.querySelector('.confirm-btn');
        
        let allFilled = true;
        inputs.forEach(input => {
            if (input.value === '' || input.value === null) {
                allFilled = false;
            }
        });

        if (confirmBtn) {
            confirmBtn.disabled = !allFilled;
        }
    }

    confirmMatch(matchId, round, matchElement) {
        const teams = matchElement.querySelectorAll('.team:not(.tbd)');
        const scores = matchElement.querySelectorAll('.score-input:not(:disabled)');
        
        if (scores.length < 2) return;

        const score1 = parseInt(scores[0].value);
        const score2 = parseInt(scores[1].value);

        // Validate scores
        if (isNaN(score1) || isNaN(score2)) {
            this.showNotification('Por favor, insira resultados válidos!', 'error');
            return;
        }

        if (score1 === score2) {
            this.showNotification('Não pode haver empate! Um time deve vencer.', 'error');
            return;
        }

        // Determine winner
        const winner = score1 > score2 ? teams[0] : teams[1];
        const loser = score1 > score2 ? teams[1] : teams[0];
        const winnerName = winner.dataset.team;

        // Mark winner and loser
        winner.classList.add('winner');
        loser.classList.add('loser');

        // Disable inputs and update button
        scores.forEach(input => input.disabled = true);
        const confirmBtn = matchElement.querySelector('.confirm-btn');
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Confirmado';
        confirmBtn.classList.add('confirmed');
        matchElement.classList.add('completed');

        // Save result
        this.results.set(matchId, {
            winner: winnerName,
            score1: score1,
            score2: score2,
            team1: teams[0].dataset.team,
            team2: teams[1].dataset.team,
            round: round
        });

        // Advance winner to next round
        this.advanceWinner(matchId, winnerName, round);
        
        this.showNotification(`${winnerName} avança para a próxima ronda!`, 'success');
        this.saveProgress();
    }

    advanceWinner(matchId, winnerName, round) {
        const matchNum = parseInt(matchId);
        const roundNum = parseInt(round);

        // Define match progression logic
        let nextMatchId, teamPosition;

        if (roundNum === 1) {
            // Round 1 -> Round 2 / Fase MD3
            // Matches 1,2 -> 12; 3,4 -> 13; 5,6 -> 14; 7,8 -> 15; 9,10 -> 16; 11 (Aztecas) -> 20
            if (matchNum <= 2) {
                nextMatchId = 12;
                teamPosition = matchNum - 1;
            } else if (matchNum <= 4) {
                nextMatchId = 13;
                teamPosition = matchNum - 3;
            } else if (matchNum <= 6) {
                nextMatchId = 14;
                teamPosition = matchNum - 5;
            } else if (matchNum <= 8) {
                nextMatchId = 15;
                teamPosition = matchNum - 7;
            } else if (matchNum <= 10) {
                nextMatchId = 16;
                teamPosition = matchNum - 9;
            } else if (matchNum === 11) {
                nextMatchId = 20;
                teamPosition = 1;
            }
        } else if (roundNum === 2) {
            // Round 2 (matches 12-17) -> Round 3 (matches 18-20)
            // Matches 12,13 -> 18; 14,15 -> 19; 16 -> 20 (Aztecas já ocupam posição 1)
            if (matchNum <= 13) {
                nextMatchId = 18;
                teamPosition = matchNum - 12;
            } else if (matchNum <= 15) {
                nextMatchId = 19;
                teamPosition = matchNum - 14;
            } else if (matchNum === 16) {
                nextMatchId = 20;
                teamPosition = 0;
            }
        } else if (roundNum === 3) {
            // Round 3 (matches 18-20) -> Round 4 (match 21)
            // Matches 18,19,20 -> 21 but only 2 teams in final
            // So: 18 -> 21 position 0, 19 -> 21 position 1
            // Match 20 is for 3rd place or something
            if (matchNum === 18) {
                nextMatchId = 21;
                teamPosition = 0;
            } else if (matchNum === 19) {
                nextMatchId = 21;
                teamPosition = 1;
            } else if (matchNum === 20) {
                // This would be for positioning, we can skip for now
                return;
            }
        } else if (roundNum === 4) {
            // Final - update champion
            this.updateChampion(winnerName);
            return;
        }

        if (nextMatchId) {
            this.updateNextMatch(nextMatchId, winnerName, teamPosition);
        }
    }

    updateNextMatch(matchId, teamName, position) {
        const nextMatch = document.querySelector(`[data-match="${matchId}"]`);
        if (!nextMatch) return;

        const teams = nextMatch.querySelectorAll('.team');
        if (!teams[position]) return;

        const team = teams[position];
        team.classList.remove('tbd');
        team.dataset.team = teamName;
        team.querySelector('.team-name').textContent = teamName;

        // Check if both teams are now filled
        const allTeamsFilled = Array.from(teams).every(t => !t.classList.contains('tbd'));
        if (allTeamsFilled) {
            // Enable the match
            const inputs = nextMatch.querySelectorAll('.score-input');
            inputs.forEach(input => input.disabled = false);
            
            this.validateMatch(nextMatch);
        }
    }

    updateChampion(teamName) {
        const championDisplay = document.querySelector('.champion-name');
        championDisplay.textContent = teamName;
        championDisplay.style.animation = 'bounce 1s ease-in-out';
        
        this.showNotification(`🏆 ${teamName} é o CAMPEÃO! 🏆`, 'success');
    }

    saveProgress() {
        const data = {
            results: Array.from(this.results.entries()),
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('tournamentBracket', JSON.stringify(data));
    }

    loadProgress() {
        const saved = localStorage.getItem('tournamentBracket');
        if (!saved) return;

        try {
            const data = JSON.parse(saved);
            this.results = new Map(data.results);
            this.restoreBracket();
        } catch (e) {
            console.error('Error loading progress:', e);
        }
    }

    restoreBracket() {
        this.results.forEach((result, matchId) => {
            const matchElement = document.querySelector(`[data-match="${matchId}"]`);
            if (!matchElement) return;

            const teams = matchElement.querySelectorAll('.team:not(.tbd)');
            const scores = matchElement.querySelectorAll('.score-input');
            const confirmBtn = matchElement.querySelector('.confirm-btn');

            // Restore scores
            if (scores[0]) scores[0].value = result.score1;
            if (scores[1]) scores[1].value = result.score2;

            // Restore winner/loser status
            teams.forEach(team => {
                if (team.dataset.team === result.winner) {
                    team.classList.add('winner');
                } else {
                    team.classList.add('loser');
                }
            });

            // Disable controls
            scores.forEach(input => input.disabled = true);
            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.textContent = 'Confirmado';
                confirmBtn.classList.add('confirmed');
            }
            matchElement.classList.add('completed');

            // Advance winner (this will recursively update the bracket)
            this.updateNextMatchFromResult(matchId, result.winner, result.round);
        });
    }

    updateNextMatchFromResult(matchId, winnerName, round) {
        const matchNum = parseInt(matchId);
        const roundNum = parseInt(round);

        let nextMatchId, teamPosition;

        if (roundNum === 1) {
            if (matchNum <= 2) {
                nextMatchId = 12;
                teamPosition = matchNum - 1;
            } else if (matchNum <= 4) {
                nextMatchId = 13;
                teamPosition = matchNum - 3;
            } else if (matchNum <= 6) {
                nextMatchId = 14;
                teamPosition = matchNum - 5;
            } else if (matchNum <= 8) {
                nextMatchId = 15;
                teamPosition = matchNum - 7;
            } else if (matchNum <= 10) {
                nextMatchId = 16;
                teamPosition = matchNum - 9;
            } else if (matchNum === 11) {
                nextMatchId = 20;
                teamPosition = 1;
            }
        } else if (roundNum === 2) {
            if (matchNum <= 13) {
                nextMatchId = 18;
                teamPosition = matchNum - 12;
            } else if (matchNum <= 15) {
                nextMatchId = 19;
                teamPosition = matchNum - 14;
            } else if (matchNum === 16) {
                nextMatchId = 20;
                teamPosition = 0;
            }
        } else if (roundNum === 3) {
            if (matchNum === 18) {
                nextMatchId = 21;
                teamPosition = 0;
            } else if (matchNum === 19) {
                nextMatchId = 21;
                teamPosition = 1;
            } else if (matchNum === 20) {
                return;
            }
        } else if (roundNum === 4) {
            this.updateChampion(winnerName);
            return;
        }

        if (nextMatchId && !this.results.has(nextMatchId.toString())) {
            this.updateNextMatch(nextMatchId, winnerName, teamPosition);
        }
    }

    resetTournament() {
        // Clear all results
        this.results.clear();
        localStorage.removeItem('tournamentBracket');
        localStorage.removeItem('roundDates');
        localStorage.removeItem('matchDates');

        // Reload page to reset everything
        location.reload();
    }

    updateBracketDisplay() {
        // Initial setup - enable Aztecas as already advanced
        const aztecasMatch = document.querySelector('[data-match="11"]');
        if (aztecasMatch) {
            const aztecasTeam = aztecasMatch.querySelector('[data-team="Aztecas"]');
            if (aztecasTeam && !this.results.has('11')) {
                // Auto-advance Aztecas
                this.results.set('11', {
                    winner: 'Aztecas',
                    team1: 'Aztecas',
                    round: '1'
                });
                this.updateNextMatch(20, 'Aztecas', 1);
            }
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
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

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showTop3Modal() {
        const modal = document.getElementById('top3Modal');
        
        // Get Final result (match 21)
        const finalResult = this.results.get('21');
        // Get 3rd place match result (match 20)
        const thirdPlaceResult = this.results.get('20');
        
        const firstPlace = document.getElementById('firstPlace');
        const secondPlace = document.getElementById('secondPlace');
        const thirdPlace = document.getElementById('thirdPlace');
        
        if (finalResult) {
            firstPlace.textContent = finalResult.winner;
            // The loser is whoever is not the winner
            secondPlace.textContent = finalResult.team1 === finalResult.winner ? finalResult.team2 : finalResult.team1;
        } else {
            firstPlace.textContent = 'TBD';
            secondPlace.textContent = 'TBD';
        }
        
        if (thirdPlaceResult) {
            thirdPlace.textContent = thirdPlaceResult.winner;
        } else {
            thirdPlace.textContent = 'TBD';
        }
        
        modal.style.display = 'flex';
        
        // Close modal handlers
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.onclick = () => modal.style.display = 'none';
        
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
    }
}

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

// Initialize the tournament bracket when page loads
document.addEventListener('DOMContentLoaded', () => {
    const tournament = new TournamentBracket();
    loadMatchDates();
    initDragToScroll();
    setupDiscordConfig();
    console.log('Tournament Bracket System initialized');
});

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

// ===================================
// DISCORD WEBHOOK INTEGRATION
// ===================================

function setupDiscordConfig() {
    const saveBtn = document.getElementById('saveWebhook');
    const testBtn = document.getElementById('testWebhook');
    
    // Load saved webhook
    const savedWebhook = localStorage.getItem('discordWebhook');
    if (savedWebhook) {
        document.getElementById('webhookUrl').value = savedWebhook;
    }
    
    saveBtn.addEventListener('click', saveDiscordWebhook);
    testBtn.addEventListener('click', testDiscordWebhook);
}

function showDiscordConfigModal() {
    const modal = document.getElementById('discordModal');
    modal.style.display = 'flex';
    
    // Close modal handlers
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.onclick = () => modal.style.display = 'none';
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
}

function saveDiscordWebhook() {
    const webhookUrl = document.getElementById('webhookUrl').value.trim();
    const statusDiv = document.getElementById('webhookStatus');
    
    if (!webhookUrl) {
        statusDiv.textContent = '❌ Por favor, insira um URL válido!';
        statusDiv.className = 'webhook-status error';
        return;
    }
    
    if (!webhookUrl.includes('discord.com/api/webhooks/')) {
        statusDiv.textContent = '❌ URL inválido! Deve ser um webhook do Discord.';
        statusDiv.className = 'webhook-status error';
        return;
    }
    
    localStorage.setItem('discordWebhook', webhookUrl);
    statusDiv.textContent = '✅ Webhook guardado com sucesso!';
    statusDiv.className = 'webhook-status success';
    
    showNotification('Webhook do Discord configurado!', 'success');
    
    setTimeout(() => {
        statusDiv.textContent = '';
    }, 3000);
}

async function testDiscordWebhook() {
    const webhookUrl = document.getElementById('webhookUrl').value.trim();
    const statusDiv = document.getElementById('webhookStatus');
    
    if (!webhookUrl) {
        statusDiv.textContent = '❌ Configure o webhook primeiro!';
        statusDiv.className = 'webhook-status error';
        return;
    }
    
    statusDiv.textContent = '🔄 Enviando mensagem de teste...';
    statusDiv.className = 'webhook-status info';
    
    const embed = {
        embeds: [{
            title: '🧪 Teste de Webhook',
            description: 'Se você está vendo esta mensagem, o webhook está funcionando perfeitamente!',
            color: 0x0309F0, // rgb(3, 9, 240)
            timestamp: new Date().toISOString(),
            footer: {
                text: 'KalliRP Tournament System'
            }
        }]
    };
    
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(embed)
        });
        
        if (response.ok) {
            statusDiv.textContent = '✅ Teste enviado com sucesso! Verifique o Discord.';
            statusDiv.className = 'webhook-status success';
            showNotification('Mensagem de teste enviada!', 'success');
        } else {
            statusDiv.textContent = '❌ Erro ao enviar. Verifique o URL do webhook.';
            statusDiv.className = 'webhook-status error';
        }
    } catch (error) {
        statusDiv.textContent = '❌ Erro de conexão. Verifique sua internet.';
        statusDiv.className = 'webhook-status error';
    }
    
    setTimeout(() => {
        statusDiv.textContent = '';
    }, 5000);
}

async function sendMatchDateToDiscord(matchId, date, team1, team2, round) {
    const webhookUrl = localStorage.getItem('discordWebhook');
    
    if (!webhookUrl) {
        console.log('Discord webhook não configurado. Pulando notificação.');
        return;
    }
    
    const roundNames = {
        '1': 'Round 1',
        '2': 'Quartos de Final',
        '3': 'Meias-Finais (MD3)',
        '4': 'FINAL'
    };
    
    const embed = {
        embeds: [{
            title: '📅 Nova Data de Partida Agendada',
            description: `Uma nova data foi definida para a partida!`,
            color: 0x11DEFB, // rgb(17, 222, 251)
            fields: [
                {
                    name: '🎮 Partida',
                    value: `Match #${matchId}`,
                    inline: true
                },
                {
                    name: '🏆 Fase',
                    value: roundNames[round] || `Round ${round}`,
                    inline: true
                },
                {
                    name: '📆 Data/Hora',
                    value: date,
                    inline: false
                },
                {
                    name: '⚔️ Confronto',
                    value: `**${team1}** vs **${team2}**`,
                    inline: false
                }
            ],
            timestamp: new Date().toISOString(),
            footer: {
                text: 'KalliRP Tournament Brackets',
                icon_url: 'https://cdn.discordapp.com/emojis/🏆.png'
            }
        }]
    };
    
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(embed)
        });
        
        if (response.ok) {
            console.log(`✅ Notificação enviada ao Discord para match ${matchId}`);
        } else {
            console.error('❌ Erro ao enviar notificação ao Discord:', response.status);
        }
    } catch (error) {
        console.error('❌ Erro ao conectar com Discord webhook:', error);
    }
}
