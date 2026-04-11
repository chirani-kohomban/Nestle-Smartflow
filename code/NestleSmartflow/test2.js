const http = require('http');

['manager', 'warehouse', 'distributor'].forEach(username => {
  const req = http.request('http://localhost:5000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => console.log(`Login for ${username}:`, res.statusCode, data));
  });
  req.write(JSON.stringify({username: username, password: 'password123'}));
  req.end();
});
