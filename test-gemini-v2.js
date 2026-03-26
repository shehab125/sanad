async function testModel(modelName) {
  const apiKey = 'AIzaSyDsVdU-XBz3r7WLD0LYZkaCpgxXki6YPmQ';
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] })
    });
    const data = await response.json();
    console.log(`Model ${modelName}:`, response.status, data.error ? data.error.message : 'OK');
  } catch (err) {
    console.error(`${modelName} failed:`, err);
  }
}

async function run() {
  await testModel('gemini-1.5-flash');
  await testModel('gemini-1.5-flash-latest');
  await testModel('gemini-2.0-flash-lite');
  await testModel('gemini-flash-latest');
}
run();
