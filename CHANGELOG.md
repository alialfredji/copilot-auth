# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-20

### Added

- `CopilotLLM` class with `init()`, `complete()`, `logout()`, and `isAuthenticated()` methods
- **Approach A** (`device-flow`): Zero-dependency GitHub Device Authorization Grant flow
  - Automatic token persistence to `~/.config/copilot-llm/auth.json`
  - Silent token refresh using stored GitHub OAuth token (Copilot token TTL: 5 min)
  - Terminal login prompt only on first run or after token expiry
  - Uses the same OAuth client ID as the official VS Code Copilot extension (`Iv1.b507a08c87ecfe98`)
- **Approach B** (`sdk`): Same device-flow tokens as Approach A, but verifies `gh` CLI is available in `PATH` before proceeding — useful when you want to enforce a `gh` CLI environment as a prerequisite
- `MODELS` constant covering OpenAI (`gpt-4o`, `gpt-4o-mini`, `gpt-4.1`, `gpt-5-mini`, `gpt-5.1`, `gpt-5.2`), Anthropic (`claude-haiku-4.5`, `claude-sonnet-4.5`, `claude-opus-4.5`), Google (`gemini-2.5-pro`), and xAI (`grok-code-fast-1`) model identifiers
- Per-call overrides for `model`, `maxTokens`, `temperature`, and `systemPrompt`
- `CompletionResult` with `text`, `model`, `approach`, and `tokensUsed` fields (populated by both approaches)
- Typed error class `CopilotLLMError` with `ErrorCode` discriminant: `AUTH_TIMEOUT`, `AUTH_DENIED`, `AUTH_EXPIRED`, `API_FORBIDDEN`, `API_ERROR`, `SDK_CLI_NOT_FOUND`
- Full TypeScript types exported: `CopilotLLMConfig`, `CompleteOptions`, `CompletionResult`, `Approach`, `StoredTokens`
- `.nvmrc` pinned to Node.js `v24.13.1` (LTS "Krypton")
- GitHub Actions CI (typecheck on PR/push) and publish (npm on version tag) workflows
- MIT license
