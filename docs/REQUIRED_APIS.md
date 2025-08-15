# Required Google APIs for Vibe Logger

## APIs That Must Be Enabled

For Vibe Logger to work properly, you need to enable these APIs in your Google Cloud project:

### 1. Google Docs API ⭐ **REQUIRED**
- **API Name**: Google Docs API
- **Enable URL**: https://console.developers.google.com/apis/api/docs.googleapis.com/overview
- **Purpose**: Create and edit Google Documents
- **Scopes Used**: `https://www.googleapis.com/auth/documents`

### 2. Google Drive API 📁 **RECOMMENDED**  
- **API Name**: Google Drive API
- **Enable URL**: https://console.developers.google.com/apis/api/drive.googleapis.com/overview
- **Purpose**: File management and organization
- **Scopes Used**: `https://www.googleapis.com/auth/drive.file`

## How to Enable APIs

### Method 1: Direct Links (Fastest)
1. Click the Enable URL above for each API
2. Make sure you're in the correct Google Cloud project
3. Click "Enable" button
4. Wait 2-3 minutes for propagation

### Method 2: Google Cloud Console
1. Go to https://console.cloud.google.com/
2. Select your project
3. Navigate to "APIs & Services" → "Library"
4. Search for "Google Docs API"
5. Click on the API and then "Enable"
6. Repeat for Google Drive API

## Verification

After enabling the APIs, you can verify they're working by running:

```bash
npm run auth:test
```

If the test passes, try starting a session:

```bash
# In your MCP client or Claude Code
start_session project:"test" objective:"Testing API access"
```

## Troubleshooting

**Error: "API has not been used in project before"**
- Solution: Enable the specific API mentioned in the error message
- Wait 2-3 minutes after enabling before retrying

**Error: "Permission denied"**  
- Check OAuth scopes include the required permissions
- Verify your OAuth consent screen is properly configured

**Error: "Quota exceeded"**
- Google Docs API has generous free quotas
- Check your project's quota usage in Cloud Console