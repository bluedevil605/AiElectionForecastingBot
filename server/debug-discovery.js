require('dotenv').config();
const { discoveryAgent } = require('./agents/discoveryAgent');

async function debugDiscovery() {
    console.log('Testing Discovery Agent (Verify + Validate combo)...');
    try {
        const data = await discoveryAgent('Bihar Assembly Election 2025');
        console.log('\n--- SUCCESS ---');
        console.log('Status:', data.election_status);
        console.log('Candidates:', data.candidates?.length);
    } catch (e) {
        console.error('\n--- FAILED ---');
        console.error('Message:', e.message);
        if (e.response) {
            console.error('Status:', e.response.status);
            console.error('Data:', JSON.stringify(e.response.data));
        }
    }
}

debugDiscovery();
