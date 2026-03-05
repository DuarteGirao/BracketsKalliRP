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
            description: 'Se está a ver esta mensagem, o webhook está a funcionar perfeitamente!',
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
        '3': 'Quartas MD3',
        '4': 'Semifinal',
        '5': 'FINAL'
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
