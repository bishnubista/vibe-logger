# Google Workspace MCP Server

## Project Overview

A comprehensive Model Context Protocol (MCP) server that enables Claude and other AI assistants to interact seamlessly with Google Workspace services including Google Docs, Drive, Sheets, and Calendar.

## Core Mission

Enable AI assistants to:
- Create and manage Google Docs for business documentation
- Organize files and folders in Google Drive  
- Read from and write to Google Sheets for data management
- Schedule and manage calendar events
- Provide a unified interface for Google Workspace automation

## Target Users

- Business professionals using Claude Code for documentation
- Developers integrating AI workflows with Google Workspace
- Teams wanting to automate Google Workspace tasks via AI
- Consultants and freelancers managing client work through Google services

## Architecture

### MCP Server Structure
```
google-workspace-mcp/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                 # MCP server entry point
│   ├── server.ts               # MCP server implementation
│   ├── auth/
│   │   ├── oauth.ts            # OAuth2 flow handler
│   │   ├── service-account.ts  # Service account auth
│   │   └── token-manager.ts    # Token refresh logic
│   ├── services/
│   │   ├── docs.ts             # Google Docs operations
│   │   ├── drive.ts            # Google Drive operations
│   │   ├── sheets.ts           # Google Sheets operations
│   │   └── calendar.ts         # Google Calendar operations
│   ├── tools/
│   │   ├── docs-tools.ts       # MCP tools for Docs
│   │   ├── drive-tools.ts      # MCP tools for Drive
│   │   ├── sheets-tools.ts     # MCP tools for Sheets
│   │   └── calendar-tools.ts   # MCP tools for Calendar
│   ├── types/
│   │   ├── docs.ts             # Type definitions for Docs
│   │   ├── drive.ts            # Type definitions for Drive
│   │   └── common.ts           # Shared type definitions
│   └── utils/
│       ├── config.ts           # Configuration management
│       ├── logger.ts           # Logging utilities
│       └── validation.ts       # Input validation
├── config/
│   ├── mcp-server-config.json  # MCP server configuration
│   └── workspace-config.json   # Google Workspace settings
├── examples/
│   ├── business-documentation/ # Business use case examples
│   ├── project-management/     # Project management examples
│   └── data-analysis/          # Data analysis examples
├── docs/
│   ├── setup.md               # Installation and setup guide
│   ├── authentication.md      # Authentication setup
│   ├── api-reference.md       # Complete API documentation
│   └── use-cases.md           # Common use cases and examples
└── tests/
    ├── unit/                  # Unit tests
    ├── integration/           # Integration tests
    └── e2e/                   # End-to-end tests
```

## MCP Tools Specification

### Google Docs Tools

#### `create_google_doc`
**Description**: Create a new Google Document
**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "Document title"
    },
    "content": {
      "type": "string", 
      "description": "Initial document content (optional)"
    },
    "folderId": {
      "type": "string",
      "description": "Parent folder ID (optional, defaults to root)"
    },
    "templateId": {
      "type": "string",
      "description": "Template document ID to copy from (optional)"
    }
  },
  "required": ["title"]
}
```
**Output**: Document ID, URL, and creation timestamp

#### `append_to_doc`
**Description**: Add content to the end of an existing document
**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "documentId": {
      "type": "string",
      "description": "Google Doc ID"
    },
    "content": {
      "type": "string",
      "description": "Content to append"
    },
    "formatting": {
      "type": "object",
      "properties": {
        "style": {
          "type": "string",
          "enum": ["NORMAL_TEXT", "HEADING_1", "HEADING_2", "HEADING_3"]
        },
        "bold": {"type": "boolean"},
        "italic": {"type": "boolean"}
      }
    }
  },
  "required": ["documentId", "content"]
}
```

#### `insert_content_at_position`
**Description**: Insert content at a specific position in the document
**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "documentId": {"type": "string"},
    "content": {"type": "string"},
    "position": {
      "type": "string",
      "enum": ["beginning", "end", "after_heading"],
      "description": "Where to insert content"
    },
    "headingText": {
      "type": "string",
      "description": "Required if position is 'after_heading'"
    }
  },
  "required": ["documentId", "content", "position"]
}
```

#### `get_document_content`
**Description**: Retrieve the full content of a Google Doc
**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "documentId": {"type": "string"},
    "format": {
      "type": "string",
      "enum": ["plain_text", "markdown", "structured"],
      "default": "plain_text"
    }
  },
  "required": ["documentId"]
}
```

