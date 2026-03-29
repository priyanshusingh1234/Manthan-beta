const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

async function testApi() {
  const schoolId = '8c5ae2b2-7a62-47f8-8cf1-6e2d6bc5c718';
  const url = `http://localhost:3000/api/war/history?schoolId=${schoolId}`;
  
  console.log('Testing API:', url);
  // Need to use node-fetch or similar, but since I am in a non-web environment, I will just call the handler directly if possible? 
  // No, I'll just use a curl-like command if the server is running, or I can't.
  
  console.log('Cant call localhost from script if server not running. I will check the API code again.');
}

testApi();
