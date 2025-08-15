import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

import { VibeLoggerService } from './services/vibe-logger.js';
import { GoogleDocsClient } from './google/client.js';
import { SessionManager } from './session/manager.js';
import {
  StartSessionSchema,
  ContinueSessionSchema,
  EndSessionSchema,
  LogDecisionSchema,
  LogActivitySchema,
  SaveConversationSchema
} from './schemas/tools.js';

export function createServer(): Server {
  // Initialize service dependencies
  const sessionManager = new SessionManager();
  const docsClient = new GoogleDocsClient();
  const vibeLogger = new VibeLoggerService(sessionManager, docsClient);

  const server = new Server(
    {
      name: 'vibe-logger',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'start_session',
          description: 'Creates or continues a project documentation session in Google Docs',
          inputSchema: {
            type: 'object',
            properties: {
              project: {
                type: 'string',
                description: 'Project name for the documentation'
              },
              objective: {
                type: 'string', 
                description: 'What you are working on in this session'
              },
              template: {
                type: 'string',
                enum: ['project_log', 'adr', 'feature_spec', 'troubleshooting'],
                description: 'Document template to use (defaults to project_log)'
              }
            },
            required: ['project', 'objective']
          }
        },
        {
          name: 'continue_session',
          description: 'Resumes an existing project session with full context',
          inputSchema: {
            type: 'object',
            properties: {
              project: {
                type: 'string',
                description: 'Project name (auto-detects if not provided)'
              }
            }
          }
        },
        {
          name: 'end_session',
          description: 'Closes current session with summary and next steps',
          inputSchema: {
            type: 'object',
            properties: {
              summary: {
                type: 'string',
                description: 'Session summary (auto-generated if not provided)'
              },
              nextSteps: {
                type: 'array',
                items: { type: 'string' },
                description: 'Next steps for future sessions'
              }
            }
          }
        },
        {
          name: 'log_decision',
          description: 'Records an architecture or implementation decision with rationale',
          inputSchema: {
            type: 'object',
            properties: {
              decision: {
                type: 'string',
                description: 'The decision that was made'
              },
              rationale: {
                type: 'string',
                description: 'Why this decision was made'
              },
              alternatives: {
                type: 'array',
                items: { type: 'string' },
                description: 'Alternative options that were considered'
              },
              impact: {
                type: 'string',
                enum: ['high', 'medium', 'low'],
                description: 'Expected impact of this decision'
              }
            },
            required: ['decision', 'rationale']
          }
        },
        {
          name: 'log_activity',
          description: 'Logs development activity with context',
          inputSchema: {
            type: 'object',
            properties: {
              activity: {
                type: 'string',
                description: 'Description of the activity performed'
              },
              category: {
                type: 'string',
                enum: ['implementation', 'debugging', 'research', 'planning'],
                description: 'Type of development activity'
              },
              outcome: {
                type: 'string',
                description: 'Result or outcome of the activity'
              }
            },
            required: ['activity', 'category']
          }
        },
        {
          name: 'save_conversation',
          description: 'Preserves important conversation or discussion',
          inputSchema: {
            type: 'object',
            properties: {
              topic: {
                type: 'string',
                description: 'Topic or subject of the conversation'
              },
              includeFullText: {
                type: 'boolean',
                description: 'Whether to include full conversation text (defaults to key points only)'
              }
            },
            required: ['topic']
          }
        }
      ]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      // Initialize service if needed
      await vibeLogger.initialize();

      switch (name) {
        case 'start_session':
          return await handleStartSession(vibeLogger, args);
        
        case 'continue_session':
          return await handleContinueSession(vibeLogger, args);
          
        case 'end_session':
          return await handleEndSession(vibeLogger, args);
          
        case 'log_decision':
          return await handleLogDecision(vibeLogger, args);
          
        case 'log_activity':
          return await handleLogActivity(vibeLogger, args);
          
        case 'save_conversation':
          return await handleSaveConversation(vibeLogger, args);

        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
      }
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      
      throw new McpError(
        ErrorCode.InternalError,
        `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  return server;
}

async function handleStartSession(vibeLogger: VibeLoggerService, args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
  // Validate input with Zod schema
  const validatedInput = StartSessionSchema.parse(args);
  
  try {
    const result = await vibeLogger.startSession(validatedInput);
    
    return {
      content: [
        {
          type: 'text',
          text: `🚀 Session started successfully!\n\n` +
                `**Project:** ${result.session.projectName}\n` +
                `**Objective:** ${result.session.objective}\n` +
                `**Document:** ${result.document.title}\n` +
                `**Document ID:** ${result.document.id}\n` +
                `**Status:** ${result.isNewDocument ? 'New document created' : 'Continuing existing document'}\n\n` +
                `Session is now active and ready for logging decisions, activities, and conversations.`
        }
      ]
    };
  } catch (error) {
    // Handle authentication errors specially
    if (error instanceof Error && error.message.includes('Authentication required')) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Authentication required to start session.\n\n${error.message}\n\n` +
                  `Please complete the Google OAuth setup before starting a session.`
          }
        ]
      };
    }
    throw error;
  }
}