#### `search_documents`
**Description**: Search for documents by title, content, or metadata
**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "query": {"type": "string"},
    "searchIn": {
      "type": "string",
      "enum": ["title", "content", "both"],
      "default": "both"
    },
    "folderId": {
      "type": "string",
      "description": "Limit search to specific folder"
    },
    "limit": {
      "type": "number",
      "default": 10,
      "maximum": 100
    }
  },
  "required": ["query"]
}
```

#### `update_document_permissions`
**Description**: Manage document sharing and permissions
**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "documentId": {"type": "string"},
    "permissions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "email": {"type": "string"},
          "role": {
            "type": "string",
            "enum": ["reader", "writer", "commenter", "owner"]
          }
        }
      }
    },
    "linkSharing": {
      "type": "string",
      "enum": ["private", "anyone_with_link", "public"]
    }
  },
  "required": ["documentId"]
}
```

### Google Drive Tools

#### `create_folder`
**Description**: Create a new folder in Google Drive
**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "name": {"type": "string"},
    "parentId": {
      "type": "string",
      "description": "Parent folder ID (optional)"
    }
  },
  "required": ["name"]
}
```

#### `list_files`
**Description**: List files and folders in Google Drive
**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "folderId": {
      "type": "string",
      "description": "Folder to list (optional, defaults to root)"
    },
    "fileType": {
      "type": "string",
      "enum": ["all", "documents", "spreadsheets", "presentations", "folders"],
      "default": "all"
    },
    "limit": {
      "type": "number",
      "default": 50,
      "maximum": 1000
    }
  }
}
```

#### `move_file`
**Description**: Move a file or folder to a different location
**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "fileId": {"type": "string"},
    "newParentId": {"type": "string"},
    "removeFromCurrentParent": {
      "type": "boolean",
      "default": true
    }
  },
  "required": ["fileId", "newParentId"]
}
```

#### `upload_file`
**Description**: Upload a local file to Google Drive
**Input Schema**:
```json
{
  "type": "object", 
  "properties": {
    "filePath": {"type": "string"},
    "name": {
      "type": "string",
      "description": "Optional custom name"
    },
    "folderId": {
      "type": "string",
      "description": "Destination folder ID"
    },
    "convertToGoogleFormat": {
      "type": "boolean",
      "default": false,
      "description": "Convert office files to Google format"
    }
  },
  "required": ["filePath"]
}
```

### Google Sheets Tools

#### `create_spreadsheet`
**Description**: Create a new Google Spreadsheet
**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "title": {"type": "string"},
    "folderId": {"type": "string"},
    "sheets": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": {"type": "string"},
          "rowCount": {"type": "number", "default": 1000},
          "columnCount": {"type": "number", "default": 26}
        }
      }
    }
  },
  "required": ["title"]
}
```

#### `read_sheet_data`
**Description**: Read data from a specific range in a spreadsheet
**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "spreadsheetId": {"type": "string"},
    "range": {
      "type": "string",
      "description": "A1 notation (e.g., 'Sheet1!A1:C10')"
    },
    "valueRenderOption": {
      "type": "string",
      "enum": ["FORMATTED_VALUE", "UNFORMATTED_VALUE", "FORMULA"],
      "default": "FORMATTED_VALUE"
    }
  },
  "required": ["spreadsheetId", "range"]
}
```

#### `write_sheet_data`
**Description**: Write data to a specific range in a spreadsheet
**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "spreadsheetId": {"type": "string"},
    "range": {"type": "string"},
    "values": {
      "type": "array",
      "items": {
        "type": "array",
        "items": {"type": "string"}
      }
    },
    "valueInputOption": {
      "type": "string",
      "enum": ["RAW", "USER_ENTERED"],
      "default": "USER_ENTERED"
    }
  },
  "required": ["spreadsheetId", "range", "values"]
}
```

#### `append_sheet_data`
**Description**: Append data to the end of a sheet
**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "spreadsheetId": {"type": "string"},
    "range": {"type": "string"},
    "values": {
      "type": "array",
      "items": {
        "type": "array",
        "items": {"type": "string"}
      }
    }
  },
  "required": ["spreadsheetId", "range", "values"]
}
```

### Google Calendar Tools

#### `create_event`
**Description**: Create a new calendar event
**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "summary": {"type": "string"},
    "description": {"type": "string"},
    "startDateTime": {
      "type": "string",
      "format": "date-time"
    },
    "endDateTime": {
      "type": "string",
      "format": "date-time"
    },
    "attendees": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "email": {"type": "string"},
          "optional": {"type": "boolean", "default": false}
        }
      }
    },
    "calendarId": {
      "type": "string",
      "default": "primary"
    }
  },
  "required": ["summary", "startDateTime", "endDateTime"]
}
```

