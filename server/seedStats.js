const http = require('http');

const API_PORT = 5000;
const API_HOST = 'localhost';

function postRequest(path, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: API_HOST,
            port: API_PORT,
            path: '/api' + path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(data))
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    console.error("Error parsing response:", body);
                    resolve({});
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(JSON.stringify(data));
        req.end();
    });
}

function getRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: API_HOST,
            port: API_PORT,
            path: '/api' + path,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                 try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    console.error("Error parsing response:", body);
                    resolve([]);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.end();
    });
}

async function seedMockStats() {
    console.log("📊 Seeding Mock Stats...");

    try {
        // 1. Get All Tournaments
        const tournaments = await getRequest('/tournaments');
        console.log(`Found ${tournaments.length} tournaments.`);

        // 2. Mock Player Names for realism
        const proPlayers = [
            "MortaL", "ScoutOP", "Jonathan", "Goblin", "Omega", 
            "Hector", "AkshaT", "Neyoo", "ZGOD", "ClutchGod", 
            "Snax", "Daljitsk", "Viper", "Regaltos", "Mavi"
        ];

        let totalStatsPushed = 0;

        for (const t of tournaments) {
            if (!t.participants || t.participants.length === 0) continue;

            console.log(`Processing Tournament: ${t.title}`);
            
            const statsPayload = [];

            // For each team in the tournament
            t.participants.forEach((team) => {
                // Determine players (If no roster, assign random pro players)
                let roster = team.players && team.players.length > 0 ? team.players : [];
                
                // If roster is empty or just has empty strings, generate fake players
                if (roster.length === 0 || roster.every(p => !p || p.trim() === '')) {
                    // Generate 4 random players for this team
                    const teamBaseName = (team.teamName || "Team").split(' ')[0];
                    roster = [
                        `${teamBaseName}_IGL`,
                        proPlayers[Math.floor(Math.random() * proPlayers.length)],
                        `${teamBaseName}_Assaulter`,
                        `${teamBaseName}_Sniper`
                    ];
                }

                // Generate stats for each player
                roster.forEach(player => {
                    if(!player) return;
                    
                    // Random Kills (0 to 15) weighted towards lower numbers
                    const kills = Math.floor(Math.random() * 15);
                    // Damage roughly correlates to kills (approx 100-150 damage per kill + variance)
                    const damage = (kills * 100) + Math.floor(Math.random() * 500);

                    statsPayload.push({
                        teamName: team.teamName || "Unknown Team",
                        playerName: player,
                        kills: kills,
                        damage: damage
                    });
                });
            });

            if (statsPayload.length > 0) {
                // Send to API
                await postRequest('/update-stats', {
                    tournamentId: t.id,
                    stats: statsPayload
                });
                console.log(`   ✅ Pushed stats for ${statsPayload.length} players.`);
                totalStatsPushed += statsPayload.length;
            }
        }

        console.log(`\n🎉 Stats Seeding Complete! Added records for ${totalStatsPushed} players.`);
        console.log("👉 Go to Dashboard > Leaderboard to see the charts.");

    } catch (error) {
        console.error("❌ Error Seeding Stats:", error);
    }
}

seedMockStats();
