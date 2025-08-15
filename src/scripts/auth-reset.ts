#!/usr/bin/env tsx

/**
 * Authentication Reset Script for Vibe Logger
 * 
 * This script safely resets authentication state:
 * 1. Removes stored tokens
 * 2. Optionally removes credentials
 * 3. Provides guidance for re-setup
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

class AuthReset {
  private readonly CREDENTIALS_PATH = path.join(os.homedir(), '.config', 'claude', 'google-credentials.json');
  private readonly TOKENS_PATH = path.join(os.homedir(), '.config', 'claude', 'google-tokens.json');

  async run(): Promise<void> {
    console.log('🔄 Vibe Logger Authentication Reset');
    console.log('===================================\n');

    const args = process.argv.slice(2);
    const resetCredentials = args.includes('--credentials') || args.includes('-c');
    const force = args.includes('--force') || args.includes('-f');

    try {
      if (!force) {
        console.log('This will reset your Vibe Logger authentication.\n');
        
        if (resetCredentials) {
          console.log('⚠️  WARNING: This will also remove your credentials file.');
          console.log('   You will need to download it again from Google Cloud Console.\n');
        }

        const confirmed = await this.confirmReset();
        if (!confirmed) {
          console.log('Reset cancelled.\n');
          return;
        }
      }

      // Remove tokens
      await this.removeTokens();

      // Remove credentials if requested
      if (resetCredentials) {
        await this.removeCredentials();
      }

      this.showSuccessMessage(resetCredentials);

    } catch (error) {
      console.log('\n❌ Reset failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  private async confirmReset(): Promise<boolean> {
    console.log('Continue with reset? (y/N): ');

    return new Promise((resolve) => {
      process.stdin.once('data', (data) => {
        const input = data.toString().trim().toLowerCase();
        resolve(input === 'y' || input === 'yes');
      });
    });
  }

  private async removeTokens(): Promise<void> {
    console.log('🗑️  Removing authentication tokens...\n');

    try {
      await fs.unlink(this.TOKENS_PATH);
      console.log('✅ Tokens removed:', this.TOKENS_PATH);
    } catch (error) {
      if (error instanceof Error && error.message.includes('ENOENT')) {
        console.log('ℹ️  No tokens file found (already clean)');
      } else {
        throw error;
      }
    }
  }

  private async removeCredentials(): Promise<void> {
    console.log('🗑️  Removing credentials file...\n');

    try {
      await fs.unlink(this.CREDENTIALS_PATH);
      console.log('✅ Credentials removed:', this.CREDENTIALS_PATH);
    } catch (error) {
      if (error instanceof Error && error.message.includes('ENOENT')) {
        console.log('ℹ️  No credentials file found (already clean)');
      } else {
        throw error;
      }
    }
  }

  private showSuccessMessage(credentialsRemoved: boolean): void {
    console.log('\n🎯 Reset Complete!');
    console.log('==================\n');
    
    console.log('Authentication state has been cleared.\n');

    if (credentialsRemoved) {
      console.log('Next steps:');
      console.log('1. Follow docs/AUTHENTICATION_SETUP.md to:');
      console.log('   - Download new credentials from Google Cloud Console');
      console.log('   - Place credentials file in the correct location');
      console.log('2. Run npm run auth:setup to re-authenticate');
    } else {
      console.log('Next steps:');
      console.log('1. Run npm run auth:setup to re-authenticate');
      console.log('2. Your credentials file is still in place');
    }

    console.log('\nQuick commands:');
    console.log('  npm run auth:setup    # Interactive authentication setup');
    console.log('  npm run auth:test     # Test authentication status\n');
  }

  private showUsage(): void {
    console.log('Usage: npm run auth:reset [options]\n');
    console.log('Options:');
    console.log('  --credentials, -c    Also remove credentials file');
    console.log('  --force, -f          Skip confirmation prompt\n');
    console.log('Examples:');
    console.log('  npm run auth:reset                    # Remove tokens only');
    console.log('  npm run auth:reset -- --credentials   # Remove tokens and credentials');
    console.log('  npm run auth:reset -- --force         # Reset without confirmation\n');
  }
}

// Show usage if help requested
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  const reset = new AuthReset();
  (reset as any).showUsage();
  process.exit(0);
}

// Run the reset if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const reset = new AuthReset();
  reset.run().catch((error) => {
    console.error('Reset failed:', error);
    process.exit(1);
  });
}