async function handleContinueSession(vibeLogger: VibeLoggerService, args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
  // Validate input with Zod schema
  const validatedInput = ContinueSessionSchema.parse(args);
  
  const result = await vibeLogger.continueSession(validatedInput);
  
  if (!result) {
    return {
      content: [
        {
          type: 'text',
          text: `📖 No existing session found${validatedInput.project ? ` for project "${validatedInput.project}"` : ''}.\n\n` +
                `Use 'start_session' to begin a new session.`
        }
      ]
    };
  }
  
  return {
    content: [
      {
        type: 'text',
        text: `📖 Session continued successfully!\n\n` +
              `**Project:** ${result.session.projectName}\n` +
              `**Original Objective:** ${result.session.objective}\n` +
              `**Document:** ${result.document.title}\n` +
              `**Document ID:** ${result.document.id}\n` +
              `**Started:** ${result.session.startTime.toISOString()}\n\n` +
              `Session is now active and ready for continued logging.`
      }
    ]
  };
}

async function handleEndSession(vibeLogger: VibeLoggerService, args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
  // Validate input with Zod schema
  const validatedInput = EndSessionSchema.parse(args);
  
  try {
    const result = await vibeLogger.endSession(validatedInput);
    
    return {
      content: [
        {
          type: 'text',
          text: `✅ Session ended successfully!\n\n` +
                `**Project:** ${result.session.projectName}\n` +
                `**Duration:** ${Math.round((Date.now() - result.session.startTime.getTime()) / (1000 * 60))} minutes\n` +
                `**Summary:** ${result.summary}\n\n` +
                `Session data has been saved to the project document.`
        }
      ]
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('No active session')) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ No active session to end.\n\nUse 'start_session' to begin a new session first.`
          }
        ]
      };
    }
    throw error;
  }
}

async function handleLogDecision(vibeLogger: VibeLoggerService, args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
  // Validate input with Zod schema
  const validatedInput = LogDecisionSchema.parse(args);
  
  try {
    await vibeLogger.logDecision(validatedInput);
    
    return {
      content: [
        {
          type: 'text',
          text: `📝 Decision logged successfully!\n\n` +
                `**Decision:** ${validatedInput.decision}\n` +
                `**Rationale:** ${validatedInput.rationale}\n` +
                `${validatedInput.impact ? `**Impact:** ${validatedInput.impact}\n` : ''}` +
                `\nDecision has been added to the current session document.`
        }
      ]
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('No active session')) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ No active session found.\n\nStart a session first using 'start_session' before logging decisions.`
          }
        ]
      };
    }
    throw error;
  }
}

async function handleLogActivity(vibeLogger: VibeLoggerService, args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
  // Validate input with Zod schema
  const validatedInput = LogActivitySchema.parse(args);
  
  try {
    await vibeLogger.logActivity(validatedInput);
    
    return {
      content: [
        {
          type: 'text',
          text: `⚡ Activity logged successfully!\n\n` +
                `**Activity:** ${validatedInput.activity}\n` +
                `**Category:** ${validatedInput.category}\n` +
                `${validatedInput.outcome ? `**Outcome:** ${validatedInput.outcome}\n` : ''}` +
                `\nActivity has been added to the current session document.`
        }
      ]
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('No active session')) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ No active session found.\n\nStart a session first using 'start_session' before logging activities.`
          }
        ]
      };
    }
    throw error;
  }
}

async function handleSaveConversation(vibeLogger: VibeLoggerService, args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
  // Validate input with Zod schema
  const validatedInput = SaveConversationSchema.parse(args);
  
  try {
    await vibeLogger.saveConversation(validatedInput);
    
    return {
      content: [
        {
          type: 'text',
          text: `💬 Conversation saved successfully!\n\n` +
                `**Topic:** ${validatedInput.topic}\n` +
                `**Full Text:** ${validatedInput.includeFullText ? 'Yes' : 'Key points only'}\n\n` +
                `Conversation has been added to the current session document.`
        }
      ]
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('No active session')) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ No active session found.\n\nStart a session first using 'start_session' before saving conversations.`
          }
        ]
      };
    }
    throw error;
  }
}