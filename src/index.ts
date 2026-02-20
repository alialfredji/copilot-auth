import { CopilotLLMConfig, CompleteOptions, CompletionResult, MODELS } from './types.js'
import { TokenStore } from './token-store.js'
import { deviceFlowAuth } from './auth/device-flow.js'
import { checkSdkAvailable } from './auth/sdk-flow.js'
import { rawComplete } from './client/raw-client.js'
import { sdkComplete } from './client/sdk-client.js'
import { CopilotLLMError } from './errors.js'

export { CopilotLLMError, MODELS }
export type { CopilotLLMConfig, CompleteOptions, CompletionResult }

export class CopilotLLM {
  private store: TokenStore
  private config: Required<CopilotLLMConfig>

  private constructor(config: Required<CopilotLLMConfig>) {
    this.config = config
    this.store = new TokenStore(config.tokenStorePath)
  }

  /**
   * Create and initialize a CopilotLLM instance.
   * On first run with device-flow approach, prompts user to login via terminal.
   * Subsequent runs reuse stored tokens silently.
   */
  static async init(config: CopilotLLMConfig = {}): Promise<CopilotLLM> {
    const resolved: Required<CopilotLLMConfig> = {
      approach: config.approach ?? 'device-flow',
      model: config.model ?? 'gpt-4.1',
      systemPrompt: config.systemPrompt ?? 'You are a helpful assistant.',
      tokenStorePath: config.tokenStorePath ?? TokenStore.defaultPath(),
    }

    const instance = new CopilotLLM(resolved)

    if (resolved.approach === 'sdk') {
      await checkSdkAvailable()
    } else {
      // Trigger auth check early so any login prompt happens at init, not mid-run
      await deviceFlowAuth(instance.store)
    }

    return instance
  }

  /**
   * Run a completion against GitHub Copilot.
   */
  async complete(prompt: string, options: CompleteOptions = {}): Promise<CompletionResult> {
    if (this.config.approach === 'sdk') {
      return sdkComplete(prompt, {
        ...options,
        defaultModel: this.config.model,
        defaultSystemPrompt: this.config.systemPrompt,
      }, this.store)
    }

    // Approach A: refresh token if needed, then call API
    const copilotToken = await deviceFlowAuth(this.store)
    return rawComplete(copilotToken, prompt, {
      ...options,
      defaultModel: this.config.model,
      defaultSystemPrompt: this.config.systemPrompt,
    })
  }

  /**
   * Remove stored tokens. Next init() call will re-authenticate.
   */
  static async logout(tokenStorePath?: string): Promise<void> {
    const store = new TokenStore(tokenStorePath ?? TokenStore.defaultPath())
    await store.clear()
    console.log('Logged out. Tokens cleared.')
  }

  /**
   * Check if a valid session exists without triggering login.
   */
  static async isAuthenticated(tokenStorePath?: string): Promise<boolean> {
    const store = new TokenStore(tokenStorePath ?? TokenStore.defaultPath())
    const tokens = await store.load()
    if (!tokens) return false
    return !store.isExpired(tokens) || !!tokens.githubToken
  }
}
