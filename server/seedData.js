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
            res.on('end', () => resolve(JSON.parse(body)));
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
            res.on('end', () => resolve(JSON.parse(body)));
        });

        req.on('error', (e) => reject(e));
        req.end();
    });
}

async function createMockData() {
    console.log("🚀 Creating Mock Tournaments...");

    const scenarios = [
        {
            title: "Winter TDM Cup " + Math.floor(Math.random() * 100),
            game: "BGMI",
            map: "Warehouse",
            format: "Team Deathmatch (4v4)",
            teams: ["Team Soul", "GodLike", "Hydra", "XSpark", "Blind", "Orangutan", "Global", "Revenant"]
        },
        {
            title: "Pro Scrims Lite " + Math.floor(Math.random() * 100),
            game: "Free Fire",
            map: "Bermuda",
            format: "Battle Royale (Squad)",
            teams: ["Total Gaming", "Desi Gamers", "Gyan Gaming", "AS Gaming", "Lokesh Gamer", "Two Side", "Techno", "Mythpat"]
        }
    ];

    try {
        for (const scenario of scenarios) {
            console.log(`\n---------------------------------`);
            console.log(`creating: ${scenario.title}`);

            // 1. Create Tournament
            const tournamentData = {
                title: scenario.title,
                game: scenario.game,
                map: scenario.map,
                format: scenario.format, 
                prize: "1000",
                entryFee: "Free",
                date: "2025-02-20",
                time: "20:00",
                maxSlots: 100,
                discordLink: "https://discord.gg/mock",
                qrCodeUrl: ""
            };

            const createRes = await postRequest('/create-tournament', tournamentData);
            if (!createRes.success) {
                console.error(`Failed to create ${scenario.title}`);
                continue;
            }
            
            console.log(`✅ Created. ShortID: ${createRes.shortId}`);

            // 2. Fetch Tournament ID
            const tournaments = await getRequest('/tournaments');
            const tournament = tournaments.find(t => t.shortId === createRes.shortId);
            
            if (!tournament) {
                console.error("Could not find tournament doc");
                continue;
            }
            const tId = tournament.id;

            // 3. Add Teams
            console.log(`👥 Adding ${scenario.teams.length} teams...`);
            for (const team of scenario.teams) {
                // Generate a roster for the team
                const players = [`${team}_Leader`, `${team}_P2`, `${team}_P3`, `${team}_P4`];

                await postRequest('/join-tournament', {
                    tournamentId: tId,
                    userEmail: `${team.toLowerCase().replace(/\s/g, '')}@mock.com`,
                    teamName: team,
                    teamSize: "Squad",
                    transactionId: "Free Entry",
                    players: players // sending roster
                });
                process.stdout.write(".");
            }
            console.log(" Done.");
        }

        console.log("\n✅ Success! 2 Tournaments with mock data created.");

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

createMockData();
