// Weekly scraper - updates player stats
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

const BASE_URL = 'https://fantasy.superleague.co.uk/players';

// Scrape player data
async function scrapePlayers() {
    console.log('Starting scrape...');
    
    const players = [];
    let page = 1;

    while (true) {
        console.log(`Scraping page ${page}...`);
        
        try {
            const response = await axios.get(`${BASE_URL}?page=${page}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            });

            const $ = cheerio.load(response.data);
            const table = $('table tbody');
            
            if (!table.length) break;

            const rows = table.find('tr');
            if (!rows.length) break;

            rows.each((i, row) => {
                const tds = $(row).find('td');
                if (tds.length === 0) return;

                // Extract team from img alt
                const teamImg = $(tds[0]).find('img');
                const team = teamImg.attr('alt') || '';

                // Extract name and position
                const nameCell = $(tds[1]).text().trim();
                const nameParts = nameCell.split(/(?=[A-Z][a-z]+ [A-Z][a-z]+)/);
                
                let name = nameCell;
                let position = '';

                const positions = ['Full Back', 'Winger', 'Centre', 'Stand Off', 'Scrum Half', 'Prop', 'Hooker', 'Second Row', 'Loose Forward'];
                for (const pos of positions) {
                    if (nameCell.includes(pos)) {
                        position = pos;
                        name = nameCell.replace(pos, '').trim();
                        break;
                    }
                }

                const price = parseInt($(tds[3]).text().replace(/[^\d]/g, '')) || 0;

                // Stats
                const metres = parseInt($(tds[4]).text()) || 0;
                const carries = parseInt($(tds[5]).text()) || 0;
                const tackles = parseInt($(tds[6]).text()) || 0;
                const offloads = parseInt($(tds[7]).text()) || 0;
                const attackingKicks = parseInt($(tds[8]).text()) || 0;
                const tries = parseInt($(tds[9]).text()) || 0;
                const goals = parseInt($(tds[10]).text()) || 0;
                const dropGoals = parseInt($(tds[11]).text()) || 0;
                const tackleBusts = parseInt($(tds[12]).text()) || 0;
                const markerTackles = parseInt($(tds[13]).text()) || 0;
                const cleanBreaks = parseInt($(tds[14]).text()) || 0;
                const fortyTwenty = parseInt($(tds[15]).text()) || 0;
                const errors = parseInt($(tds[16]).text()) || 0;
                const yellowCards = parseInt($(tds[17]).text()) || 0;
                const redCards = parseInt($(tds[18]).text()) || 0;
                const penalties = parseInt($(tds[21]).text()) || 0;
                const runsFromDH = parseInt($(tds[22]).text()) || 0;
                const tryAssists = parseInt($(tds[23]).text()) || 0;

                players.push({
                    name,
                    team,
                    position,
                    price,
                    stats: {
                        metres,
                        carries,
                        tackles,
                        offloads,
                        attackingKicks,
                        tries,
                        goals,
                        dropGoals,
                        tackleBusts,
                        markerTackles,
                        cleanBreaks,
                        fortyTwenty,
                        errors,
                        yellowCards,
                        redCards,
                        penalties,
                        runsFromDH,
                        tryAssists
                    }
                });
            });

            // Check for next page
            const nextBtn = $('.pagination').find('a:contains("Next")');
            if (nextBtn.length && !nextBtn.hasClass('disabled')) {
                page++;
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                break;
            }
        } catch (error) {
            console.error('Scrape error:', error.message);
            break;
        }
    }

    console.log(`Scraped ${players.length} players`);
    return players;
}

// Upload stats to database
async function uploadStats() {
    try {
        const players = await scrapePlayers();

        // Get current gameweek
        const { data: currentGW } = await supabase
            .from('gameweeks')
            .select('*')
            .eq('is_current', true)
            .single();

        if (!currentGW) {
            console.error('No current gameweek found');
            return;
        }

        console.log(`Uploading stats for gameweek ${currentGW.round_number}...`);

        // Upload each player's stats
        for (const player of players) {
            // Find player in database
            const { data: dbPlayer } = await supabase
                .from('players')
                .select('id')
                .eq('name', player.name)
                .eq('team', player.team)
                .single();

            if (!dbPlayer) {
                console.log(`Player not found: ${player.name} (${player.team})`);
                continue;
            }

            // Insert/update gameweek stats
            const { error } = await supabase
                .from('player_gameweek_stats')
                .upsert({
                    player_id: dbPlayer.id,
                    gameweek_id: currentGW.id,
                    metres: player.stats.metres,
                    carries: player.stats.carries,
                    tackles: player.stats.tackles,
                    offloads: player.stats.offloads,
                    attacking_kicks: player.stats.attackingKicks,
                    tries: player.stats.tries,
                    goals: player.stats.goals,
                    drop_goals: player.stats.dropGoals,
                    tackle_busts: player.stats.tackleBusts,
                    marker_tackles: player.stats.markerTackles,
                    clean_breaks: player.stats.cleanBreaks,
                    forty_twenty: player.stats.fortyTwenty,
                    errors: player.stats.errors,
                    yellow_cards: player.stats.yellowCards,
                    red_cards: player.stats.redCards,
                    penalties: player.stats.penalties,
                    runs_from_dh: player.stats.runsFromDH,
                    try_assists: player.stats.tryAssists,
                    played: (player.stats.tackles > 0 || player.stats.tries > 0),
                    points: 0 // Will be calculated by scoring function
                }, {
                    onConflict: 'player_id,gameweek_id'
                });

            if (error) {
                console.error(`Error uploading ${player.name}:`, error.message);
            }
        }

        console.log('✅ Stats uploaded successfully!');

        // Calculate points for all players
        console.log('Calculating points...');
        await calculateAllPoints(currentGW.id);

        console.log('✅ Complete!');
    } catch (error) {
        console.error('Upload error:', error);
    }
}

// Calculate points for all players
async function calculateAllPoints(gameweekId) {
    // Call the database function to calculate points
    const { error } = await supabase.rpc('calculate_player_points', {
        p_gameweek_id: gameweekId
    });

    if (error) {
        console.error('Calculate points error:', error);
    }
}

// Run scraper
uploadStats();