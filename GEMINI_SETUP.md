# AI Assistant Setup Guide

## Gemini API Integration for Support Assistant

The Support Assistant now includes AI-powered chat functionality using Google's Gemini API. Follow these steps to enable it:

### 1. Get Your Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Click **"Get API Key"** in the left sidebar
3. Create a new API key or use an existing one
4. Copy the API key

### 2. Configure Environment Variables

Create or edit the `.env.local` file in your project root and add:

```env
VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
```

Replace `your_actual_gemini_api_key_here` with your actual API key from step 1.

**Example:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_key
VITE_DEV_PASSWORD=admin
VITE_GEMINI_API_KEY=AIzaSyD1234567890abcdefghijklmnop
```

### 3. Restart Your Development Server

```bash
npm run dev
```

### 4. Test the AI Assistant

1. Open your app in the browser
2. Click the floating assistant avatar (bottom-left corner)
3. You should see a chat interface with quick help topics
4. Type a question and press Enter or click the Send button
5. The AI assistant will respond with helpful information

### Features

- **AI Chat**: Ask questions about the system and get intelligent responses
- **Quick Help Topics**: Access the top 5 help topics instantly
- **Arabic & English Support**: The AI responds in the language you use
- **Context-Aware**: The AI understands the car service franchise system
- **Drag & Drop**: Move the assistant around the page

### Troubleshooting

- **"Gemini API key not configured"**: Make sure you've added `VITE_GEMINI_API_KEY` to `.env.local` and restarted the dev server
- **API Errors**: Check that your API key is valid and hasn't hit rate limits
- **No Response**: Check browser console for error messages

### Important Security Notes

- ⚠️ **Never commit `.env.local` to git** - add it to `.gitignore`
- Keep your API key confidential
- The API key is only used in the browser for Gemini calls
- Consider using API key restrictions in Google Cloud Console for production

### Disabling AI Assistant

If you want to disable the AI chat feature, simply remove or comment out the `VITE_GEMINI_API_KEY` in `.env.local`. The assistant will show quick help topics only.
