# KalliRP Tournament Brackets

Sistema de gestão de torneio eliminatório para KalliRP com 22 equipas.

## 📁 Estrutura do Projeto

### Arquivos Principais
- `index.html` - Página principal do torneio

### 📂 CSS Modular (`/css/`)
- `styles.css` - Arquivo principal que importa todos os módulos
- `base.css` - Reset CSS, variáveis e animações
- `header.css` - Estilos do cabeçalho e navegação
- `bracket.css` - Estilos do bracket e partidas
- `modal.css` - Estilos dos modais (Top 3, Discord)
- `responsive.css` - Media queries e design responsivo

### 📂 JavaScript Modular (`/js/`)
- `script.js` - Inicialização principal da aplicação
- `tournament.js` - Classe TournamentBracket e lógica do torneio
- `discord.js` - Integração com webhook do Discord
- `ui.js` - Funcionalidades de UI (drag-to-scroll, notificações, datas)

## 🎮 Equipas Participantes (22)

### Round 1 - 11 Partidas
1. Reapers vs Los Piratas
2. Vanilla vs Club77
3. Triads vs Vagos
4. Kibera vs Belluci
5. Bahamas vs Southside
6. Ballas vs OBlock
7. Bloods vs SOA
8. LSPD vs Demonike
9. Fury vs Tequila
10. Olympus vs 18th
11. **Synndicate vs Aztecas** ⭐ (Nova adição)

## 📊 Estrutura do Torneio

- **Round 1**: 11 partidas (22 equipas)
  - ⭐ **Match 11** (Synndicate vs Aztecas): Vencedor passa **direto para MD3 (Match 20)**!
- **Quartos de Final**: 5 partidas (10 vencedores do Round 1, exceto match 11)
- **Meias-Finais (MD3)**: 3 partidas
  - **Match 18**: Vencedor vai para a Final
  - **Match 19**: Disputa de 3º lugar 🥉
  - **Match 20**: Vencedor do match 16 **vs** vencedor direto do match 11 → vai para a Final
- **Final**: Match 18 winner vs Match 20 winner 🏆
- **Campeão**: Winner takes all! 👑

## 🚀 Funcionalidades

- ✅ Gestão completa de partidas e resultados
- ✅ Sistema de drag-to-scroll no bracket
- ✅ Edição de datas das partidas
- ✅ Integração com Discord Webhook
- ✅ Guardar/Carregar progresso (LocalStorage)
- ✅ Modal Top 3 com pódio animado
- ✅ Design responsivo
- ✅ Código modular e otimizado

## 🔧 Melhorias na Versão Atual

### Otimizações
- **CSS Modular**: Dividido em 5 arquivos para melhor manutenção
- **JavaScript Modular**: Dividido em 4 arquivos por responsabilidade
- **Nova Equipa**: Synndicate adicionada ao torneio
- **Estrutura Clara**: Pastas `/css/` e `/js/` organizadas

### Vantagens da Modularização
- ✨ Código mais fácil de manter
- ✨ Melhor organização por responsabilidade
- ✨ Carregamento otimizado
- ✨ Facilita trabalho em equipa
- ✨ Reutilização de código

## 📝 Como Usar

1. Abra `index.html` no navegador
2. Configure o Discord Webhook (opcional) clicando no botão 🔗
3. Edite as datas das partidas clicando nos campos
4. Insira os resultados e confirme
5. O sistema avançará automaticamente os vencedores
6. Visualize o Top 3 a qualquer momento clicando em 🏆

## 💾 Persistência de Dados

O sistema guarda automaticamente:
- Resultados de todas as partidas
- Datas editadas
- Configuração do Discord Webhook

Todos os dados são armazenados no LocalStorage do navegador.

---

**Desenvolvido para KalliRP Tournament 2026** 🎮
