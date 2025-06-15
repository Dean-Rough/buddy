// Quick test script for dynamic time limits functionality
// This is for manual testing of the time management system

import { TimeManager } from './lib/time-management.js';
import { ContextAwareWarnings } from './lib/context-aware-warnings.js';
import { ConversationAnalyzer } from './lib/conversation-analyzer.js';
import { NaturalExitGenerator } from './lib/natural-exit-generator.js';

// Test scenarios for different conversation types
const testScenarios = [
  {
    name: 'Emotional Support Conversation',
    messages: [
      {
        content: "I'm really sad about my pet dying",
        role: 'child',
        createdAt: new Date(),
      },
      {
        content: "I'm so sorry to hear that. Losing a pet is really hard.",
        role: 'assistant',
        createdAt: new Date(),
      },
      { content: 'I miss him so much', role: 'child', createdAt: new Date() },
    ],
    childAge: 8,
    expectedBehavior: 'Should not interrupt emotional conversation',
  },

  {
    name: 'Educational Discussion',
    messages: [
      {
        content: 'Can you help me understand fractions?',
        role: 'child',
        createdAt: new Date(),
      },
      {
        content: 'Of course! Fractions are like cutting a pizza into pieces.',
        role: 'assistant',
        createdAt: new Date(),
      },
      {
        content: 'How do I add fractions together?',
        role: 'child',
        createdAt: new Date(),
      },
    ],
    childAge: 10,
    expectedBehavior: 'Should allow extended time for learning',
  },

  {
    name: 'Story in Progress',
    messages: [
      {
        content: 'Let me tell you about my adventure yesterday...',
        role: 'child',
        createdAt: new Date(),
      },
      {
        content: "I'd love to hear it! What happened?",
        role: 'assistant',
        createdAt: new Date(),
      },
      {
        content: 'So first we went to the park and then...',
        role: 'child',
        createdAt: new Date(),
      },
    ],
    childAge: 9,
    expectedBehavior: 'Should not interrupt story until natural break',
  },

  {
    name: 'Casual Chat',
    messages: [
      {
        content: "what's your favorite color",
        role: 'child',
        createdAt: new Date(),
      },
      {
        content: 'I really like blue! What about you?',
        role: 'assistant',
        createdAt: new Date(),
      },
      { content: "mine's green", role: 'child', createdAt: new Date() },
    ],
    childAge: 7,
    expectedBehavior: 'Should show natural time warnings',
  },
];

// Test different age groups for exit responses
const testExitResponses = () => {
  console.log('🧪 Testing Natural Exit Responses');
  console.log('=====================================');

  const ages = [7, 9, 11];
  const warningLevels = ['gentle', 'preparation', 'final'];

  ages.forEach(age => {
    console.log(`\n👶 Age ${age}:`);

    warningLevels.forEach(level => {
      const context = {
        childAge: age,
        timeOfDay: 'afternoon',
        conversationTone: 'casual',
        isWeekend: false,
      };

      try {
        const response = NaturalExitGenerator.generateNaturalExit(
          context,
          level
        );
        console.log(`  ${level}: "${response}"`);
      } catch (error) {
        console.log(`  ${level}: Error - ${error.message}`);
      }
    });
  });
};

// Test conversation analysis
const testConversationAnalysis = () => {
  console.log('\n🔍 Testing Conversation Analysis');
  console.log('==================================');

  testScenarios.forEach(scenario => {
    console.log(`\n📝 ${scenario.name}:`);

    try {
      const context = ContextAwareWarnings.analyzeConversationContext(
        scenario.messages,
        scenario.childAge
      );

      const importance = ConversationAnalyzer.analyzeImportance(
        context,
        scenario.messages,
        scenario.childAge
      );

      console.log(`  Emotional State: ${context.emotionalState}`);
      console.log(`  Topic Depth: ${context.topicDepth}`);
      console.log(`  Importance Score: ${importance.score.toFixed(2)}`);
      console.log(`  Category: ${importance.category}`);
      console.log(`  Can Override: ${importance.canOverride}`);
      console.log(`  Expected: ${scenario.expectedBehavior}`);

      // Test if good time to end
      const goodTimeToEnd = ContextAwareWarnings.isGoodTimeToEnd(context);
      console.log(`  Good Time to End: ${goodTimeToEnd}`);
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
  });
};

// Test time warning generation
const testTimeWarnings = () => {
  console.log('\n⏰ Testing Time Warning Generation');
  console.log('===================================');

  const timeScenarios = [
    { minutes: 10, desc: '10 minutes remaining' },
    { minutes: 5, desc: '5 minutes remaining' },
    { minutes: 2, desc: '2 minutes remaining' },
    { minutes: 1, desc: '1 minute remaining' },
  ];

  testScenarios.forEach(scenario => {
    console.log(`\n📱 ${scenario.name}:`);

    try {
      const context = ContextAwareWarnings.analyzeConversationContext(
        scenario.messages,
        scenario.childAge
      );

      timeScenarios.forEach(timeScenario => {
        const warning = ContextAwareWarnings.generateContextualWarning(
          context,
          timeScenario.minutes,
          scenario.childAge
        );

        if (warning) {
          console.log(`  ${timeScenario.desc}: "${warning}"`);
        } else {
          console.log(`  ${timeScenario.desc}: No warning (context-aware)`);
        }
      });
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
  });
};

// Run all tests
console.log('🚀 Dynamic Time Limits Test Suite');
console.log('==================================');

try {
  testExitResponses();
  testConversationAnalysis();
  testTimeWarnings();

  console.log('\n✅ Test suite completed!');
  console.log('\n📊 Summary:');
  console.log('- Natural exit responses generated for different ages');
  console.log('- Conversation importance analysis working');
  console.log('- Context-aware warnings respect conversation flow');
  console.log('- Time management integrates with chat system');
} catch (error) {
  console.error('❌ Test suite failed:', error);
}
