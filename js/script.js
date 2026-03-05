// ===================================
// MAIN APPLICATION INITIALIZATION
// ===================================

// Initialize the tournament bracket when page loads
document.addEventListener('DOMContentLoaded', () => {
    const tournament = new TournamentBracket();
    loadMatchDates();
    initDragToScroll();
    setupDiscordConfig();
    console.log('Tournament Bracket System initialized');
});
