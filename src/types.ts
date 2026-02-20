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
  GPT_4O:       'gpt-4o',
  GPT_4O_MINI:  'gpt-4o-mini',
  GPT_41:       'gpt-4.1',
  GPT_5:        'gpt-5-mini',
  GPT_51:       'gpt-5.1',
  GPT_52:       'gpt-5.2',

  CLAUDE_HAIKU:  'claude-haiku-4.5',
  CLAUDE_SONNET: 'claude-sonnet-4.5',
  CLAUDE_OPUS:   'claude-opus-4.5',

  GEMINI_25_PRO: 'gemini-2.5-pro',
  GROK_CODE:     'grok-code-fast-1',
} as const
