# 🤖 AskMate - AI-Powered Document & Web Analysis

AskMate is an intelligent document analysis and website scraping tool that lets you upload documents or enter website URLs, then ask questions to get AI-powered insights. With persistent chat history and seamless authentication, it's your personal AI research assistant.



## ✨ Features

- 📄 **Document Analysis**: Upload PDFs, Word docs, and text files for AI-powered analysis
- 🌐 **Website Scraping**: Enter any URL to scrape and analyze web content
- 💬 **Intelligent Chat**: Ask questions about your documents and websites using advanced AI
- 📚 **Chat History**: All conversations are automatically saved and organized
- 🔐 **Secure Authentication**: User accounts with Supabase authentication
- 🎨 **Beautiful UI**: Modern, responsive design with dark/light mode support
- 🚀 **Dual Deployment**: Works both locally (with your API keys) and in production (via Supabase Edge Functions)

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **AI Integration**: OpenAI GPT-4.1, Firecrawl API
- **Build Tool**: Vite
- **UI Components**: shadcn/ui

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))
- **Firecrawl API Key** ([Get one here](https://www.firecrawl.dev/))

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/askmate.git
cd askmate
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local
```

Edit `.env.local` with your actual API keys:

```env
# OpenAI API Key for local development
VITE_OPENAI_API_KEY=sk-your-actual-openai-key-here

# Firecrawl API Key for local development  
VITE_FIRECRAWL_API_KEY=fc-your-actual-firecrawl-key-here

# Set to 'local' for local development, 'production' for deployed version
VITE_APP_MODE=local

# Supabase configuration (pre-configured)
VITE_SUPABASE_URL=https://ncpifmvfijbtecwwymou.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcGlmbXZmaWpidGVjd3d5bW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMDQxMTcsImV4cCI6MjA2OTU4MDExN30.FHaSkG3oXUXLoZNF_pXTv_fdFaiMzpM-kXsC0Ly605Q
```

### 4. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📱 How to Use

### Document Analysis
1. **Upload Documents**: Click "Choose Files" or drag & drop PDFs, Word docs, or text files
2. **Ask Questions**: Type questions like "What is the main topic of this document?"
3. **Get AI Insights**: Receive detailed analysis powered by OpenAI's latest models

### Website Scraping
1. **Enter URL**: Paste any website URL in the input field
2. **Scrape Content**: Click the scrape button to extract website content
3. **Analyze Content**: Ask questions about the scraped website content

### Chat History
- All conversations are automatically saved
- Access previous chats from the sidebar
- Delete conversations you no longer need
- Seamless conversation switching

## 🔧 Configuration

### Local vs Production Mode

AskMate supports two modes:

**Local Mode** (`VITE_APP_MODE=local`):
- Uses your API keys directly from `.env.local`
- Perfect for development and personal use
- No backend required

**Production Mode** (`VITE_APP_MODE=production`):
- Uses secure Supabase Edge Functions
- API keys stored safely in Supabase secrets
- Recommended for deployed applications

### Getting API Keys

#### OpenAI API Key
1. Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Sign in to your OpenAI account
3. Click "Create new secret key"
4. Copy the key and add it to your `.env.local`

#### Firecrawl API Key
1. Visit [Firecrawl](https://www.firecrawl.dev/)
2. Sign up for an account
3. Navigate to your API settings
4. Copy your API key and add it to your `.env.local`

## 📁 Project Structure

```
askmate/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── Chat.tsx        # Main chat interface
│   │   ├── ChatHistory.tsx # Chat history sidebar
│   │   ├── Hero.tsx        # Landing page hero
│   │   └── UploadSection.tsx # File upload component
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   ├── utils/              # Utility functions
│   │   ├── AIService.ts    # AI integration service
│   │   ├── WebscrapeService.ts # Website scraping service
│   │   └── DocumentProcessor.ts # Document processing
│   └── integrations/       # Third-party integrations
│       └── supabase/       # Supabase configuration
├── supabase/
│   ├── functions/          # Edge functions
│   │   ├── answer-question/
│   │   ├── scrape-website/
│   │   └── extract-pdf-text/
│   └── migrations/         # Database migrations
├── .env.example           # Environment variables template
└── README.md             # This file
```

## 🧪 Testing

### Test Local Setup
```bash
# Test without API keys (should show errors)
mv .env.local .env.local.backup
npm run dev

# Test with API keys (should work fully)
mv .env.local.backup .env.local
npm run dev
```

### Test Production Build
```bash
npm run build
npm run preview
```

## 🔒 Security

- **API Keys**: Never commit `.env.local` to version control
- **Environment Variables**: Use `.env.example` as a template
- **Production**: API keys are securely stored in Supabase Edge Function secrets
- **Authentication**: User data is protected with Supabase Row Level Security

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**File upload dialog disappears immediately**
- This is usually a browser security feature
- Try using a different browser or disabling extensions

**API key errors**
- Ensure your `.env.local` file exists and contains valid API keys
- Check that `VITE_APP_MODE=local` is set correctly

**Build failures**
- Run `npm install` to ensure all dependencies are installed
- Check for TypeScript errors in the console

**Authentication issues**
- Ensure you're connected to the internet
- Check Supabase service status

### Getting Help

- 📖 [Documentation](https://docs.lovable.dev/)
- 💬 [Discord Community](https://discord.com/channels/1119885301872070706/1280461670979993613)
- 🐛 [Report Issues](https://github.com/yourusername/askmate/issues)

---

<div align="center">
  <p>Built with ❤️ using React, TypeScript, and Supabase</p>
  <p>Powered by OpenAI and Firecrawl APIs</p>
</div>
