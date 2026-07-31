import http from 'http';

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 2001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer local-guest-token',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, data });
      });
    });

    req.on('error', (e) => reject(e));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log("Testing POST /api/runs/performance ...");
  try {
    const res = await makeRequest('/api/runs/performance', 'POST', {
      flowId: '62360f88-e4e9-4268-87f0-16a2d52dd1a0',
      performanceConfig: { virtualUsers: 1, duration: 10 },
      nodes: [{ id: 'node-1', type: 'action', data: { label: 'Test' } }],
      edges: []
    });
    console.log("POST /api/runs/performance Status:", res.statusCode);
    console.log("POST /api/runs/performance Body:", res.data);
  } catch (err) {
    console.error("HTTP Request Error:", err);
  }
}

run();
