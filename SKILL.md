---
name: mcporter-cli-generator
description: |
  Convert any MCP server to standalone CLI or distributable Claude Code skill.

  **MUST TRIGGER when user wants to:**
  - Convert MCP to CLI/skill/command-line tool
  - Wrap MCP as executable CLI
  - Create CLI from MCP URL or config
  - Package MCP functionality for distribution

  **Trigger keywords (Chinese):** 转换MCP, 把MCP转, MCP转CLI, MCP转skill, 生成CLI, 创建CLI,
  MCP命令行, MCP包装, 把...转成CLI, 将MCP转换, 高德MCP, 高德地图MCP, 百度MCP, Linear MCP,
  Tavily MCP, 任何MCP服务转CLI, MCP配置转CLI, http MCP转, stdio MCP转, npx MCP转

  **Trigger keywords (English):** mcp to cli, convert mcp, wrap mcp, mcp wrapper,
  mcp command line, mcp cli, generate cli from mcp, mcporter

  **Common user phrases that MUST trigger:**
  - "转换xxx mcp为cli", "把xxx mcp转成cli", "将xxx mcp转换为命令行"
  - "用这个MCP配置创建CLI", "从MCP URL生成CLI"
  - "帮我转MCP为CLI", "MCP怎么变成CLI"

  Commands: generate-cli, generate-skill
---

# MCPorter CLI & Skill Generator

Convert any MCP server (HTTP/SSE/stdio) to standalone CLI or distributable Claude Code skill.

## Output Modes

| Mode | Command | Output |
|------|---------|--------|
| **CLI Only** | `generate-cli` | Single executable CLI file |
| **Skill Package** | `generate-skill` | Complete distributable skill (SKILL.md + CLI) |

---

## Requirements

- **Node.js 18+** (required for CLI execution)
- **Bun** (for running TypeScript CLI)
- **npx** (included with Node.js)

```bash
# Check environment
node --version   # Requires 18+
bun --version    # Must be installed

# Install bun (if not installed)
curl -fsSL https://bun.sh/install | bash
```

---

## Part 1: Generate CLI

### Core Command

```bash
npx mcporter generate-cli --command <source> --name <name> --output <file-path> [options]
```

### Critical Notes

**`--output` MUST be a file path, NOT a directory!**

```bash
# Correct: specify file path with extension
npx mcporter generate-cli --command "https://mcp.example.com/mcp" --name mycli --output ./scripts/mycli.ts

# Wrong: directory path causes EISDIR error
npx mcporter generate-cli --command "https://mcp.example.com/mcp" --name mycli --output ./scripts/
```

**`--command` is REQUIRED for URL/stdio sources:**

```bash
# Correct: use --command flag
npx mcporter generate-cli --command "https://mcp.example.com/mcp" --name mycli --output ./mycli.ts

# Wrong: missing --command flag
npx mcporter generate-cli "https://mcp.example.com/mcp" --name mycli --output ./mycli.ts
```

### Source Format Support

| Protocol | --command Example |
|----------|-------------------|
| HTTP/SSE | `--command "https://mcp.linear.app/mcp"` |
| stdio (npm) | `--command "npx -y some-mcp-server@latest"` |
| stdio (local) | `--command "bun run ./local-server.ts"` |
| Named server | `--server linear` (read from config, no --command needed) |

### Key Options

| Flag | Type | Description |
|------|------|-------------|
| `--command <ref>` | string | MCP source URL or command (required for HTTP/stdio) |
| `--server <name>` | string | Named server from config (alternative to --command) |
| `--name <name>` | string | Override CLI name |
| `--output <file>` | string | **File path** (e.g., `./scripts/cli.ts`) |
| `--runtime bun\|node` | string | Target runtime (default: bun) |
| `--bundle` | flag | Bundle into single .js file for distribution |
| `--include-tools a,b,c` | string | Only include specified tools |
| `--exclude-tools a,b,c` | string | Exclude specified tools |

### --bundle Option

Use `--bundle` to create a self-contained JavaScript file:

```bash
# Generate bundled CLI (single .js file, no external deps)
npx mcporter generate-cli --command "https://mcp.example.com/mcp" --name mycli --bundle --output ./mycli.js

# Bundled CLI can run directly with node
node ./mycli.js --help
```

**When to use --bundle:**
- Distributing CLI to users without bun
- Creating standalone executables
- npm package distribution

### CLI Examples

```bash
# HTTP MCP - TypeScript output
npx mcporter generate-cli --command "https://mcp.amap.com/mcp?key=xxx" --name amap --output ~/.claude/skills/amap/scripts/amap.ts

# stdio MCP - npm package
npx mcporter generate-cli --command "npx -y @modelcontextprotocol/server-github" --name github --output ./github.ts

# Include only specific tools
npx mcporter generate-cli --command "https://mcp.linear.app/mcp" --name linear --output ./linear.ts --include-tools create_issue,search_issues

# Generate bundled CLI for distribution
npx mcporter generate-cli --command "npx -y tavily-mcp@latest" --name tavily --bundle --output ./tavily.js
```

---

## Part 2: Generate Distributable Skill

### Using the Helper Script

```bash
node ~/.claude/skills/mcporter-cli-generator/scripts/generate-skill.mjs <mcp-source> [options]
```

**Options:**
- `-n, --name <name>` - Skill name (default: derived from source)
- `-o, --output <dir>` - Output directory (default: ./<name>-skill)
- `-d, --description` - Skill description
- `-t, --trigger` - When to trigger this skill
- `-e, --env <vars>` - Required env vars (comma-separated)
- `--include <tools>` - Only include these tools
- `--exclude <tools>` - Exclude these tools
- `--runtime <runtime>` - Target runtime: node or bun (default: node)

