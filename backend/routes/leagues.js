// Leagues routes - mini-leagues management
const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { LEAGUE_CODE_LENGTH } = require('../config/constants');

// Generate random league code
function generateLeagueCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing characters
    let code = '';
    for (let i = 0; i < LEAGUE_CODE_LENGTH; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// POST /api/leagues/create - Create mini-league
router.post('/create', authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || name.length < 3) {
            return res.status(400).json({ error: 'League name must be at least 3 characters' });
        }

        // Generate unique code
        let code;
        let codeExists = true;
        
        while (codeExists) {
            code = generateLeagueCode();
            const { data } = await supabaseAdmin
                .from('mini_leagues')
                .select('id')
                .eq('code', code)
                .single();
            
            codeExists = !!data;
        }

        // Create league
        const { data: league, error } = await supabaseAdmin
            .from('mini_leagues')
            .insert({
                name,
                code,
                created_by: req.user.id
            })
            .select()
            .single();

        if (error) {
            console.error('League create error:', error);
            return res.status(500).json({ error: 'Failed to create league' });
        }

        // Auto-join creator
        await supabaseAdmin
            .from('mini_league_members')
            .insert({
                mini_league_id: league.id,
                user_id: req.user.id
            });

        res.status(201).json({
            message: 'League created successfully',
            league
        });
    } catch (error) {
        console.error('Create league error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/leagues/join - Join mini-league
router.post('/join', authenticateToken, async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'League code required' });
        }

        // Find league
        const { data: league, error } = await supabaseAdmin
            .from('mini_leagues')
            .select('*')
            .eq('code', code.toUpperCase())
            .single();

        if (error || !league) {
            return res.status(404).json({ error: 'Invalid league code' });
        }

        // Check if already member
        const { data: existing } = await supabaseAdmin
            .from('mini_league_members')
            .select('id')
            .eq('mini_league_id', league.id)
            .eq('user_id', req.user.id)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'Already a member of this league' });
        }

        // Join league
        await supabaseAdmin
            .from('mini_league_members')
            .insert({
                mini_league_id: league.id,
                user_id: req.user.id
            });

        res.json({
            message: 'Joined league successfully',
            league
        });
    } catch (error) {
        console.error('Join league error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/leagues/my-leagues - Get user's leagues
router.get('/my-leagues', authenticateToken, async (req, res) => {
    try {
        const { data: memberships, error } = await supabaseAdmin
            .from('mini_league_members')
            .select(`
                *,
                league:mini_leagues(*)
            `)
            .eq('user_id', req.user.id);

        if (error) {
            console.error('My leagues error:', error);
            return res.status(500).json({ error: 'Failed to fetch leagues' });
        }

        const leagues = memberships?.map(m => m.league) || [];

        res.json({ leagues });
    } catch (error) {
        console.error('My leagues error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/leagues/:id/standings - Get league standings
router.get('/:id/standings', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Get league
        const { data: league } = await supabaseAdmin
            .from('mini_leagues')
            .select('*')
            .eq('id', id)
            .single();

        if (!league) {
            return res.status(404).json({ error: 'League not found' });
        }

        // Get members
        const { data: memberships } = await supabaseAdmin
            .from('mini_league_members')
            .select(`
                user_id,
                user:users(username, team_name)
            `)
            .eq('mini_league_id', id);

        if (!memberships) {
            return res.json({ league, standings: [] });
        }

        // Get current gameweek
        const { data: currentGW } = await supabaseAdmin
            .from('gameweeks')
            .select('*')
            .eq('is_current', true)
            .single();

        // Get latest scores for each member
        const standings = await Promise.all(
            memberships.map(async (member) => {
                const { data: team } = await supabaseAdmin
                    .from('user_teams')
                    .select('total_points, gameweek_points')
                    .eq('user_id', member.user_id)
                    .eq('gameweek_id', currentGW?.id)
                    .single();

                return {
                    userId: member.user_id,
                    username: member.user.username,
                    teamName: member.user.team_name,
                    totalPoints: team?.total_points || 0,
                    gameweekPoints: team?.gameweek_points || 0
                };
            })
        );

        // Sort by total points
        standings.sort((a, b) => b.totalPoints - a.totalPoints);

        // Add ranks
        standings.forEach((team, index) => {
            team.rank = index + 1;
        });

        res.json({
            league,
            standings
        });
    } catch (error) {
        console.error('League standings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/leagues/overall/standings - Get overall league standings
router.get('/overall/standings', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;

        // Get current gameweek
        const { data: currentGW } = await supabaseAdmin
            .from('gameweeks')
            .select('*')
            .eq('is_current', true)
            .single();

        if (!currentGW) {
            return res.json({ standings: [] });
        }

        // Get all user teams for current gameweek
        const { data: teams, count } = await supabaseAdmin
            .from('user_teams')
            .select(`
                *,
                user:users(username, team_name)
            `, { count: 'exact' })
            .eq('gameweek_id', currentGW.id)
            .order('total_points', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        const standings = teams?.map((team, index) => ({
            rank: (page - 1) * limit + index + 1,
            userId: team.user_id,
            username: team.user.username,
            teamName: team.user.team_name,
            totalPoints: team.total_points,
            gameweekPoints: team.gameweek_points
        })) || [];

        res.json({
            standings,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count
            }
        });
    } catch (error) {
        console.error('Overall standings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;