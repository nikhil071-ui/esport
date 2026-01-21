const http = require('http');

const fetchUrl = (path) => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: path,
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log(`PATH: ${path}`);
      console.log('STATUS:', res.statusCode);
      console.log('DATA:', data);
      console.log('---');
    });
  });
  
  req.on('error', (e) => console.error(e));
  req.end();
};

fetchUrl('/api/leaderboard?type=player&month=2026-01');
fetchUrl('/api/users');
