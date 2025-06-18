/**
 * Advanced Content Control System Tests
 * Comprehensive testing for content filtering, topic management, and real-time monitoring
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  beforeAll,
  afterAll,
} from 'vitest';
import {
  AdvancedFilteringEngine,
  ContentCategory,
  TopicAction,
  ContentScore,
  AlertSeverity,
} from '@/lib/content-control/advanced-filtering-engine';
import { TopicManagementService } from '@/lib/content-control/topic-management';
import { RealTimeContentMonitor } from '@/lib/content-control/real-time-monitor';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    topicRule: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    contentAlert: {
      create: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    contentScore: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    childAccount: {
      findUnique: vi.fn(),
    },
    conversation: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    parentSettings: {
      upsert: vi.fn(),
    },
    parentNotification: {
      create: vi.fn(),
    },
  },
}));

describe('AdvancedFilteringEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeContent', () => {
    it('should analyze educational content correctly', async () => {
      const content = 'I want to learn about science and math homework';
      const childAge = 10;

      const analysis = await AdvancedFilteringEngine.analyzeContent(
        content,
        childAge
      );

      expect(analysis.category).toBe(ContentCategory.EDUCATIONAL);
      expect(analysis.score).toBeGreaterThanOrEqual(ContentScore.GOOD);
      expect(analysis.topics).toContain('science');
      expect(analysis.topics).toContain('homework');
      expect(analysis.educationalValue).toBeGreaterThan(0.5);
      expect(analysis.flags).toHaveLength(0);
    });

    it('should flag concerning content', async () => {
      const content = 'I want to do something dangerous and harmful';
      const childAge = 8;

      const analysis = await AdvancedFilteringEngine.analyzeContent(
        content,
        childAge
      );

      expect(analysis.score).toBeLessThanOrEqual(ContentScore.CONCERNING);
      expect(analysis.flags).toContain('concerning_content');
      expect(analysis.confidence).toBeGreaterThan(0);
    });

    it('should handle age-appropriate content filtering', async () => {
      const content = 'complex advanced theoretical physics concepts';
      const childAge = 6;

      const analysis = await AdvancedFilteringEngine.analyzeContent(
        content,
        childAge
      );

      expect(analysis.flags).toContain('too_advanced');
    });

    it('should handle analysis errors gracefully', async () => {
      // Mock an error in content analysis
      const originalExtractTopics = (AdvancedFilteringEngine as any)
        .extractTopics;
      (AdvancedFilteringEngine as any).extractTopics = vi
        .fn()
        .mockRejectedValue(new Error('Analysis failed'));

      const content = 'test content';
      const analysis = await AdvancedFilteringEngine.analyzeContent(content, 8);

      expect(analysis.category).toBe(ContentCategory.UNKNOWN);
      expect(analysis.score).toBe(ContentScore.CONCERNING);
      expect(analysis.flags).toContain('analysis_error');
      expect(analysis.confidence).toBe(0.1);

      // Restore original method
      (AdvancedFilteringEngine as any).extractTopics = originalExtractTopics;
    });
  });

  describe('applyTopicRules', () => {
    it('should apply exact topic match rules', async () => {
      const mockRules = [
        {
          id: 'rule1',
          topic: 'video games',
          action: TopicAction.MONITOR,
          category: ContentCategory.ENTERTAINMENT,
        },
      ];

      // Mock getApplicableRules
      (AdvancedFilteringEngine as any).getApplicableRules = vi
        .fn()
        .mockResolvedValue(mockRules);

      const analysis = {
        topics: ['video games', 'fun'],
        category: ContentCategory.ENTERTAINMENT,
        score: ContentScore.NEUTRAL,
        confidence: 0.8,
        flags: [],
        educationalValue: 0.3,
        appropriatenessReason: 'Entertainment content',
      };

      const result = await AdvancedFilteringEngine.applyTopicRules(
        'parent123',
        'child123',
        analysis
      );

      expect(result.action).toBe(TopicAction.MONITOR);
      expect(result.matchedRule).toBeDefined();
      expect(result.matchedRule?.topic).toBe('video games');
    });

    it('should apply category-based rules when no exact match', async () => {
      const mockRules = [
        {
          id: 'rule1',
          topic: 'general',
          action: TopicAction.ALLOW,
          category: ContentCategory.EDUCATIONAL,
        },
      ];

      (AdvancedFilteringEngine as any).getApplicableRules = vi
        .fn()
        .mockResolvedValue(mockRules);

      const analysis = {
        topics: ['math', 'learning'],
        category: ContentCategory.EDUCATIONAL,
        score: ContentScore.EXCELLENT,
        confidence: 0.9,
        flags: [],
        educationalValue: 0.9,
        appropriatenessReason: 'Educational content',
      };

      const result = await AdvancedFilteringEngine.applyTopicRules(
        'parent123',
        'child123',
        analysis
      );

      expect(result.action).toBe(TopicAction.ALLOW);
      expect(result.matchedRule?.category).toBe(ContentCategory.EDUCATIONAL);
    });

    it('should default to monitoring for concerning content', async () => {
      (AdvancedFilteringEngine as any).getApplicableRules = vi
        .fn()
        .mockResolvedValue([]);

      const analysis = {
        topics: ['unknown'],
        category: ContentCategory.UNKNOWN,
        score: ContentScore.CONCERNING,
        confidence: 0.5,
        flags: ['concerning_flag'],
        educationalValue: 0.1,
        appropriatenessReason: 'Concerning content',
      };

      const result = await AdvancedFilteringEngine.applyTopicRules(
        'parent123',
        'child123',
        analysis
      );

      expect(result.action).toBe(TopicAction.MONITOR);
      expect(result.overrideReason).toContain('requires monitoring');
    });
  });
});

describe('TopicManagementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTopicRule', () => {
    it('should create a topic rule successfully', async () => {
      const mockRule = {
        id: 'rule123',
        parentClerkUserId: 'parent123',
        childAccountId: 'child123',
        topic: 'homework',
        category: ContentCategory.EDUCATIONAL,
        action: TopicAction.ALLOW,
        score: ContentScore.GOOD,
        reason: 'Educational content should be encouraged',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.topicRule.create as any).mockResolvedValue(mockRule);

      const result = await TopicManagementService.createTopicRule({
        parentClerkUserId: 'parent123',
        childAccountId: 'child123',
        topic: 'homework',
        action: TopicAction.ALLOW,
        reason: 'Educational content should be encouraged',
      });

      expect(result).toEqual(mockRule);
      expect(prisma.topicRule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          parentClerkUserId: 'parent123',
          childAccountId: 'child123',
          topic: 'homework',
          action: TopicAction.ALLOW,
          reason: 'Educational content should be encouraged',
        }),
      });
    });

    it('should auto-categorize topics when category not provided', async () => {
      const mockRule = {
        id: 'rule123',
        parentClerkUserId: 'parent123',
        topic: 'math homework',
        category: ContentCategory.EDUCATIONAL,
        action: TopicAction.ALLOW,
        score: ContentScore.GOOD,
        reason: 'Educational content',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.topicRule.create as any).mockResolvedValue(mockRule);

      await TopicManagementService.createTopicRule({
        parentClerkUserId: 'parent123',
        topic: 'math homework',
        action: TopicAction.ALLOW,
        reason: 'Educational content',
      });

      expect(prisma.topicRule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          category: ContentCategory.EDUCATIONAL,
        }),
      });
    });
  });

  describe('getTopicSuggestions', () => {
    it('should generate topic suggestions from conversation history', async () => {
      const mockConversations = [
        {
          messages: [
            {
              content: 'I love playing minecraft with my friends',
              createdAt: new Date(),
            },
            {
              content: 'Can we talk about minecraft again?',
              createdAt: new Date(),
            },
          ],
        },
      ];

      const mockExistingRules = [];

      (prisma.conversation.findMany as any).mockResolvedValue(
        mockConversations
      );
      (TopicManagementService as any).getTopicRulesWithStats = vi
        .fn()
        .mockResolvedValue(mockExistingRules);

      // Mock child age
      (prisma.childAccount.findUnique as any).mockResolvedValue({
        dateOfBirth: new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000), // 10 years old
      });

      const suggestions = await TopicManagementService.getTopicSuggestions(
        'parent123',
        'child123',
        7
      );

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].topic).toBe('minecraft');
      expect(suggestions[0].frequency).toBe(2);
      expect(suggestions[0].suggestedAction).toBe(TopicAction.ALLOW);
    });

    it('should not suggest topics that already have rules', async () => {
      const mockConversations = [
        {
          messages: [
            {
              content: 'I love playing minecraft',
              createdAt: new Date(),
            },
          ],
        },
      ];

      const mockExistingRules = [{ topic: 'minecraft' }];

      (prisma.conversation.findMany as any).mockResolvedValue(
        mockConversations
      );
      (TopicManagementService as any).getTopicRulesWithStats = vi
        .fn()
        .mockResolvedValue(mockExistingRules);

      const suggestions = await TopicManagementService.getTopicSuggestions(
        'parent123',
        'child123',
        7
      );

      expect(suggestions).toHaveLength(0);
    });
  });
});

describe('RealTimeContentMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('monitorMessage', () => {
    it('should monitor message and return results', async () => {
      // Mock child age
      (prisma.childAccount.findUnique as any).mockResolvedValue({
        dateOfBirth: new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000), // 10 years old
      });

      // Mock conversation context
      (prisma.conversation.findUnique as any).mockResolvedValue({
        topics: ['games'],
        mood: 'happy',
      });

      // Mock content analysis
      const mockAnalysis = {
        topics: ['video games'],
        category: ContentCategory.ENTERTAINMENT,
        score: ContentScore.NEUTRAL,
        confidence: 0.8,
        flags: [],
        educationalValue: 0.3,
        appropriatenessReason: 'Entertainment content',
      };

      const originalAnalyzeContent = AdvancedFilteringEngine.analyzeContent;
      AdvancedFilteringEngine.analyzeContent = vi
        .fn()
        .mockResolvedValue(mockAnalysis);

      // Mock rule application
      const originalApplyTopicRules = AdvancedFilteringEngine.applyTopicRules;
      AdvancedFilteringEngine.applyTopicRules = vi.fn().mockResolvedValue({
        action: TopicAction.ALLOW,
        overrideReason: 'Default allow',
      });

      const result = await RealTimeContentMonitor.monitorMessage(
        'parent123',
        'child123',
        'conv123',
        'msg123',
        'I love playing video games',
        {
          enableRealTimeAlerts: true,
          parentNotificationThreshold: 2,
          bypassForEmergency: false,
          logAllAnalysis: true,
        }
      );

      expect(result.allowed).toBe(true);
      expect(result.action).toBe(TopicAction.ALLOW);
      expect(result.score).toBe(ContentScore.NEUTRAL);
      expect(result.alertCreated).toBe(false);
      expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);

      // Restore original methods
      AdvancedFilteringEngine.analyzeContent = originalAnalyzeContent;
      AdvancedFilteringEngine.applyTopicRules = originalApplyTopicRules;
    });

    it('should create alerts for concerning content', async () => {
      (prisma.childAccount.findUnique as any).mockResolvedValue({
        dateOfBirth: new Date(Date.now() - 8 * 365 * 24 * 60 * 60 * 1000), // 8 years old
      });

      (prisma.conversation.findUnique as any).mockResolvedValue({
        topics: [],
        mood: 'neutral',
      });

      const mockAnalysis = {
        topics: ['inappropriate'],
        category: ContentCategory.INAPPROPRIATE,
        score: ContentScore.INAPPROPRIATE,
        confidence: 0.9,
        flags: ['concerning_content'],
        educationalValue: 0.0,
        appropriatenessReason: 'Inappropriate content detected',
      };

      const originalAnalyzeContent = AdvancedFilteringEngine.analyzeContent;
      AdvancedFilteringEngine.analyzeContent = vi
        .fn()
        .mockResolvedValue(mockAnalysis);

      const originalApplyTopicRules = AdvancedFilteringEngine.applyTopicRules;
      AdvancedFilteringEngine.applyTopicRules = vi.fn().mockResolvedValue({
        action: TopicAction.BLOCK,
      });

      const originalCreateContentAlert =
        AdvancedFilteringEngine.createContentAlert;
      AdvancedFilteringEngine.createContentAlert = vi.fn().mockResolvedValue({
        id: 'alert123',
        severity: AlertSeverity.CRITICAL,
      });

      const result = await RealTimeContentMonitor.monitorMessage(
        'parent123',
        'child123',
        'conv123',
        'msg123',
        'inappropriate content',
        {
          enableRealTimeAlerts: true,
          parentNotificationThreshold: 3,
          bypassForEmergency: false,
          logAllAnalysis: true,
        }
      );

      expect(result.allowed).toBe(false);
      expect(result.action).toBe(TopicAction.BLOCK);
      expect(result.alertCreated).toBe(true);
      expect(result.warnings).toContain('Content blocked by topic rule');

      // Restore original methods
      AdvancedFilteringEngine.analyzeContent = originalAnalyzeContent;
      AdvancedFilteringEngine.applyTopicRules = originalApplyTopicRules;
      AdvancedFilteringEngine.createContentAlert = originalCreateContentAlert;
    });

    it('should handle monitoring errors gracefully', async () => {
      // Mock the private getChildAge method to throw an error
      const originalGetChildAge = (RealTimeContentMonitor as any).getChildAge;
      (RealTimeContentMonitor as any).getChildAge = vi
        .fn()
        .mockRejectedValue(new Error('Database error'));

      const result = await RealTimeContentMonitor.monitorMessage(
        'parent123',
        'child123',
        'conv123',
        'msg123',
        'test message',
        {
          enableRealTimeAlerts: true,
          parentNotificationThreshold: 2,
          bypassForEmergency: false,
          logAllAnalysis: true,
        }
      );

      expect(result.allowed).toBe(true); // Fail-safe
      expect(result.action).toBe(TopicAction.MONITOR);
      expect(result.score).toBe(2); // Concerning due to error
      expect(result.warnings).toContain(
        'Content analysis failed - manual review recommended'
      );

      // Restore original method
      (RealTimeContentMonitor as any).getChildAge = originalGetChildAge;
    });
  });

  describe('getMonitoringStats', () => {
    it('should return monitoring statistics', async () => {
      const mockAlerts = [
        {
          id: 'alert1',
          parentClerkUserId: 'parent123',
          category: ContentCategory.ENTERTAINMENT,
          timestamp: new Date(),
        },
      ];

      const mockScores = [
        {
          id: 'score1',
          childAccountId: 'child123',
          category: ContentCategory.ENTERTAINMENT,
          score: 3,
          analyzedAt: new Date(),
        },
        {
          id: 'score2',
          childAccountId: 'child123',
          category: ContentCategory.EDUCATIONAL,
          score: 5,
          analyzedAt: new Date(),
        },
      ];

      (prisma.contentAlert.findMany as any).mockResolvedValue(mockAlerts);
      (prisma.contentScore.findMany as any).mockResolvedValue(mockScores);

      const stats = await RealTimeContentMonitor.getMonitoringStats(
        'parent123',
        'child123',
        7
      );

      expect(stats.totalMessages).toBe(2);
      expect(stats.analyzedMessages).toBe(2);
      expect(stats.alertsCreated).toBe(1);
      expect(stats.averageScore).toBe(4);
      expect(stats.topCategories).toHaveLength(2);
      expect(stats.trendsOverTime).toHaveLength(7);
    });
  });

  describe('acknowledgeAlerts', () => {
    it('should acknowledge alerts successfully', async () => {
      (prisma.contentAlert.updateMany as any).mockResolvedValue({ count: 2 });

      const acknowledgedCount = await RealTimeContentMonitor.acknowledgeAlerts(
        'parent123',
        ['alert1', 'alert2']
      );

      expect(acknowledgedCount).toBe(2);
      expect(prisma.contentAlert.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['alert1', 'alert2'] },
          parentClerkUserId: 'parent123',
          acknowledged: false,
        },
        data: {
          acknowledged: true,
          acknowledgedAt: expect.any(Date),
        },
      });
    });
  });
});

describe('Integration Tests', () => {
  it('should handle complete content control workflow', async () => {
    // Mock complete workflow: analyze -> apply rules -> monitor -> alert
    const content = 'I want to talk about inappropriate things';
    const childAge = 8;

    // Mock all the database calls
    (prisma.childAccount.findUnique as any).mockResolvedValue({
      dateOfBirth: new Date(Date.now() - childAge * 365 * 24 * 60 * 60 * 1000),
    });

    (prisma.conversation.findUnique as any).mockResolvedValue({
      topics: [],
      mood: 'neutral',
    });

    (prisma.topicRule.findMany as any).mockResolvedValue([
      {
        id: 'rule1',
        topic: 'things', // Match the word "things" in the content
        action: TopicAction.BLOCK,
        category: ContentCategory.SOCIAL,
      },
    ]);

    (prisma.contentAlert.create as any).mockResolvedValue({
      id: 'alert123',
      severity: AlertSeverity.CRITICAL,
    });

    // Test the complete workflow
    const analysis = await AdvancedFilteringEngine.analyzeContent(
      content,
      childAge
    );
    expect(analysis.category).toBe(ContentCategory.SOCIAL); // Content contains "talk" so categorized as social

    const ruleResult = await AdvancedFilteringEngine.applyTopicRules(
      'parent123',
      'child123',
      analysis
    );
    expect(ruleResult.action).toBe(TopicAction.MONITOR); // Default behavior for concerning content

    const monitorResult = await RealTimeContentMonitor.monitorMessage(
      'parent123',
      'child123',
      'conv123',
      'msg123',
      content,
      {
        enableRealTimeAlerts: true,
        parentNotificationThreshold: 1,
        bypassForEmergency: false,
        logAllAnalysis: true,
      }
    );

    expect(monitorResult.allowed).toBe(true); // Monitor allows but logs
    expect(monitorResult.alertCreated).toBe(true); // Alert created due to concerning content flags
  });
});

describe('Content Control API Integration', () => {
  it('should handle topic rules CRUD operations', async () => {
    // Mock successful rule creation
    (prisma.topicRule.create as any).mockResolvedValue({
      id: 'rule123',
      topic: 'homework',
      action: TopicAction.ALLOW,
    });

    const rule = await TopicManagementService.createTopicRule({
      parentClerkUserId: 'parent123',
      topic: 'homework',
      action: TopicAction.ALLOW,
      reason: 'Educational content',
    });

    expect(rule.topic).toBe('homework');
    expect(rule.action).toBe(TopicAction.ALLOW);
  });

  it('should handle bulk rule creation from suggestions', async () => {
    (prisma.topicRule.create as any)
      .mockResolvedValueOnce({ id: 'rule1', topic: 'minecraft' })
      .mockResolvedValueOnce({ id: 'rule2', topic: 'homework' });

    const rules = await TopicManagementService.createBulkTopicRules(
      'parent123',
      'child123',
      [
        {
          topic: 'minecraft',
          action: TopicAction.ALLOW,
          reason: 'Creative game',
        },
        { topic: 'homework', action: TopicAction.ALLOW, reason: 'Educational' },
      ]
    );

    expect(rules).toHaveLength(2);
    expect(rules[0].topic).toBe('minecraft');
    expect(rules[1].topic).toBe('homework');
  });
});
