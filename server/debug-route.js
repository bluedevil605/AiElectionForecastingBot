const axios = require('axios');

async function testFullForecast() {
    try {
        console.log('Sending forecast request for "Bihar Assembly Election 2025"...');
        const res = await axios.post('http://localhost:5000/api/forecast', {
            query: 'Bihar Assembly Election 2025'
        }, { timeout: 120000 }); // Large timeout for AI
        console.log('\n--- SUCCESS! ---');
        console.log('Model Source:', res.data.modelSource);
        console.log('Candidates:', res.data.candidates?.length || 0);
    } catch (e) {
        console.error('\n--- FAILED ---');
        console.error('Error:', e.message);
        if (e.response) {
            console.error('Status:', e.response.status);
            console.error('Body:', JSON.stringify(e.response.data, null, 2));
        }
    }
}

testFullForecast();
