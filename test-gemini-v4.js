async function testModels() {
  const apiKey = 'AIzaSyDsVdU-XBz3r7WLD0LYZkaCpgxXki6YPmQ';
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    console.log('Model Names Full List:', JSON.stringify(data.models.map(m => m.name), null, 2));
  } catch (err) {
    console.error('Fetch failed:', err);
  }
}
testModels();
