import { CopilotLLMError } from '../errors.js'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

async function isCommandAvailable(command: string): Promise<boolean> {
  try {
    await execFileAsync(command, ['--version'])
    return true
  } catch {
    return false
  }
}

export async function checkSdkAvailable(): Promise<void> {
  // Check if @github/copilot-sdk is importable
  try {
    await import('@github/copilot-sdk')
  } catch {
    throw new CopilotLLMError(
      'SDK_NOT_INSTALLED',
      'The @github/copilot-sdk package is not installed.\n' +
      'Install it with: npm install @github/copilot-sdk\n' +
      'Also install the Copilot CLI: npm install -g @github/copilot\n' +
      'Then authenticate: gh auth login'
    )
  }

  // Check if gh CLI or copilot CLI is in PATH
  const ghAvailable = await isCommandAvailable('gh')
  const copilotAvailable = await isCommandAvailable('copilot')

  if (!ghAvailable && !copilotAvailable) {
    throw new CopilotLLMError(
      'SDK_CLI_NOT_FOUND',
      'Neither `gh` nor `copilot` CLI found in PATH.\n' +
      'Install the GitHub CLI: https://cli.github.com\n' +
      'Then authenticate: gh auth login\n' +
      'Or install the Copilot CLI: npm install -g @github/copilot'
    )
  }
}
