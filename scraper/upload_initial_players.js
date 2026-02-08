// Upload initial players from CSV to database
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Path to your CSV file
const CSV_PATH = 'C:\\Users\\w_yal\\OneDrive\\Documents\\Fantasy RL\\Data';

async function uploadPlayers() {
    try {
        console.log('Looking for CSV files in:', CSV_PATH);
        
        // Find the most recent CSV file
        const files = fs.readdirSync(CSV_PATH)
            .filter(f => f.endsWith('.csv'))
            .map(f => ({
                name: f,
                path: path.join(CSV_PATH, f),
                time: fs.statSync(path.join(CSV_PATH, f)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

        if (files.length === 0) {
            console.error('❌ No CSV files found in:', CSV_PATH);
            return;
        }

        const latestFile = files[0];
        console.log(`✅ Using file: ${latestFile.name}`);

        // Read CSV file
        const csvContent = fs.readFileSync(latestFile.path, 'utf-8');
        const lines = csvContent.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            console.error('❌ CSV file is empty or invalid');
            return;
        }

        // Parse header - split by comma but handle potential issues
        const header = lines[0].split(',').map(h => h.trim());
        console.log('CSV columns:', header.slice(0, 5).join(', '), '...');

        console.log(`\nParsing players...`);

        // Parse players with proper CSV handling
        const players = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Split by comma - CSV format: Team,Name,Position,Price,...
            const parts = line.split(',');
            
            if (parts.length < 4) {
                console.log(`⚠️  Skipping invalid row ${i}: not enough columns`);
                continue;
            }

            const team = parts[0].trim();
            const name = parts[1].trim();
            const position = parts[2].trim();
            const priceStr = parts[3].trim().replace('k', ''); // Remove 'k' from price
            const price = parseInt(priceStr) || 0;

            // Validate required fields
            if (name && team && position && price > 0) {
                players.push({
                    name,
                    team,
                    position,
                    price,
                    total_points: 0
                });
            } else {
                console.log(`⚠️  Skipping invalid player: ${name || 'unnamed'} - Team: ${team}, Position: ${position}, Price: ${price}`);
            }
        }

        console.log(`✅ Found ${players.length} valid players\n`);

        if (players.length === 0) {
            console.error('❌ No valid players found in CSV');
            return;
        }

        // Show sample players
        console.log('Sample players:');
        players.slice(0, 5).forEach(p => {
            console.log(`  - ${p.name} (${p.team}) - ${p.position} - £${p.price}k`);
        });
        console.log('');

        // Count positions
        const positionCounts = {};
        players.forEach(p => {
            positionCounts[p.position] = (positionCounts[p.position] || 0) + 1;
        });

        console.log('Positions found:');
        Object.entries(positionCounts).forEach(([pos, count]) => {
            console.log(`  ${pos}: ${count} players`);
        });
        console.log('');

        // Check if players already exist
        const { count } = await supabase
            .from('players')
            .select('id', { count: 'exact', head: true });

        if (count > 0) {
            console.log(`⚠️  Database already has ${count} players`);
            console.log('\nOptions:');
            console.log('1. Delete existing players from Supabase Table Editor first');
            console.log('2. Or modify this script to force re-upload');
            return;
        }

        // Upload players in batches
        console.log('Uploading players to database...');
        const batchSize = 50;
        let uploaded = 0;
        
        for (let i = 0; i < players.length; i += batchSize) {
            const batch = players.slice(i, i + batchSize);
            
            const { error } = await supabase
                .from('players')
                .insert(batch);

            if (error) {
                console.error(`❌ Error uploading batch ${Math.floor(i / batchSize) + 1}:`, error.message);
                console.error('Error details:', error);
            } else {
                uploaded += batch.length;
                console.log(`✅ Uploaded ${uploaded} / ${players.length} players`);
            }
        }

        console.log('\n🎉 Upload complete!');
        console.log(`Total players in database: ${uploaded}`);

        // Show final breakdown by team
        const teamCounts = {};
        players.forEach(p => {
            teamCounts[p.team] = (teamCounts[p.team] || 0) + 1;
        });

        console.log('\nPlayers by team:');
        Object.entries(teamCounts)
            .sort((a, b) => b[1] - a[1])
            .forEach(([team, count]) => {
                console.log(`  ${team}: ${count} players`);
            });

    } catch (error) {
        console.error('❌ Upload error:', error.message);
        console.error(error);
    }
}

// Run the upload
uploadPlayers();