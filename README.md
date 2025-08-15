# Vibe Logger

> Never lose why you built something - automatic decision logging for Claude Code sessions in Google Docs

Vibe Logger is an MCP (Model Context Protocol) server that transforms Google Docs into persistent memory for AI coding sessions. Instead of losing business context and architecture decisions, this tool automatically documents your development process, preserving the "why" behind every code change.

## 🎯 What Makes This Different

| Feature | Generic Google MCP | Vibe Logger |
|---------|-------------------|-------------------|
| **Purpose** | General Google API access | AI coding session documentation |
| **Target Users** | Anyone using MCP | AI coding developers specifically |
| **Core Value** | API wrapper | Business context preservation |
| **Templates** | None | ADR, Feature Spec, Decision Log |
| **Auto-features** | None | Timestamps, session linking, git integration |
| **Workflow** | Manual everything | Automatic context capture |

## ✨ Key Features

- **Persistent Memory**: Your AI assistant never forgets project context
- **Decision Tracking**: Every architecture choice documented with rationale  
- **Seamless Workflow**: Automatic documentation while you code
- **Team Knowledge**: Share context through Google Docs
- **Session Continuity**: Each session links to previous work
- **Smart Templates**: Built-in structures for different document types

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Build the project**
   ```bash
   npm run build
   ```

3. **Configure MCP in Claude Code**
   Add to your MCP configuration:
   ```json
   {
     "vibe-logger": {
       "command": "node",
       "args": ["path/to/vibe-logger/dist/index.js"]
     }
   }
   ```

4. **Start documenting**
   ```
   > start_session project:"User Auth" objective:"Implement JWT authentication"
   ```

## 🛠️ Core Tools

### Session Management
- `start_session` - Creates or continues a project documentation
- `continue_session` - Resumes work with full context
- `end_session` - Closes session with summary

### Decision Documentation  
- `log_decision` - Records architecture decisions with rationale
- `log_activity` - Tracks development activities
- `save_conversation` - Preserves important discussions

### Context Preservation
- `extract_requirements` - Pulls business requirements from conversations
- `link_code` - Connects decisions to actual code changes
- `summarize` - Generates session summaries

## 📋 Example Workflow

```typescript
// Start working on a new feature
> start_session project:"E-commerce Cart" objective:"Add wishlist functionality"
→ Creates: "2025-01-15 - Feature: Wishlist System.gdoc"

// Document a key decision
> log_decision decision:"Use Redis for wishlist storage" rationale:"Fast reads, session-based data"
→ Appends structured decision with timestamp

// Save important discussion
> save_conversation topic:"Performance considerations for wishlist queries"
→ Preserves conversation with key points extracted

// Link to implementation  
> link_code description:"Wishlist API endpoints" files:["src/api/wishlist.ts"]
→ References code in documentation
```

## 🏗️ Architecture

Vibe Logger treats Google Docs as the **primary source of truth** for project knowledge:

- **Document-Centric**: Not just an API wrapper, but a logging system
- **Session-Based**: Every interaction happens within session context  
- **Single Document Per Project**: Complete history in one place
- **Automatic Enrichment**: Timestamps, formatting, summaries added automatically
- **Template System**: Structured documents with semantic meaning

## 📚 Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md) - System design and principles
- [API Reference](./docs/API.md) - Complete tool documentation
- [Configuration Guide](./docs/CONFIGURATION.md) - Setup and customization
- [Examples](./docs/EXAMPLES.md) - Common workflows and use cases

## 🧪 Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Lint and format
npm run lint
npm run format

# Type checking
npm run typecheck
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🙋‍♂️ Support

- [Issues](https://github.com/bishnubista/vibe-logger/issues) - Bug reports and feature requests
- [Discussions](https://github.com/bishnubista/vibe-logger/discussions) - Questions and community

---

**Built for AI coding developers who believe context should never be lost.**