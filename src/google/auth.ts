import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { 
  GoogleCredentials, 
  TokenData, 
  GoogleCredentialsFileSchema, 
  TokenDataSchema,
  AuthCodeSchema 
} from '../schemas/google.js';

export class GoogleAuth {
  private oauth2Client: OAuth2Client | null = null;
  private credentials: GoogleCredentials | null = null;
  
  private readonly SCOPES = ['https://www.googleapis.com/auth/documents'];
  private readonly CREDENTIALS_PATH = path.join(os.homedir(), '.config', 'claude', 'google-credentials.json');
  private readonly TOKEN_PATH = path.join(os.homedir(), '.config', 'claude', 'google-tokens.json');

  async initialize(): Promise<void> {
    try {
      // Load and validate credentials from your existing file
      const credentialsContent = await fs.readFile(this.CREDENTIALS_PATH, 'utf8');
      const credentialsData = JSON.parse(credentialsContent);
      
      // Validate credentials file format with Zod
      const validatedCredentialsFile = GoogleCredentialsFileSchema.parse(credentialsData);
      
      // Handle both direct format and nested "installed" format
      this.credentials = 'installed' in validatedCredentialsFile 
        ? validatedCredentialsFile.installed 
        : validatedCredentialsFile;
      
      // Create OAuth2 client
      this.oauth2Client = new google.auth.OAuth2(
        this.credentials.client_id,
        this.credentials.client_secret,
        this.credentials.redirect_uris[0] || 'urn:ietf:wg:oauth:2.0:oob'
      );

      // Try to load existing tokens
      await this.loadTokens();
      
    } catch (error) {
      throw new Error(`Failed to initialize Google Auth: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async loadTokens(): Promise<void> {
    try {
      const tokenContent = await fs.readFile(this.TOKEN_PATH, 'utf8');
      const tokenData = JSON.parse(tokenContent);
      
      // Validate token data with Zod
      const validatedTokens = TokenDataSchema.parse(tokenData);
      
      if (this.oauth2Client) {
        this.oauth2Client.setCredentials(validatedTokens);
        
        // Check if token needs refresh
        if (this.isTokenExpired(validatedTokens)) {
          await this.refreshTokens();
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        console.log('Invalid token format found. Re-authentication required.');
      } else {
        console.log('No valid tokens found. Authentication required.');
      }
    }
  }

  private isTokenExpired(tokens: TokenData): boolean {
    if (!tokens.expiry_date) return true;
    return Date.now() >= tokens.expiry_date;
  }

  private async refreshTokens(): Promise<void> {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      // Validate and transform the credentials from Google
      const validatedTokens = TokenDataSchema.parse(credentials);
      
      this.oauth2Client.setCredentials(validatedTokens);
      await this.saveTokens(validatedTokens);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        throw new Error('Invalid token data received during refresh');
      }
      // Refresh failed - user needs to re-authenticate
      throw new Error('Token refresh failed. Re-authentication required.');
    }
  }

  async getAuthUrl(): Promise<string> {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.SCOPES,
      prompt: 'consent' // Force consent screen to ensure refresh token
    });
  }

  async handleAuthCode(code: string): Promise<void> {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    try {
      // Validate auth code with Zod
      const validatedCode = AuthCodeSchema.parse(code);
      
      const { tokens } = await this.oauth2Client.getToken(validatedCode);
      
      // Validate received tokens
      const validatedTokens = TokenDataSchema.parse(tokens);
      
      this.oauth2Client.setCredentials(validatedTokens);
      await this.saveTokens(validatedTokens);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        throw new Error('Invalid authorization code format');
      }
      throw new Error(`Failed to exchange auth code: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async saveTokens(tokens: TokenData): Promise<void> {
    try {
      // Validate tokens before saving
      const validatedTokens = TokenDataSchema.parse(tokens);
      
      // Ensure directory exists
      const tokenDir = path.dirname(this.TOKEN_PATH);
      await fs.mkdir(tokenDir, { recursive: true });
      
      // Save validated tokens
      await fs.writeFile(this.TOKEN_PATH, JSON.stringify(validatedTokens, null, 2));
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        throw new Error('Invalid token data received from Google API');
      }
      throw new Error(`Failed to save tokens: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getAuthenticatedClient(): Promise<OAuth2Client> {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    // Check if we have valid credentials
    const credentials = this.oauth2Client.credentials;
    if (!credentials.access_token) {
      throw new Error('No access token available. Authentication required.');
    }

    // Check if token is expired and refresh if needed
    if (this.isTokenExpired(credentials as TokenData)) {
      await this.refreshTokens();
    }

    return this.oauth2Client;
  }

  isAuthenticated(): boolean {
    if (!this.oauth2Client) return false;
    
    const credentials = this.oauth2Client.credentials;
    return !!(credentials.access_token && !this.isTokenExpired(credentials as TokenData));
  }

  async clearTokens(): Promise<void> {
    try {
      await fs.unlink(this.TOKEN_PATH);
      if (this.oauth2Client) {
        this.oauth2Client.setCredentials({});
      }
    } catch {
      // File doesn't exist, that's fine
    }
  }
}