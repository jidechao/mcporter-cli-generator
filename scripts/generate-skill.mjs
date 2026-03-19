#!/usr/bin/env node
/**
 * MCP to Skill Generator
 * Converts an MCP server into a distributable Claude Code skill
 *
 * Usage: node generate-skill.mjs <mcp-source> [options]
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, basename } from 'path';

const COLORS = {
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[1;33m',
  blue: '\x1b[0;34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function usage() {
  console.log(`
Usage: node generate-skill.mjs <mcp-source> [options]

Arguments:
  <mcp-source>          MCP source (URL, npm package, or command)

Options:
  -n, --name <name>     Skill name (default: derived from source)
  -o, --output <dir>    Output directory (default: ./<name>-skill)
  -d, --description     Skill description
  -t, --trigger         When to trigger this skill
  -e, --env <vars>      Required environment variables (comma-separated)
  --include <tools>     Only include these tools
  --exclude <tools>     Exclude these tools
  --runtime <runtime>   Target runtime: node or bun (default: node)
  -h, --help            Show this help

Examples:
  node generate-skill.mjs "npx -y @modelcontextprotocol/server-github" -n github -d "GitHub operations"
  node generate-skill.mjs https://mcp.example.com/mcp -n myservice -o ./skills/
`);
  process.exit(1);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    source: '',
    name: '',
    output: '',
    description: '',
    trigger: '',
    envVars: '',
    includeTools: '',
    excludeTools: '',
    runtime: 'node'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '-n':
      case '--name':
        options.name = args[++i];
        break;
      case '-o':
      case '--output':
        options.output = args[++i];
        break;
      case '-d':
      case '--description':
        options.description = args[++i];
        break;
      case '-t':
      case '--trigger':
        options.trigger = args[++i];
        break;
      case '-e':
      case '--env':
        options.envVars = args[++i];
        break;
      case '--include':
        options.includeTools = args[++i];
        break;
      case '--exclude':
        options.excludeTools = args[++i];
        break;
      case '--runtime':
        options.runtime = args[++i];
        break;
      case '-h':
      case '--help':
        usage();
        break;
      default:
        if (!arg.startsWith('-') && !options.source) {
          options.source = arg;
        } else if (!arg.startsWith('-')) {
          log('red', `Error: Unknown option ${arg}`);
          usage();
        }
    }
  }

  return options;
}

function deriveName(source) {
  // Extract name from URL
  if (source.match(/^https?:\/\//)) {
    const url = new URL(source);
    return url.hostname
      .replace(/^mcp\./, '')
      .replace(/\./g, '-')
      .toLowerCase();
  }

  // Extract name from npm package
  const npxMatch = source.match(/npx\s+(-y\s+)?@?([^@\s]+)/);
  if (npxMatch) {
    let name = npxMatch[2];
    // Handle scoped packages
    if (name.includes('/')) {
      name = name.split('/')[1] || name.split('/')[0];
    }
    return name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
  }

  // Extract from command
  const cmdMatch = source.match(/(\w+)\s/);
  if (cmdMatch) {
    return cmdMatch[1].toLowerCase();
  }

  return 'mcp-skill';
}

function generateSkillMd(options) {
  const { name, description, trigger, source, envVars } = options;

  let envSection = '';
  if (envVars) {
    const vars = envVars.split(',').map(v => v.trim());
    envSection = `
### Environment Variables
${vars.map(v => `- \`${v}\`: Required`).join('\n')}
`;
  }

  let configSection = 'No configuration required.';
  if (envVars) {
    const vars = envVars.split(',').map(v => v.trim());
    const isWindows = process.platform === 'win32';
    if (isWindows) {
      configSection = `Set these environment variables before use:

**Windows (PowerShell):**
\`\`\`powershell
${vars.map(v => `$env:${v}="your-value-here"`).join('\n')}
\`\`\`

**Windows (CMD):**
\`\`\`cmd
${vars.map(v => `set ${v}=your-value-here`).join('\n')}
\`\`\`

**Unix/Mac/Linux:**
\`\`\`bash
${vars.map(v => `export ${v}="your-value-here"`).join('\n')}
\`\`\`
`;
    } else {
      configSection = `Set these environment variables before use:

\`\`\`bash
${vars.map(v => `export ${v}="your-value-here"`).join('\n')}
\`\`\`
`;
    }
  }

  const homeDir = process.env.USERPROFILE || process.env.HOME || '~';
  const skillsPath = process.platform === 'win32'
    ? `${homeDir}\\.claude\\skills\\${name}`
    : `${homeDir}/.claude/skills/${name}`;

  return `---
name: ${name}
description: |
  ${description || `Interact with ${name} MCP server`}. Use when ${trigger || `the user needs to interact with ${name}`}.
  Generated from MCP: ${source}
---

# ${name} Skill

${description || `Interact with ${name} MCP server`}

## Installation

This skill is self-contained. Copy to your Claude Code skills directory:

**Windows (PowerShell):**
\`\`\`powershell
Copy-Item -Recurse -Force . "${skillsPath}"
\`\`\`

**Unix/Mac/Linux:**
\`\`\`bash
cp -r . ~/.claude/skills/${name}/
\`\`\`

## Requirements

- Node.js 18+ or Bun
${envSection}
## Usage

The CLI is located at \`scripts/${name}.js\`. Run directly:

\`\`\`bash
node scripts/${name}.js --help
\`\`\`

## Available Tools

Run \`node scripts/${name}.js --help\` to see all available tools and their parameters.

## Examples

\`\`\`bash
# Get help
node scripts/${name}.js --help

# Call a specific tool
node scripts/${name}.js <tool-name> --param1 value1
\`\`\`

## Configuration

${configSection}

## Source

This skill was generated from: \`${source}\`

Generated with mcporter-cli-generator
`;
}

function generateReadmeMd(options) {
  const { name, description, envVars, source } = options;

  let configSection = 'No configuration required.';
  if (envVars) {
    const vars = envVars.split(',').map(v => v.trim());
    const isWindows = process.platform === 'win32';
    if (isWindows) {
      configSection = `Set these environment variables:

**Windows (PowerShell):**
\`\`\`powershell
${vars.map(v => `$env:${v}="your-value-here"`).join('\n')}
\`\`\`

**Windows (CMD):**
\`\`\`cmd
${vars.map(v => `set ${v}=your-value-here`).join('\n')}
\`\`\`
`;
    } else {
      configSection = `Set these environment variables:
${vars.map(v => `- \`${v}\``).join('\n')}`;
    }
  }

  const homeDir = process.env.USERPROFILE || process.env.HOME || '~';
  const skillsPath = process.platform === 'win32'
    ? `${homeDir}\\.claude\\skills\\${name}`
    : `${homeDir}/.claude/skills/${name}`;

  return `# ${name} Claude Code Skill

${description || `Interact with ${name} MCP server`}

## Installation

### Option 1: Direct Copy

**Windows (PowerShell):**
\`\`\`powershell
Copy-Item -Recurse -Force . "${skillsPath}"
\`\`\`

**Unix/Mac/Linux:**
\`\`\`bash
cp -r . ~/.claude/skills/${name}/
\`\`\`

### Option 2: Clone

**Windows (PowerShell):**
\`\`\`powershell
git clone <repo-url> "${skillsPath}"
\`\`\`

**Unix/Mac/Linux:**
\`\`\`bash
git clone <repo-url> ~/.claude/skills/${name}
\`\`\`

### Option 3: npm (if published)

\`\`\`bash
npm install -g ${name}-skill
\`\`\`

## Requirements

- Node.js 18+ or Bun

## Usage

Once installed, Claude Code will automatically use this skill when appropriate.

To use the CLI directly:

\`\`\`bash
node scripts/${name}.js --help
\`\`\`

## Configuration

${configSection}

## License

MIT

## Source

Generated from MCP: \`${source}\`
`;
}

function generatePackageJson(options) {
  const { name, description } = options;

  return JSON.stringify({
    name: `${name}-skill`,
    version: "1.0.0",
    description: description || `Interact with ${name} MCP server`,
    type: "module",
    main: `scripts/${name}.js`,
    bin: {
      [name]: `./scripts/${name}.js`
    },
    files: [
      "SKILL.md",
      "README.md",
      "scripts/"
    ],
    keywords: [
      "claude-code",
      "skill",
      "mcp",
      name
    ],
    author: "",
    license: "MIT",
    engines: {
      node: ">=18.0.0"
    }
  }, null, 2);
}

async function main() {
  const options = parseArgs();

  if (!options.source) {
    log('red', 'Error: MCP source is required');
    usage();
  }

  // Derive name if not provided
  if (!options.name) {
    options.name = deriveName(options.source);
    log('yellow', `Derived skill name: ${options.name}`);
  }

  // Set output directory
  if (!options.output) {
    options.output = `./${options.name}-skill`;
  }

  log('blue', '=== MCP to Skill Generator ===');
  console.log(`  Source: ${options.source}`);
  console.log(`  Name: ${options.name}`);
  console.log(`  Output: ${options.output}`);
  console.log(`  Runtime: ${options.runtime}`);
  console.log('');

  // Create output directory structure
  const scriptsDir = join(options.output, 'scripts');
  mkdirSync(scriptsDir, { recursive: true });

  // Generate bundled CLI
  log('blue', 'Step 1: Generating bundled CLI...');

  let cliCmd = `npx mcporter generate-cli "${options.source}" --bundle --name ${options.name} --runtime ${options.runtime} --output "${scriptsDir}/"`;

  if (options.includeTools) {
    cliCmd += ` --include-tools ${options.includeTools}`;
  }
  if (options.excludeTools) {
    cliCmd += ` --exclude-tools ${options.excludeTools}`;
  }

  try {
    execSync(cliCmd, { stdio: 'inherit' });
  } catch (error) {
    log('red', `Error generating CLI: ${error.message}`);
    process.exit(1);
  }

  // Find generated CLI file
  let cliFile = join(scriptsDir, `${options.name}.js`);
  if (!existsSync(cliFile)) {
    cliFile = join(scriptsDir, `${options.name}.ts`);
    if (!existsSync(cliFile)) {
      log('red', 'Error: CLI file not generated');
      process.exit(1);
    }
  }

  log('green', `CLI generated: ${cliFile}`);

  // Generate SKILL.md
  log('blue', 'Step 2: Generating SKILL.md...');
  const skillMd = generateSkillMd(options);
  writeFileSync(join(options.output, 'SKILL.md'), skillMd);
  log('green', 'SKILL.md generated');

  // Generate README.md
  log('blue', 'Step 3: Generating README.md...');
  const readmeMd = generateReadmeMd(options);
  writeFileSync(join(options.output, 'README.md'), readmeMd);
  log('green', 'README.md generated');

  // Generate package.json for npm distribution
  log('blue', 'Step 4: Generating package.json...');
  const packageJson = generatePackageJson(options);
  writeFileSync(join(options.output, 'package.json'), packageJson);
  log('green', 'package.json generated');

  // Summary
  console.log('');
  log('green', '=== Skill Generation Complete ===');
  console.log('');
  console.log(`Output directory: ${options.output}`);
  console.log('');
  console.log('Files generated:');
  console.log('  - SKILL.md      (skill definition)');
  console.log('  - README.md     (installation guide)');
  console.log(`  - scripts/${options.name}.js (bundled CLI)`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Review and edit SKILL.md to add tool documentation');
  console.log(`  2. Test the skill: cd ${options.output} && node scripts/${options.name}.js --help`);
  console.log(`  3. Install: cp -r ${options.output} ~/.claude/skills/${options.name}/`);
  console.log('');
}

main().catch(error => {
  log('red', `Error: ${error.message}`);
  process.exit(1);
});
