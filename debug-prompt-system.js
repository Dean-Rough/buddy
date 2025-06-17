// Debug script to test the modular prompt system
const { readFileSync } = require('fs');
const { join } = require('path');

console.log('🔍 DEBUGGING MODULAR PROMPT SYSTEM\n');

const CONFIG_DIR = join(__dirname, 'config');
console.log('Config directory:', CONFIG_DIR);

// Test 1: Check if all required files exist
const requiredFiles = [
  'system-prompts.json',
  'ai-personas.json',
  'safety-rules.json',
];

console.log('\n📁 CHECKING CONFIG FILES:');
for (const file of requiredFiles) {
  const filePath = join(CONFIG_DIR, file);
  try {
    const stats = require('fs').statSync(filePath);
    console.log(`✅ ${file} - ${Math.round(stats.size / 1024)}KB`);
  } catch (error) {
    console.log(`❌ ${file} - MISSING`);
  }
}

// Test 2: Try loading each config
console.log('\n📄 LOADING CONFIG FILES:');

try {
  const systemPromptsPath = join(CONFIG_DIR, 'system-prompts.json');
  const systemPrompts = JSON.parse(readFileSync(systemPromptsPath, 'utf-8'));
  console.log('✅ system-prompts.json loaded');
  console.log('   - Version:', systemPrompts.version);
  console.log(
    '   - Has chatPromptTemplate:',
    !!systemPrompts.chatPromptTemplate
  );
  console.log('   - Has ageSpecificStyles:', !!systemPrompts.ageSpecificStyles);
  console.log('   - Has modeInstructions:', !!systemPrompts.modeInstructions);
  console.log('   - Has safetyResponses:', !!systemPrompts.safetyResponses);
} catch (error) {
  console.log('❌ system-prompts.json failed:', error.message);
}

try {
  const aiPersonasPath = join(CONFIG_DIR, 'ai-personas.json');
  const aiPersonas = JSON.parse(readFileSync(aiPersonasPath, 'utf-8'));
  console.log('✅ ai-personas.json loaded');
  console.log('   - Version:', aiPersonas.version);
  console.log(
    '   - Personas available:',
    Object.keys(aiPersonas.personas || {})
      .slice(0, 3)
      .join(', ') + '...'
  );
} catch (error) {
  console.log('❌ ai-personas.json failed:', error.message);
}

try {
  const safetyRulesPath = join(CONFIG_DIR, 'safety-rules.json');
  const safetyRules = JSON.parse(readFileSync(safetyRulesPath, 'utf-8'));
  console.log('✅ safety-rules.json loaded');
  console.log('   - Version:', safetyRules.version);
  console.log('   - Has critical patterns:', !!safetyRules.criticalPatterns);
} catch (error) {
  console.log('❌ safety-rules.json failed:', error.message);
}

// Test 3: Test config-loader functions
console.log('\n🔧 TESTING CONFIG-LOADER FUNCTIONS:');

try {
  // Import the config loader (this will test if the module loads)
  const configLoader = require('./lib/config-loader.js');
  console.log('✅ config-loader.js imported successfully');

  // Test buildSystemPrompt function
  console.log('\n🔄 Testing buildSystemPrompt...');
  const testPrompt = configLoader.buildSystemPrompt(
    9, // age
    'chaos-raccoon', // persona
    'Test memory context', // memory
    false, // whisper mode
    'TestChild', // child name
    'excited', // mood
    ['minecraft', 'games'], // topics
    'high' // engagement
  );

  console.log('✅ buildSystemPrompt executed successfully');
  console.log('   - Prompt length:', testPrompt.length, 'characters');
  console.log(
    '   - Contains persona name:',
    testPrompt.includes('chaos-raccoon') || testPrompt.includes('Chaos')
  );
  console.log('   - Contains child age:', testPrompt.includes('9'));
} catch (error) {
  console.log('❌ config-loader failed:', error.message);
  console.log('   Stack:', error.stack);
}

// Test 4: Test direct AI client import
console.log('\n🤖 TESTING AI CLIENT:');

try {
  const aiClient = require('./lib/ai/client.js');
  console.log('✅ ai/client.js imported successfully');

  // Check if generateChatResponse is available
  console.log(
    '   - generateChatResponse available:',
    typeof aiClient.generateChatResponse === 'function'
  );
} catch (error) {
  console.log('❌ ai/client.js failed:', error.message);
  console.log('   Stack:', error.stack);
}

console.log('\n🏁 DEBUG COMPLETE\n');
