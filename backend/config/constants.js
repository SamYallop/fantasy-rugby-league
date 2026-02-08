// Application constants and configuration

module.exports = {
    // Budget
    BUDGET: 2100, // £2.1 million in thousands
    
    // Team composition
    TEAM_SIZE: {
        STARTERS: 13,
        BENCH: 4,
        TOTAL: 17
    },
    
    // Position requirements for starting 13
    POSITION_REQUIREMENTS: {
        'Full Back': 1,
        'Winger': 2,
        'Centre': 2,
        'Half Back': 2, // Stand Off OR Scrum Half
        'Prop': 2,
        'Hooker': 1,
        'Second Row': 2,
        'Loose Forward': 1
    },
    
    // Position mappings (for flexibility)
    POSITION_MAPPINGS: {
        'Stand Off': 'Half Back',
        'Scrum Half': 'Half Back'
    },
    
    // Transfer rules
    MAX_TRANSFERS_PER_WEEK: 2,
    MAX_PLAYERS_PER_TEAM: 3, // Max 3 players from same club
    
    // Deadlines
    TRANSFER_DEADLINE: {
        DAY: 4, // Thursday (0 = Sunday, 1 = Monday, etc.)
        TIME: '19:30' // 7:30 PM UK time
    },
    
    // Scraper schedule
    SCRAPER_SCHEDULE: {
        DAY: 1, // Monday
        TIME: '23:00' // 11:00 PM UK time
    },
    
    // JWT expiration
    JWT_EXPIRATION: '7d',
    
    // Pagination
    DEFAULT_PAGE_SIZE: 50,
    MAX_PAGE_SIZE: 200,
    
    // Mini-league code length
    LEAGUE_CODE_LENGTH: 8,
    
    // Super League 2026 rounds
    TOTAL_ROUNDS: 27,
    
    // Season year
    SEASON_YEAR: 2026
};