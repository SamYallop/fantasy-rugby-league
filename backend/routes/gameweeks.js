// Gameweeks routes
const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

// GET /api/gameweeks - Get all gameweeks
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { data: gameweeks, error } = await supabaseAdmin
            .from('gameweeks')
            .select('*')
            .order('round_number', { ascending: true });

        if (error) {
            console.error('Gameweeks fetch error:', error);
            return res.status(500).json({ error: 'Failed to fetch gameweeks' });
        }

        res.json({ gameweeks: gameweeks || [] });
    } catch (error) {
        console.error('Gameweeks error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/gameweeks/current - Get current gameweek
router.get('/current', optionalAuth, async (req, res) => {
    try {
        const { data: gameweek, error } = await supabaseAdmin
            .from('gameweeks')
            .select('*')
            .eq('is_current', true)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Current gameweek error:', error);
            return res.status(500).json({ error: 'Failed to fetch current gameweek' });
        }

        res.json({ gameweek: gameweek || null });
    } catch (error) {
        console.error('Current gameweek error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/gameweeks/:id - Get specific gameweek
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const { data: gameweek, error } = await supabaseAdmin
            .from('gameweeks')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return res.status(404).json({ error: 'Gameweek not found' });
        }

        res.json({ gameweek });
    } catch (error) {
        console.error('Gameweek detail error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;