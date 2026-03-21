const http = require('http');

const PORT = process.env.PORT || 3001;
const URL = `http://127.0.0.1:${PORT}`;

function checkStatus() {
  console.log(`Checking deployment at ${URL}...`);
  
  // Check health endpoint
  http.get(`${URL}/health`, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Backend health check passed.');
      } else {
        console.error(`❌ Backend health check failed with status ${res.statusCode}`);
        process.exit(1);
      }
      
      // Check root path for frontend
      http.get(URL, (res2) => {
        let data2 = '';
        res2.on('data', (chunk) => data2 += chunk);
        res2.on('end', () => {
          if (res2.statusCode === 200 && data2.includes('<div id="root">')) {
            console.log('✅ Frontend root page check passed.');
            console.log('Deployment verification successful!');
            process.exit(0);
          } else {
            console.error(`❌ Frontend root page check failed. Status: ${res2.statusCode}`);
            process.exit(1);
          }
        });
      }).on('error', (err) => {
        console.error('❌ Error checking frontend:', err.message);
        process.exit(1);
      });
    });
  }).on('error', (err) => {
    console.error(`❌ Error checking backend health: ${err.message}`);
    process.exit(1);
  });
}

// Wait a bit for the server to start if needed
setTimeout(checkStatus, 2000);
