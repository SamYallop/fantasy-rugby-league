const express = require('express');
const { supabaseAdmin } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's team
router.get('/my-team', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (teamError && teamError.code !== 'PGRST116') {
      throw teamError;
    }

    if (!team) {
      return res.json({ team: null, players: [] });
    }

    // Get team selections with player details
    const { data: selections, error: selectionsError } = await supabase
      .from('team_selections')
      .select(`
        *,
        player:players (
          id,
          name,
          team,
          position,
          price,
          total_points
        )
      `)
      .eq('team_id', team.id);

    if (selectionsError) throw selectionsError;

    // Get last gameweek points for each player
    const { data: currentGW } = await supabase
      .from('gameweeks')
      .select('*')
      .eq('is_current', true)
      .single();

    let lastGWPoints = {};
    if (currentGW) {
      const playerIds = selections.map(s => s.player_id);
      const { data: gwStats } = await supabase
        .from('player_gameweek_stats')
        .select('player_id, points')
        .eq('gameweek_id', currentGW.id)
        .in('player_id', playerIds);

      if (gwStats) {
        gwStats.forEach(stat => {
          lastGWPoints[stat.player_id] = stat.points;
        });
      }
    }

    // Add last gameweek points to player data
    const playersWithStats = selections.map(s => ({
      ...s.player,
      is_captain: s.is_captain,
      is_vice_captain: s.is_vice_captain,
      is_bench: s.is_bench,
      bench_order: s.bench_order,
      last_gw_points: lastGWPoints[s.player_id] || 0
    }));

    res.json({
      team,
      players: playersWithStats
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ message: 'Failed to get team' });
  }
});

// Save team
router.post('/save', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { team_name, players } = req.body;

    // Validate 13 players
    if (!players || players.length !== 13) {
      return res.status(400).json({ message: 'Team must have exactly 13 players' });
    }

    // Get or create team
    let { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (teamError && teamError.code === 'PGRST116') {
      // Create new team
      const { data: newTeam, error: createError } = await supabase
        .from('teams')
        .insert([{
          user_id: userId,
          team_name: team_name || 'My Team'
        }])
        .select()
        .single();

      if (createError) throw createError;
      team = newTeam;
    } else if (teamError) {
      throw teamError;
    } else if (team_name) {
      // Update team name if provided
      const { error: updateError } = await supabase
        .from('teams')
        .update({ team_name })
        .eq('id', team.id);

      if (updateError) throw updateError;
    }

    // Delete old selections
    await supabase
      .from('team_selections')
      .delete()
      .eq('team_id', team.id);

    // Insert new selections
    const selections = players.map(player => ({
      team_id: team.id,
      player_id: player.id,
      is_captain: player.is_captain || false,
      is_vice_captain: player.is_vice_captain || false,
      is_bench: player.is_bench || false,
      bench_order: player.bench_order || null
    }));

    const { error: insertError } = await supabase
      .from('team_selections')
      .insert(selections);

    if (insertError) throw insertError;

    res.json({ 
      message: 'Team saved successfully',
      team: { ...team, team_name: team_name || team.team_name }
    });
  } catch (error) {
    console.error('Save team error:', error);
    res.status(500).json({ message: 'Failed to save team' });
  }
});

module.exports = router;