**Example:**
```bash
node ~/.claude/skills/mcporter-cli-generator/scripts/generate-skill.mjs \
  "npx -y tavily-mcp@latest" \
  -n tavily \
  -d "Tavily web search" \
  -e "TAVILY_API_KEY"
```

### Manual Workflow

```bash
# 1. Create directory structure
mkdir -p ~/.claude/skills/<skill-name>/scripts

# 2. Generate CLI (file path!)
npx mcporter generate-cli --command "<mcp-source>" --name <skill-name> --output ~/.claude/skills/<skill-name>/scripts/cli.ts

# 3. View available tools
bun ~/.claude/skills/<skill-name>/scripts/cli.ts --help

# 4. Create SKILL.md (see template below)

# 5. Test
bun ~/.claude/skills/<skill-name>/scripts/cli.ts <tool-name> --param value
```

---

## Part 3: SKILL.md Best Practice Template

Generated SKILL.md should follow this template:

```markdown
---
name: <skill-name>
description: |
  <One-line MCP function description>. Use when: <trigger scenario 1>, <trigger scenario 2>.
  TRIGGER: "<keyword1>", "<keyword2>", "<keyword3>".
  Tools: <tool1>, <tool2>, <tool3>
---

# <Skill Name>

<Detailed description of MCP functionality and use cases>

## Requirements

- Set `<API_KEY_ENV>` environment variable
- bun runtime required

## Available Tools

### <tool-name>
**Description:** <Tool function description>
**Parameters:**
- `<param1>` (<type>, required): <Description>
- `<param2>` (<type>, optional): <Description> (default: <default>)

**Usage:**
\`\`\`bash
<API_KEY_ENV>="xxx" bun ~/.claude/skills/<skill-name>/scripts/cli.ts <tool-name> --param1 value1
\`\`\`

## Global Options

- `-t, --timeout <ms>`: Call timeout in milliseconds
- `-o, --output <format>`: Output format - text/markdown/json/raw (default: text)

## Example Use Cases

1. **<Scenario 1 Title>**
   \`\`\`
   User: <What user might say>
   -> Call <tool-name> --param1 "value"
   \`\`\`

2. **<Scenario 2 Title>**
   \`\`\`
   User: <What user might say>
   -> Call <tool-name> --param1 "value"
   \`\`\`

## API Key

Visit <provider-url> to register and get API Key.
```

---

## Part 4: Complete Examples

### Example: Create Tavily Search Skill

```bash
# 1. Create directory
mkdir -p ~/.claude/skills/tavily/scripts

# 2. Generate CLI
TAVILY_API_KEY="your-key" npx mcporter generate-cli \
  --command "npx -y tavily-mcp@latest" \
  --name tavily \
  --output ~/.claude/skills/tavily/scripts/tavily.ts

# 3. View tools
bun ~/.claude/skills/tavily/scripts/tavily.ts --help

# 4. Create SKILL.md (fill template based on --help output)

# 5. Test
TAVILY_API_KEY="your-key" bun ~/.claude/skills/tavily/scripts/tavily.ts tavily-search --query "test"
```

### Example: Create AMap (Gaode Maps) Skill

```bash
# 1. Create directory
mkdir -p ~/.claude/skills/amap/scripts

# 2. Generate CLI
npx mcporter generate-cli \
  --command "https://mcp.amap.com/mcp?key=your-key" \
  --name amap \
  --output ~/.claude/skills/amap/scripts/amap.ts

# 3. Test
bun ~/.claude/skills/amap/scripts/amap.ts maps-weather --city "Beijing"
```

### Example: List Configured MCP Servers

```bash
# List all configured servers
npx mcporter list

# View tools for a specific server
npx mcporter list linear --schema

# Use named server from config
npx mcporter generate-cli --server linear --name linear --output ./linear.ts
```

---

## Part 5: Example Use Cases

Typical conversation scenarios using this skill:

1. **Convert MCP to Skill**
   ```
   User: I have a Tavily MCP config, want to convert it to a skill
   Claude: I'll help you convert. First create directory, then generate CLI...
   ```

2. **Create CLI from URL**
   ```
   User: Help me convert https://mcp.linear.app/mcp to a command line tool
   Claude: Use mcporter generate-cli command to convert...
   ```

3. **Create CLI from npm package**
   ```
   User: I want to make @modelcontextprotocol/server-github into a CLI
   Claude: This is a stdio MCP, use npx -y prefix...
   ```

---

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| `EISDIR` | `--output` points to directory | Use file path: `./scripts/cli.ts` |
| `Unknown source format` | Missing `--command` | Add `--command "url"` |
| `OAuth required` | Authentication needed | Run `mcporter auth <server>` |
| `Timeout` | Call timeout | Set `MCPORTER_CALL_TIMEOUT=60000` |
| `--bundle` fails | Bundling issue | Use `.ts` + bun runtime |

---

## Quick Reference

```bash
# Standard mode
npx mcporter generate-cli \
  --command "<mcp-url-or-command>" \
  --name <skill-name> \
  --output ~/.claude/skills/<skill-name>/scripts/cli.ts

# Bundled mode (for distribution)
npx mcporter generate-cli \
  --command "<mcp-url-or-command>" \
  --name <skill-name> \
  --bundle \
  --output ./cli.js

# Run CLI
bun ~/.claude/skills/<skill-name>/scripts/cli.ts <tool-name> --param value

# View help
bun ~/.claude/skills/<skill-name>/scripts/cli.ts --help

# Run with environment variable
API_KEY="xxx" bun ~/.claude/skills/<skill-name>/scripts/cli.ts <tool-name> --param value

# List configured servers
npx mcporter list

# View server tools
npx mcporter list <server-name> --schema
```
