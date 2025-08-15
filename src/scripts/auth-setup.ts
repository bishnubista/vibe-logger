#!/usr/bin/env tsx

/**
 * Interactive Authentication Setup Script for Vibe Logger
 * 
 * This script guides users through the OAuth authentication process:
 * 1. Validates Google credentials file
 * 2. Opens browser for OAuth authorization
 * 3. Handles the authorization code exchange
 * 4. Tests the authentication
 * 5. Provides next steps
 */

import { GoogleAuth } from '../google/auth.js';
import { GoogleDocsClient } from '../google/client.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class AuthSetup {
  private readonly CREDENTIALS_PATH = path.join(os.homedir(), '.config', 'claude', 'google-credentials.json');
  private readonly TOKENS_PATH = path.join(os.homedir(), '.config', 'claude', 'google-tokens.json');

  async run(): Promise<void> {
    console.log('🚀 Vibe Logger Authentication Setup');
    console.log('=====================================\n');

    try {
      // Step 1: Check credentials file
      await this.validateCredentialsFile();
      
      // Step 2: Initialize auth and get URL
      const { auth, authUrl } = await this.initializeAuth();
      
      // Step 3: Open browser and get code
      const authCode = await this.handleBrowserAuth(authUrl);
      
      // Step 4: Exchange code for tokens
      await this.exchangeAuthCode(auth, authCode);
      
      // Step 5: Test the authentication
      await this.testAuthentication();
      
      // Step 6: Success message
      this.showSuccessMessage();
      
    } catch (error) {
      this.handleError(error);
      process.exit(1);
    }
  }

  private async validateCredentialsFile(): Promise<void> {
    console.log('📋 Step 1: Validating credentials file...\n');
    
    try {
      await fs.access(this.CREDENTIALS_PATH);
      console.log('✅ Credentials file found at:', this.CREDENTIALS_PATH);
      
      // Validate file contents
      const content = await fs.readFile(this.CREDENTIALS_PATH, 'utf8');
      const credentials = JSON.parse(content);
      
      // Check for required fields
      const creds = credentials.installed || credentials;
      if (!creds.client_id || !creds.client_secret) {
        throw new Error('Invalid credentials file format');
      }
      
      console.log('✅ Credentials file is valid');
      console.log(`   Client ID: ${creds.client_id.substring(0, 20)}...`);
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('ENOENT')) {
        console.log('❌ Credentials file not found!\n');
        console.log('Please follow these steps:');
        console.log('1. Complete Google Cloud setup (see docs/AUTHENTICATION_SETUP.md)');
        console.log('2. Download credentials file from Google Cloud Console');
        console.log('3. Place it at:', this.CREDENTIALS_PATH);
        console.log('\nThen run this script again.\n');
        throw new Error('Credentials file missing');
      }
      throw error;
    }
  }

  private async initializeAuth(): Promise<{ auth: GoogleAuth; authUrl: string }> {
    console.log('🔐 Step 2: Initializing authentication...\n');
    
    const auth = new GoogleAuth();
    await auth.initialize();
    
    const authUrl = await auth.getAuthUrl();
    console.log('✅ Authentication URL generated');
    console.log('   URL length:', authUrl.length, 'characters\n');
    
    return { auth, authUrl };
  }

  private async handleBrowserAuth(authUrl: string): Promise<string> {
    console.log('🌐 Step 3: Opening browser for authorization...\n');
    
    // Try to open browser automatically
    try {
      await this.openBrowser(authUrl);
      console.log('✅ Browser opened successfully');
    } catch {
      console.log('⚠️  Could not open browser automatically');
      console.log('   Please manually open this URL:');
      console.log('   ' + authUrl);
    }
    
    console.log('\n📝 After authorizing in the browser:');
    console.log('   1. You\'ll see a success page or authorization code');
    console.log('   2. Copy the authorization code');
    console.log('   3. Paste it below\n');
    
    // Get authorization code from user
    const authCode = await this.promptForAuthCode();
    
    console.log('✅ Authorization code received\n');
    return authCode;
  }

  private async openBrowser(url: string): Promise<void> {
    const platform = process.platform;
    
    let command: string;
    if (platform === 'darwin') {
      command = `open "${url}"`;
    } else if (platform === 'win32') {
      command = `start "${url}"`;
    } else {
      command = `xdg-open "${url}"`;
    }
    
    await execAsync(command);
  }

  private async promptForAuthCode(): Promise<string> {
    return new Promise((resolve) => {
      process.stdout.write('Enter authorization code: ');
      
      process.stdin.once('data', (data) => {
        const code = data.toString().trim();
        resolve(code);
      });
    });
  }

  private async exchangeAuthCode(auth: GoogleAuth, authCode: string): Promise<void> {
    console.log('🔄 Step 4: Exchanging authorization code for tokens...\n');
    
    try {
      await auth.handleAuthCode(authCode);
      console.log('✅ Authorization successful!');
      console.log('   Tokens saved to:', this.TOKENS_PATH);
      console.log('   Tokens will be automatically refreshed when needed\n');
    } catch (error) {
      console.log('❌ Authorization failed');
      if (error instanceof Error) {
        console.log('   Error:', error.message);
      }
      throw error;
    }
  }

  private async testAuthentication(): Promise<void> {
    console.log('🧪 Step 5: Testing authentication...\n');
    
    try {
      const docsClient = new GoogleDocsClient();
      await docsClient.initialize();
      
      if (docsClient.isAuthenticated()) {
        console.log('✅ Authentication test successful!');
        console.log('   Vibe Logger can now access Google Docs API\n');
      } else {
        throw new Error('Authentication test failed');
      }
    } catch (error) {
      console.log('❌ Authentication test failed');
      if (error instanceof Error) {
        console.log('   Error:', error.message);
      }
      throw error;
    }
  }

  private showSuccessMessage(): void {
    console.log('🎉 Setup Complete!');
    console.log('==================\n');
    console.log('Vibe Logger is now ready to use with Claude Code.\n');
    
    console.log('Next steps:');
    console.log('1. Add Vibe Logger to your Claude Code MCP configuration');
    console.log('2. Start using tools like start_session, log_decision, etc.');
    console.log('3. Check docs/AUTHENTICATION_SETUP.md for usage examples\n');
    
    console.log('Test commands:');
    console.log('  npm run auth:test    # Test authentication');
    console.log('  npm run start        # Start the MCP server\n');
  }

  private handleError(error: unknown): void {
    console.log('\n❌ Setup Failed');
    console.log('================\n');
    
    if (error instanceof Error) {
      console.log('Error:', error.message);
    } else {
      console.log('Error:', String(error));
    }
    
    console.log('\nTroubleshooting:');
    console.log('1. Check docs/AUTHENTICATION_SETUP.md for detailed setup');
    console.log('2. Verify Google Cloud project configuration');
    console.log('3. Ensure credentials file is properly downloaded');
    console.log('4. Run npm run auth:reset to clear tokens and retry\n');
  }
}

// Run the setup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new AuthSetup();
  setup.run().catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}