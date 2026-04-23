const axios = require('axios');

async function testLocalHealth() {
    try {
        console.log('Hitting health check...');
        const res = await axios.get('http://localhost:5000/api/health');
        console.log('Health Status:', res.data);
    } catch (e) {
        console.error('FAILED to hit health check:', e.message);
        if (e.response) {
            console.error('Response Status:', e.response.status);
            console.error('Response Data:', e.response.data);
        }
    }
}

testLocalHealth();
