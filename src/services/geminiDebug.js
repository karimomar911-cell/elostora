// Debug utility to test Gemini API and list available models
// Run this in the browser console to test your API key

export const testGeminiAPI = async () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  if (!apiKey) {
    console.error('❌ VITE_GEMINI_API_KEY is not set in environment')
    return
  }

  console.log('🔍 Testing Gemini API...')
  console.log(`API Key (first 20 chars): ${apiKey.substring(0, 20)}...`)

  try {
    // Test 1: List available models
    console.log('\n📋 Fetching available models...')
    const modelsResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    )

    if (!modelsResponse.ok) {
      console.error(`❌ Failed to list models: ${modelsResponse.status} ${modelsResponse.statusText}`)
      const errorData = await modelsResponse.json()
      console.error('Error details:', errorData)
      return
    }

    const modelsData = await modelsResponse.json()
    const models = modelsData.models || []

    console.log(`✓ Found ${models.length} models:`)
    models.forEach(model => {
      console.log(`\n  📌 ${model.name}`)
      console.log(`     Display: ${model.displayName}`)
      console.log(`     Generation Methods: ${model.supportedGenerationMethods?.join(', ') || 'none'}`)
      console.log(`     Input Tokens: ${model.inputTokenLimit}`)
      console.log(`     Output Tokens: ${model.outputTokenLimit}`)
    })

    // Test 2: Try to generate content with the first supported model
    const generateModel = models.find(m => m.supportedGenerationMethods?.includes('generateContent'))
    
    if (generateModel) {
      console.log(`\n🚀 Testing generateContent with ${generateModel.name}...`)
      
      const testResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${generateModel.name}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: 'Hello, please respond with just the word TEST to confirm you are working.' }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 100,
            },
          }),
        }
      )

      if (!testResponse.ok) {
        console.error(`❌ Failed to generate content: ${testResponse.status} ${testResponse.statusText}`)
        const errorData = await testResponse.json()
        console.error('Error details:', errorData)
        return
      }

      const testData = await testResponse.json()
      const responseText = testData.candidates?.[0]?.content?.parts?.[0]?.text

      if (responseText) {
        console.log(`✓ API is working! Response: "${responseText}"`)
        console.log(`\n✅ Use model: ${generateModel.name} in your configuration`)
      } else {
        console.error('❌ No response text received')
      }
    } else {
      console.warn('⚠️  No model found that supports generateContent')
    }
  } catch (err) {
    console.error('❌ Error during test:', err)
  }
}

// Export for window access in browser console
if (typeof window !== 'undefined') {
  window.testGeminiAPI = testGeminiAPI
}
