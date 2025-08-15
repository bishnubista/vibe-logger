import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface Session {
  id: string;
  projectName: string;
  documentId: string;
  documentName: string;
  startTime: Date;
  objective: string;
  template: string;
  previousSessionId?: string;
  isActive: boolean;
}

export interface SessionState {
  currentSession?: Session;
  projectSessions: Map<string, Session[]>;
  todaysDocuments: Map<string, string>; // projectName -> documentId for today
}

export class SessionManager {
  private state: SessionState = {
    projectSessions: new Map(),
    todaysDocuments: new Map()
  };

  private async getCurrentUsername(): Promise<string> {
    try {
      const { stdout } = await execAsync('git config user.name');
      return stdout.trim().toLowerCase().replace(/\s+/g, '-');
    } catch {
      return process.env.USER?.toLowerCase().replace(/\s+/g, '-') || 'developer';
    }
  }

  private sanitizeProjectName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')  // Remove special chars except spaces/hyphens
      .replace(/\s+/g, '-')          // Spaces to hyphens
      .replace(/-+/g, '-')           // Multiple hyphens to single
      .replace(/^-|-$/g, '')         // Remove leading/trailing hyphens
      .slice(0, 50);                 // Reasonable length limit
  }

  private getTodaysDate(): string {
    return new Date().toISOString().split('T')[0]; // 2025-01-15
  }

  async generateDocumentName(projectName: string): Promise<string> {
    const today = this.getTodaysDate();
    const username = await this.getCurrentUsername();
    const cleanProject = this.sanitizeProjectName(projectName);
    return `session-${cleanProject}-${today}-${username}`;
  }

  generateSessionId(): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `session-${timestamp}-${random}`;
  }

  async startSession(
    projectName: string, 
    objective: string, 
    template: string = 'project_log'
  ): Promise<Session> {
    const sessionId = this.generateSessionId();
    const documentName = await this.generateDocumentName(projectName);
    
    // Check if we already have today's document for this project
    const documentId = this.state.todaysDocuments.get(projectName);
    
    const projectSessions = this.state.projectSessions.get(projectName) || [];
    const previousSession = projectSessions.length > 0 
      ? projectSessions[projectSessions.length - 1] 
      : undefined;

    const session: Session = {
      id: sessionId,
      projectName,
      documentId: documentId || '', // Will be set when document is created/found
      documentName,
      startTime: new Date(),
      objective,
      template,
      previousSessionId: previousSession?.id,
      isActive: true
    };

    // End any current session first
    this.endCurrentSession();
    
    // Add to project sessions
    projectSessions.push(session);
    this.state.projectSessions.set(projectName, projectSessions);
    this.state.currentSession = session;

    return session;
  }

  async continueSession(projectName?: string): Promise<Session | null> {
    if (projectName) {
      const projectSessions = this.state.projectSessions.get(projectName);
      if (projectSessions && projectSessions.length > 0) {
        const lastSession = projectSessions[projectSessions.length - 1];
        
        // Check if the last session is from today
        const todaysDate = this.getTodaysDate();
        const sessionDate = lastSession.startTime.toISOString().split('T')[0];
        
        if (sessionDate === todaysDate) {
          // Continue today's session
          this.endCurrentSession();
          lastSession.isActive = true;
          this.state.currentSession = lastSession;
          return lastSession;
        } else {
          // Last session was from a different day, need to start new
          return null;
        }
      }
    }

    // Return current session if it exists and is from today
    if (this.state.currentSession) {
      const todaysDate = this.getTodaysDate();
      const sessionDate = this.state.currentSession.startTime.toISOString().split('T')[0];
      
      if (sessionDate === todaysDate) {
        return this.state.currentSession;
      } else {
        // Current session is from different day, clear it
        this.endCurrentSession();
        return null;
      }
    }

    return null;
  }

  endCurrentSession(): void {
    if (this.state.currentSession) {
      this.state.currentSession.isActive = false;
      this.state.currentSession = undefined;
    }
  }

  getCurrentSession(): Session | null {
    return this.state.currentSession || null;
  }

  getProjectSessions(projectName: string): Session[] {
    return this.state.projectSessions.get(projectName) || [];
  }

  getAllProjects(): string[] {
    return Array.from(this.state.projectSessions.keys());
  }

  setDocumentId(sessionId: string, documentId: string): void {
    // Find the session and update its document ID
    for (const [projectName, sessions] of this.state.projectSessions.entries()) {
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        session.documentId = documentId;
        // Also cache today's document ID for this project
        this.state.todaysDocuments.set(projectName, documentId);
        break;
      }
    }
  }

  // Helper to check if we need a new document for today
  needsNewDocument(projectName: string): boolean {
    const existingDocumentId = this.state.todaysDocuments.get(projectName);
    return !existingDocumentId;
  }

  // Get today's document ID if it exists
  getTodaysDocumentId(projectName: string): string | null {
    return this.state.todaysDocuments.get(projectName) || null;
  }
}