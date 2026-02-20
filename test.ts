import { CopilotLLM, MODELS } from './index.js'

async function runTest() {
  try {
    console.log('🚀 Starting Copilot LLM test...\n')

    console.log('📝 Initializing CopilotLLM...')
    const llm = await CopilotLLM.init({
      // approach: 'sdk',
      model: MODELS.CLAUDE_HAIKU,
      systemPrompt: 'You are a helpful assistant. Keep responses concise.'
    })
    console.log('✅ Successfully initialized!\n')

    console.log('🤖 Sending test prompt...')
    const result = await llm.complete('What is 2 + 2?')
    
    console.log('\n📤 Response received:')
    console.log(`Text: ${result.text}`)
    console.log(`Model: ${result.model}`)
    console.log(`Approach: ${result.approach}`)
    console.log(`Tokens Used: ${result.tokensUsed || 'N/A'}`)
    
    console.log('\n✨ Test completed successfully!')

  } catch (error) {
    console.error('\n❌ Test failed:')
    console.error(error)
    process.exit(1)
  }
}

runTest()
