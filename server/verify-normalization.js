const { normaliseData } = require('./utils/apiChain');

const mockData = {
    candidates: [
        { name: "Candidate A", win_probability: "45.5", projected_vote_share: 50 },
        { name: "Candidate B", win_probability: "0.0", projected_vote_share: "0" }
    ],
    verified_candidates: [
        { name: "Candidate C", win_probability: 0.0 }
    ]
};

const result = normaliseData(mockData);
console.log('Normalised Data:');
console.log(JSON.stringify(result, null, 2));

const probA = result.candidates[0].winProbability;
const probB = result.candidates[1].winProbability;
const probC = result.verified_candidates[0].winProbability;

console.log(`\nProb A: ${probA} (expected 45.5)`);
console.log(`Prob B: ${probB} (expected 0)`);
console.log(`Prob C: ${probC} (expected 0)`);

if (probB === 0 && probC === 0 && probA === 45.5) {
    console.log('\nVERIFICATION SUCCESS: 0.0 is preserved and types are correct.');
} else {
    console.log('\nVERIFICATION FAILED!');
    process.exit(1);
}
