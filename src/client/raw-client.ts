import { CompleteOptions, CompletionResult } from '../types.js'
import { CopilotLLMError } from '../errors.js'

interface OpenAIMessage {
  role: string
  content: string
}

interface OpenAIChoice {
  message: OpenAIMessage
}

interface OpenAIUsage {
  total_tokens?: number
}

interface OpenAIResponse {
  choices: OpenAIChoice[]
  model: string
  usage?: OpenAIUsage
}

export async function rawComplete(
  copilotToken: string,
  prompt: string,
  options: CompleteOptions & { defaultModel: string; defaultSystemPrompt: string }
): Promise<CompletionResult> {
  const body = {
    model: options.model ?? options.defaultModel,
    messages: [
      { role: 'system', content: options.systemPrompt ?? options.defaultSystemPrompt },
      { role: 'user', content: prompt },
    ],
    max_tokens: options.maxTokens ?? 1000,
    temperature: options.temperature ?? 0.7,
    stream: false,
  }

  const response = await fetch('https://api.githubcopilot.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${copilotToken}`,
      'Content-Type': 'application/json',
      'Copilot-Integration-Id': 'vscode-chat',
      'Editor-Version': 'vscode/1.104.1',
      'Editor-Plugin-Version': 'copilot-chat/0.26.7',
      'User-Agent': 'GitHubCopilotChat/0.26.7',
      'X-Initiator': 'agent',
    },
    body: JSON.stringify(body),
  })

  if (response.status === 401) {
    throw new CopilotLLMError('AUTH_EXPIRED', 'Copilot token is expired or invalid. Re-initializing will refresh it.')
  }

  if (response.status === 403) {
    throw new CopilotLLMError('API_FORBIDDEN', 'Access forbidden. Check your Copilot subscription and model availability at github.com/settings/copilot/features')
  }

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText)
    throw new CopilotLLMError('API_ERROR', `GitHub Copilot API error ${response.status}: ${text}`)
  }

  const data = await response.json() as OpenAIResponse

  return {
    text: data.choices[0].message.content,
    model: data.model,
    approach: 'device-flow',
    tokensUsed: data.usage?.total_tokens,
  }
}
