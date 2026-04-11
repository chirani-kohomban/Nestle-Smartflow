const http = require('http');

async function test() {
  // Login first
  let token = await new Promise((resolve) => {
    const req = http.request('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(JSON.parse(data).token));
    });
    req.write(JSON.stringify({username: 'distributor', password: 'password123'}));
    req.end();
  });

  // Then fetch route
  const req2 = http.request('http://localhost:5000/api/route', {
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + token }
  }, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => console.log('Route Response:', res.statusCode, data));
  });
  req2.end();
}
test();
