# copilot-llm

Use your GitHub Copilot subscription as an LLM backend. No API keys required.

Two auth strategies unified behind one interface, selected via a flag.

## Install

```bash
npm install copilot-llm
# For Approach B (optional):
npm install @github/copilot-sdk @github/copilot
```

## Prerequisites

- Node.js 18+
- Active GitHub Copilot subscription (any paid tier)
- For Claude models: enable at [github.com/settings/copilot/features](https://github.com/settings/copilot/features)

## Quick Start - Approach A (default, zero deps)

```typescript
import { CopilotLLM, MODELS } from 'copilot-llm'

const llm = await CopilotLLM.init({
  model: MODELS.CLAUDE_SONNET,
  systemPrompt: 'You are a LinkedIn engagement expert. Write authentic 2-3 sentence comments.'
})

// First run: shows terminal prompt to visit github.com/login/device
// All subsequent runs: silent, uses stored token

const comment = await llm.complete(
  'Write a LinkedIn comment on this post: "AI will replace most developers by 2030"'
)
console.log(comment.text)
```

## Quick Start - Approach B (official SDK)

```typescript
import { CopilotLLM, MODELS } from 'copilot-llm'

// Requires: npm install @github/copilot-sdk && npm install -g @github/copilot
// Then: gh auth login (one-time setup)
const llm = await CopilotLLM.init({
  approach: 'sdk',
  model: MODELS.GPT_41
})

const result = await llm.complete('Write a LinkedIn comment on...')
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
console.log(result.tokensUsed)  // Total tokens (Approach A only)
```

## Available Models

```typescript
import { MODELS } from 'copilot-llm'

// Anthropic - requires Copilot Pro+ and model enabled at github.com/settings/copilot/features
MODELS.CLAUDE_SONNET   // 'claude-sonnet-4-5'
MODELS.CLAUDE_OPUS     // 'claude-opus-4-5'
MODELS.CLAUDE_HAIKU    // 'claude-haiku-4-5'

// OpenAI
MODELS.GPT_4O          // 'gpt-4o'
MODELS.GPT_41          // 'gpt-4.1'
MODELS.GPT_5           // 'gpt-5'

// Google
MODELS.GEMINI_15_PRO   // 'gemini-1.5-pro'
MODELS.GEMINI_20_FLASH // 'gemini-2.0-flash'
```

> **Note:** Claude models require Copilot Pro+ and must be explicitly enabled at
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

### Approach B: Official SDK

Uses `@github/copilot-sdk` which integrates with the `gh` CLI's stored credentials. Requires:
- `@github/copilot-sdk` npm package
- `gh` or `copilot` CLI in PATH
- Prior authentication via `gh auth login`

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
      case 'SDK_NOT_INSTALLED':   // @github/copilot-sdk not installed
      case 'SDK_CLI_NOT_FOUND':   // gh/copilot CLI not in PATH
    }
  }
}
```

## Publishing

Set the `NPM_TOKEN` secret in your GitHub repository settings, then:

```bash
git tag v0.1.0 && git push --tags
```

The publish workflow triggers automatically on version tags.

## License

MIT
