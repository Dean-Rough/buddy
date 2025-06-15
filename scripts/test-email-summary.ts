/**
 * Test script for Email Summary System
 * Run with: npx tsx scripts/test-email-summary.ts
 */

import {
  WeeklySummaryGenerator,
  WeeklyDataCollector,
  EmailService,
} from '../lib/email-summary';
import { WeeklyData, SummaryAnalysis } from '../lib/email-summary/types';

// Mock data for testing
const mockWeeklyData: WeeklyData = {
  childId: 'test-child-123',
  childName: 'Emma',
  childAge: 9,
  parentEmail: 'parent@example.com',
  parentClerkUserId: 'test-parent-123',
  weekStart: new Date('2024-12-01'),
  weekEnd: new Date('2024-12-07'),
  conversations: [
    {
      id: 'conv-1',
      date: new Date('2024-12-02'),
      duration: 15,
      messageCount: 12,
      childMessages: [
        'Hi Buddy! What should we talk about today?',
        'Can you help me with my math homework?',
        'I love space! Tell me about planets!',
      ],
      aiResponses: [
        "Hey Emma! I'd love to chat about anything you want.",
        'Of course! What math topic are you working on?',
        'Space is amazing! Which planet interests you most?',
      ],
      safetyFlags: [],
      mood: 'excited',
      topics: ['education', 'space', 'math'],
      emotionalTrend: 'positive',
      safetyLevel: 1,
    },
    {
      id: 'conv-2',
      date: new Date('2024-12-04'),
      duration: 20,
      messageCount: 18,
      childMessages: [
        'I had a fight with my friend today',
        'She said something mean about my project',
        "I don't know how to feel better",
      ],
      aiResponses: [
        "I'm sorry to hear that happened. That must have hurt.",
        'It sounds like you worked hard on your project.',
        "Sometimes friends say things they don't mean when they're upset.",
      ],
      safetyFlags: [],
      mood: 'sad',
      topics: ['friendship', 'emotions', 'conflict'],
      emotionalTrend: 'recovering',
      safetyLevel: 2,
    },
    {
      id: 'conv-3',
      date: new Date('2024-12-06'),
      duration: 12,
      messageCount: 8,
      childMessages: [
        'I made up with my friend!',
        'We talked and she apologized',
        "Now we're planning a sleepover",
      ],
      aiResponses: [
        "That's wonderful news! I'm so happy for you.",
        'It takes courage to work things out with friends.',
        'Sleepovers are so much fun! What are you planning to do?',
      ],
      safetyFlags: [],
      mood: 'happy',
      topics: ['friendship', 'reconciliation', 'social'],
      emotionalTrend: 'positive',
      safetyLevel: 1,
    },
  ],
  totalChatTime: 47, // 15 + 20 + 12
  totalSessions: 3,
  safetyEvents: [],
};

const mockAnalysis: SummaryAnalysis = {
  overall_mood: 'positive',
  mood_details:
    'Emma showed resilience this week, working through a friendship conflict and ending on a positive note with successful reconciliation.',
  main_interests: ['space exploration', 'mathematics', 'friendship dynamics'],
  learning_moments:
    'Emma engaged with math homework help and showed genuine curiosity about space and planets.',
  social_emotional:
    'Demonstrated emotional maturity by working through a friendship conflict and celebrating the successful resolution.',
  safety_status: 'all_good',
  safety_details: '',
  highlights: [
    'Showed genuine curiosity about space exploration',
    'Handled friendship conflict with emotional maturity',
    'Successfully reconciled with friend and planned positive activities',
  ],
  suggested_conversations: [
    '"What was the most interesting thing you learned about space this week?"',
    '"How did your conversation with Buddy help with your friend situation?"',
    '"What are you most excited about for your sleepover?"',
  ],
};

