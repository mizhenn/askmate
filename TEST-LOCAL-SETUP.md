# Testing Local Setup Before GitHub Upload

## Quick Test Checklist

Before uploading to GitHub, test these scenarios to ensure users can run your project locally:

### 1. Test Fresh Clone Simulation
```bash
# Simulate what users will do:
rm -rf node_modules
rm .env.local  # Delete your current env file
npm install
npm run dev
```

**Expected Result:** App should start but show API key errors when trying to use AI features.

### 2. Test Environment Setup
```bash
cp .env.example .env.local
# Edit .env.local and add test API keys
npm run dev
```

**Expected Result:** App should work fully with local API keys.

### 3. Test Mode Detection
- Open the app and click "API Keys" button
- Should show "Local Environment" status
- Should display instructions about .env.local

### 4. Test API Integration
- Try uploading a document and asking a question
- Try scraping a website URL
- Both should work with your local API keys

### 5. Test Missing Keys Gracefully
- Remove one API key from .env.local
- Try using that feature
- Should show clear error message about missing key

## What Users Will See

1. **First Run (no .env.local):**
   - App loads but AI features show API key errors
   - Clear instructions in API Keys dialog

2. **After Setup:**
   - Full functionality with their own API keys
   - Local mode indicators in UI

3. **Production Deploy:**
   - Automatically switches to Supabase Edge Functions
   - No environment variables needed

## Files Safe for GitHub
✅ `.env.example` - Template with fake values
✅ `README-LOCAL-SETUP.md` - Setup instructions  
✅ Updated service files with mode detection
✅ Updated UI components showing local status

## Files That Stay Private
❌ `.env.local` - Your real API keys (auto-ignored by git)
❌ Supabase secrets - Stored securely on Supabase servers