import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { StoredTokens } from './types.js'

export class TokenStore {
  constructor(private storePath: string) {}

  static defaultPath(): string {
    return path.join(os.homedir(), '.config', 'copilot-llm', 'auth.json')
  }

  static default(): TokenStore {
    return new TokenStore(TokenStore.defaultPath())
  }

  async load(): Promise<StoredTokens | null> {
    try {
      const data = await fs.readFile(this.storePath, 'utf-8')
      return JSON.parse(data) as StoredTokens
    } catch {
      return null
    }
  }

  async save(tokens: StoredTokens): Promise<void> {
    const dir = path.dirname(this.storePath)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(this.storePath, JSON.stringify(tokens, null, 2), 'utf-8')
  }

  async clear(): Promise<void> {
    try {
      await fs.unlink(this.storePath)
    } catch {
      // File may not exist, that's fine
    }
  }

  isExpired(tokens: StoredTokens): boolean {
    // True if copilot token expires in less than 5 minutes
    const fiveMinutesFromNow = Math.floor(Date.now() / 1000) + 5 * 60
    return tokens.copilotTokenExpiresAt < fiveMinutesFromNow
  }
}
