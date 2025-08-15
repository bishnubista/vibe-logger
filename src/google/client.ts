import { google, docs_v1 } from 'googleapis';
import { GoogleAuth } from './auth.js';
import { 
  DocumentInfo, 
  CreateDocumentOptions, 
  AppendContentOptions,
  DocumentInfoSchema,
  CreateDocumentOptionsSchema,
  AppendContentOptionsSchema,
  GoogleDocumentSchema
} from '../schemas/google.js';

export class GoogleDocsClient {
  private auth: GoogleAuth;
  private docsApi: docs_v1.Docs | null = null;

  constructor() {
    this.auth = new GoogleAuth();
  }

  async initialize(): Promise<void> {
    await this.auth.initialize();
    
    const authClient = await this.auth.getAuthenticatedClient();
    this.docsApi = google.docs({ version: 'v1', auth: authClient });
  }

  async ensureAuthenticated(): Promise<void> {
    if (!this.auth.isAuthenticated()) {
      const authUrl = await this.auth.getAuthUrl();
      throw new Error(`Authentication required. Please visit: ${authUrl}`);
    }

    if (!this.docsApi) {
      const authClient = await this.auth.getAuthenticatedClient();
      this.docsApi = google.docs({ version: 'v1', auth: authClient });
    }
  }

  async createDocument(options: CreateDocumentOptions): Promise<DocumentInfo> {
    // Validate input with Zod
    const validatedOptions = CreateDocumentOptionsSchema.parse(options);
    
    await this.ensureAuthenticated();
    
    if (!this.docsApi) {
      throw new Error('Google Docs API not initialized');
    }

    try {
      const response = await this.docsApi.documents.create({
        requestBody: {
          title: validatedOptions.title
        }
      });

      const doc = response.data;
      
      // Validate Google API response
      const validatedDoc = GoogleDocumentSchema.parse(doc);
      
      if (!validatedDoc.documentId || !validatedDoc.title) {
        throw new Error('Invalid document response from Google API');
      }

      // Create and validate our DocumentInfo
      const documentInfo = {
        id: validatedDoc.documentId,
        title: validatedDoc.title,
        createdTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString()
      };

      return DocumentInfoSchema.parse(documentInfo);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        throw new Error('Invalid data received from Google Docs API');
      }
      throw new Error(`Failed to create document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getDocument(documentId: string): Promise<docs_v1.Schema$Document> {
    await this.ensureAuthenticated();
    
    if (!this.docsApi) {
      throw new Error('Google Docs API not initialized');
    }

    try {
      const response = await this.docsApi.documents.get({
        documentId: documentId
      });

      // Note: Google's Schema$Document is complex and varies
      // For now, we'll trust Google's API response structure
      // TODO: Create comprehensive Zod schema for Document structure if needed
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async appendContent(options: AppendContentOptions): Promise<void> {
    // Validate input with Zod
    const validatedOptions = AppendContentOptionsSchema.parse(options);
    
    await this.ensureAuthenticated();
    
    if (!this.docsApi) {
      throw new Error('Google Docs API not initialized');
    }

    try {
      // First, get the document to find the end index
      const doc = await this.getDocument(validatedOptions.documentId);
      const endIndex = doc.body?.content?.[doc.body.content.length - 1]?.endIndex || 1;

      // Insert content at the specified position or end
      await this.docsApi.documents.batchUpdate({
        documentId: validatedOptions.documentId,
        requestBody: {
          requests: [
            {
              insertText: {
                location: {
                  index: validatedOptions.insertIndex || (endIndex - 1) // -1 because we can't insert at the very end
                },
                text: validatedOptions.content
              }
            }
          ]
        }
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        throw new Error('Invalid append content options provided');
      }
      throw new Error(`Failed to append content: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findDocumentByTitle(_title: string): Promise<DocumentInfo | null> {
    await this.ensureAuthenticated();
    
    // Note: Google Docs API doesn't have a direct search by title
    // This would require Google Drive API to search for documents
    // For MVP, we'll return null and create new documents
    // TODO: Implement Drive API search in future version
    
    return null;
  }

  async formatContent(_content: string, _documentId: string, _startIndex: number): Promise<void> {
    await this.ensureAuthenticated();
    
    if (!this.docsApi) {
      throw new Error('Google Docs API not initialized');
    }

    // This method can be used to apply formatting like bold, italic, headers, etc.
    // For MVP, we'll keep it simple and just insert plain text
    // TODO: Implement rich formatting in future version
  }

  // Helper method to check if we need authentication
  isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  // Helper to get auth URL for manual authentication
  async getAuthUrl(): Promise<string> {
    return await this.auth.getAuthUrl();
  }

  // Helper to handle auth code from manual flow
  async handleAuthCode(code: string): Promise<void> {
    await this.auth.handleAuthCode(code);
    
    // Reinitialize the docs API with new credentials
    const authClient = await this.auth.getAuthenticatedClient();
    this.docsApi = google.docs({ version: 'v1', auth: authClient });
  }
}