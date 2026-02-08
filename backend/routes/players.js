// Players routes
const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/database');
const { optionalAuth } = require('../middleware/auth');
const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('../config/constants');

// GET /api/players - Get all players with filters
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { 
            team, 
            position, 
            search,
            minPrice,
            maxPrice,
            page = 1,
            pageSize = DEFAULT_PAGE_SIZE,
            sortBy = 'total_points',
            sortOrder = 'desc'
        } = req.query;

        let query = supabaseAdmin
            .from('players')
            .select('*', { count: 'exact' });

        // Filters
        if (team) {
            query = query.eq('team', team);
        }

        if (position) {
         // Trim whitespace and handle exact match
        query = query.eq('position', position.trim());
        }

        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        if (minPrice) {
            query = query.gte('price', parseInt(minPrice));
        }

        if (maxPrice) {
            query = query.lte('price', parseInt(maxPrice));
        }

        // Sorting
        const validSortFields = ['name', 'team', 'position', 'price', 'total_points'];
        if (validSortFields.includes(sortBy)) {
            query = query.order(sortBy, { ascending: sortOrder === 'asc' });
        }

        // Pagination
        const limit = Math.min(parseInt(pageSize), MAX_PAGE_SIZE);
        const offset = (parseInt(page) - 1) * limit;
        query = query.range(offset, offset + limit - 1);

        const { data: players, error, count } = await query;

        if (error) {
            console.error('Players fetch error:', error);
            return res.status(500).json({ error: 'Failed to fetch players' });
        }

        // Get ownership percentages if user is logged in
        let playersWithOwnership = players;
        
        if (req.user) {
            // Get total users
            const { count: totalUsers } = await supabaseAdmin
                .from('users')
                .select('id', { count: 'exact', head: true });

            // Get ownership counts
            const { data: ownershipData } = await supabaseAdmin
                .from('player_ownership')
                .select('player_id')
                .in('player_id', players.map(p => p.id));

            const ownershipCounts = {};
            ownershipData?.forEach(o => {
                ownershipCounts[o.player_id] = (ownershipCounts[o.player_id] || 0) + 1;
            });

            playersWithOwnership = players.map(player => ({
                ...player,
                ownership_percentage: totalUsers > 0 
                    ? ((ownershipCounts[player.id] || 0) / totalUsers * 100).toFixed(1)
                    : 0
            }));
        }

        res.json({
            players: playersWithOwnership,
            pagination: {
                page: parseInt(page),
                pageSize: limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Players error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/players/:id - Get single player with detailed stats
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Get player basic info
        const { data: player, error: playerError } = await supabaseAdmin
            .from('players')
            .select('*')
            .eq('id', id)
            .single();

        if (playerError || !player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        // Get gameweek stats
        const { data: gameweekStats } = await supabaseAdmin
            .from('player_gameweek_stats')
            .select(`
                *,
                gameweek:gameweeks(round_number, deadline)
            `)
            .eq('player_id', id)
            .order('gameweek_id', { ascending: false })
            .limit(10);

        // Calculate aggregate stats from ALL gameweeks (not just last 10)
        const { data: allGameweekStats } = await supabaseAdmin
            .from('player_gameweek_stats')
            .select('*')
            .eq('player_id', id);

        const stats = {
            appearances: allGameweekStats?.filter(gw => gw.played).length || 0,
            tries: allGameweekStats?.reduce((sum, gw) => sum + (gw.tries || 0), 0) || 0,
            try_assists: allGameweekStats?.reduce((sum, gw) => sum + (gw.try_assists || 0), 0) || 0,
            goals: allGameweekStats?.reduce((sum, gw) => sum + (gw.goals || 0), 0) || 0,
            tackle_busts: allGameweekStats?.reduce((sum, gw) => sum + (gw.tackle_busts || 0), 0) || 0,
            clean_breaks: allGameweekStats?.reduce((sum, gw) => sum + (gw.clean_breaks || 0), 0) || 0,
            tackles: allGameweekStats?.reduce((sum, gw) => sum + (gw.tackles || 0), 0) || 0,
            marker_tackles: allGameweekStats?.reduce((sum, gw) => sum + (gw.marker_tackles || 0), 0) || 0,
            offloads: allGameweekStats?.reduce((sum, gw) => sum + (gw.offloads || 0), 0) || 0,
            metres: allGameweekStats?.reduce((sum, gw) => sum + (gw.metres || 0), 0) || 0,
            carries: allGameweekStats?.reduce((sum, gw) => sum + (gw.carries || 0), 0) || 0,
            runs_from_dummy_half: allGameweekStats?.reduce((sum, gw) => sum + (gw.runs_from_dummy_half || 0), 0) || 0,
            errors: allGameweekStats?.reduce((sum, gw) => sum + (gw.errors || 0), 0) || 0,
            penalties: allGameweekStats?.reduce((sum, gw) => sum + (gw.penalties || 0), 0) || 0,
            yellow_cards: allGameweekStats?.reduce((sum, gw) => sum + (gw.yellow_cards || 0), 0) || 0,
            red_cards: allGameweekStats?.reduce((sum, gw) => sum + (gw.red_cards || 0), 0) || 0,
            forty_twenty: allGameweekStats?.reduce((sum, gw) => sum + (gw.forty_twenty || 0), 0) || 0,
        };

        // Calculate form (last 5 gameweeks average)
        const last5 = gameweekStats?.slice(0, 5) || [];
        const form = last5.length > 0
            ? (last5.reduce((sum, gw) => sum + (gw.points || 0), 0) / last5.length).toFixed(1)
            : 0;

        // Get ownership if user is logged in
        let ownership_percentage = 0;
        if (req.user) {
            const { count: totalTeams } = await supabaseAdmin
                .from('user_teams')
                .select('*', { count: 'exact', head: true });

            const { count: owningTeams } = await supabaseAdmin
                .from('user_player_ownership')
                .select('*', { count: 'exact', head: true })
                .eq('player_id', id);

            if (totalTeams > 0) {
                ownership_percentage = ((owningTeams / totalTeams) * 100).toFixed(1);
            }
        }

        res.json({
            player: {
                ...player,
                stats,
                form,
                ownership_percentage,
                gameweek_stats: gameweekStats
            }
        });
    } catch (error) {
        console.error('Get player error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/players/teams/all - Get list of all teams
router.get('/teams/all', async (req, res) => {
    try {
        const { data: teams, error } = await supabaseAdmin
            .from('players')
            .select('team')
            .order('team');

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch teams' });
        }

        // Get unique teams
        const uniqueTeams = [...new Set(teams.map(t => t.team))].filter(Boolean);

        res.json({ teams: uniqueTeams });
    } catch (error) {
        console.error('Teams error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/players/positions/all - Get list of all positions
router.get('/positions/all', async (req, res) => {
    try {
        const positions = [
            'Full Back',
            'Winger',
            'Centre',
            'Stand Off',
            'Scrum Half',
            'Prop',
            'Hooker',
            'Second Row',
            'Loose Forward'
        ];

        res.json({ positions });
    } catch (error) {
        console.error('Positions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/players/debug/positions - Debug endpoint
router.get('/debug/positions', async (req, res) => {
    try {
        const { data: players } = await supabaseAdmin
            .from('players')
            .select('position');

        const positions = {};
        players.forEach(p => {
            positions[p.position] = (positions[p.position] || 0) + 1;
        });

        res.json({ 
            positions,
            sample: players.slice(0, 10)
        });
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/players/:id - Get single player with detailed stats
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Get player basic info
        const { data: player, error: playerError } = await supabaseAdmin
            .from('players')
            .select('*')
            .eq('id', id)
            .single();

        if (playerError || !player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        // Get gameweek stats
        const { data: gameweekStats } = await supabaseAdmin
            .from('player_gameweek_stats')
            .select(`
                *,
                gameweek:gameweeks(round_number, deadline)
            `)
            .eq('player_id', id)
            .order('gameweek_id', { ascending: false })
            .limit(10);

        // Calculate aggregate stats
        const stats = {
            appearances: gameweekStats?.filter(gw => gw.played).length || 0,
            tries: gameweekStats?.reduce((sum, gw) => sum + (gw.tries || 0), 0) || 0,
            try_assists: gameweekStats?.reduce((sum, gw) => sum + (gw.try_assists || 0), 0) || 0,
            goals: gameweekStats?.reduce((sum, gw) => sum + (gw.goals || 0), 0) || 0,
            tackle_busts: gameweekStats?.reduce((sum, gw) => sum + (gw.tackle_busts || 0), 0) || 0,
            clean_breaks: gameweekStats?.reduce((sum, gw) => sum + (gw.clean_breaks || 0), 0) || 0,
            tackles: gameweekStats?.reduce((sum, gw) => sum + (gw.tackles || 0), 0) || 0,
            marker_tackles: gameweekStats?.reduce((sum, gw) => sum + (gw.marker_tackles || 0), 0) || 0,
            offloads: gameweekStats?.reduce((sum, gw) => sum + (gw.offloads || 0), 0) || 0,
            metres: gameweekStats?.reduce((sum, gw) => sum + (gw.metres || 0), 0) || 0,
            carries: gameweekStats?.reduce((sum, gw) => sum + (gw.carries || 0), 0) || 0,
            runs_from_dummy_half: gameweekStats?.reduce((sum, gw) => sum + (gw.runs_from_dummy_half || 0), 0) || 0,
            errors: gameweekStats?.reduce((sum, gw) => sum + (gw.errors || 0), 0) || 0,
            penalties: gameweekStats?.reduce((sum, gw) => sum + (gw.penalties || 0), 0) || 0,
            yellow_cards: gameweekStats?.reduce((sum, gw) => sum + (gw.yellow_cards || 0), 0) || 0,
            red_cards: gameweekStats?.reduce((sum, gw) => sum + (gw.red_cards || 0), 0) || 0,
            forty_twenty: gameweekStats?.reduce((sum, gw) => sum + (gw.forty_twenty || 0), 0) || 0,
        };

        // Calculate form (last 5 gameweeks average)
        const last5 = gameweekStats?.slice(0, 5) || [];
        const form = last5.length > 0
            ? (last5.reduce((sum, gw) => sum + (gw.points || 0), 0) / last5.length).toFixed(1)
            : 0;

        // Get ownership if user is logged in
        let ownership_percentage = 0;
        if (req.user) {
            const { count: totalTeams } = await supabaseAdmin
                .from('user_teams')
                .select('*', { count: 'exact', head: true });

            const { count: owningTeams } = await supabaseAdmin
                .from('user_player_ownership')
                .select('*', { count: 'exact', head: true })
                .eq('player_id', id);

            if (totalTeams > 0) {
                ownership_percentage = ((owningTeams / totalTeams) * 100).toFixed(1);
            }
        }

        res.json({
            player: {
                ...player,
                stats,
                form,
                ownership_percentage,
                gameweek_stats: gameweekStats
            }
        });
    } catch (error) {
        console.error('Get player error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;