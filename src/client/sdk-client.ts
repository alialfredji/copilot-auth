import { CompleteOptions, CompletionResult } from '../types.js'
import { TokenStore } from '../token-store.js'
import { deviceFlowAuth } from '../auth/device-flow.js'
import { rawComplete } from './raw-client.js'

export async function sdkComplete(
  prompt: string,
  options: CompleteOptions & { defaultModel: string; defaultSystemPrompt: string },
  store: TokenStore
): Promise<CompletionResult> {
  const copilotToken = await deviceFlowAuth(store)
  const result = await rawComplete(copilotToken, prompt, options)
  return { ...result, approach: 'sdk' }
}
