const axios = require('axios');

async function testAuth() {
    try {
        console.log('1. Attempting Registration...');
        const regPayload = {
            fullName: 'Test User',
            accountEmail: 'test55@example.com',
            password: 'password123',
            phoneNumber: '1234567890',
            centreName: 'Test Centre',
            ownerName: 'Test Owner',
            contactEmail: 'test55@example.com',
            address: '123 Test St'
        };
        
        let regResp;
        try {
            regResp = await axios.post('http://localhost:8080/api/auth/register', regPayload);
            console.log('Registration Success:', regResp.data);
        } catch (e) {
            console.log('Registration Error:', e.response ? e.response.data : e.message);
            // Ignore error if already registered
        }

        console.log('\n2. Attempting Login...');
        const loginPayload = {
            email: 'test55@example.com',
            password: 'password123'
        };
        
        const loginResp = await axios.post('http://localhost:8080/api/auth/login', loginPayload);
        console.log('Login Success data keys:', Object.keys(loginResp.data));
    } catch (error) {
        console.error('Login Failed with status:', error.response ? error.response.status : error.message);
        console.error('Login error response data:', error.response ? error.response.data : '');
    }
}

testAuth();
