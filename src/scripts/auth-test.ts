#!/usr/bin/env tsx

/**
 * Authentication Test Script for Vibe Logger
 * 
 * This script tests the current authentication setup:
 * 1. Checks if credentials and tokens exist
 * 2. Tests Google API connection
 * 3. Validates MCP server functionality
 * 4. Reports any issues found
 */

import { GoogleAuth } from '../google/auth.js';
import { GoogleDocsClient } from '../google/client.js';
import { VibeLoggerService } from '../services/vibe-logger.js';
import { SessionManager } from '../session/manager.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

class AuthTest {
  private readonly CREDENTIALS_PATH = path.join(os.homedir(), '.config', 'claude', 'google-credentials.json');
  private readonly TOKENS_PATH = path.join(os.homedir(), '.config', 'claude', 'google-tokens.json');

  async run(): Promise<void> {
    console.log('🧪 Vibe Logger Authentication Test');
    console.log('===================================\n');

    let allTestsPassed = true;

    try {
      // Test 1: Check files exist
      const filesExist = await this.testFilesExist();
      allTestsPassed = allTestsPassed && filesExist;

      // Test 2: Test authentication
      const authWorks = await this.testAuthentication();
      allTestsPassed = allTestsPassed && authWorks;

      // Test 3: Test Google Docs API
      const docsApiWorks = await this.testGoogleDocsAPI();
      allTestsPassed = allTestsPassed && docsApiWorks;

      // Test 4: Test service layer
      const serviceWorks = await this.testServiceLayer();
      allTestsPassed = allTestsPassed && serviceWorks;

      // Summary
      this.showSummary(allTestsPassed);

    } catch (error) {
      console.log('\n❌ Test suite failed with error:');
      console.log('  ', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }

    process.exit(allTestsPassed ? 0 : 1);
  }

  private async testFilesExist(): Promise<boolean> {
    console.log('📁 Test 1: Checking configuration files...\n');

    let success = true;

    // Check credentials file
    try {
      await fs.access(this.CREDENTIALS_PATH);
      console.log('✅ Credentials file exists:', this.CREDENTIALS_PATH);
    } catch {
      console.log('❌ Credentials file missing:', this.CREDENTIALS_PATH);
      success = false;
    }

    // Check tokens file
    try {
      await fs.access(this.TOKENS_PATH);
      console.log('✅ Tokens file exists:', this.TOKENS_PATH);
    } catch {
      console.log('❌ Tokens file missing:', this.TOKENS_PATH);
      console.log('   Run npm run auth:setup to authenticate');
      success = false;
    }

    console.log();
    return success;
  }

  private async testAuthentication(): Promise<boolean> {
    console.log('🔐 Test 2: Testing authentication...\n');

    try {
      const auth = new GoogleAuth();
      await auth.initialize();

      if (auth.isAuthenticated()) {
        console.log('✅ Authentication successful');
        
        // Test token refresh if needed
        try {
          await auth.getAuthenticatedClient();
          console.log('✅ Token validation successful');
        } catch (error) {
          console.log('⚠️  Token validation failed:', error instanceof Error ? error.message : String(error));
          return false;
        }
      } else {
        console.log('❌ Not authenticated');
        console.log('   Run npm run auth:setup to authenticate');
        return false;
      }

      console.log();
      return true;
    } catch (error) {
      console.log('❌ Authentication test failed:', error instanceof Error ? error.message : String(error));
      console.log();
      return false;
    }
  }

  private async testGoogleDocsAPI(): Promise<boolean> {
    console.log('📄 Test 3: Testing Google Docs API access...\n');

    try {
      const docsClient = new GoogleDocsClient();
      await docsClient.initialize();

      if (!docsClient.isAuthenticated()) {
        console.log('❌ Google Docs client not authenticated');
        return false;
      }

      console.log('✅ Google Docs API client initialized');
      console.log('✅ Ready to create and manage documents');

      // Note: We don't create a test document here to avoid cluttering the user's Drive
      // In a real test, you might create and immediately delete a test document

      console.log();
      return true;
    } catch (error) {
      console.log('❌ Google Docs API test failed:', error instanceof Error ? error.message : String(error));
      console.log();
      return false;
    }
  }

  private async testServiceLayer(): Promise<boolean> {
    console.log('⚙️  Test 4: Testing service layer integration...\n');

    try {
      const sessionManager = new SessionManager();
      const docsClient = new GoogleDocsClient();
      const vibeLogger = new VibeLoggerService(sessionManager, docsClient);

      await vibeLogger.initialize();

      // Test session status
      const status = vibeLogger.getCurrentSessionStatus();
      console.log('✅ Service layer initialized');
      console.log('✅ Session status check working');
      console.log('   Active session:', status.hasActiveSession ? 'Yes' : 'No');

      console.log();
      return true;
    } catch (error) {
      console.log('❌ Service layer test failed:', error instanceof Error ? error.message : String(error));
      console.log();
      return false;
    }
  }

  private showSummary(allTestsPassed: boolean): void {
    console.log('📊 Test Summary');
    console.log('===============\n');

    if (allTestsPassed) {
      console.log('🎉 All tests passed!');
      console.log('\nVibe Logger is properly configured and ready to use.\n');
      
      console.log('Next steps:');
      console.log('1. Add to your Claude Code MCP configuration');
      console.log('2. Start using tools: start_session, log_decision, etc.');
      console.log('3. Check the documentation for usage examples\n');
    } else {
      console.log('❌ Some tests failed!');
      console.log('\nVibe Logger is not properly configured.\n');
      
      console.log('Troubleshooting steps:');
      console.log('1. Run npm run auth:setup to configure authentication');
      console.log('2. Check docs/AUTHENTICATION_SETUP.md for detailed setup');
      console.log('3. Verify Google Cloud project configuration');
      console.log('4. If issues persist, run npm run auth:reset and try again\n');
    }
  }
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const test = new AuthTest();
  test.run().catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}