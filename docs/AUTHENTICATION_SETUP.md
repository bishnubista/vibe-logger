# Authentication Setup Guide - Vibe Logger

## 🎯 Overview

This guide walks you through setting up Google OAuth authentication for Vibe Logger. You'll need to create a Google Cloud project, enable APIs, and configure OAuth credentials.

**Estimated Time:** 15-20 minutes  
**Prerequisites:** Google account

## 📋 Step-by-Step Setup

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create New Project**
   - Click "Select a project" dropdown (top of page)
   - Click "New Project"
   - **Project Name:** `vibe-logger` (or your preferred name)
   - **Organization:** Leave as default
   - Click "Create"

3. **Wait for Project Creation**
   - Takes 30-60 seconds
   - You'll see a notification when complete

### Step 2: Enable Required APIs

1. **Navigate to APIs & Services**
   - In the left sidebar, click "APIs & Services" → "Library"
   - Or use this direct link: https://console.cloud.google.com/apis/library

2. **Enable Google Docs API**
   - Search for "Google Docs API"
   - Click on "Google Docs API" result
   - Click "Enable" button
   - Wait for confirmation

3. **Enable Google Drive API** (Optional but recommended)
   - Search for "Google Drive API" 
   - Click on "Google Drive API" result
   - Click "Enable" button
   - This allows file management and search capabilities

### Step 3: Configure OAuth Consent Screen

1. **Navigate to OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Or use: https://console.cloud.google.com/apis/credentials/consent

2. **Choose User Type**
   - Select "External" (allows any Google user)
   - Click "Create"

3. **Fill App Information**
   - **App name:** `Vibe Logger`
   - **User support email:** Your email
   - **Developer contact email:** Your email
   - **App domain fields:** Leave blank for now
   - Click "Save and Continue"

4. **Scopes Configuration**
   - Click "Add or Remove Scopes"
   - Search and add these scopes:
     - `../auth/documents` (Google Docs API)
     - `../auth/drive.file` (Google Drive API - files created by app)
   - Click "Update" then "Save and Continue"

5. **Test Users** (For External apps)
   - Add your email address as a test user
   - Click "Save and Continue"

6. **Review and Submit**
   - Review information
   - Click "Back to Dashboard"

### Step 4: Create OAuth Credentials

1. **Navigate to Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Or use: https://console.cloud.google.com/apis/credentials

2. **Create OAuth Client ID**
   - Click "Create Credentials" → "OAuth client ID"
   - **Application type:** "Desktop application"
   - **Name:** `Vibe Logger Desktop Client`
   - Click "Create"

3. **Download Credentials**
   - A popup will show your credentials
   - Click "Download JSON"
   - Save the file as `google-credentials.json`

### Step 5: Install Credentials

1. **Create Config Directory**
   ```bash
   mkdir -p ~/.config/claude
   ```

2. **Move Credentials File**
   ```bash
   mv ~/Downloads/google-credentials.json ~/.config/claude/google-credentials.json
   ```

3. **Verify File Location**
   ```bash
   ls -la ~/.config/claude/google-credentials.json
   ```

## 🔧 Interactive Authentication Setup

Now that you have the Google Cloud project configured, use the interactive setup:

```bash
# Build the project first
npm run build

# Run the interactive authentication setup
npm run auth:setup
```

This will:
1. Validate your credentials file
2. Open your browser for OAuth authorization
3. Save authentication tokens
4. Test the connection

## 🧪 Testing Your Setup

After authentication, test the basic functionality:

```bash
# Test MCP server startup
npm run start

# In another terminal, test basic MCP communication
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm run start
```

## 🔍 Troubleshooting

### Common Issues

**❌ "Credentials file not found"**
- Verify file location: `~/.config/claude/google-credentials.json`
- Check file permissions: `chmod 600 ~/.config/claude/google-credentials.json`

**❌ "Access blocked: This app isn't verified"**
- Click "Advanced" → "Go to Vibe Logger (unsafe)"
- This is normal for personal/development apps

**❌ "Invalid scope" errors**
- Verify you enabled Google Docs API in Step 2
- Check OAuth consent screen includes correct scopes

**❌ "Token refresh failed"**
- Delete tokens: `rm ~/.config/claude/google-tokens.json`
- Re-run authentication: `npm run auth:setup`

### Getting Help

1. **Check Error Messages**: Authentication errors are usually descriptive
2. **Verify Prerequisites**: Ensure all APIs are enabled
3. **File Permissions**: Config files should be readable but secure
4. **Test Incrementally**: Use the validation tools to isolate issues

## 📚 Understanding the Authentication Flow

### What Happens During Setup:

1. **Credential Validation**: Checks your downloaded credentials file
2. **OAuth URL Generation**: Creates secure authorization URL
3. **Browser Authorization**: You grant permissions to Vibe Logger
4. **Token Exchange**: Authorization code exchanged for access tokens
5. **Token Storage**: Secure storage for future use
6. **Auto-Refresh**: Tokens automatically renewed when needed

### Security Notes:

- **Credentials File**: Contains client ID/secret (not sensitive for desktop apps)
- **Tokens File**: Contains access/refresh tokens (keep secure)
- **Permissions**: Only access to documents created by Vibe Logger
- **Revocation**: Can revoke access anytime in Google Account settings

---

**Next Step**: Once authentication is working, you can start using Vibe Logger with Claude Code!