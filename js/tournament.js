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
            showNotification('Progresso guardado com sucesso!', 'success');
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
            showNotification('Por favor, insira resultados válidos!', 'error');
            return;
        }

        if (score1 === score2) {
            showNotification('Não pode haver empate! Uma equipa deve vencer.', 'error');
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

        // Get loser name
        const loserName = loser.dataset.team;

        // Save result
        this.results.set(matchId, {
            winner: winnerName,
            loser: loserName,
            score1: score1,
            score2: score2,
            team1: teams[0].dataset.team,
            team2: teams[1].dataset.team,
            round: round
        });

        // Advance winner to next round
        this.advanceWinner(matchId, winnerName, round);
        
        // Advance loser if applicable (for 3rd place match)
        this.advanceLoser(matchId, loserName, round);
        
        showNotification(`${winnerName} avança para a próxima ronda!`, 'success');
        
        // Send result to Discord
        this.sendMatchResultToDiscord(matchId, {
            winner: winnerName,
            loser: loserName,
            score1: score1,
            score2: score2,
            team1: teams[0].dataset.team,
            team2: teams[1].dataset.team,
            round: round
        });
        
        this.saveProgress();
    }

    advanceWinner(matchId, winnerName, round) {
        const matchNum = parseInt(matchId);
        const roundNum = parseInt(round);

        // Define match progression logic
        let nextMatchId, teamPosition;

        if (roundNum === 1) {
            // Round 1 (11 matches) -> Round 2 (5 matches) + 1 bye direct to Round 3
            // Matches 1,2 -> 12; 3,4 -> 13; 5,6 -> 14; 7,8 -> 15; 9,10 -> 16
            // Match 11 -> 21 (direto para MD3)
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
                // Vencedor passa direto para PLAY-IN MD3!
                nextMatchId = 17;
                teamPosition = 1;
            }
        } else if (roundNum === 2) {
            // Round 2 (matches 12-16) -> Round 3 (Quartas 17, 18, 19)
            // 12 -> 17(0); 13 -> 18(0); 14 -> 18(1); 15 -> 19(0); 16 -> 19(1)
            if (matchNum === 12) {
                nextMatchId = 17;
                teamPosition = 0;
            } else if (matchNum === 13) {
                nextMatchId = 18;
                teamPosition = 0;
            } else if (matchNum === 14) {
                nextMatchId = 18;
                teamPosition = 1;
            } else if (matchNum === 15) {
                nextMatchId = 19;
                teamPosition = 0;
            } else if (matchNum === 16) {
                nextMatchId = 19;
                teamPosition = 1;
            }
        } else if (roundNum === 3) {
            // Round 3 Quartas (17, 18, 19) -> Match 20 (Semifinal) ou 21 (Final direta)
            // 17 -> 20(0); 18 -> 20(1); 19 -> 21(1) BYE direto
            if (matchNum === 17) {
                nextMatchId = 20;
                teamPosition = 0;
            } else if (matchNum === 18) {
                nextMatchId = 20;
                teamPosition = 1;
            } else if (matchNum === 19) {
                // Vencedor da Quarta #3 vai DIRETO para a Final (BYE)
                nextMatchId = 21;
                teamPosition = 1;
            }
        } else if (roundNum === 4) {
            // Round 4: Match 20 (Semifinal) -> 21 (Final); Match 22 (3º lugar) não avança
            if (matchNum === 20) {
                nextMatchId = 21;
                teamPosition = 0;
            } else if (matchNum === 22) {
                // Disputa de 3º lugar, não avança
                return;
            }
        } else if (roundNum === 5) {
            // Round 5 (Match 21, Final) -> Champion
            this.updateChampion(winnerName);
            return;
        }

        if (nextMatchId) {
            this.updateNextMatch(nextMatchId, winnerName, teamPosition);
        }
    }

    advanceLoser(matchId, loserName, round) {
        const matchNum = parseInt(matchId);
        const roundNum = parseInt(round);

        let thirdPlaceMatchId, teamPosition;

        // Only matches 19 (Quarta #3) and 20 (Semifinal) send losers to 3rd place
        if (roundNum === 3 && matchNum === 19) {
            // Perdedor da Quarta #3 vai para disputa de 3º lugar
            thirdPlaceMatchId = 22;
            teamPosition = 1;
        } else if (roundNum === 4 && matchNum === 20) {
            // Perdedor da Semifinal vai para disputa de 3º lugar
            thirdPlaceMatchId = 22;
            teamPosition = 0;
        } else {
            // Outros matches não enviam perdedores
            return;
        }

        if (thirdPlaceMatchId) {
            this.updateNextMatch(thirdPlaceMatchId, loserName, teamPosition);
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
        
        showNotification(`🏆 ${teamName} é o CAMPEÃO! 🏆`, 'success');
    }

    async sendMatchResultToDiscord(matchId, result) {
        const webhookUrl = localStorage.getItem('discordWebhook');
        
        if (!webhookUrl) {
            console.log('Discord webhook não configurado.');
            return;
        }
        
        const roundNames = {
            '1': 'Round 1',
            '2': 'Quartos de Final',
            '3': 'Quartas MD3',
            '4': 'Semifinal',
            '5': 'FINAL'
        };
        
        const embed = {
            embeds: [{
                title: '🎯 Resultado de Partida',
                description: `Match #${matchId} foi concluído!`,
                color: 0x00FF00, // Verde
                fields: [
                    {
                        name: '🏆 Fase',
                        value: roundNames[result.round] || `Round ${result.round}`,
                        inline: true
                    },
                    {
                        name: '⚔️ Confronto',
                        value: `**${result.team1}** ${result.score1} x ${result.score2} **${result.team2}**`,
                        inline: false
                    },
                    {
                        name: '✅ Vencedor',
                        value: `**${result.winner}**`,
                        inline: true
                    },
                    {
                        name: '❌ Eliminado',
                        value: result.loser,
                        inline: true
                    }
                ],
                timestamp: new Date().toISOString(),
                footer: {
                    text: 'KalliRP Tournament Brackets'
                }
            }]
        };
        
        try {
            await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(embed)
            });
            console.log(`✅ Resultado enviado ao Discord para match ${matchId}`);
            
            // Se for a Final (Match 21), enviar pódio após 3 segundos
            if (matchId === '21' && result.round === '5') {
                setTimeout(() => {
                    this.sendPodiumToDiscord();
                }, 3000);
            }
        } catch (error) {
            console.error('❌ Erro ao enviar resultado ao Discord:', error);
        }
    }

    async sendPodiumToDiscord() {
        console.log('🏆 Iniciando envio do pódio ao Discord...');
        
        const webhookUrl = localStorage.getItem('discordWebhook');
        
        if (!webhookUrl) {
            console.log('❌ Discord webhook não configurado.');
            showNotification('Configure o webhook do Discord primeiro!', 'error');
            return;
        }
        
        console.log('✅ Webhook encontrado:', webhookUrl.substring(0, 50) + '...');
        
        // Obter resultados da Final (Match 21) e Disputa 3º (Match 22)
        const finalResult = this.results.get('21');
        const thirdPlaceResult = this.results.get('22');
        
        console.log('📊 Resultado Final:', finalResult);
        console.log('📊 Resultado 3º Lugar:', thirdPlaceResult);
        
        if (!finalResult) {
            console.log('❌ Final ainda não concluída.');
            showNotification('A Final ainda não foi concluída!', 'error');
            return;
        }
        
        const champion = finalResult.winner;
        const runnerUp = finalResult.team1 === finalResult.winner ? finalResult.team2 : finalResult.team1;
        const thirdPlace = thirdPlaceResult ? thirdPlaceResult.winner : 'TBD';
        
        console.log('🥇 Campeão:', champion);
        console.log('🥈 Vice-Campeão:', runnerUp);
        console.log('🥉 Terceiro Lugar:', thirdPlace);
        
        const embed = {
            embeds: [{
                title: '🏆 PÓDIO DO TORNEIO KALLIRP 🏆',
                description: 'Os melhores do torneio foram definidos!',
                color: 0xFFD700, // Dourado
                fields: [
                    {
                        name: '🥇 CAMPEÃO',
                        value: `**${champion}**`,
                        inline: false
                    },
                    {
                        name: '🥈 VICE-CAMPEÃO',
                        value: `**${runnerUp}**`,
                        inline: false
                    },
                    {
                        name: '🥉 TERCEIRO LUGAR',
                        value: `**${thirdPlace}**`,
                        inline: false
                    }
                ],
                thumbnail: {
                    url: 'https://em-content.zobj.net/thumbs/160/twitter/351/trophy_1f3c6.png'
                },
                image: {
                    url: 'https://media.tenor.com/hzHJCRLYdesAAAAC/confetti-celebrate.gif'
                },
                timestamp: new Date().toISOString(),
                footer: {
                    text: 'KalliRP Tournament Brackets - Torneio Concluído!'
                }
            }]
        };
        
        console.log('📤 Enviando pódio para Discord...');
        console.log('📦 Embed:', JSON.stringify(embed, null, 2));
        
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(embed)
            });
            
            console.log('📨 Resposta do Discord:', response.status, response.statusText);
            
            if (response.ok) {
                console.log('🏆 Pódio enviado ao Discord com sucesso!');
            } else {
                console.error('❌ Erro na resposta:', await response.text());
            }
        } catch (error) {
            console.error('❌ Erro ao enviar pódio ao Discord:', error);
            throw error;
        }
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
            
            // Advance loser if applicable (for 3rd place match)
            if (result.loser) {
                this.updateLoserFromResult(matchId, result.loser, result.round);
            }
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
                nextMatchId = 17;
                teamPosition = 1;
            }
        } else if (roundNum === 2) {
            if (matchNum === 12) {
                nextMatchId = 17;
                teamPosition = 0;
            } else if (matchNum === 13) {
                nextMatchId = 18;
                teamPosition = 0;
            } else if (matchNum === 14) {
                nextMatchId = 18;
                teamPosition = 1;
            } else if (matchNum === 15) {
                nextMatchId = 19;
                teamPosition = 0;
            } else if (matchNum === 16) {
                nextMatchId = 19;
                teamPosition = 1;
            }
        } else if (roundNum === 3) {
            if (matchNum === 17) {
                nextMatchId = 20;
                teamPosition = 0;
            } else if (matchNum === 18) {
                nextMatchId = 20;
                teamPosition = 1;
            } else if (matchNum === 19) {
                nextMatchId = 21;
                teamPosition = 1;
            }
        } else if (roundNum === 4) {
            if (matchNum === 20) {
                nextMatchId = 21;
                teamPosition = 0;
            } else if (matchNum === 22) {
                return;
            }
        } else if (roundNum === 5) {
            this.updateChampion(winnerName);
            return;
        }

        if (nextMatchId && !this.results.has(nextMatchId.toString())) {
            this.updateNextMatch(nextMatchId, winnerName, teamPosition);
        }
    }

    updateLoserFromResult(matchId, loserName, round) {
        const matchNum = parseInt(matchId);
        const roundNum = parseInt(round);

        let thirdPlaceMatchId, teamPosition;

        // Only matches 19 (Quarta #3) and 20 (Semifinal) send losers to 3rd place
        if (roundNum === 3 && matchNum === 19) {
            thirdPlaceMatchId = 22;
            teamPosition = 1;
        } else if (roundNum === 4 && matchNum === 20) {
            thirdPlaceMatchId = 22;
            teamPosition = 0;
        } else {
            return;
        }

        if (thirdPlaceMatchId && !this.results.has(thirdPlaceMatchId.toString())) {
            this.updateNextMatch(thirdPlaceMatchId, loserName, teamPosition);
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
        // Initial setup if needed
        // Currently no special initialization required
    }

    showTop3Modal() {
        const modal = document.getElementById('top3Modal');
        
        // Get Final result (match 21)
        const finalResult = this.results.get('21');
        // Get 3rd place match result (match 22)
        const thirdPlaceResult = this.results.get('22');
        
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
        
        // Send Podium to Discord button
        const sendPodiumBtn = document.getElementById('sendPodiumBtn');
        if (sendPodiumBtn) {
            sendPodiumBtn.onclick = async () => {
                console.log('Botão de enviar pódio clicado!');
                try {
                    await this.sendPodiumToDiscord();
                    showNotification('Pódio enviado para o Discord!', 'success');
                } catch (error) {
                    console.error('Erro ao enviar pódio:', error);
                    showNotification('Erro ao enviar pódio. Verifique o console.', 'error');
                }
            };
        }
    }
}
