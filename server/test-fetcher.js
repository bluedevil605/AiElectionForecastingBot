require('dotenv').config();
const { gatherExternalContext } = require('./utils/contextFetcher');

async function testFetch() {
    const q = "Bihar Assembly Election 2025";
    console.log(`Testing context fetch for: "${q}"`);
    try {
        const ctx = await gatherExternalContext(q);
        if (ctx) {
            console.log('\n--- CONTEXT FOUND ---');
            console.log(ctx.slice(0, 500) + '...');
            console.log('\nTotal Length:', ctx.length);
        } else {
            console.log('\n--- NO CONTEXT FOUND ---');
        }
    } catch (e) {
        console.error('Error during fetch:', e.message);
    }
}

testFetch();