async function testEmailGeneration() {
  console.log('🧪 Testing Email Summary Generation');
  console.log('=====================================');

  try {
    // Test 1: Email Template Generation
    console.log('\n1. Testing Email Template Generation...');
    const { EmailTemplateGenerator } = await import(
      '../lib/email-summary/email-template'
    );
    const templateGenerator = new EmailTemplateGenerator();

    const { subject, htmlContent } = await templateGenerator.generateEmail(
      mockWeeklyData,
      mockAnalysis
    );

    console.log('✅ Subject:', subject);
    console.log('✅ HTML Content Length:', htmlContent.length, 'characters');

    // Test 2: Plain Text Generation
    console.log('\n2. Testing Plain Text Generation...');
    const templateData = (templateGenerator as any).prepareTemplateData(
      mockWeeklyData,
      mockAnalysis
    );
    const plainText = templateGenerator.generatePlainTextContent(templateData);
    console.log('✅ Plain Text Length:', plainText.length, 'characters');

    // Test 3: Email Service Configuration
    console.log('\n3. Testing Email Service Configuration...');
    const emailService = new EmailService();
    const isConfigValid = await emailService.testEmailConfiguration();
    console.log('✅ Email Configuration Valid:', isConfigValid);

    // Test 4: Data Collection (Mock)
    console.log('\n4. Testing Data Collection Structure...');
    const dataCollector = new WeeklyDataCollector();
    const conversationSummary = dataCollector.prepareConversationSummary(
      mockWeeklyData.conversations[0]
    );
    console.log('✅ Conversation Summary Preview:');
    console.log(conversationSummary);

    // Test 5: LLM Analysis (Mock)
    console.log('\n5. Testing LLM Analysis...');
    const { LLMAnalyzer } = await import('../lib/email-summary/llm-analyzer');
    const analyzer = new LLMAnalyzer();
    const tokenEstimate = analyzer.estimateTokenUsage(mockWeeklyData);
    console.log('✅ Estimated Token Usage:', tokenEstimate);
    console.log('✅ Estimated Cost: $', (tokenEstimate * 0.00015).toFixed(6)); // GPT-4o-mini pricing

    // Test 6: Full Generator (Dry Run)
    console.log('\n6. Testing Full Generator (Dry Run)...');
    const generator = new WeeklySummaryGenerator();

    // This would normally connect to database, so we'll just test the methods exist
    console.log('✅ WeeklySummaryGenerator methods available:');
    console.log(
      '  - generateWeeklySummaries:',
      typeof generator.generateWeeklySummaries
    );
    console.log(
      '  - generateManualSummary:',
      typeof generator.generateManualSummary
    );
    console.log(
      '  - retryFailedSummaries:',
      typeof generator.retryFailedSummaries
    );

    // Test 7: Write Sample Email to File
    console.log('\n7. Writing Sample Email to File...');
    const fs = await import('fs/promises');
    const path = await import('path');

    const outputPath = path.join(process.cwd(), 'sample-email-output.html');
    await fs.writeFile(outputPath, htmlContent, 'utf-8');
    console.log('✅ Sample email written to:', outputPath);

    console.log('\n🎉 All tests completed successfully!');
    console.log('\nNext Steps:');
    console.log('1. Configure email service (SendGrid/Resend)');
    console.log('2. Set up CRON_SECRET environment variable');
    console.log('3. Test with real data in development');
    console.log('4. Deploy and configure Vercel cron job');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

async function testCostEstimation() {
  console.log('\n💰 Cost Estimation Analysis');
  console.log('============================');

  const tokenEstimate = 2300; // Average tokens per summary
  const gpt4oMiniInputCost = 0.15 / 1000000; // $0.15 per 1M tokens
  const gpt4oMiniOutputCost = 0.075 / 1000000; // $0.075 per 1M tokens

  const inputTokens = 1500; // Conversation data
  const outputTokens = 800; // Analysis response

  const costPerSummary =
    inputTokens * gpt4oMiniInputCost + outputTokens * gpt4oMiniOutputCost;

  console.log('Per Summary:');
  console.log(`  Input tokens: ${inputTokens}`);
  console.log(`  Output tokens: ${outputTokens}`);
  console.log(`  Cost: $${costPerSummary.toFixed(6)}`);

  const scenarios = [
    { families: 100, name: '100 families' },
    { families: 500, name: '500 families' },
    { families: 1000, name: '1,000 families' },
    { families: 5000, name: '5,000 families' },
  ];

  console.log('\nScaling Analysis:');
  scenarios.forEach(scenario => {
    const weeklyGeneration = scenario.families * 1; // 1 child per family average
    const weeklyCost = weeklyGeneration * costPerSummary;
    const monthlyCost = weeklyCost * 4.33; // Average weeks per month
    const annualCost = weeklyCost * 52;

    console.log(`\n${scenario.name}:`);
    console.log(`  Weekly: $${weeklyCost.toFixed(2)}`);
    console.log(`  Monthly: $${monthlyCost.toFixed(2)}`);
    console.log(`  Annual: $${annualCost.toFixed(2)}`);
  });
}

// Run tests
if (require.main === module) {
  testEmailGeneration()
    .then(() => testCostEstimation())
    .catch(console.error);
}

export { testEmailGeneration, testCostEstimation };
