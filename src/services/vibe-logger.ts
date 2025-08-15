import { GoogleDocsClient } from '../google/client.js';
import { SessionManager, Session } from '../session/manager.js';
import {
  StartSessionInput,
  ContinueSessionInput,
  EndSessionInput,
  LogDecisionInput,
  LogActivityInput,
  SaveConversationInput
} from '../schemas/tools.js';
import { DocumentInfo } from '../schemas/google.js';

/**
 * Main orchestration service for Vibe Logger
 * 
 * This service coordinates between session management and document operations,
 * implementing the core business logic for persistent development session logging.
 * 
 * Key responsibilities:
 * - Session lifecycle management (start, continue, end)
 * - Document creation and content management
 * - Template-based document structure
 * - Context preservation across sessions
 */
export class VibeLoggerService {
  constructor(
    private sessionManager: SessionManager,
    private docsClient: GoogleDocsClient
  ) {}

  /**
   * Initialize the service and ensure authentication
   */
  async initialize(): Promise<void> {
    await this.docsClient.initialize();
  }

  /**
   * Start a new coding session with document creation
   * 
   * Business Logic:
   * 1. Create or find today's document for the project
   * 2. Set up session tracking
   * 3. Initialize document with template content
   * 4. Link session to document for future operations
   */
  async startSession(input: StartSessionInput): Promise<{
    session: Session;
    document: DocumentInfo;
    isNewDocument: boolean;
  }> {
    // Start session tracking
    const session = await this.sessionManager.startSession(
      input.project,
      input.objective,
      input.template
    );

    let document: DocumentInfo;
    let isNewDocument = false;

    // Check if we need to create a new document for today
    const existingDocumentId = this.sessionManager.getTodaysDocumentId(input.project);
    
    if (existingDocumentId) {
      // Continue with existing document
      try {
        const existingDoc = await this.docsClient.getDocument(existingDocumentId);
        document = {
          id: existingDocumentId,
          title: existingDoc.title || session.documentName,
          createdTime: new Date().toISOString(), // We don't have exact creation time
          modifiedTime: new Date().toISOString()
        };
      } catch {
        // Document might have been deleted, create a new one
        document = await this.createSessionDocument(session);
        isNewDocument = true;
      }
    } else {
      // Create new document
      document = await this.createSessionDocument(session);
      isNewDocument = true;
    }

    // Link session to document
    this.sessionManager.setDocumentId(session.id, document.id);

    // Add session header to document
    await this.addSessionHeader(document.id, session, isNewDocument);

    return {
      session,
      document,
      isNewDocument
    };
  }

