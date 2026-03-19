# MCPorter CLI 生成器

> 将任意 MCP 服务器转换为独立命令行工具或可分发的 Claude Code skill

中文文档 | [English](README.md)

## 这是什么？

MCPorter CLI Generator 是一个 Claude Code 技能，可以将 MCP（模型上下文协议）服务器转换为直接在终端运行的命令行工具。无需复杂配置——生成即可使用。

## 核心功能

- **多协议支持**：支持 HTTP/SSE、stdio（npm 包）、本地 MCP 服务器
- **两种输出模式**：
  - **仅 CLI**：生成单个可执行文件，适合个人使用
  - **Skill 包**：完整的可分发包，包含 SKILL.md、README 和 package.json
- **灵活的工具选择**：可包含或排除特定的 MCP 工具
- **打包输出**：创建独立的 JavaScript 文件用于分发
- **跨平台**：支持 Windows、macOS 和 Linux

## 快速开始

### 环境要求

- Node.js 18+
- Bun（可选，用于 TypeScript 运行时）
- npx（随 Node.js 安装）

### 基本用法

将 MCP 服务器转换为 CLI：

```bash
npx mcporter generate-cli \
  --command "https://mcp.example.com/mcp" \
  --name mycli \
  --output ./mycli.ts
```

运行生成的 CLI：

```bash
bun ./mycli.ts --help
```

## 支持的 MCP 来源

| 来源类型 | 命令示例 |
|---------|---------|
| HTTP/SSE URL | `--command "https://mcp.linear.app/mcp"` |
| npm 包 | `--command "npx -y tavily-mcp@latest"` |
| 本地脚本 | `--command "bun run ./server.ts"` |
| 已配置服务器 | `--server linear`（从配置读取） |

## 常用命令

### 生成 CLI

```bash
# HTTP MCP（如 Linear、高德地图）
npx mcporter generate-cli \
  --command "https://mcp.linear.app/mcp" \
  --name linear \
  --output ./linear.ts

# npm 包 MCP（如 Tavily、GitHub）
npx mcporter generate-cli \
  --command "npx -y @modelcontextprotocol/server-github" \
  --name github \
  --output ./github.ts

# 过滤特定工具
npx mcporter generate-cli \
  --command "https://mcp.linear.app/mcp" \
  --name linear \
  --include-tools create_issue,search_issues \
  --output ./linear.ts

# 打包为独立 .js 文件（用于分发）
npx mcporter generate-cli \
  --command "npx -y tavily-mcp@latest" \
  --name tavily \
  --bundle \
  --output ./tavily.js
```

### 生成可分发 Skill

```bash
node ~/.claude/skills/mcporter-cli-generator/scripts/generate-skill.mjs \
  "npx -y tavily-mcp@latest" \
  -n tavily \
  -d "Tavily 网络搜索" \
  -e "TAVILY_API_KEY"
```

### 列出已配置的服务器

```bash
# 列出所有服务器
npx mcporter list

# 查看特定服务器的工具
npx mcporter list linear --schema
```

## 命令选项

| 选项 | 说明 |
|-----|------|
| `--command <ref>` | MCP 源 URL 或命令（URL/stdio 必需） |
| `--server <name>` | 配置中的命名服务器（--command 的替代方案） |
| `--name <name>` | CLI/skill 名称 |
| `--output <file>` | 输出文件路径（必须是文件，不是目录） |
| `--runtime bun\|node` | 目标运行时（默认：bun） |
| `--bundle` | 创建打包的 .js 文件用于分发 |
| `--include-tools` | 要包含的工具列表（逗号分隔） |
| `--exclude-tools` | 要排除的工具列表（逗号分隔） |

## 重要注意事项

### --output 必须是文件路径

```bash
# 正确：指定文件路径（带扩展名）
npx mcporter generate-cli --command "https://mcp.example.com/mcp" --name mycli --output ./scripts/mycli.ts

# 错误：目录路径会导致 EISDIR 错误
npx mcporter generate-cli --command "https://mcp.example.com/mcp" --name mycli --output ./scripts/
```

### --command 对于 URL/stdio 来源是必需的

```bash
# 正确：使用 --command 标志
npx mcporter generate-cli --command "https://mcp.example.com/mcp" --name mycli --output ./mycli.ts

# 错误：缺少 --command 标志
npx mcporter generate-cli "https://mcp.example.com/mcp" --name mycli --output ./mycli.ts
```

## 示例

### 示例 1：Linear MCP 转 CLI

```bash
npx mcporter generate-cli \
  --command "https://mcp.linear.app/mcp" \
  --name linear \
  --output ~/.claude/skills/linear/scripts/linear.ts

# 运行
bun ~/.claude/skills/linear/scripts/linear.ts --help
```

### 示例 2：Tavily MCP 转 Skill

```bash
# 创建 skill 包
node ~/.claude/skills/mcporter-cli-generator/scripts/generate-skill.mjs \
  "npx -y tavily-mcp@latest" \
  -n tavily \
  -d "Tavily 网络搜索，获取实时信息" \
  -e "TAVILY_API_KEY" \
  -o ./tavily-skill

# 安装到 Claude Code
cp -r ./tavily-skill ~/.claude/skills/tavily/
```

### 示例 3：高德地图 MCP

```bash
npx mcporter generate-cli \
  --command "https://mcp.amap.com/mcp?key=你的API密钥" \
  --name amap \
  --output ~/.claude/skills/amap/scripts/amap.ts

# 查询天气
bun ~/.claude/skills/amap/scripts/amap.ts maps-weather --city "北京"
```

## 故障排除

| 错误 | 解决方案 |
|-----|---------|
| `EISDIR` | `--output` 必须是文件路径，不能是目录 |
| `Unknown source format` | 在 URL 前添加 `--command` 标志 |
| `OAuth required` | 运行 `mcporter auth <server>` |
| `Timeout` | 设置环境变量 `MCPORTER_CALL_TIMEOUT=60000` |
| `--bundle` 失败 | 改用 `.ts` 输出配合 bun 运行时 |

## 安装为 Claude Code Skill

如果你能看到这个文件，说明这个 skill 已经安装。手动安装方法：

**Windows (PowerShell):**
```powershell
Copy-Item -Recurse -Force . "$env:USERPROFILE\.claude\skills\mcporter-cli-generator"
```

**Unix/Mac/Linux:**
```bash
cp -r . ~/.claude/skills/mcporter-cli-generator/
```

## 生成器脚本选项

使用 `generate-skill.mjs` 生成完整的可分发 skill：

```bash
node generate-skill.mjs <mcp-source> [options]
```

| 选项 | 说明 |
|-----|------|
| `-n, --name <name>` | Skill 名称（默认：从来源派生） |
| `-o, --output <dir>` | 输出目录（默认：./<name>-skill） |
| `-d, --description` | Skill 描述 |
| `-t, --trigger` | 何时触发此 skill |
| `-e, --env <vars>` | 需要的环境变量（逗号分隔） |
| `--include <tools>` | 仅包含这些工具 |
| `--exclude <tools>` | 排除这些工具 |
| `--runtime <runtime>` | 目标运行时：node 或 bun（默认：node） |

## 许可证

MIT

## 相关链接

- [MCPorter](https://github.com/anthropics/mcporter) - 底层 MCP 转 CLI 转换器
- [Claude Code](https://claude.ai/claude-code) - AI 编程助手
- [MCP 协议](https://modelcontextprotocol.io/) - 模型上下文协议规范
