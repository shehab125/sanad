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
  await testModel('gemini-pro', 'v1');
  await testModel('gemini-pro', 'v1beta');
  await testModel('gemini-1.5-pro', 'v1');
  await testModel('gemini-1.5-pro', 'v1beta');
  await testModel('gemini-2.0-flash-lite-001', 'v1beta');
}
run();
