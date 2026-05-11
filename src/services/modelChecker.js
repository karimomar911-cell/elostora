// Utility to check available Gemini models
export const listAvailableModels = async (apiKey) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.statusText}`)
    }

    const data = await response.json()
    return data.models || []
  } catch (err) {
    console.error('Error listing models:', err)
    return []
  }
}

// Get the first available model that supports generateContent
export const getAvailableModel = async (apiKey) => {
  const models = await listAvailableModels(apiKey)
  
  if (models.length === 0) {
    console.warn('No models found')
    return null
  }

  // Log all available models for debugging
  console.log('Available models:')
  models.forEach(model => {
    console.log(`- ${model.name}`)
    console.log(`  Display name: ${model.displayName}`)
    console.log(`  Supported methods: ${model.supportedGenerationMethods?.join(', ') || 'none'}`)
  })

  // Find a model that supports generateContent
  const supportedModel = models.find(
    model => model.supportedGenerationMethods?.includes('generateContent')
  )

  if (supportedModel) {
    console.log(`Using model: ${supportedModel.name}`)
    return supportedModel.name
  }

  console.warn('No model with generateContent support found')
  return null
}
