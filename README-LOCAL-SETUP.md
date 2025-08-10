# Local Development Setup

## Prerequisites

1. Node.js (v18 or higher)
2. npm or yarn
3. API keys for OpenAI and Firecrawl

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/askmate.git
   cd askmate
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```
   
   **Note:** If you encounter dependency conflicts (ERESOLVE errors), use the `--legacy-peer-deps` flag as shown above. This resolves peer dependency conflicts between packages like `date-fns` and `react-day-picker`.

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Add your API keys to `.env.local`**
   - Get your OpenAI API key from: https://platform.openai.com/api-keys
   - Get your Firecrawl API key from: https://www.firecrawl.dev/
   - Update the values in `.env.local`:
     ```
     VITE_OPENAI_API_KEY=sk-your-actual-openai-key
     VITE_FIRECRAWL_API_KEY=fc-your-actual-firecrawl-key
     VITE_APP_MODE=local
     ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## Troubleshooting

### Common Issues

**"vite: command not found" error:**
- Make sure you've run `npm install --legacy-peer-deps` first
- Ensure Node.js and npm are properly installed

**"This site can't be reached" in browser:**
- Verify the development server is running (look for "VITE ready" message)
- Check the exact URL shown in terminal output (usually `http://localhost:5173/`)
- Try `http://127.0.0.1:5173/` if localhost doesn't work

**Dependency conflicts:**
- Use `npm install --legacy-peer-deps` instead of `npm install`
- Alternatively, try `npm install --force` if the above doesn't work

## How it works

- **Production mode**: Uses secure Supabase Edge Functions with API keys stored as secrets
- **Local mode**: Uses environment variables for direct API calls
- The app automatically detects the mode based on `VITE_APP_MODE`

## Important Notes

- Never commit `.env.local` to version control
- The `.env.example` file shows the required variables without sensitive values
- For production deployment, use the Supabase Edge Functions setup (no env vars needed)
