import { createInterface } from 'node:readline'
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
  console.log('[DEBUG] Requesting device code from GitHub...')
  
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    scope: 'read:user',
  })
  
  const response = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  console.log(`[DEBUG] Device code response status: ${response.status} ${response.statusText}`)

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[DEBUG] Device code request failed:', errorText)
    throw new CopilotLLMError('API_ERROR', `Failed to request device code: ${response.statusText}`)
  }

  const data = await response.json() as DeviceCodeResponse
  console.log(`[DEBUG] Device code received. Interval: ${data.interval}s, Expires in: ${data.expires_in}s`)
  return data
}

function waitForEnter(prompt: string): Promise<void> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question(prompt, () => {
      rl.close()
      resolve()
    })
  })
}

async function fetchAccessToken(deviceCode: string): Promise<AccessTokenResponse> {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    device_code: deviceCode,
    grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
  })

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  console.log(`[DEBUG] Token fetch response status: ${response.status} ${response.statusText}`)

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[DEBUG] Token fetch failed:`, errorText)
    throw new CopilotLLMError('API_ERROR', `Failed to fetch access token: ${response.statusText}`)
  }

  const data = await response.json() as AccessTokenResponse
  console.log(`[DEBUG] Token fetch response:`, JSON.stringify(data, null, 2))
  return data
}

async function waitForUserAuth(deviceCode: string, expiresIn: number): Promise<string> {
  const deadline = Date.now() + expiresIn * 1000

  while (Date.now() < deadline) {
    await waitForEnter('Press Enter after you have authorized on GitHub... ')

    console.log('[DEBUG] Checking authorization with GitHub...')
    const data = await fetchAccessToken(deviceCode)

    if (data.access_token) {
      console.log('[DEBUG] ✅ Access token received!')
      return data.access_token
    }

    if (data.error === 'access_denied') {
      throw new CopilotLLMError('AUTH_DENIED', 'GitHub authorization was denied.')
    }

    if (data.error === 'expired_token') {
      throw new CopilotLLMError('AUTH_TIMEOUT', 'The device code expired. Please try again.')
    }

    if (data.error === 'authorization_pending') {
      console.log("Not authorized yet — make sure you've approved on GitHub, then press Enter again.")
      continue
    }

    if (data.error) {
      throw new CopilotLLMError('API_ERROR', `OAuth error: ${data.error} - ${data.error_description ?? ''}`)
    }
  }

  throw new CopilotLLMError('AUTH_TIMEOUT', 'Device code expired. Please try again.')
}

export async function refreshCopilotToken(githubToken: string, store: TokenStore): Promise<string> {
  console.log('[DEBUG] Fetching Copilot token from GitHub API...')
  const response = await fetch('https://api.github.com/copilot_internal/v2/token', {
    method: 'GET',
    headers: {
      'Authorization': `token ${githubToken}`,
      'Accept': 'application/json',
      'User-Agent': 'copilot-llm/1.0.0',
    },
  })

  console.log(`[DEBUG] Copilot token response status: ${response.status} ${response.statusText}`)

  if (response.status === 401) {
    console.error('[DEBUG] GitHub token is invalid or expired')
    throw new CopilotLLMError('AUTH_EXPIRED', 'GitHub token is no longer valid. Please re-authenticate.')
  }

  if (response.status === 403) {
    const errorText = await response.text()
    console.error('[DEBUG] Access forbidden:', errorText)
    throw new CopilotLLMError('API_FORBIDDEN', 'Access forbidden. Make sure you have an active GitHub Copilot subscription.')
  }

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[DEBUG] Failed to get Copilot token:', errorText)
    throw new CopilotLLMError('API_ERROR', `Failed to get Copilot token: ${response.statusText}`)
  }

  const data = await response.json() as CopilotTokenResponse
  console.log(`[DEBUG] Copilot token received. Expires at: ${new Date(data.expires_at * 1000).toISOString()}`)

  const existing = await store.load()
  await store.save({
    githubToken,
    copilotToken: data.token,
    copilotTokenExpiresAt: data.expires_at,
  })
  console.log('[DEBUG] Tokens saved to store')

  void existing

  return data.token
}

export async function deviceFlowAuth(store: TokenStore): Promise<string> {
  console.log('[DEBUG] Starting deviceFlowAuth...')
  const existing = await store.load()

  if (existing && !store.isExpired(existing)) {
    console.log('[DEBUG] Using existing valid Copilot token')
    return existing.copilotToken
  }

  if (existing?.githubToken) {
    console.log('[DEBUG] Found existing GitHub token, attempting to refresh Copilot token...')
    try {
      return await refreshCopilotToken(existing.githubToken, store)
    } catch (err) {
      console.log('[DEBUG] Failed to refresh with existing GitHub token:', err instanceof Error ? err.message : err)
      if (err instanceof CopilotLLMError && err.code !== 'AUTH_EXPIRED') {
        throw err
      }
      console.log('[DEBUG] Proceeding with full device flow...')
    }
  } else {
    console.log('[DEBUG] No existing tokens found, starting full device flow...')
  }

  const deviceCode = await requestDeviceCode()

  console.log('\n🔐 GitHub Copilot Login Required')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  1. Visit: ${deviceCode.verification_uri}`)
  console.log(`  2. Enter code: ${deviceCode.user_code}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  const githubToken = await waitForUserAuth(
    deviceCode.device_code,
    deviceCode.expires_in
  )

  console.log('[DEBUG] GitHub token obtained, fetching Copilot token...')
  return await refreshCopilotToken(githubToken, store)
}
