const http = require('http');

const API_PORT = 5000;
const API_HOST = 'localhost';

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

function deleteRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: API_HOST,
            port: API_PORT,
            path: '/api' + path,
            method: 'DELETE'
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
        req.end();
    });
}

async function removeMockData() {
    console.log("🗑️  Starting cleanup of Mock Data...");

    try {
        const tournaments = await getRequest('/tournaments');
        console.log(`Found ${tournaments.length} total tournaments.`);

        const mockTournaments = tournaments.filter(t => t.title && t.title.startsWith("Mock Cup"));
        console.log(`Found ${mockTournaments.length} mock tournaments to delete.`);

        if (mockTournaments.length === 0) {
            console.log("No mock data found to delete.");
            return;
        }

        let deletedCount = 0;
        for (const t of mockTournaments) {
            await deleteRequest(`/tournament/${t.id}`);
            process.stdout.write(`Deleted: ${t.title} (${t.id})\n`);
            deletedCount++;
        }

        console.log(`\n✅ Successfully deleted ${deletedCount} mock tournaments.`);

    } catch (error) {
        console.error("Error removing data:", error);
    }
}

removeMockData();
