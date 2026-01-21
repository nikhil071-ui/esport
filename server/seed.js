const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

const GAMES = [
    { name: "BGMI", maps: ["Erangel", "Miramar", "Sanhok", "Vikendi"], format: "Squad" },
    { name: "Free Fire", maps: ["Bermuda", "Purgatory", "Kalahari"], format: "Squad" },
    { name: "COD Mobile", maps: ["Crash", "Nuketown", "Summit", "Crossfire"], format: "5v5" }
];

const TEAM_PREFIXES = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Omega", "Titan", "Phoenix", "Dragon", "Viper", "Ghost", "Shadow", "Storm", "Thunder", "Neon", "Cyber", "Pixel", "Quantum", "Solar"];

const generateShortId = () => 'TRN-' + Math.floor(1000 + Math.random() * 9000);

const generateParticipants = (count, gameName) => {
    const participants = [];
    for (let i = 0; i < count; i++) {
        const teamName = `${TEAM_PREFIXES[i % TEAM_PREFIXES.length]} ${gameName} Team ${Math.floor(Math.random() * 100)}`;
        // For simplicity, assuming Squad/5v5 means 4-5 players. Let's list 4 names.
        const players = Array.from({length: 4}, (_, j) => `Player${i}_${j}`);
        
        participants.push({
            email: `player${i}_${Math.random().toString(36).substring(7)}@mock.com`,
            teamName: teamName,
            teamSize: "Squad",
            players: players,
            transactionId: "Free Entry",
            paymentStatus: "Verified",
            joinedAt: new Date().toISOString()
        });
    }
    return participants;
};

const seedTournaments = async () => {
    console.log("🌱 Starting Seed Process...");

    for (const game of GAMES) {
        console.log(`Processing Game: ${game.name}...`);
        
        for (let i = 1; i <= 3; i++) {
            const map = game.maps[Math.floor(Math.random() * game.maps.length)];
            const shortId = generateShortId();
            
            const tournamentData = {
                shortId: shortId,
                title: `${game.name} Championship ${['Series', 'Cup', 'Showdown'][i-1]}`,
                game: game.name,
                map: map,
                format: game.format,
                prize: `${(i * 100) + 50}`, // $150, $250, $350
                entryFee: "Free",
                date: new Date(Date.now() + 86400000 * (i + 1)).toISOString().split('T')[0], // Future dates
                time: "18:00",
                maxSlots: 25, // Slightly more than 20 to show it's not full yet
                discordLink: "https://discord.gg/mock",
                qrCodeUrl: "",
                participants: generateParticipants(20, game.name), // 20 Participants
                status: "Open",
                bracket: [],
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('tournaments').add(tournamentData);
            console.log(`   --> Created Tournament: ${tournamentData.title} (${shortId}) with 20 participants.`);
        }
    }

    console.log("✅ Seeding Complete!");
    process.exit(0);
};

seedTournaments().catch(err => {
    console.error("❌ Seed Failed:", err);
    process.exit(1);
});
