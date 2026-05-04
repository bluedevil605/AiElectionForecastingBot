async function testSearch() {
  console.log('--- STARTING BACKEND SEARCH TEST ---');
  try {
    const response = await fetch('http://localhost:5000/api/forecast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: "US Presidential Election 2028" })
    });
    
    console.log('Status Code:', response.status);
    const body = await response.json();
    console.log('Full Response Body:', JSON.stringify(body, null, 2).slice(0, 500));
    
    if (response.ok) {
      console.log('\n✅ BACKEND IS WORKING CORRECTLY.');
    } else {
      console.log('\n❌ BACKEND RETURNED ERROR:', body.error || 'Unknown Error');
    }
  } catch (e) {
    console.error('\n❌ CONNECTION FAILED:', e.message);
  }
  console.log('--- TEST COMPLETE ---');
}

testSearch();
