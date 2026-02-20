import { CopilotLLMError } from '../errors.js'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export async function checkSdkAvailable(): Promise<void> {
  try {
    await execFileAsync('gh', ['--version'])
  } catch {
    throw new CopilotLLMError(
      'SDK_CLI_NOT_FOUND',
      '`gh` CLI not found in PATH.\n' +
      'Install the GitHub CLI: https://cli.github.com\n' +
      'Then authenticate: gh auth login'
    )
  }
}
