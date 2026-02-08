// Team validation utilities
const { POSITION_REQUIREMENTS, POSITION_MAPPINGS, TEAM_SIZE } = require('../config/constants');

// Validate team composition
function validateTeam(players, starters, bench, captainId) {
    // Check team size
    if (starters.length !== TEAM_SIZE.STARTERS) {
        return { valid: false, error: `Must have ${TEAM_SIZE.STARTERS} starters` };
    }

    if (bench.length !== TEAM_SIZE.BENCH) {
        return { valid: false, error: `Must have ${TEAM_SIZE.BENCH} bench players` };
    }

    // Check no duplicates
    const allIds = [...starters, ...bench];
    const uniqueIds = [...new Set(allIds)];
    if (allIds.length !== uniqueIds.length) {
        return { valid: false, error: 'Cannot select the same player multiple times' };
    }

    // Check captain is in starters
    if (!starters.includes(captainId)) {
        return { valid: false, error: 'Captain must be in starting 13' };
    }

    // Get starter players
    const starterPlayers = players.filter(p => starters.includes(p.id));

    // Map positions (Stand Off/Scrum Half -> Half Back)
    const mappedPositions = starterPlayers.map(p => {
        const position = p.position;
        return POSITION_MAPPINGS[position] || position;
    });

    // Count positions
    const positionCounts = {};
    mappedPositions.forEach(pos => {
        positionCounts[pos] = (positionCounts[pos] || 0) + 1;
    });

    // Validate position requirements
    for (const [position, required] of Object.entries(POSITION_REQUIREMENTS)) {
        const count = positionCounts[position] || 0;
        if (count !== required) {
            return { 
                valid: false, 
                error: `Must have exactly ${required} ${position}${required > 1 ? 's' : ''} (have ${count})` 
            };
        }
    }

    return { valid: true };
}

module.exports = {
    validateTeam
};