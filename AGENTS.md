# AGENTS.md — Developer Guide for AI Coding Agents

## Project Overview

`copilot-llm` is a TypeScript ESM library that exposes GitHub Copilot as an LLM backend.
It implements two auth strategies (device-flow OAuth, gh CLI) behind a unified `CopilotLLM` class.
No API keys are required — it reuses a Copilot subscription.

**Node.js:** `>=24` (pin: `v24.13.1` via `.nvmrc`)
**Module system:** ESM (`"type": "module"`)
**Language:** TypeScript 5.x, compiled to `dist/` for publishing

---

## Build, Typecheck, and Test Commands

```bash
# Build for publishing (outputs to dist/)
npm run build          # tsc -p tsconfig.build.json

# Type-check without emitting (CI uses this)
npm run typecheck      # tsc --noEmit

# Run the manual integration test (requires live GitHub auth)
npm test               # tsx test.ts

# Run the device-flow test script directly
npx tsx test-device-flow.ts

# Run any single TypeScript file directly
npx tsx <file.ts>

# Development / quick iteration
npm run dev            # tsx index.ts
```

There is **no unit test framework** (no Jest, Vitest, Mocha). Tests are manual integration
scripts (`test.ts`, `test-device-flow.ts`) executed with `tsx`. CI only runs `typecheck`.

**CI pipeline** (`.github/workflows/ci.yml`): checkout → `npm ci` → `npm run typecheck`

---

## Project Structure

```
copilot-auth/
├── index.ts               # Public re-export barrel (root, included in tsconfig)
├── src/
│   ├── index.ts           # CopilotLLM class (main implementation)
│   ├── types.ts           # All shared types, interfaces, MODELS const
│   ├── errors.ts          # CopilotLLMError class + ErrorCode union
│   ├── token-store.ts     # TokenStore class (fs-based token persistence)
│   ├── auth/
│   │   ├── device-flow.ts # GitHub OAuth device-flow implementation
│   │   └── sdk-flow.ts    # gh CLI availability check
│   └── client/
│       ├── raw-client.ts  # Direct fetch to api.githubcopilot.com
│       └── sdk-client.ts  # Thin wrapper that sets approach: 'sdk'
├── test.ts                # Integration test script
├── test-device-flow.ts    # Device-flow specific test
├── tsconfig.json          # Base TS config (strict, NodeNext, ES2022)
└── tsconfig.build.json    # Extends base; adds outDir/rootDir, excludes dist
```

---

## TypeScript Configuration

- **`strict: true`** — all strict checks enabled (no implicit any, strict null, etc.)
- **`target: ES2022`**, **`module: NodeNext`**, **`moduleResolution: NodeNext`**
- `declaration: true`, `declarationMap: true`, `sourceMap: true` for the published build
- `esModuleInterop: true`, `skipLibCheck: true`

---

## Code Style Guidelines

### Imports

- Use **relative imports with `.js` extension** for all local modules (required by NodeNext):
  ```ts
  import { TokenStore } from '../token-store.js'
  import { CopilotLLMError } from '../errors.js'
  ```
- Use **`node:` protocol** for all Node.js built-ins:
  ```ts
  import fs from 'node:fs/promises'
  import path from 'node:path'
  import os from 'node:os'
  ```
- No path aliases — use relative paths only.
- Group order: Node built-ins → local modules (no blank line separation enforced).

### Naming Conventions

| Construct       | Convention          | Example                              |
|-----------------|---------------------|--------------------------------------|
| Files           | `kebab-case.ts`     | `token-store.ts`, `device-flow.ts`   |
| Classes         | `PascalCase`        | `CopilotLLM`, `TokenStore`           |
| Interfaces      | `PascalCase`        | `CopilotLLMConfig`, `StoredTokens`   |
| Type aliases    | `PascalCase`        | `Approach`, `ErrorCode`              |
| Functions       | `camelCase`         | `deviceFlowAuth`, `rawComplete`      |
| Constants       | `SCREAMING_SNAKE`   | `MODELS`, `GITHUB_CLIENT_ID`         |
| Variables       | `camelCase`         | `copilotToken`, `existingTokens`     |

### Types

- Prefer `interface` for object shapes, `type` for unions and aliases.
- Export all public-facing types from `src/types.ts` — do not scatter them.
- Internal-only interfaces (e.g., API response shapes) are defined locally in the file that uses them.
- Use `as const` for enum-like constant objects (`MODELS`).
- Avoid `any`; use `unknown` when type is truly unknown.

### Functions and Classes

- **Async/await** everywhere — no raw Promise chains.
- `static async` factory methods for classes that need async init (`CopilotLLM.init()`).
- Private constructor pattern for classes initialized via factory: `private constructor(...)`.
- Keep functions small and single-purpose. Prefer module-level functions over methods where class state is not needed.

### Error Handling

- All public errors are `CopilotLLMError` instances with a typed `code: ErrorCode`.
- Always pass the original cause as the third argument when wrapping errors:
  ```ts
  throw new CopilotLLMError('API_ERROR', 'Human-readable message', originalError)
  ```
- Silently ignore expected "not found" cases (e.g., missing token file) using empty `catch {}`.
- Check HTTP status codes explicitly (401, 403) before checking `response.ok`.
- Use `.catch(() => fallback)` for non-critical secondary reads (e.g., reading error body text).

### Formatting

- No Prettier or ESLint config present — follow the existing code style:
  - 2-space indentation
  - Single quotes for strings
  - Semicolons at end of statements
  - Trailing commas in multi-line objects/arrays
  - Opening brace on same line (`{` not on new line)

---

## Publishing

```bash
# Triggers CI typecheck + publishes to npm automatically on version tag push
git tag v0.x.y && git push --tags
```

The `prepublishOnly` hook runs `npm run build`. Requires `NPM_TOKEN` in GitHub secrets.
Published package includes: `dist/`, `README.md`, `CHANGELOG.md`, `LICENSE`.

---

## Key Constraints

- **No runtime dependencies** — only `devDependencies` (tsx, typescript, @types/node).
- All network calls use the global `fetch` (Node 24 built-in). Do not add `node-fetch` or `axios`.
- Token storage path defaults to `~/.config/copilot-llm/auth.json`; always use `TokenStore.defaultPath()`.
- Copilot tokens have a ~5 min TTL; `TokenStore.isExpired()` checks with a 5-min buffer.
- The `GITHUB_CLIENT_ID` (`Iv1.b507a08c87ecfe98`) is the public VS Code Copilot OAuth client — do not replace it.