  /**
   * Continue an existing session
   * 
   * Business Logic:
   * 1. Find existing session for project/today
   * 2. Validate document still exists
   * 3. Add continuation marker to document
   */
  async continueSession(input: ContinueSessionInput): Promise<{
    session: Session;
    document: DocumentInfo;
  } | null> {
    const session = await this.sessionManager.continueSession(input.project);
    
    if (!session) {
      return null;
    }

    // Validate document still exists
    try {
      const existingDoc = await this.docsClient.getDocument(session.documentId);
      const document: DocumentInfo = {
        id: session.documentId,
        title: existingDoc.title || session.documentName,
        createdTime: session.startTime.toISOString(),
        modifiedTime: new Date().toISOString()
      };

      // Add continuation marker
      await this.addContinuationMarker(document.id, session);

      return { session, document };
    } catch (error) {
      // Document no longer exists, session is invalid
      this.sessionManager.endCurrentSession();
      throw new Error(`Session document no longer exists: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * End current session with summary
   * 
   * Business Logic:
   * 1. Generate session summary
   * 2. Add next steps to document
   * 3. Mark session as inactive
   */
  async endSession(input: EndSessionInput): Promise<{
    session: Session;
    summary: string;
  }> {
    const currentSession = this.sessionManager.getCurrentSession();
    
    if (!currentSession) {
      throw new Error('No active session to end');
    }

    // Generate or use provided summary
    const summary = input.summary || await this.generateSessionSummary(currentSession);

    // Add session end content to document
    await this.addSessionEnd(currentSession.documentId, summary, input.nextSteps);

    // End session tracking
    this.sessionManager.endCurrentSession();

    return {
      session: currentSession,
      summary
    };
  }

  /**
   * Log an architecture or implementation decision
   * 
   * Business Logic:
   * 1. Validate active session
   * 2. Format decision with timestamp and context
   * 3. Append to current session document
   */
  async logDecision(input: LogDecisionInput): Promise<void> {
    const currentSession = this.sessionManager.getCurrentSession();
    
    if (!currentSession) {
      throw new Error('No active session. Start a session first.');
    }

    const timestamp = new Date().toISOString();
    const decisionContent = this.formatDecision(input, timestamp);

    await this.docsClient.appendContent({
      documentId: currentSession.documentId,
      content: decisionContent
    });
  }

  /**
   * Log a development activity
   * 
   * Business Logic:
   * 1. Validate active session
   * 2. Format activity with timestamp and category
   * 3. Append to current session document
   */
  async logActivity(input: LogActivityInput): Promise<void> {
    const currentSession = this.sessionManager.getCurrentSession();
    
    if (!currentSession) {
      throw new Error('No active session. Start a session first.');
    }

    const timestamp = new Date().toISOString();
    const activityContent = this.formatActivity(input, timestamp);

    await this.docsClient.appendContent({
      documentId: currentSession.documentId,
      content: activityContent
    });
  }

  /**
   * Save important conversation or discussion
   * 
   * Business Logic:
   * 1. Validate active session
   * 2. Format conversation with context
   * 3. Append to current session document
   */
  async saveConversation(input: SaveConversationInput): Promise<void> {
    const currentSession = this.sessionManager.getCurrentSession();
    
    if (!currentSession) {
      throw new Error('No active session. Start a session first.');
    }

    const timestamp = new Date().toISOString();
    const conversationContent = this.formatConversation(input, timestamp);

    await this.docsClient.appendContent({
      documentId: currentSession.documentId,
      content: conversationContent
    });
  }

  /**
   * Get current session status
   */
  getCurrentSessionStatus(): {
    hasActiveSession: boolean;
    session?: Session;
  } {
    const currentSession = this.sessionManager.getCurrentSession();
    return {
      hasActiveSession: !!currentSession,
      session: currentSession || undefined
    };
  }

  // Private helper methods for document formatting

  private async createSessionDocument(session: Session): Promise<DocumentInfo> {
    const document = await this.docsClient.createDocument({
      title: session.documentName
    });

    // Add initial template content
    const templateContent = this.getTemplateContent(session.template, session);
    await this.docsClient.appendContent({
      documentId: document.id,
      content: templateContent
    });

    return document;
  }

  private async addSessionHeader(documentId: string, session: Session, isNewDocument: boolean): Promise<void> {
    const timestamp = new Date().toISOString();
    const header = isNewDocument 
      ? `\n\n## 🚀 Session Started\n**Time:** ${timestamp}\n**Objective:** ${session.objective}\n\n`
      : `\n\n## 🔄 Session Continued\n**Time:** ${timestamp}\n**Objective:** ${session.objective}\n\n`;

    await this.docsClient.appendContent({
      documentId,
      content: header
    });
  }

  private async addContinuationMarker(documentId: string, session: Session): Promise<void> {
    const timestamp = new Date().toISOString();
    const marker = `\n\n---\n## 🔄 Session Resumed\n**Time:** ${timestamp}\n**Continuing work on:** ${session.objective}\n\n`;

    await this.docsClient.appendContent({
      documentId,
      content: marker
    });
  }

  private async addSessionEnd(documentId: string, summary: string, nextSteps?: string[]): Promise<void> {
    const timestamp = new Date().toISOString();
    let endContent = `\n\n---\n## ✅ Session Ended\n**Time:** ${timestamp}\n**Summary:** ${summary}\n`;

    if (nextSteps && nextSteps.length > 0) {
      endContent += `\n**Next Steps:**\n${nextSteps.map(step => `- ${step}`).join('\n')}\n`;
    }

    endContent += '\n---\n\n';

    await this.docsClient.appendContent({
      documentId,
      content: endContent
    });
  }

  private formatDecision(input: LogDecisionInput, timestamp: string): string {
    let content = `\n### 📋 Decision: ${input.decision}\n`;
    content += `**Time:** ${timestamp}\n`;
    content += `**Rationale:** ${input.rationale}\n`;

    if (input.alternatives && input.alternatives.length > 0) {
      content += `**Alternatives Considered:**\n${input.alternatives.map(alt => `- ${alt}`).join('\n')}\n`;
    }

    if (input.impact) {
      content += `**Impact Level:** ${input.impact}\n`;
    }

    return content + '\n';
  }

  private formatActivity(input: LogActivityInput, timestamp: string): string {
    let content = `\n### ⚡ Activity: ${input.activity}\n`;
    content += `**Time:** ${timestamp}\n`;
    content += `**Category:** ${input.category}\n`;

    if (input.outcome) {
      content += `**Outcome:** ${input.outcome}\n`;
    }

    return content + '\n';
  }

  private formatConversation(input: SaveConversationInput, timestamp: string): string {
    let content = `\n### 💬 Conversation: ${input.topic}\n`;
    content += `**Time:** ${timestamp}\n`;
    
    if (input.includeFullText) {
      content += `**Note:** Full conversation text would be captured here in a real implementation.\n`;
    } else {
      content += `**Key Points:** Summary of important discussion points about ${input.topic}\n`;
    }

    return content + '\n';
  }

  private getTemplateContent(template: string, session: Session): string {
    const timestamp = new Date().toISOString();
    
    switch (template) {
      case 'adr':
        return `# Architecture Decision Record: ${session.projectName}\n\n` +
               `**Date:** ${timestamp}\n` +
               `**Status:** Proposed\n\n` +
               `## Context\n\n` +
               `## Decision\n\n` +
               `## Rationale\n\n` +
               `## Consequences\n\n`;

      case 'feature_spec':
        return `# Feature Specification: ${session.projectName}\n\n` +
               `**Created:** ${timestamp}\n` +
               `**Objective:** ${session.objective}\n\n` +
               `## Overview\n\n` +
               `## Requirements\n\n` +
               `## Technical Approach\n\n` +
               `## Implementation Notes\n\n`;

      case 'troubleshooting':
        return `# Troubleshooting Log: ${session.projectName}\n\n` +
               `**Started:** ${timestamp}\n` +
               `**Issue:** ${session.objective}\n\n` +
               `## Problem Description\n\n` +
               `## Investigation Steps\n\n` +
               `## Solutions Attempted\n\n` +
               `## Resolution\n\n`;

      case 'project_log':
      default:
        return `# Development Log: ${session.projectName}\n\n` +
               `**Started:** ${timestamp}\n` +
               `**Session Objective:** ${session.objective}\n\n` +
               `## Development Notes\n\n`;
    }
  }

  private async generateSessionSummary(session: Session): Promise<string> {
    // In a real implementation, this could analyze the document content
    // For now, return a basic summary
    const duration = Date.now() - session.startTime.getTime();
    const minutes = Math.round(duration / (1000 * 60));
    
    return `Session completed after ${minutes} minutes. Worked on: ${session.objective}`;
  }
}