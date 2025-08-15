import { z } from 'zod';

// Google OAuth2 Credentials Schema
export const GoogleCredentialsSchema = z.object({
  client_id: z.string().min(1, 'Client ID is required'),
  client_secret: z.string().min(1, 'Client secret is required'),
  redirect_uris: z.array(z.string().url()).min(1, 'At least one redirect URI is required')
});

// Handle both direct format and nested "installed" format
export const GoogleCredentialsFileSchema = z.union([
  GoogleCredentialsSchema,
  z.object({
    installed: GoogleCredentialsSchema
  })
]);

// Google OAuth2 Token Schema - matches Google's Credentials interface
export const TokenDataSchema = z.object({
  access_token: z.string().nullable().optional(),
  refresh_token: z.string().nullable().optional(),
  scope: z.string().nullable().optional(),
  token_type: z.string().nullable().optional(),
  expiry_date: z.number().nullable().optional(),
  id_token: z.string().nullable().optional() // Google sometimes includes this
}).transform((data) => ({
  // Transform to ensure we have the required fields for our use
  access_token: data.access_token || '',
  refresh_token: data.refresh_token || undefined,
  scope: data.scope || '',
  token_type: data.token_type || 'Bearer',
  expiry_date: data.expiry_date || undefined,
  id_token: data.id_token || undefined
}));

// Google Docs API Document Schema
export const GoogleDocumentSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
  title: z.string(),
  revisionId: z.string().optional(),
  suggestionsViewMode: z.string().optional()
});

// Document Info for our internal use
export const DocumentInfoSchema = z.object({
  id: z.string().min(1, 'Document ID is required'),
  title: z.string().min(1, 'Document title is required'),
  createdTime: z.string().datetime(),
  modifiedTime: z.string().datetime()
});

// Create Document Options
export const CreateDocumentOptionsSchema = z.object({
  title: z.string().min(1, 'Document title is required').max(255, 'Title too long')
});

// Append Content Options
export const AppendContentOptionsSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
  content: z.string().min(1, 'Content cannot be empty'),
  insertIndex: z.number().int().min(1).optional()
});

// Auth Code for OAuth flow
export const AuthCodeSchema = z.string().min(1, 'Authorization code is required');

// Export types
export type GoogleCredentials = z.infer<typeof GoogleCredentialsSchema>;
export type GoogleCredentialsFile = z.infer<typeof GoogleCredentialsFileSchema>;
export type TokenData = z.output<typeof TokenDataSchema>; // Use z.output for transformed schema
export type GoogleDocument = z.infer<typeof GoogleDocumentSchema>;
export type DocumentInfo = z.infer<typeof DocumentInfoSchema>;
export type CreateDocumentOptions = z.infer<typeof CreateDocumentOptionsSchema>;
export type AppendContentOptions = z.infer<typeof AppendContentOptionsSchema>;