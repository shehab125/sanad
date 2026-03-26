async function testModel(modelName, version) {
  const apiKey = 'AIzaSyDsVdU-XBz3r7WLD0LYZkaCpgxXki6YPmQ';
  try {
    const url = `https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] })
    });
    const data = await response.json();
    console.log(`[${version}] ${modelName}:`, response.status, data.error ? data.error.message : 'OK');
  } catch (err) {
    console.error(`[${version}] ${modelName} failed:`, err);
  }
}

async function run() {
  // Test 1.5 variants which usually have higher quotas
  await testModel('gemini-1.5-flash', 'v1');
  await testModel('gemini-1.5-flash-8b', 'v1');
  await testModel('gemini-1.5-flash', 'v1beta');
  await testModel('gemini-1.5-flash-8b', 'v1beta');
  
  // Test 2.0 variants
  await testModel('gemini-2.0-flash', 'v1beta');
  await testModel('gemini-2.0-flash-lite-preview-02-05', 'v1beta');
}
run();
