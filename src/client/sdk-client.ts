import { CompleteOptions, CompletionResult } from '../types.js'
import { CopilotLLMError } from '../errors.js'

export async function sdkComplete(
  prompt: string,
  options: CompleteOptions & { defaultModel: string; defaultSystemPrompt: string }
): Promise<CompletionResult> {
  // Dynamic import so the package doesn't hard-fail if @github/copilot-sdk not installed
  const sdk = await import('@github/copilot-sdk').catch(() => {
    throw new CopilotLLMError(
      'SDK_NOT_INSTALLED',
      'Install @github/copilot-sdk: npm install @github/copilot-sdk\n' +
      'Also install the Copilot CLI: npm install -g @github/copilot'
    )
  })

  const client = new sdk.CopilotClient()
  await client.start()

  const model = options.model ?? options.defaultModel
  const session = await client.createSession({ model })

  const systemPrompt = options.systemPrompt ?? options.defaultSystemPrompt
  const fullPrompt = systemPrompt
    ? `[System: ${systemPrompt}]\n\n${prompt}`
    : prompt

  const result = await session.sendAndWait({ prompt: fullPrompt })
  await session.destroy()
  await client.stop()

  return {
    text: result?.data?.content ?? '',
    model,
    approach: 'sdk',
  }
}
