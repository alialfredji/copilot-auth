import { CopilotLLM, MODELS } from './index.js'

async function testDeviceFlow() {
  try {
    console.log('🧪 Testing Device Flow Approach...\n')

    console.log('⏳ Initializing (this may show login prompt)...')
    const llm = await CopilotLLM.init({
      approach: 'device-flow',
      model: MODELS.GPT_4O,
      systemPrompt: 'You are a helpful assistant. Keep responses very brief.'
    })
    console.log('✅ Initialization complete!\n')

    console.log('📤 Sending test prompt...')
    const result = await llm.complete('Say "Hello from Copilot" and nothing else')
    
    console.log('\n📥 Response:')
    console.log(`  Text: ${result.text}`)
    console.log(`  Model: ${result.model}`)
    console.log(`  Approach: ${result.approach}`)
    console.log(`  Tokens: ${result.tokensUsed || 'N/A'}`)
    
    console.log('\n✨ Device flow test passed!')

  } catch (error) {
    console.error('\n❌ Device flow test failed:')
    console.error(error)
    process.exit(1)
  }
}

testDeviceFlow()
