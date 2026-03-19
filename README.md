# MCPorter CLI Generator

> Convert any MCP server into a standalone CLI or distributable Claude Code skill

[中文文档](README_CN.md) | English

## What is this?

MCPorter CLI Generator is a Claude Code skill that transforms MCP (Model Context Protocol) servers into command-line tools you can run directly from your terminal. No more复杂的配置 - just generate and use.

## Key Features

- **Multiple Protocols**: Supports HTTP/SSE, stdio (npm packages), and local MCP servers
- **Two Output Modes**:
  - **CLI Only**: Single executable file for personal use
  - **Skill Package**: Complete distributable package with SKILL.md, README, and package.json
- **Flexible Tool Selection**: Include or exclude specific MCP tools
- **Bundled Output**: Create self-contained JavaScript files for distribution
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Quick Start

### Prerequisites

- Node.js 18+
- Bun (optional, for TypeScript runtime)
- npx (comes with Node.js)

### Basic Usage

Convert an MCP server to CLI:

```bash
npx mcporter generate-cli \
  --command "https://mcp.example.com/mcp" \
  --name mycli \
  --output ./mycli.ts
```

Run the generated CLI:

```bash
bun ./mycli.ts --help
```

## Supported MCP Sources

| Source Type | Example Command |
|------------|----------------|
| HTTP/SSE URL | `--command "https://mcp.linear.app/mcp"` |
| npm Package | `--command "npx -y tavily-mcp@latest"` |
| Local Script | `--command "bun run ./server.ts"` |
| Named Server | `--server linear` (from config) |

## Common Commands

### Generate CLI

```bash
# HTTP MCP (like Linear, AMap)
npx mcporter generate-cli \
  --command "https://mcp.linear.app/mcp" \
  --name linear \
  --output ./linear.ts

# npm Package MCP (like Tavily, GitHub)
npx mcporter generate-cli \
  --command "npx -y @modelcontextprotocol/server-github" \
  --name github \
  --output ./github.ts

# With tool filtering
npx mcporter generate-cli \
  --command "https://mcp.linear.app/mcp" \
  --name linear \
  --include-tools create_issue,search_issues \
  --output ./linear.ts

# Bundled for distribution (single .js file)
npx mcporter generate-cli \
  --command "npx -y tavily-mcp@latest" \
  --name tavily \
  --bundle \
  --output ./tavily.js
```

### Generate Distributable Skill

```bash
node ~/.claude/skills/mcporter-cli-generator/scripts/generate-skill.mjs \
  "npx -y tavily-mcp@latest" \
  -n tavily \
  -d "Tavily web search" \
  -e "TAVILY_API_KEY"
```

### List Configured Servers

```bash
# List all servers
npx mcporter list

# View tools for a server
npx mcporter list linear --schema
```

## Command Options

| Option | Description |
|--------|-------------|
| `--command <ref>` | MCP source URL or command (required for URL/stdio) |
| `--server <name>` | Named server from config (alternative to --command) |
| `--name <name>` | CLI/skill name |
| `--output <file>` | Output file path (must be file, not directory) |
| `--runtime bun\|node` | Target runtime (default: bun) |
| `--bundle` | Create bundled .js file for distribution |
| `--include-tools` | Comma-separated list of tools to include |
| `--exclude-tools` | Comma-separated list of tools to exclude |

## Examples

### Example 1: Linear MCP to CLI

```bash
npx mcporter generate-cli \
  --command "https://mcp.linear.app/mcp" \
  --name linear \
  --output ~/.claude/skills/linear/scripts/linear.ts

# Run it
bun ~/.claude/skills/linear/scripts/linear.ts --help
```

### Example 2: Tavily MCP to Skill

```bash
# Create skill package
node ~/.claude/skills/mcporter-cli-generator/scripts/generate-skill.mjs \
  "npx -y tavily-mcp@latest" \
  -n tavily \
  -d "Tavily web search for real-time information" \
  -e "TAVILY_API_KEY" \
  -o ./tavily-skill

# Install to Claude Code
cp -r ./tavily-skill ~/.claude/skills/tavily/
```

### Example 3: AMap (Gaode Maps) MCP

```bash
npx mcporter generate-cli \
  --command "https://mcp.amap.com/mcp?key=your-api-key" \
  --name amap \
  --output ~/.claude/skills/amap/scripts/amap.ts

# Get weather
bun ~/.claude/skills/amap/scripts/amap.ts maps-weather --city "Beijing"
```

## Troubleshooting

| Error | Solution |
|-------|----------|
| `EISDIR` | `--output` must be a file path, not directory |
| `Unknown source format` | Add `--command` flag before the URL |
| `OAuth required` | Run `mcporter auth <server>` |
| `Timeout` | Set `MCPORTER_CALL_TIMEOUT=60000` |
| `--bundle` fails | Use `.ts` output with bun runtime instead |

## Installation as Claude Code Skill

This skill is already installed if you can see this file. To install manually:

```bash
# Clone or copy to your skills directory
cp -r . ~/.claude/skills/mcporter-cli-generator/
```

## License

MIT

## Related

- [MCPorter](https://github.com/anthropics/mcporter) - The underlying MCP to CLI converter
- [Claude Code](https://claude.ai/claude-code) - AI-powered coding assistant
- [MCP Protocol](https://modelcontextprotocol.io/) - Model Context Protocol specification
