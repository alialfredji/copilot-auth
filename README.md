# copilot-llm

Use your GitHub Copilot subscription as an LLM backend. No API keys required.

Two auth strategies unified behind one interface, selected via a flag.

## Install

```bash
npm install copilot-llm
```

No extra packages required for either approach.

## Prerequisites

- Node.js 24+
- Active GitHub Copilot subscription (any paid tier)
- For Approach B: `gh` CLI installed and authenticated (`gh auth login`)
- For Claude/Gemini/Grok models: enable at [github.com/settings/copilot/features](https://github.com/settings/copilot/features)

## Quick Start - Approach A (default, zero deps)

```typescript
import { CopilotLLM, MODELS } from 'copilot-llm'

const llm = await CopilotLLM.init({
  model: MODELS.CLAUDE_SONNET,
  systemPrompt: 'You are a helpful assistant.'
})

// First run: shows terminal prompt to visit github.com/login/device
// All subsequent runs: silent, uses stored token

const result = await llm.complete('Explain the CAP theorem in two sentences.')
console.log(result.text)
```

## Quick Start - Approach B (gh CLI)

```typescript
import { CopilotLLM, MODELS } from 'copilot-llm'

// Requires: gh CLI installed and authenticated via `gh auth login`
const llm = await CopilotLLM.init({
  approach: 'sdk',
  model: MODELS.GPT_41
})

const result = await llm.complete('Explain the CAP theorem in two sentences.')
console.log(result.text)
```

## Logout / Reset

```typescript
await CopilotLLM.logout()
// Deletes ~/.config/copilot-llm/auth.json
```

## Check Auth Status

```typescript
const ok = await CopilotLLM.isAuthenticated()
// true = has valid or refreshable session
// false = needs to re-authenticate
```

## Per-Call Options

```typescript
const result = await llm.complete('Your prompt here', {
  model: MODELS.GPT_4O,       // Override model for this call
  maxTokens: 500,             // Override max tokens
  temperature: 0.5,           // Override temperature
  systemPrompt: 'Be concise.' // Override system prompt
})

console.log(result.text)        // The completion text
console.log(result.model)       // Model used
console.log(result.approach)    // 'device-flow' or 'sdk'
console.log(result.tokensUsed)  // Total tokens consumed (both approaches)
```

## Available Models

```typescript
import { MODELS } from 'copilot-llm'

// OpenAI
MODELS.GPT_4O          // 'gpt-4o'
MODELS.GPT_4O_MINI     // 'gpt-4o-mini'
MODELS.GPT_41          // 'gpt-4.1'
MODELS.GPT_5           // 'gpt-5-mini'
MODELS.GPT_51          // 'gpt-5.1'
MODELS.GPT_52          // 'gpt-5.2'

// Anthropic - requires Copilot Pro+ and model enabled at github.com/settings/copilot/features
MODELS.CLAUDE_HAIKU    // 'claude-haiku-4.5'
MODELS.CLAUDE_SONNET   // 'claude-sonnet-4.5'
MODELS.CLAUDE_OPUS     // 'claude-opus-4.5'

// Google
MODELS.GEMINI_25_PRO   // 'gemini-2.5-pro'

// xAI
MODELS.GROK_CODE       // 'grok-code-fast-1'
```

> **Note:** Claude, Gemini, and Grok models require Copilot Pro+ and must be explicitly enabled at
> [github.com/settings/copilot/features](https://github.com/settings/copilot/features).

## Token Storage

Tokens are stored at `~/.config/copilot-llm/auth.json` by default. Customize with:

```typescript
const llm = await CopilotLLM.init({
  tokenStorePath: '/custom/path/auth.json'
})
```

## How It Works

### Approach A: Device Flow (default)

1. On first run, performs GitHub's [Device Authorization Grant](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow) flow
2. Stores the GitHub OAuth token and Copilot API token locally
3. On subsequent runs, reuses stored tokens silently
4. Automatically refreshes the Copilot token (5 min TTL) using the stored GitHub token
5. Only re-prompts for login if the GitHub token itself expires

Uses the same OAuth client ID as the official VS Code Copilot extension (`Iv1.b507a08c87ecfe98`), which is public and embedded in the open-source extension.

### Approach B: gh CLI

Uses the same device-flow token mechanism as Approach A, but verifies that the `gh` CLI is available in `PATH` before proceeding. This is useful when you want to ensure that the GitHub CLI environment is present as a prerequisite (e.g., in CI or dev containers where `gh` is always installed). No additional npm packages are required.

**Setup:**

```bash
# Install gh CLI (one-time)
# macOS:  brew install gh
# Linux:  https://github.com/cli/cli#installation
gh auth login
```

## Error Handling

```typescript
import { CopilotLLM, CopilotLLMError } from 'copilot-llm'

try {
  const llm = await CopilotLLM.init()
  const result = await llm.complete('Hello')
  console.log(result.text)
} catch (err) {
  if (err instanceof CopilotLLMError) {
    switch (err.code) {
      case 'AUTH_TIMEOUT':        // User didn't complete device flow in time
      case 'AUTH_DENIED':         // User denied the OAuth request
      case 'AUTH_EXPIRED':        // Tokens are no longer valid
      case 'API_FORBIDDEN':       // No Copilot subscription or model not enabled
      case 'API_ERROR':           // Generic API failure
      case 'SDK_CLI_NOT_FOUND':   // gh CLI not in PATH (Approach B only)
    }
  }
}
```

## Publishing

Requires an npm account with publish access to the `copilot-llm` package. Log in once:

```bash
npm login
```

**Release workflow:**

```bash
# 1. Bump the version (updates package.json, commits, and creates a git tag)
npm run version:patch   # 0.1.0 → 0.1.1
npm run version:minor   # 0.1.0 → 0.2.0
npm run version:major   # 0.1.0 → 1.0.0

# 2. Build and publish to npm
npm run release

# 3. Push the version commit and tag to GitHub
git push && git push --tags
```

`npm run release` runs `npm publish --access public`. The `prepublishOnly` hook automatically runs `npm run build` before publishing, so the `dist/` output is always fresh.

## License

MIT
