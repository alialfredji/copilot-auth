export type Approach = 'device-flow' | 'sdk'

export interface CopilotLLMConfig {
  /**
   * Which auth/execution approach to use.
   * 'device-flow' - Approach A: self-contained, zero CLI deps, raw GitHub OAuth
   * 'sdk'         - Approach B: official @github/copilot-sdk, requires gh CLI
   * Default: 'device-flow'
   */
  approach?: Approach

  /**
   * Default model to use for completions.
   * Can be overridden per-call in CompleteOptions.
   * Default: 'gpt-4.1'
   */
  model?: string

  /**
   * Default system prompt applied to every completion unless overridden.
   */
  systemPrompt?: string

  /**
   * Where to store auth tokens.
   * Default: ~/.config/copilot-llm/auth.json
   */
  tokenStorePath?: string
}

export interface CompleteOptions {
  model?: string
  maxTokens?: number
  systemPrompt?: string
  temperature?: number
}

export interface CompletionResult {
  text: string
  model: string
  approach: Approach
  tokensUsed?: number
}

export interface StoredTokens {
  githubToken: string
  copilotToken: string
  copilotTokenExpiresAt: number   // Unix timestamp seconds
}

export const MODELS = {
  // Anthropic - requires Copilot Pro+ and model enabled at github.com/settings/copilot/features
  CLAUDE_SONNET: 'claude-sonnet-4-5',
  CLAUDE_OPUS: 'claude-opus-4-5',
  CLAUDE_HAIKU: 'claude-haiku-4-5',
  // OpenAI
  GPT_4O: 'gpt-4o',
  GPT_41: 'gpt-4.1',
  GPT_5: 'gpt-5',
  // Google
  GEMINI_15_PRO: 'gemini-1.5-pro',
  GEMINI_20_FLASH: 'gemini-2.0-flash',
} as const
