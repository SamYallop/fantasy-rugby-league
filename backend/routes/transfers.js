// Transfers routes
const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { MAX_TRANSFERS_PER_WEEK } = require('../config/constants');

// GET /api/transfers/available - Check available transfers
router.get('/available', authenticateToken, async (req, res) => {
    try {
        // Get current gameweek
        const { data: currentGW } = await supabaseAdmin
            .from('gameweeks')
            .select('*')
            .eq('is_current', true)
            .single();

        if (!currentGW) {
            return res.status(404).json({ error: 'No active gameweek' });
        }

        // Pre-season (Round 0) - unlimited transfers
        if (currentGW.round_number === 0) {
            return res.json({
                available: 999,
                used: 0,
                unlimited: true,
                gameweek: currentGW
            });
        }

        // Check deadline
        const now = new Date();
        const deadline = new Date(currentGW.deadline);

        if (now > deadline) {
            return res.json({
                available: 0,
                used: 0,
                deadline_passed: true,
                gameweek: currentGW
            });
        }

        // Get transfers made this gameweek
        const { data: transfers, error } = await supabaseAdmin
            .from('transfers')
            .select('*')
            .eq('user_id', req.user.id)
            .eq('gameweek_id', currentGW.id);

        if (error) {
            console.error('Transfers fetch error:', error);
            return res.status(500).json({ error: 'Failed to fetch transfers' });
        }

        const used = transfers?.length || 0;
        const available = Math.max(0, MAX_TRANSFERS_PER_WEEK - used);

        res.json({
            available,
            used,
            max: MAX_TRANSFERS_PER_WEEK,
            unlimited: false,
            deadline_passed: false,
            gameweek: currentGW
        });
    } catch (error) {
        console.error('Available transfers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/transfers/make - Make a transfer
router.post('/make', authenticateToken, async (req, res) => {
    try {
        const { playerOutId, playerInId } = req.body;

        if (!playerOutId || !playerInId) {
            return res.status(400).json({ error: 'Both playerOutId and playerInId required' });
        }

        if (playerOutId === playerInId) {
            return res.status(400).json({ error: 'Cannot transfer a player for themselves' });
        }

        // Get current gameweek
        const { data: currentGW } = await supabaseAdmin
            .from('gameweeks')
            .select('*')
            .eq('is_current', true)
            .single();

        if (!currentGW) {
            return res.status(400).json({ error: 'No active gameweek' });
        }

        // Check deadline (except pre-season)
        if (currentGW.round_number > 0) {
            const now = new Date();
            const deadline = new Date(currentGW.deadline);

            if (now > deadline) {
                return res.status(400).json({ error: 'Transfer deadline has passed' });
            }

            // Check transfer limit
            const { data: existingTransfers } = await supabaseAdmin
                .from('transfers')
                .select('*')
                .eq('user_id', req.user.id)
                .eq('gameweek_id', currentGW.id);

            if (existingTransfers && existingTransfers.length >= MAX_TRANSFERS_PER_WEEK) {
                return res.status(400).json({ 
                    error: `Maximum ${MAX_TRANSFERS_PER_WEEK} transfers per week` 
                });
            }
        }

        // Get current team
        const { data: team } = await supabaseAdmin
            .from('user_teams')
            .select('*')
            .eq('user_id', req.user.id)
            .eq('gameweek_id', currentGW.id)
            .single();

        if (!team) {
            return res.status(400).json({ error: 'No team found. Please select a team first.' });
        }

        // Check if player out is in team
        const teamPlayerIds = [
            team.starter_1, team.starter_2, team.starter_3, team.starter_4,
            team.starter_5, team.starter_6, team.starter_7, team.starter_8,
            team.starter_9, team.starter_10, team.starter_11, team.starter_12,
            team.starter_13, team.bench_1, team.bench_2, team.bench_3, team.bench_4
        ];

        if (!teamPlayerIds.includes(playerOutId)) {
            return res.status(400).json({ error: 'Player to transfer out is not in your team' });
        }

        // Get both players
        const { data: players } = await supabaseAdmin
            .from('players')
            .select('*')
            .in('id', [playerOutId, playerInId]);

        const playerOut = players?.find(p => p.id === playerOutId);
        const playerIn = players?.find(p => p.id === playerInId);

        if (!playerOut || !playerIn) {
            return res.status(400).json({ error: 'Invalid player selection' });
        }

        // Check positions match
        if (playerOut.position !== playerIn.position) {
            // Allow Stand Off <-> Scrum Half (both are Half Backs)
            const halfBackPositions = ['Stand Off', 'Scrum Half'];
            if (!(halfBackPositions.includes(playerOut.position) && 
                  halfBackPositions.includes(playerIn.position))) {
                return res.status(400).json({ 
                    error: `Cannot transfer ${playerOut.position} for ${playerIn.position}` 
                });
            }
        }

        // Get purchase price of player out
        const { data: ownership } = await supabaseAdmin
            .from('player_ownership')
            .select('purchase_price')
            .eq('user_id', req.user.id)
            .eq('player_id', playerOutId)
            .single();

        const sellPrice = ownership?.purchase_price || playerOut.price;

        // Check budget
        const newBank = team.bank + sellPrice - playerIn.price;
        if (newBank < 0) {
            return res.status(400).json({ 
                error: `Insufficient funds. Need £${Math.abs(newBank)/1000}M more.`,
                bank: team.bank,
                sellPrice,
                buyPrice: playerIn.price
            });
        }

        // Update team - replace player
        const updates = {};
        for (let i = 1; i <= 13; i++) {
            if (team[`starter_${i}`] === playerOutId) {
                updates[`starter_${i}`] = playerInId;
                break;
            }
        }
        for (let i = 1; i <= 4; i++) {
            if (team[`bench_${i}`] === playerOutId) {
                updates[`bench_${i}`] = playerInId;
                break;
            }
        }

        updates.bank = newBank;
        updates.team_value = team.team_value - sellPrice + playerIn.price;

        // Save transfer and update team in transaction
        const { error: transferError } = await supabaseAdmin
            .from('transfers')
            .insert({
                user_id: req.user.id,
                gameweek_id: currentGW.id,
                player_out: playerOutId,
                player_in: playerInId
            });

        if (transferError) {
            console.error('Transfer save error:', transferError);
            return res.status(500).json({ error: 'Failed to save transfer' });
        }

        const { error: teamError } = await supabaseAdmin
            .from('user_teams')
            .update(updates)
            .eq('user_id', req.user.id)
            .eq('gameweek_id', currentGW.id);

        if (teamError) {
            console.error('Team update error:', teamError);
            return res.status(500).json({ error: 'Failed to update team' });
        }

        // Update ownership
        await supabaseAdmin
            .from('player_ownership')
            .delete()
            .eq('user_id', req.user.id)
            .eq('player_id', playerOutId);

        await supabaseAdmin
            .from('player_ownership')
            .insert({
                user_id: req.user.id,
                player_id: playerInId,
                purchase_price: playerIn.price,
                gameweek_acquired: currentGW.id
            });

        res.json({
            message: 'Transfer completed successfully',
            transfer: {
                playerOut: playerOut.name,
                playerIn: playerIn.name,
                cost: playerIn.price - sellPrice,
                newBank
            }
        });
    } catch (error) {
        console.error('Make transfer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/transfers/history - Get user's transfer history
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const { data: transfers, error } = await supabaseAdmin
            .from('transfers')
            .select(`
                *,
                player_out:players!transfers_player_out_fkey(name, team, position, price),
                player_in:players!transfers_player_in_fkey(name, team, position, price),
                gameweek:gameweeks(round_number)
            `)
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Transfer history error:', error);
            return res.status(500).json({ error: 'Failed to fetch transfer history' });
        }

        res.json({ transfers: transfers || [] });
    } catch (error) {
        console.error('Transfer history error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
