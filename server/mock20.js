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
                } catch(e) {
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
                } catch(e) {
                    resolve([]);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.end();
    });
}

const GAMES = [
    { name: "BGMI", maps: ["Erangel", "Miramar", "Sanhok"], modes: ["Battle Royale (Squad)", "Team Deathmatch (4v4)"] },
    { name: "Free Fire", maps: ["Bermuda", "Purgatory"], modes: ["Battle Royale (Squad)", "Clash Squad (4v4)"] },
    { name: "COD Mobile", maps: ["Isolated", "Nuketown"], modes: ["Battle Royale (Squad)", "Search & Destroy (5v5)"] }
];

const TEAMS = [
    "Soul", "GodLike", "Hydra", "XSpark", "Blind", "Orangutan", "Global", "Revenant", "Entity", "Enigma",
    "8bit", "Chemin", "Marcos", "Skylight", "TSM", "OG", "7Sea", "Team XO", "FS", "Velocity"
];

async function seed20() {
    console.log("🚀 Starting Bulk Mock Generation (20 Tournaments)...");

    try {
        for (let i = 1; i <= 20; i++) {
            const game = GAMES[Math.floor(Math.random() * GAMES.length)];
            const map = game.maps[Math.floor(Math.random() * game.maps.length)];
            const mode = game.modes[Math.floor(Math.random() * game.modes.length)];
            
            const isToday = Math.random() > 0.5;
            const hour = 10 + Math.floor(Math.random() * 12);
            
            const title = `Mock Cup S${i}: ${game.name} ${mode.split(' ')[0]}`;
            
            console.log(`\n[${i}/20] Creating: ${title}`);

            // 1. Create Tournament
            const tournamentData = {
                title: title,
                game: game.name,
                map: map,
                format: mode, 
                prize: (Math.floor(Math.random() * 50) * 100).toString(), // 0 to 5000
                entryFee: Math.random() > 0.7 ? "50" : "Free", // 30% paid
                date: isToday ? new Date().toISOString().split('T')[0] : "2026-02-" + (Math.floor(Math.random() * 28) + 1),
                time: `${hour}:00`,
                maxSlots: 100,
                discordLink: "https://discord.gg/mock",
                qrCodeUrl: ""
            };

            const createRes = await postRequest('/create-tournament', tournamentData);
            if (!createRes.success) {
                console.error(`Failed to create ${title}:`, createRes.error);
                continue;
            }

            // 2. Fetch Back to get ID
            // Ideally backend returns ID, but structure returns shortId. Dashboard uses Firestore ID. 
            // We need to fetch all and match shortId.
            const allTournaments = await getRequest('/tournaments');
            // Assuming the newest is the one we made, or match shortId
            const created = allTournaments.find(t => t.shortId === createRes.shortId);
            
            if (!created) {
                console.log("   --> Could not find created tournament structure.");
                continue;
            }

            // 3. Add Random Participants
            const participantCount = Math.floor(Math.random() * 15) + 5; // 5 to 20 teams
            console.log(`   --> Adding ${participantCount} teams...`);
            
            // Shuffle teams
            const shuffledTeams = [...TEAMS].sort(() => 0.5 - Math.random()).slice(0, participantCount);

            for (const teamName of shuffledTeams) {
                const uniqueTeam = `${teamName} ${i}`;
                await postRequest('/join-tournament', {
                    tournamentId: created.id,
                    userEmail: `${teamName.toLowerCase()}@mock.com`,
                    teamName: uniqueTeam,
                    teamSize: "Squad",
                    transactionId: tournamentData.entryFee === "Free" ? "Free Entry" : `TRX-MOCK-${Math.floor(Math.random()*10000)}`,
                    players: ["IGL", "Fragger", "Support", "Sniper"].map(role => `${teamName}_${role}`)
                });
            }
        }
        
        console.log("\n✅ DONE! 20 Mock Tournaments Created.");

    } catch (error) {
        console.error("Critical Error during seeding:", error);
    }
}

seed20();
