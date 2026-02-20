export type ErrorCode =
  | 'AUTH_TIMEOUT'
  | 'AUTH_EXPIRED'
  | 'AUTH_DENIED'
  | 'API_FORBIDDEN'
  | 'API_ERROR'
  | 'SDK_NOT_INSTALLED'
  | 'SDK_CLI_NOT_FOUND'

export class CopilotLLMError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'CopilotLLMError'
  }
}
