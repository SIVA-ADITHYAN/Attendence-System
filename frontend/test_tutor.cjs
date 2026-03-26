const axios = require('axios');

async function testTutorCreation() {
    try {
        console.log("1. Logging in as Admin...");
        const loginRes = await axios.post("http://localhost:8080/api/auth/login", {
            email: "t9@e.com", // Valid registered admin from my previous curl test
            password: "123"
        });
        const token = loginRes.data.token;
        console.log("Admin logged in! Token acquired.");

        // Decode token to get centre ID
        const payloadStr = Buffer.from(token.split('.')[1], 'base64').toString();
        const payload = JSON.parse(payloadStr);
        const centreId = payload.centreId;

        console.log("2. Attempting to add tutor for centre:", centreId);
        const tutorPayload = {
            fullName: "Test Tutor",
            email: "tutor100@e.com",
            phoneNumber: "9876543210",
            password: "password123",
            role: "TUTOR",
            coachingCentreId: centreId
        };

        const res = await axios.post("http://localhost:8080/api/users", tutorPayload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Tutor Creation Success:", res.data);
    } catch (e) {
        console.error("Tutor Creation Failed:", e.response ? e.response.status : e.message);
        console.error("Payload:", e.response ? e.response.data : '');
    }
}

testTutorCreation();
