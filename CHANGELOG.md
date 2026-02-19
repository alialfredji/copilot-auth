# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-19

### Added

- `CopilotLLM` class with `init()`, `complete()`, `logout()`, and `isAuthenticated()` methods
- **Approach A** (`device-flow`): Zero-dependency GitHub Device Authorization Grant flow
  - Automatic token persistence to `~/.config/copilot-llm/auth.json`
  - Silent token refresh using stored GitHub OAuth token
  - Terminal login prompt only on first run or after token expiry
- **Approach B** (`sdk`): Optional `@github/copilot-sdk` integration
  - Dynamic import so package does not hard-fail if SDK is not installed
  - CLI availability check with helpful install instructions
- `MODELS` constant with OpenAI, Anthropic, and Google model identifiers
- Typed error classes with `ErrorCode` discriminant (`AUTH_TIMEOUT`, `AUTH_DENIED`, `AUTH_EXPIRED`, `API_FORBIDDEN`, `API_ERROR`, `SDK_NOT_INSTALLED`, `SDK_CLI_NOT_FOUND`)
- Full TypeScript types exported: `CopilotLLMConfig`, `CompleteOptions`, `CompletionResult`, `Approach`, `StoredTokens`
- GitHub Actions CI (typecheck on PR/push) and publish (npm on version tag) workflows
- MIT license
