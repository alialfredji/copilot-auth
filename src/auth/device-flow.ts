import { TokenStore } from '../token-store.js'
import { CopilotLLMError } from '../errors.js'

const GITHUB_CLIENT_ID = 'Iv1.b507a08c87ecfe98'

interface DeviceCodeResponse {
  device_code: string
  user_code: string
  verification_uri: string
  expires_in: number
  interval: number
}

interface AccessTokenResponse {
  access_token?: string
  error?: string
  error_description?: string
}

interface CopilotTokenResponse {
  token: string
  expires_at: number
}

async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const response = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      scope: 'read:user',
    }),
  })

  if (!response.ok) {
    throw new CopilotLLMError('API_ERROR', `Failed to request device code: ${response.statusText}`)
  }

  return response.json() as Promise<DeviceCodeResponse>
}

async function pollForAccessToken(
  deviceCode: string,
  intervalSeconds: number,
  expiresIn: number
): Promise<string> {
  const deadline = Date.now() + expiresIn * 1000
  const pollInterval = intervalSeconds * 1000

  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, pollInterval))

    const response = await fetch('https://github.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    })

    if (!response.ok) {
      throw new CopilotLLMError('API_ERROR', `Failed to poll for access token: ${response.statusText}`)
    }

    const data = await response.json() as AccessTokenResponse

    if (data.access_token) {
      return data.access_token
    }

    if (data.error === 'authorization_pending') {
      continue
    }

    if (data.error === 'access_denied') {
      throw new CopilotLLMError('AUTH_DENIED', 'GitHub authorization was denied by the user.')
    }

    if (data.error === 'slow_down') {
      // Server asked us to slow down, add extra delay
      await new Promise(resolve => setTimeout(resolve, pollInterval))
      continue
    }

    if (data.error) {
      throw new CopilotLLMError('API_ERROR', `OAuth error: ${data.error} - ${data.error_description ?? ''}`)
    }
  }

  throw new CopilotLLMError('AUTH_TIMEOUT', 'GitHub device authorization timed out. Please try again.')
}

export async function refreshCopilotToken(githubToken: string, store: TokenStore): Promise<string> {
  const response = await fetch('https://api.github.com/copilot_internal/v2/token', {
    method: 'GET',
    headers: {
      'Authorization': `token ${githubToken}`,
      'Accept': 'application/json',
      'User-Agent': 'copilot-llm/1.0.0',
    },
  })

  if (response.status === 401) {
    throw new CopilotLLMError('AUTH_EXPIRED', 'GitHub token is no longer valid. Please re-authenticate.')
  }

  if (response.status === 403) {
    throw new CopilotLLMError('API_FORBIDDEN', 'Access forbidden. Make sure you have an active GitHub Copilot subscription.')
  }

  if (!response.ok) {
    throw new CopilotLLMError('API_ERROR', `Failed to get Copilot token: ${response.statusText}`)
  }

  const data = await response.json() as CopilotTokenResponse

  const existing = await store.load()
  await store.save({
    githubToken,
    copilotToken: data.token,
    copilotTokenExpiresAt: data.expires_at,
  })

  // If there was existing data with a github token, preserve it; otherwise use current
  void existing

  return data.token
}

export async function deviceFlowAuth(store: TokenStore): Promise<string> {
  const existing = await store.load()

  // If we have a valid Copilot token, return it directly
  if (existing && !store.isExpired(existing)) {
    return existing.copilotToken
  }

  // If we have a GitHub token but Copilot token is expired, silently refresh
  if (existing?.githubToken) {
    try {
      return await refreshCopilotToken(existing.githubToken, store)
    } catch (err) {
      if (err instanceof CopilotLLMError && err.code !== 'AUTH_EXPIRED') {
        throw err
      }
      // GitHub token expired too, fall through to full flow
    }
  }

  // Full device flow
  const deviceCode = await requestDeviceCode()

  console.log('\n\uD83D\uDD10 GitHub Copilot Login Required')
  console.log('\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501')
  console.log(`  1. Visit: ${deviceCode.verification_uri}`)
  console.log(`  2. Enter code: ${deviceCode.user_code}`)
  console.log('\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501')
  console.log('Waiting for authorization...\n')

  const githubToken = await pollForAccessToken(
    deviceCode.device_code,
    deviceCode.interval,
    deviceCode.expires_in
  )

  return await refreshCopilotToken(githubToken, store)
}
