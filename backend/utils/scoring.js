// Scoring calculation utilities
const { supabaseAdmin } = require('../config/database');

// Calculate points for a player in a gameweek
async function calculatePlayerPoints(playerId, gameweekId) {
    try {
        // Get player stats
        const { data: stats } = await supabaseAdmin
            .from('player_gameweek_stats')
            .select('*')
            .eq('player_id', playerId)
            .eq('gameweek_id', gameweekId)
            .single();

        if (!stats) {
            return 0;
        }

        // Get scoring system
        const { data: scoringSystem } = await supabaseAdmin
            .from('scoring_system')
            .select('*');

        const scoringMap = {};
        scoringSystem.forEach(s => {
            scoringMap[s.stat_name] = parseFloat(s.points_value);
        });

        // Calculate total points
        let totalPoints = 0;
        totalPoints += (stats.metres || 0) * (scoringMap['metres'] || 0);
        totalPoints += (stats.carries || 0) * (scoringMap['carries'] || 0);
        totalPoints += (stats.tackles || 0) * (scoringMap['tackles'] || 0);
        totalPoints += (stats.offloads || 0) * (scoringMap['offloads'] || 0);
        totalPoints += (stats.runs_from_dh || 0) * (scoringMap['runs_from_dh'] || 0);
        totalPoints += (stats.attacking_kicks || 0) * (scoringMap['attacking_kicks'] || 0);
        totalPoints += (stats.tries || 0) * (scoringMap['tries'] || 0);
        totalPoints += (stats.try_assists || 0) * (scoringMap['try_assists'] || 0);
        totalPoints += (stats.goals || 0) * (scoringMap['goals'] || 0);
        totalPoints += (stats.drop_goals || 0) * (scoringMap['drop_goals'] || 0);
        totalPoints += (stats.tackle_busts || 0) * (scoringMap['tackle_busts'] || 0);
        totalPoints += (stats.clean_breaks || 0) * (scoringMap['clean_breaks'] || 0);
        totalPoints += (stats.forty_twenty || 0) * (scoringMap['forty_twenty'] || 0);
        totalPoints += (stats.errors || 0) * (scoringMap['errors'] || 0);
        totalPoints += (stats.yellow_cards || 0) * (scoringMap['yellow_cards'] || 0);
        totalPoints += (stats.red_cards || 0) * (scoringMap['red_cards'] || 0);
        totalPoints += (stats.penalties || 0) * (scoringMap['penalties'] || 0);
        totalPoints += (stats.marker_tackles || 0) * (scoringMap['marker_tackles'] || 0);

        return Math.round(totalPoints);
    } catch (error) {
        console.error('Calculate player points error:', error);
        return 0;
    }
}

// Calculate team points for a gameweek (with auto-substitution)
async function calculateTeamPoints(userId, gameweekId) {
    try {
        // Get user's team
        const { data: team } = await supabaseAdmin
            .from('user_teams')
            .select('*')
            .eq('user_id', userId)
            .eq('gameweek_id', gameweekId)
            .single();

        if (!team) {
            return { gameweekPoints: 0, totalPoints: 0 };
        }

        // Get all starter IDs
        const starterIds = [
            team.starter_1, team.starter_2, team.starter_3, team.starter_4,
            team.starter_5, team.starter_6, team.starter_7, team.starter_8,
            team.starter_9, team.starter_10, team.starter_11, team.starter_12,
            team.starter_13
        ].filter(Boolean);

        // Get bench IDs
        const benchIds = [
            team.bench_1, team.bench_2, team.bench_3, team.bench_4
        ].filter(Boolean);

        // Get stats for all players
        const { data: starterStats } = await supabaseAdmin
            .from('player_gameweek_stats')
            .select('*, player:players(position)')
            .in('player_id', starterIds)
            .eq('gameweek_id', gameweekId);

        const { data: benchStats } = await supabaseAdmin
            .from('player_gameweek_stats')
            .select('*, player:players(position)')
            .in('player_id', benchIds)
            .eq('gameweek_id', gameweekId);

        let gameweekPoints = 0;

        // Process each starter
        for (const starterId of starterIds) {
            const stat = starterStats?.find(s => s.player_id === starterId);
            
            // If starter didn't play, try to auto-sub
            if (!stat || !stat.played) {
                // Find bench player with same position who played
                const starterPlayer = await supabaseAdmin
                    .from('players')
                    .select('position')
                    .eq('id', starterId)
                    .single();

                const benchSub = benchStats?.find(b => 
                    b.played && 
                    b.player?.position === starterPlayer.data?.position
                );

                if (benchSub) {
                    gameweekPoints += benchSub.points || 0;
                    console.log(`Auto-subbed bench player for ${starterId}`);
                    continue;
                }
            }

            // Use starter points
            gameweekPoints += stat?.points || 0;
        }

        // Double captain points
        if (team.captain_id) {
            const captainStat = starterStats?.find(s => s.player_id === team.captain_id);
            if (captainStat && captainStat.played) {
                gameweekPoints += captainStat.points || 0; // Add captain bonus (2x total)
            }
        }

        // Update team points
        const { error } = await supabaseAdmin
            .from('user_teams')
            .update({
                gameweek_points: gameweekPoints,
                total_points: (team.total_points || 0) + gameweekPoints
            })
            .eq('user_id', userId)
            .eq('gameweek_id', gameweekId);

        if (error) {
            console.error('Update team points error:', error);
        }

        return {
            gameweekPoints,
            totalPoints: (team.total_points || 0) + gameweekPoints
        };
    } catch (error) {
        console.error('Calculate team points error:', error);
        return { gameweekPoints: 0, totalPoints: 0 };
    }
}

module.exports = {
    calculatePlayerPoints,
    calculateTeamPoints
};