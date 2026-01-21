const http = require('http');

function getLeaderboard() {
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/leaderboard?type=player&month=2026-01',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            console.log("Response Status:", res.statusCode);
            console.log("Response Body:", body);
        });
    });

    req.on('error', e => console.error(e));
    req.end();
}

getLeaderboard();
