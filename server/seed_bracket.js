const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// MOCK DATA GENERATOR
async function seedBracket() {
    console.log("🚀 STARTING MOCK TOURNAMENT SEED...");

    try {
        // 1. Create Tournament
        console.log("Creating Tournament...");
        const createRes = await axios.post(`${API_URL}/create-tournament`, {
            title: "Mock Championship 2026",
            game: "BGMI",
            map: "Erangel",
            format: "Battle Royale (Squad)",
            prize: "1000",
            entryFee: "50 Coins",
            date: "2026-02-01",
            time: "18:00",
            maxSlots: 32,
            discordLink: "https://discord.gg/mock",
            qrCodeUrl: "https://placeholder.com/qr"
        });

        if (!createRes.data.success) throw new Error("Failed to create tournament");
        
        // We need the ID, but the create route returns success and shortId.
        // We probably need to fetch the latest tournament or modify the create route to return ID.
        // Let's fetch all and pick the newest one.
        
        const listRes = await axios.get(`${API_URL}/tournaments`);
        const tournament = listRes.data[0]; // Newest is usually first or we find by shortId
        const tournamentId = tournament.id;
        console.log(`✅ Tournament Created: ${tournament.title} (ID: ${tournamentId})`);

        // 2. Add 20 Players
        console.log("Adding 20 Mock Players...");
        const players = [];
        for (let i = 1; i <= 20; i++) {
            players.push({
                email: `player${i}@mock.com`,
                teamName: `Team Alpha ${i}`,
                teamSize: "Squad",
                transactionId: `MOCK-TX-${1000 + i}`
            });
        }

        // Parallel Requests to speed up
        const joinPromises = players.map(p => 
            axios.post(`${API_URL}/join-tournament`, {
                tournamentId,
                userEmail: p.email,
                teamName: p.teamName,
                teamSize: p.teamSize,
                transactionId: p.transactionId
            }).then(() => process.stdout.write('.')) // Progress dot
        );
        
        await Promise.all(joinPromises);
        console.log("\n✅ 20 Players Joined.");

        // 3. Verify All Payments (So they show up for Bracket)
        console.log("Verifying Payments...");
        
        // Note: The verify endpoint is: app.post('/api/tournament/verify-payment', { tournamentId, userEmail })
        const verifyPromises = players.map(p => 
            axios.post(`${API_URL}/tournament/verify-payment`, {
                tournamentId,
                userEmail: p.email
            }).then(() => process.stdout.write('+'))
        );

        await Promise.all(verifyPromises);
        console.log("\n✅ All Payments Verified.");

        console.log("🎉 SEED COMPLETE! Refresh your Admin Panel.");

    } catch (error) {
        console.error("\n❌ ERROR:", error.response ? error.response.data : error.message);
    }
}

seedBracket();
