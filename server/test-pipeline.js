require('dotenv').config();
const { verifyAgent } = require('./agents/verifyAgent');
const { validationAgent } = require('./agents/validationAgent');
const { trendAgent } = require('./agents/trendAgent');
const { sentimentAgent } = require('./agents/sentimentAgent');
const { forecastAgent } = require('./agents/forecastAgent');

async function testFullPipeline() {
  const query = "Bihar Assembly Election 2025";
  console.log(`\n--- TESTING FULL PIPELINE FOR: ${query} ---`);
  
  try {
    console.log('\n[Phase 1] Verification...');
    const verification = await verifyAgent(query);
    console.log('Verification Status:', verification.election_status);
    console.log('Candidates:', verification.verified_candidates?.map(c => c.name).join(', '));
    
    console.log('\n[Phase 2] Validation...');
    const validation = await validationAgent(query, verification);
    
    console.log('\n[Phase 3] Trend...');
    const trend = await trendAgent(query, validation);
    
    console.log('\n[Phase 4] Sentiment...');
    const sentiment = await sentimentAgent(query);
    
    console.log('\n[Phase 5] Final Forecast...');
    const { data: final, source } = await forecastAgent(query, verification, validation, trend, sentiment);
    
    console.log(`\nSUCCESS via ${source.toUpperCase()}!`);
    console.log('Final Forecast Object:', JSON.stringify(final, null, 2));
    
    if (final.candidates) {
      console.log('\nFinal Candidates & Probabilities:');
      final.candidates.forEach(c => {
        console.log(`- ${c.name}: ${c.winProbability}% (Raw: ${c.winProbability})`);
      });
    } else {
      console.log('\nNo candidates found in final forecast.');
    }
    
  } catch (err) {
    console.error('\nPIPELINE FAILED:', err.message);
    if (err.response) {
       console.error('API Error Body:', JSON.stringify(err.response.data));
    }
  }
}

testFullPipeline();
