// Admin routes
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { supabaseAdmin } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

// All admin routes require authentication and admin status
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/users - Get all users
router.get('/users', async (req, res) => {
    try {
        const { data: users, error } = await supabaseAdmin
            .from('users')
            .select('id, username, team_name, is_admin, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Users fetch error:', error);
            return res.status(500).json({ error: 'Failed to fetch users' });
        }

        res.json({ users });
    } catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/admin/users/:id/reset-password - Reset user password
router.post('/users/:id/reset-password', async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        const { error } = await supabaseAdmin
            .from('users')
            .update({ password_hash: passwordHash })
            .eq('id', id);

        if (error) {
            console.error('Password reset error:', error);
            return res.status(500).json({ error: 'Failed to reset password' });
        }

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/admin/players - Get all players (with pagination)
router.get('/players', async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;

        const { data: players, error, count } = await supabaseAdmin
            .from('players')
            .select('*', { count: 'exact' })
            .order('name')
            .range((page - 1) * limit, page * limit - 1);

        if (error) {
            console.error('Players fetch error:', error);
            return res.status(500).json({ error: 'Failed to fetch players' });
        }

        res.json({
            players,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count
            }
        });
    } catch (error) {
        console.error('Admin players error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/admin/players/:id - Update player price
router.put('/players/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { price } = req.body;

        if (!price || price < 10 || price > 500) {
            return res.status(400).json({ error: 'Invalid price (must be 10-500)' });
        }

        const { data: player, error } = await supabaseAdmin
            .from('players')
            .update({ price, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Player update error:', error);
            return res.status(500).json({ error: 'Failed to update player' });
        }

        res.json({ message: 'Player updated successfully', player });
    } catch (error) {
        console.error('Update player error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/admin/scoring - Get scoring system
router.get('/scoring', async (req, res) => {
    try {
        const { data: scoring, error } = await supabaseAdmin
            .from('scoring_system')
            .select('*')
            .order('stat_name');

        if (error) {
            console.error('Scoring fetch error:', error);
            return res.status(500).json({ error: 'Failed to fetch scoring system' });
        }

        res.json({ scoring });
    } catch (error) {
        console.error('Admin scoring error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/admin/scoring - Update scoring system
router.put('/scoring', async (req, res) => {
    try {
        const { scoring } = req.body;

        if (!scoring || !Array.isArray(scoring)) {
            return res.status(400).json({ error: 'Invalid scoring data' });
        }

        // Update each stat
        for (const stat of scoring) {
            await supabaseAdmin
                .from('scoring_system')
                .update({ 
                    points_value: stat.points_value,
                    updated_at: new Date()
                })
                .eq('stat_name', stat.stat_name);
        }

        res.json({ message: 'Scoring system updated successfully' });
    } catch (error) {
        console.error('Update scoring error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/admin/gameweeks - Create gameweek
router.post('/gameweeks', async (req, res) => {
    try {
        const { roundNumber, deadline } = req.body;

        if (!roundNumber || !deadline) {
            return res.status(400).json({ error: 'Round number and deadline required' });
        }

        const { data: gameweek, error } = await supabaseAdmin
            .from('gameweeks')
            .insert({
                round_number: roundNumber,
                deadline: new Date(deadline),
                is_current: false,
                is_finished: false
            })
            .select()
            .single();

        if (error) {
            console.error('Gameweek create error:', error);
            return res.status(500).json({ error: 'Failed to create gameweek' });
        }

        res.status(201).json({ message: 'Gameweek created successfully', gameweek });
    } catch (error) {
        console.error('Create gameweek error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/admin/gameweeks/:id/set-current - Set current gameweek
router.put('/gameweeks/:id/set-current', async (req, res) => {
    try {
        const { id } = req.params;

        // Unset all current gameweeks
        await supabaseAdmin
            .from('gameweeks')
            .update({ is_current: false })
            .eq('is_current', true);

        // Set new current
        const { error } = await supabaseAdmin
            .from('gameweeks')
            .update({ is_current: true })
            .eq('id', id);

        if (error) {
            console.error('Set current gameweek error:', error);
            return res.status(500).json({ error: 'Failed to set current gameweek' });
        }

        res.json({ message: 'Current gameweek updated successfully' });
    } catch (error) {
        console.error('Set current gameweek error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;