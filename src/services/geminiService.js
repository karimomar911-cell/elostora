// Gemini AI Service
// Integrates with Google Generative AI API for intelligent assistant responses

import { getAvailableModel } from './modelChecker'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
let MODEL_NAME = null
let API_URL = null

// Initialize model on first use
const initializeModel = async () => {
  if (API_URL) return // Already initialized

  if (!API_KEY) {
    throw new Error('Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your environment.')
  }

  console.log('Detecting available Gemini models...')
  MODEL_NAME = await getAvailableModel(API_KEY)
  
  if (!MODEL_NAME) {
    throw new Error('No available Gemini model found. Please check your API key and ensure you have access to Gemini API.')
  }

  API_URL = `https://generativelanguage.googleapis.com/v1beta/${MODEL_NAME}:generateContent`
  console.log(`Initialized with model: ${MODEL_NAME}`)
}

// System context for the assistant
const SYSTEM_PROMPT = `You are a helpful AI assistant for a car service franchise management system. 
You help users with:
- System navigation and features
- Understanding invoicing, inventory, and client management
- User roles: Developer, Admin, Employee, and Client
- Troubleshooting common issues
- Best practices for service center operations

Be concise, professional, and helpful. Use Arabic when the user writes in Arabic, English when they use English.
If asked about something outside the system scope, politely redirect to system-related topics.`

// Stream text generation response from Gemini
export const generateAssistantResponse = async (userMessage, conversationHistory = []) => {
  // Initialize model on first use
  await initializeModel()

  // Simplified request format for testing
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `${SYSTEM_PROMPT}\n\nUser: ${userMessage}\n\nAssistant:`
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  }

  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to generate response from Gemini')
    }

    const data = await response.json()

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text
    } else {
      throw new Error('No response from Gemini API')
    }
  } catch (err) {
    console.error('Gemini API error:', err)
    throw err
  }
}

// Check if Gemini API is configured
export const isGeminiConfigured = () => {
  return !!API_KEY
}
