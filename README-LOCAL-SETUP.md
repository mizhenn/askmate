# Local Development Setup

## Prerequisites

1. Node.js (v18 or higher)
2. npm or yarn
3. API keys for OpenAI and Firecrawl

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd <your-project-name>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

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

## How it works

- **Production mode**: Uses secure Supabase Edge Functions with API keys stored as secrets
- **Local mode**: Uses environment variables for direct API calls
- The app automatically detects the mode based on `VITE_APP_MODE`

## Important Notes

- Never commit `.env.local` to version control
- The `.env.example` file shows the required variables without sensitive values
- For production deployment, use the Supabase Edge Functions setup (no env vars needed)