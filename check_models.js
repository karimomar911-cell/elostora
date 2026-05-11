// Check available Gemini models
const API_KEY = 'AIzaSyAS2pFbjZicb2ctm9gK62noLoWvytRFSq8';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

async function checkModels() {
  try {
    console.log('Checking available Gemini models...\n');

    const response = await fetch(`${API_URL}?key=${API_KEY}`);

    if (!response.ok) {
      console.error('Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Response:', errorText);
      return;
    }

    const data = await response.json();

    console.log('Available models:');
    console.log('================');

    if (data.models && data.models.length > 0) {
      data.models.forEach(model => {
        console.log(`\nModel: ${model.name}`);
        console.log(`Display Name: ${model.displayName}`);
        console.log(`Description: ${model.description}`);
        console.log(`Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'None'}`);
        console.log(`Version: ${model.version}`);
      });
    } else {
      console.log('No models found in response');
      console.log('Full response:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('Network error:', error.message);
  }
}

checkModels();