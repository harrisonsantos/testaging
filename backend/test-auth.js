const http = require('http');

// Test data for authentication
const testUsers = [
  {
    cpf: "111.111.111-01",
    password: "patient",
    profile: "patient"
  },
  {
    cpf: "222.222.222-01", 
    password: "researcher",
    profile: "researcher"
  },
  {
    cpf: "333.333.333-01",
    password: "healthProfessional", 
    profile: "healthProfessional"
  }
];

// Test authentication endpoints
async function testAuthEndpoints() {
  console.log('🧪 TESTING AUTHENTICATION ENDPOINTS');
  console.log('=====================================\n');

  // Test 1: Login endpoint
  console.log('1. Testing /auth/login endpoint...');
  
  for (const user of testUsers) {
    try {
      const loginData = JSON.stringify({
        cpf: user.cpf,
        password: user.password
      });

      const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(loginData)
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          console.log(`   ✅ Login for ${user.profile} (${user.cpf}):`);
          console.log(`      Status: ${res.statusCode}`);
          if (res.statusCode === 200) {
            const response = JSON.parse(data);
            console.log(`      ✅ Success: ${response.mensagem}`);
            console.log(`      ✅ Access Token: ${response.access_token ? 'Present' : 'Missing'}`);
            console.log(`      ✅ Refresh Token: ${response.refresh_token ? 'Present' : 'Missing'}`);
            console.log(`      ✅ User: ${response.user ? response.user.name : 'Missing'}`);
          } else {
            console.log(`      ❌ Error: ${data}`);
          }
          console.log('');
        });
      });

      req.on('error', (error) => {
        console.log(`   ❌ Connection error for ${user.profile}: ${error.message}`);
        console.log('');
      });

      req.write(loginData);
      req.end();

    } catch (error) {
      console.log(`   ❌ Test error for ${user.profile}: ${error.message}`);
      console.log('');
    }
  }

  // Test 2: Profile endpoint (requires authentication)
  console.log('2. Testing /auth/profile endpoint (requires authentication)...');
  
  // This would require a valid token, so we'll just test the endpoint structure
  const profileOptions = {
    hostname: 'localhost',
    port: 3001,
    path: '/auth/profile',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer invalid-token'
    }
  };

  const profileReq = http.request(profileOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log(`   Status: ${res.statusCode}`);
      if (res.statusCode === 401) {
        console.log('   ✅ Correctly rejected invalid token');
      } else {
        console.log(`   ❌ Unexpected response: ${data}`);
      }
      console.log('');
    });
  });

  profileReq.on('error', (error) => {
    console.log(`   ❌ Connection error: ${error.message}`);
    console.log('');
  });

  profileReq.end();

  // Test 3: Swagger documentation
  console.log('3. Testing Swagger documentation endpoint...');
  
  const swaggerOptions = {
    hostname: 'localhost',
    port: 3001,
    path: '/api',
    method: 'GET'
  };

  const swaggerReq = http.request(swaggerOptions, (res) => {
    console.log(`   Status: ${res.statusCode}`);
    if (res.statusCode === 200) {
      console.log('   ✅ Swagger documentation is accessible');
    } else {
      console.log('   ❌ Swagger documentation not accessible');
    }
    console.log('');
  });

  swaggerReq.on('error', (error) => {
    console.log(`   ❌ Connection error: ${error.message}`);
    console.log('');
  });

  swaggerReq.end();
}

// Run the tests
console.log('🚀 Starting authentication endpoint tests...\n');
testAuthEndpoints();

// Wait a bit for all requests to complete
setTimeout(() => {
  console.log('✅ Authentication endpoint tests completed!');
  console.log('\n📋 SUMMARY:');
  console.log('- If you see connection errors, the server is not running');
  console.log('- If you see 200 status codes, the endpoints are working');
  console.log('- If you see 401 status codes, authentication is working correctly');
  console.log('- Check the server logs for any compilation errors');
}, 3000);
