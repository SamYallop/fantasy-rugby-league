const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

const CSV_CONTAINS_POINTS = true;

// Super League Fantasy Point System (for converting to raw stats)
const SOURCE_POINT_SYSTEM = {
    'Metres': 0.01,      // 1 point per 100m
    'Carries': 0.1,      // 0.1 per carry
    'Tackles': 0.5,      // 0.5 per tackle
    'Offloads': 1,       // 1 point per offload
    'Attacking Kick': 1, // 1 point per kick
    'Tries': 10,         // 10 points per try
    'Goals': 2,          // 2 points per goal
    'Drop Goals': 1,     // 1 point per drop goal
    'Tackle Busts': 1,   // 1 point per bust
    'Marker Tackles': 0.5, // 0.5 per marker tackle
    'Clean Breaks': 5,   // 5 points per break
    'Forty Twenty': 10,  // 10 points per 40/20
    'Errors': -2,        // -2 per error
    'Yellow Cards': -3,  // -3 per yellow
    'Red Cards': -6,     // -6 per red
    'Penalties': -2,     // -2 per penalty
    'Runs from DH': 1,   // 1 point per run
    'Try Assists': 5     // 5 points per assist
};

function convertToRawStats(stats) {
    const rawStats = {};
    
    for (const [stat, value] of Object.entries(stats)) {
        const numValue = parseFloat(value) || 0;
        
        if (SOURCE_POINT_SYSTEM[stat]) {
            // Convert points back to raw stat
            rawStats[stat] = Math.round(numValue / SOURCE_POINT_SYSTEM[stat]);
        } else {
            rawStats[stat] = numValue;
        }
    }
    
    return rawStats;
}

async function getScoringSystem() {
    const { data, error } = await supabase
        .from('scoring_system')
        .select('*');
    
    if (error) throw error;
    
    const scoringMap = {};
    data.forEach(rule => {
        scoringMap[rule.stat_name] = rule.points_value;
    });
    
    return scoringMap;
}

function calculatePoints(rawStats, scoringSystem) {
    let points = 0;
    
    const statMapping = {
        'Tries': 'tries',
        'Goals': 'goals',
        'Drop Goals': 'drop_goals',
        'Metres': 'metres_gained',
        'Carries': 'carries',
        'Tackles': 'tackles',
        'Offloads': 'offloads',
        'Tackle Busts': 'tackle_busts',
        'Clean Breaks': 'clean_breaks',
        'Try Assists': 'try_assists',
        'Errors': 'errors',
        'Penalties': 'penalties_conceded',
        'Yellow Cards': 'sin_bin',
        'Red Cards': 'send_off',
        'Marker Tackles': 'marker_tackles',
        'Runs from DH': 'runs_from_dummy_half',
        'Forty Twenty': 'forty_twenty'
    };
    
    for (const [csvStat, dbStat] of Object.entries(statMapping)) {
        if (rawStats[csvStat] !== undefined && scoringSystem[dbStat] !== undefined) {
            const statValue = parseInt(rawStats[csvStat]) || 0;
            const pointsValue = scoringSystem[dbStat];
            points += statValue * pointsValue;
        }
    }
    
    return Math.round(points);
}