#### `list_events`
**Description**: List upcoming calendar events
**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "calendarId": {
      "type": "string",
      "default": "primary"
    },
    "timeMin": {
      "type": "string",
      "format": "date-time",
      "description": "Start time (defaults to now)"
    },
    "timeMax": {
      "type": "string",
      "format": "date-time"
    },
    "maxResults": {
      "type": "number",
      "default": 10,
      "maximum": 2500
    }
  }
}
```

## Configuration

### MCP Server Configuration (`mcp-server-config.json`)
```json
{
  "name": "google-workspace-mcp",
  "version": "1.0.0",
  "description": "Google Workspace integration for MCP",
  "author": "Your Name",
  "license": "MIT",
  "server": {
    "transport": "stdio",
    "capabilities": {
      "tools": true,
      "resources": false,
      "prompts": false,
      "logging": true
    }
  },
  "tools": {
    "google_docs": {
      "enabled": true,
      "rate_limit": {
        "requests_per_minute": 100,
        "requests_per_day": 10000
      }
    },
    "google_drive": {
      "enabled": true,
      "rate_limit": {
        "requests_per_minute": 1000,
        "requests_per_day": 1000000
      }
    },
    "google_sheets": {
      "enabled": true,
      "rate_limit": {
        "requests_per_minute": 100,
        "requests_per_day": 100000
      }
    },
    "google_calendar": {
      "enabled": true,
      "rate_limit": {
        "requests_per_minute": 250,
        "requests_per_day": 1000000
      }
    }
  }
}
```

### Authentication Configuration
```json
{
  "auth": {
    "method": "oauth2",
    "oauth2": {
      "client_id": "your-client-id",
      "client_secret": "your-client-secret",
      "redirect_uri": "http://localhost:8080/oauth/callback",
      "scopes": [
        "https://www.googleapis.com/auth/documents",
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/calendar"
      ]
    },
    "service_account": {
      "enabled": false,
      "key_file": "path/to/service-account-key.json"
    },
    "token_storage": {
      "type": "file",
      "path": "~/.config/google-workspace-mcp/tokens.json"
    }
  },
  "default_settings": {
    "default_folder_id": null,
    "auto_create_folders": true,
    "backup_before_modifications": false
  }
}
```

## Installation & Setup

### Prerequisites
- Node.js 18+
- Google Cloud Project with Workspace APIs enabled
- OAuth2 credentials or Service Account

### Installation
```bash
npm install -g google-workspace-mcp
```

### Configuration for Claude Code
```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "google-workspace-mcp",
      "args": ["--config", "/path/to/config.json"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/credentials.json"
      }
    }
  }
}
```

## Use Cases

### Business Documentation Workflow
1. **Meeting Notes**: Create docs for meeting notes, append action items
2. **Project Updates**: Regular project status updates in shared docs
3. **Decision Tracking**: Document business decisions with timestamps
4. **Report Generation**: Compile data from Sheets into formatted Docs

### Project Management
1. **Task Tracking**: Sync project tasks between Sheets and Calendar
2. **Document Organization**: Create folder structures for projects
3. **Status Reporting**: Automated status reports from multiple sources

### Data Analysis & Reporting
1. **Data Collection**: Append analysis results to tracking sheets
2. **Report Creation**: Generate formatted reports from raw data
3. **Dashboard Updates**: Update summary documents with latest metrics

## Development Roadmap

### Phase 1: Core Functionality (MVP)
- [ ] Basic Google Docs operations (create, append, read)
- [ ] OAuth2 authentication flow
- [ ] MCP server implementation
- [ ] Basic error handling and logging

### Phase 2: Enhanced Features
- [ ] Google Drive file management
- [ ] Document formatting and styling
- [ ] Template support
- [ ] Batch operations

### Phase 3: Advanced Integration
- [ ] Google Sheets full CRUD operations
- [ ] Google Calendar integration
- [ ] Advanced search and filtering
- [ ] Webhook support for real-time updates

### Phase 4: Enterprise Features
- [ ] Service account authentication
- [ ] Admin controls and permissions
- [ ] Audit logging
- [ ] Multi-tenant support

## Contributing

### Development Setup
```bash
git clone https://github.com/username/google-workspace-mcp
cd google-workspace-mcp
npm install
npm run dev
```

### Testing
```bash
npm run test           # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e       # End-to-end tests
```

### Code Standards
- TypeScript strict mode
- ESLint + Prettier
- 100% test coverage for core functions
- JSDoc documentation for all public APIs

This MCP server will provide a robust, type-safe interface for integrating Google Workspace with Claude and other AI assistants, enabling powerful automation and documentation workflows.