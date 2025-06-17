import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AISummaryGenerator } from '@/lib/ai/summary-generator';
import { WeeklyData, ConversationSummary } from '@/lib/email-summary/types';
import fs from 'fs';

// Use vi.hoisted to ensure the mock function is available during module initialization
const mockOpenAICreate = vi.hoisted(() => vi.fn());

// Mock OpenAI module
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockOpenAICreate,
        },
      },
    })),
  };
});

// Mock fs for config loading
vi.mock('fs', async importOriginal => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    readFileSync: vi.fn(),
    default: {
      ...actual,
      readFileSync: vi.fn(),
    },
  };
});

describe('AISummaryGenerator', () => {
  let generator: AISummaryGenerator;
  let mockOpenAI: any;

  const mockWeeklyData: WeeklyData = {
    childId: 'child-123',
    childName: 'Test Child',
    childAge: 8,
    parentEmail: 'parent@test.com',
    parentClerkUserId: 'parent-123',
    weekStart: new Date('2024-06-10'),
    weekEnd: new Date('2024-06-16'),
    conversations: [
      {
        id: 'conv-1',
        date: new Date('2024-06-10'),
        duration: 15,
        messageCount: 10,
        childMessages: ['Hello!', 'How are you?'],
        aiResponses: ['Hi there!', "I'm doing great!"],
        safetyFlags: [],
        mood: 'happy',
        topics: ['greeting', 'wellbeing'],
        emotionalTrend: 'stable',
        safetyLevel: 0,
      },
      {
        id: 'conv-2',
        date: new Date('2024-06-12'),
        duration: 25,
        messageCount: 18,
        childMessages: ['I love minecraft!', 'Can we talk about games?'],
        aiResponses: [
          'Minecraft is awesome!',
          'Of course, what games do you like?',
        ],
        safetyFlags: [],
        mood: 'excited',
        topics: ['gaming', 'minecraft'],
        emotionalTrend: 'improving',
        safetyLevel: 0,
      },
    ],
    totalChatTime: 40,
    totalSessions: 2,
    safetyEvents: [],
  };

  const mockConfigFile = {
    age_groups: {
      '6-8': {
        system_prompt: 'Test prompt for 6-8 year olds',
      },
      '9-11': {
        system_prompt: 'Test prompt for 9-11 year olds',
      },
      '12+': {
        system_prompt: 'Test prompt for 12+ year olds',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock fs.readFileSync to return our mock config
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfigFile));

    // Initialize generator
    generator = new AISummaryGenerator();

    // Set reference to the mocked OpenAI
    mockOpenAI = { chat: { completions: { create: mockOpenAICreate } } };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor and Configuration', () => {
    it('should initialize with age-specific prompts from config file', () => {
      expect(fs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('config/summary-prompts.json'),
        'utf8'
      );
    });

    it('should fall back to default prompts if config file fails to load', () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('File not found');
      });

      // Should not throw error, should use fallback
      expect(() => new AISummaryGenerator()).not.toThrow();
    });
  });

  describe('Conversation Preprocessing', () => {
    it('should preprocess conversations correctly', () => {
      const result = generator.preprocessConversations(
        mockWeeklyData.conversations
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        expect.objectContaining({
          mood: expect.any(String),
          topics: expect.any(Array),
          safetyEvents: expect.any(Array),
          emotionalTrend: 'stable',
          engagementLevel: expect.stringMatching(/^(low|medium|high)$/),
          keyInsights: expect.any(Array),
        })
      );
    });

    it('should enrich topics with categories', () => {
      const testConversation: ConversationSummary = {
        ...mockWeeklyData.conversations[0],
        topics: ['minecraft', 'school', 'friends'],
      };

      const result = generator.preprocessConversations([testConversation]);

      expect(result[0].topics).toContain('minecraft');
      expect(result[0].topics).toContain('school');
      expect(result[0].topics).toContain('friends');
      // Should also contain enriched categories
      expect(result[0].topics.length).toBeGreaterThan(3);
    });

    it('should calculate engagement levels correctly', () => {
      const lowEngagementConv: ConversationSummary = {
        ...mockWeeklyData.conversations[0],
        messageCount: 3,
        duration: 5,
        topics: ['greeting'],
      };

      const highEngagementConv: ConversationSummary = {
        ...mockWeeklyData.conversations[0],
        messageCount: 30,
        duration: 45,
        topics: ['gaming', 'school', 'friends', 'hobbies', 'creativity'],
      };

      const results = generator.preprocessConversations([
        lowEngagementConv,
        highEngagementConv,
      ]);

      expect(results[0].engagementLevel).toBe('low');
      expect(results[1].engagementLevel).toBe('high');
    });

    it('should extract key insights from conversations', () => {
      const insightfulConv: ConversationSummary = {
        ...mockWeeklyData.conversations[0],
        messageCount: 25, // High message count
        duration: 35, // Long duration
        topics: ['gaming', 'school', 'friends', 'creativity'], // Multiple topics
        mood: 'excited', // Strong emotion
      };

      const result = generator.preprocessConversations([insightfulConv]);

      expect(result[0].keyInsights).toContain('highly_engaged_conversation');
      expect(result[0].keyInsights).toContain('extended_interaction');
      expect(result[0].keyInsights).toContain('diverse_topic_exploration');
      expect(result[0].keyInsights).toContain(
        'strong_emotional_expression_excited'
      );
    });
  });

  describe('Age Group Determination', () => {
    it('should determine correct age groups', () => {
      // Using a private method via type assertion for testing
      const determineAgeGroup = (generator as any).determineAgeGroup.bind(
        generator
      );

      expect(determineAgeGroup(6)).toBe('6-8');
      expect(determineAgeGroup(8)).toBe('6-8');
      expect(determineAgeGroup(9)).toBe('9-11');
      expect(determineAgeGroup(11)).toBe('9-11');
      expect(determineAgeGroup(12)).toBe('12+');
      expect(determineAgeGroup(15)).toBe('12+');
    });
  });

  describe('AI Summary Generation', () => {
    beforeEach(() => {
      mockOpenAICreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'Test child had 2 great conversations this week!',
                highlights: [
                  'Engaged well with topics',
                  'Showed excitement about gaming',
                ],
                concerns: [],
                recommendations: ['Continue encouraging conversation'],
                mood_analysis: 'Generally happy and excited',
                growth_opportunities: ['Explore more creative topics'],
                next_week_focus: 'Monitor gaming interest development',
                metadata: {
                  engagement_level: 'high',
                  conversation_quality: 'excellent',
                  safety_status: 'normal',
                },
              }),
            },
          },
        ],
        usage: {
          prompt_tokens: 500,
          completion_tokens: 200,
          total_tokens: 700,
        },
      });
    });

    it('should generate AI summary successfully', async () => {
      const result = await generator.generateSummary(mockWeeklyData, 8);

      expect(result).toEqual(
        expect.objectContaining({
          summary: expect.any(String),
          highlights: expect.any(Array),
          concerns: expect.any(Array),
          recommendations: expect.any(Array),
          mood_analysis: expect.any(String),
          growth_opportunities: expect.any(Array),
          next_week_focus: expect.any(String),
          metadata: expect.objectContaining({
            engagement_level: expect.any(String),
            conversation_quality: expect.any(String),
            safety_status: expect.any(String),
            tokenUsage: expect.any(Number),
            estimatedCost: expect.any(Number),
            generatedAt: expect.any(String),
          }),
        })
      );

      expect(mockOpenAICreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          temperature: 0.2,
          max_tokens: 1000,
          response_format: { type: 'json_object' },
        })
      );
    });

    it('should use age-appropriate prompts', async () => {
      await generator.generateSummary(mockWeeklyData, 8);

      const callArgs = mockOpenAICreate.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain('6-8 year olds');
    });

    it('should handle API errors gracefully', async () => {
      mockOpenAICreate.mockRejectedValue(new Error('API Error'));

      await expect(
        generator.generateSummary(mockWeeklyData, 8)
      ).rejects.toThrow('Failed to generate AI summary: API Error');
    });

    it('should calculate costs correctly', async () => {
      const result = await generator.generateSummary(mockWeeklyData, 8);

      // Based on mock usage: 500 input tokens, 200 output tokens
      // GPT-4o-mini: $0.15/1K input, $0.6/1K output
      const expectedCost = (500 / 1000) * 0.00015 + (200 / 1000) * 0.0006;
      expect(result.metadata.estimatedCost).toBeCloseTo(expectedCost, 6);
    });
  });

  describe('Batch Processing', () => {
    beforeEach(() => {
      mockOpenAICreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'Batch summary',
                highlights: ['Batch highlight'],
                concerns: [],
                recommendations: ['Batch recommendation'],
                mood_analysis: 'Batch mood',
                growth_opportunities: ['Batch growth'],
                next_week_focus: 'Batch focus',
                metadata: {
                  engagement_level: 'medium',
                  conversation_quality: 'good',
                  safety_status: 'normal',
                },
              }),
            },
          },
        ],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      });
    });

    it('should process multiple summaries in batches', async () => {
      const requests = [
        { data: mockWeeklyData, childAge: 8 },
        { data: mockWeeklyData, childAge: 10 },
        { data: mockWeeklyData, childAge: 13 },
      ];

      const results = await generator.generateBatchSummaries(requests);

      expect(results).toHaveLength(3);
      expect(mockOpenAICreate).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures in batch processing', async () => {
      mockOpenAICreate
        .mockResolvedValueOnce({
          choices: [
            { message: { content: JSON.stringify({ summary: 'Success 1' }) } },
          ],
          usage: {
            prompt_tokens: 100,
            completion_tokens: 50,
            total_tokens: 150,
          },
        })
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({
          choices: [
            { message: { content: JSON.stringify({ summary: 'Success 2' }) } },
          ],
          usage: {
            prompt_tokens: 100,
            completion_tokens: 50,
            total_tokens: 150,
          },
        });

      const requests = [
        { data: mockWeeklyData, childAge: 8 },
        { data: mockWeeklyData, childAge: 10 },
        { data: mockWeeklyData, childAge: 13 },
      ];

      const results = await generator.generateBatchSummaries(requests);

      expect(results).toHaveLength(3);
      expect(results[0].summary).toContain('Success 1');
      expect(results[1].summary).toContain('Test Child had 2 chat sessions'); // Fallback
      expect(results[2].summary).toContain('Success 2');
    });
  });

  describe('Emotional Intelligence Analysis', () => {
    it('should analyze emotional patterns correctly', () => {
      const preprocessed = [
        {
          mood: 'happy',
          topics: ['gaming'],
          safetyEvents: [],
          emotionalTrend: 'stable',
          engagementLevel: 'high' as const,
          keyInsights: ['engaged'],
        },
        {
          mood: 'excited',
          topics: ['school'],
          safetyEvents: [],
          emotionalTrend: 'improving',
          engagementLevel: 'medium' as const,
          keyInsights: ['learning'],
        },
        {
          mood: 'sad',
          topics: ['friends'],
          safetyEvents: [],
          emotionalTrend: 'declining',
          engagementLevel: 'low' as const,
          keyInsights: ['social_concern'],
        },
      ];

      const result = generator.analyzeEmotionalIntelligence(preprocessed);

      expect(result).toEqual(
        expect.objectContaining({
          overallMood: expect.any(String),
          moodTrends: expect.any(Array),
          emotionalGrowth: expect.any(Array),
          parentRecommendations: expect.any(Array),
        })
      );

      // Should identify mixed emotional patterns
      expect(result.moodTrends).toContain('balanced_emotional_expression');
    });

    it('should generate appropriate parent recommendations', () => {
      const preprocessed = [
        {
          mood: 'frustrated',
          topics: ['school', 'homework'],
          safetyEvents: [],
          emotionalTrend: 'declining',
          engagementLevel: 'low' as const,
          keyInsights: ['academic_struggle'],
        },
      ];

      const result = generator.analyzeEmotionalIntelligence(preprocessed);

      expect(result.parentRecommendations).toContain(
        'Look for opportunities to help with problem-solving skills'
      );
    });
  });

  describe('Safety Event Processing', () => {
    it('should process safety events correctly', () => {
      const conv: ConversationSummary = {
        ...mockWeeklyData.conversations[0],
        safetyFlags: ['inappropriate_content', 'mild_concern'],
        safetyLevel: 2,
      };

      const result = generator.preprocessConversations([conv]);

      expect(result[0].safetyEvents).toContain('inappropriate_content');
      expect(result[0].safetyEvents).toContain('mild_concern');
      expect(result[0].safetyEvents).toContain('moderate_safety_concern');
    });

    it('should flag high safety concerns', () => {
      const conv: ConversationSummary = {
        ...mockWeeklyData.conversations[0],
        safetyFlags: ['severe_concern'],
        safetyLevel: 4,
      };

      const result = generator.preprocessConversations([conv]);

      expect(result[0].safetyEvents).toContain('high_safety_concern');
    });
  });

  describe('Fallback Behavior', () => {
    it('should generate fallback summary when AI fails', () => {
      const fallbackSummary = (generator as any).generateFallbackSummary(
        mockWeeklyData
      );

      expect(fallbackSummary).toEqual(
        expect.objectContaining({
          summary: expect.stringContaining('Test Child had 2 chat sessions'),
          highlights: expect.any(Array),
          concerns: expect.any(Array),
          recommendations: expect.any(Array),
          metadata: expect.objectContaining({
            tokenUsage: 0,
            estimatedCost: 0,
          }),
        })
      );
    });
  });

  describe('Cost Optimization', () => {
    beforeEach(() => {
      mockOpenAICreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'Test child had 2 great conversations this week!',
                highlights: [
                  'Engaged well with topics',
                  'Showed excitement about gaming',
                ],
                concerns: [],
                recommendations: ['Continue encouraging conversation'],
                mood_analysis: 'Generally happy and excited',
                growth_opportunities: ['Explore more creative topics'],
                next_week_focus: 'Monitor gaming interest development',
                metadata: {
                  engagement_level: 'high',
                  conversation_quality: 'excellent',
                  safety_status: 'normal',
                },
              }),
            },
          },
        ],
        usage: {
          prompt_tokens: 500,
          completion_tokens: 200,
          total_tokens: 700,
        },
      });
    });

    it('should track token usage and costs', async () => {
      const result = await generator.generateSummary(mockWeeklyData, 8);

      expect(result.metadata.tokenUsage).toBe(700);
      expect(result.metadata.estimatedCost).toBeGreaterThan(0);
      expect(result.metadata.generatedAt).toBeDefined();
    });

    it('should use cost-effective model (gpt-4o-mini)', async () => {
      await generator.generateSummary(mockWeeklyData, 8);

      const callArgs = mockOpenAICreate.mock.calls[0][0];
      expect(callArgs.model).toBe('gpt-4o-mini');
    });

    it('should batch process with delays to respect rate limits', async () => {
      const startTime = Date.now();

      const requests = Array(7)
        .fill(null)
        .map(() => ({ data: mockWeeklyData, childAge: 8 }));
      await generator.generateBatchSummaries(requests);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should take at least 1 second due to batch delay (7 items = 2 batches with 1s delay)
      expect(duration).toBeGreaterThan(1000);
    });
  });

  describe('Integration with Existing Email Summary System', () => {
    beforeEach(() => {
      mockOpenAICreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'Test child had 2 great conversations this week!',
                highlights: [
                  'Engaged well with topics',
                  'Showed excitement about gaming',
                ],
                concerns: [],
                recommendations: ['Continue encouraging conversation'],
                mood_analysis: 'Generally happy and excited',
                growth_opportunities: ['Explore more creative topics'],
                next_week_focus: 'Monitor gaming interest development',
                metadata: {
                  engagement_level: 'high',
                  conversation_quality: 'excellent',
                  safety_status: 'normal',
                },
              }),
            },
          },
        ],
        usage: {
          prompt_tokens: 500,
          completion_tokens: 200,
          total_tokens: 700,
        },
      });
    });

    it('should work with existing WeeklyData type', () => {
      expect(() =>
        generator.preprocessConversations(mockWeeklyData.conversations)
      ).not.toThrow();
    });

    it('should return compatible SummaryAnalysis type', async () => {
      const result = await generator.generateSummary(mockWeeklyData, 8);

      // Should be compatible with existing email summary system
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('highlights');
      expect(result).toHaveProperty('concerns');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('metadata');
    });
  });
});