async function scrapeAndUpload() {
    try {
        console.log('🌐 Starting automated scraper...');
        
        // Get current gameweek
        const { data: currentGW } = await supabase
            .from('gameweeks')
            .select('*')
            .eq('is_current', true)
            .single();

        if (!currentGW) {
            console.error('❌ No current gameweek found');
            console.log('💡 Set a gameweek as current in Admin panel first');
            return;
        }

        console.log(`✅ Current Gameweek: Round ${currentGW.round_number}`);

        // Scrape the website
        console.log('🔍 Scraping https://fantasy.superleague.co.uk/players...');
        const response = await axios.get('https://fantasy.superleague.co.uk/players', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);

        // Get scoring system
        console.log('📊 Loading YOUR scoring system...');
        const scoringSystem = await getScoringSystem();

        // Get all players
        const { data: allPlayers } = await supabase
            .from('players')
            .select('id, name, team');

        const playerMap = new Map();
        allPlayers.forEach(p => {
            const key = `${p.name.toLowerCase()}|${p.team.toLowerCase()}`;
            playerMap.set(key, p.id);
        });

        const statsToUpload = [];
        let matched = 0;
        let notMatched = 0;

        // Parse the table - based on actual HTML structure
        $('table tbody tr').each((i, row) => {
            const $row = $(row);
            const cells = $row.find('td');
            
            if (cells.length < 10) return; // Skip incomplete rows

            // Extract data from cells
            const team = $(cells[0]).text().trim();
            const nameAndPos = $(cells[1]).text().trim();
            const price = $(cells[3]).text().trim();
            
            // Split name and position (e.g., "Andy Ackers Hooker" -> "Andy Ackers", "Hooker")
            const nameParts = nameAndPos.split(/\s+/);
            const position = nameParts[nameParts.length - 1]; // Last word is position
            const name = nameParts.slice(0, -1).join(' '); // Everything else is name
            
            // Extract stats (columns 4-23 based on the table structure)
            const metres = $(cells[4]).text().trim() || '0';
            const carries = $(cells[5]).text().trim() || '0';
            const tackles = $(cells[6]).text().trim() || '0';
            const offloads = $(cells[7]).text().trim() || '0';
            const attackingKick = $(cells[8]).text().trim() || '0';
            const tries = $(cells[9]).text().trim() || '0';
            const goals = $(cells[10]).text().trim() || '0';
            const dropGoals = $(cells[11]).text().trim() || '0';
            const tackleBusts = $(cells[12]).text().trim() || '0';
            const markerTackles = $(cells[13]).text().trim() || '0';
            const cleanBreaks = $(cells[14]).text().trim() || '0';
            const fortyTwenty = $(cells[15]).text().trim() || '0';
            const errors = $(cells[16]).text().trim() || '0';
            const yellowCards = $(cells[17]).text().trim() || '0';
            const redCards = $(cells[18]).text().trim() || '0';
            // cells[19] is duplicate MT
            const penalties = $(cells[20]).text().trim() || '0';
            const runsFromDH = $(cells[21]).text().trim() || '0';
            const tryAssists = $(cells[22]).text().trim() || '0';
            // cells[23] is Last Rd
            // cells[24] is Score (IGNORE THIS - it's their points system)

            const csvStats = {
                'Metres': metres,
                'Carries': carries,
                'Tackles': tackles,
                'Offloads': offloads,
                'Attacking Kick': attackingKick,
                'Tries': tries,
                'Goals': goals,
                'Drop Goals': dropGoals,
                'Tackle Busts': tackleBusts,
                'Marker Tackles': markerTackles,
                'Clean Breaks': cleanBreaks,
                'Forty Twenty': fortyTwenty,
                'Errors': errors,
                'Yellow Cards': yellowCards,
                'Red Cards': redCards,
                'Penalties': penalties,
                'Runs from DH': runsFromDH,
                'Try Assists': tryAssists
            };

            // Convert to raw stats
            const rawStats = convertToRawStats(csvStats);

            // Calculate points using YOUR scoring system
            const calculatedPoints = calculatePoints(rawStats, scoringSystem);

            // Find player in database
            const key = `${name.toLowerCase()}|${team.toLowerCase()}`;
            const playerId = playerMap.get(key);

            if (!playerId) {
                notMatched++;
                if (notMatched <= 5) {
                    console.log(`⚠️  Not found: ${name} (${team})`);
                }
                return;
            }

            statsToUpload.push({
                player_id: playerId,
                gameweek_id: currentGW.id,
                played: true,
                tries: parseInt(rawStats['Tries']) || 0,
                goals: parseInt(rawStats['Goals']) || 0,
                drop_goals: parseInt(rawStats['Drop Goals']) || 0,
                metres: parseInt(rawStats['Metres']) || 0,
                carries: parseInt(rawStats['Carries']) || 0,
                tackles: parseInt(rawStats['Tackles']) || 0,
                offloads: parseInt(rawStats['Offloads']) || 0,
                tackle_busts: parseInt(rawStats['Tackle Busts']) || 0,
                clean_breaks: parseInt(rawStats['Clean Breaks']) || 0,
                try_assists: parseInt(rawStats['Try Assists']) || 0,
                errors: parseInt(rawStats['Errors']) || 0,
                penalties: parseInt(rawStats['Penalties']) || 0,
                yellow_cards: parseInt(rawStats['Yellow Cards']) || 0,
                red_cards: parseInt(rawStats['Red Cards']) || 0,
                marker_tackles: parseInt(rawStats['Marker Tackles']) || 0,
                runs_from_dummy_half: parseInt(rawStats['Runs from DH']) || 0,
                forty_twenty: parseInt(rawStats['Forty Twenty']) || 0,
                points: calculatedPoints // YOUR points, not theirs!
            });

            matched++;

            if (matched <= 5) {
                console.log(`✅ ${name} (${team}):`);
                console.log(`   Raw: ${rawStats['Tries']} tries, ${rawStats['Goals']} goals, ${rawStats['Tackles']} tackles`);
                console.log(`   Points (YOUR system): ${calculatedPoints}\n`);
            }
        });

        console.log(`\n📊 Summary:`);
        console.log(`  Matched: ${matched}`);
        console.log(`  Not matched: ${notMatched}`);
        console.log(`  Ready to upload: ${statsToUpload.length}\n`);

        if (statsToUpload.length === 0) {
            console.log('⚠️  No stats to upload');
            return;
        }

        // Upload to database
        console.log('⬆️  Uploading to database...');
        const batchSize = 50;
        let uploaded = 0;

        for (let i = 0; i < statsToUpload.length; i += batchSize) {
            const batch = statsToUpload.slice(i, i + batchSize);
            
            const { error } = await supabase
                .from('player_gameweek_stats')
                .upsert(batch, { onConflict: 'player_id,gameweek_id' });

            if (error) {
                console.error(`❌ Batch failed:`, error.message);
            } else {
                uploaded += batch.length;
                console.log(`✅ Uploaded ${uploaded} / ${statsToUpload.length}`);
            }
        }

        // Update player totals
        console.log('\n🔄 Updating player totals...');
        for (const playerId of new Set(statsToUpload.map(s => s.player_id))) {
            const { data: playerStats } = await supabase
                .from('player_gameweek_stats')
                .select('points')
                .eq('player_id', playerId);

            const totalPoints = playerStats?.reduce((sum, gw) => sum + (gw.points || 0), 0) || 0;

            await supabase
                .from('players')
                .update({ total_points: totalPoints })
                .eq('id', playerId);
        }

        console.log('\n✅ Automated scraping complete!');
        console.log(`📊 ${uploaded} player stats uploaded`);
        console.log(`🎯 Points calculated using YOUR scoring system`);
        console.log(`❌ IGNORED their "Score" column - used raw stats instead!`);

    } catch (error) {
        console.error('❌ Scraping error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

scrapeAndUpload();