import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FamilyAnalyticsEngine, AnalyticsTimeframe } from '@/lib/multi-child/family-analytics';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    childAccount: {
      findMany: vi.fn(),
    },
    dailyUsage: {
      findMany: vi.fn(),
    },
    safetyEvent: {
      findMany: vi.fn(),
    },
    knowledgeUsage: {
      findMany: vi.fn(),
    },
    conversation: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/multi-child/sibling-interaction', () => ({
  SiblingInteractionManager: {
    getFamilyInteractionInsights: vi.fn(),
  },
}));

const { prisma } = await import('@/lib/prisma');
const { SiblingInteractionManager } = await import('@/lib/multi-child/sibling-interaction');

describe('FamilyAnalyticsEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateFamilyAnalytics', () => {
    const mockChildren = [
      {
        id: 'child1',
        name: 'Alice',
        age: 8,
        visibilityLevel: 'full',
        accountStatus: 'active',
      },
      {
        id: 'child2',
        name: 'Bob',
        age: 10,
        visibilityLevel: 'summaries_only',
        accountStatus: 'active',
      },
    ];

    const mockDailyUsage = [
      {
        childAccountId: 'child1',
        date: new Date(),
        totalMinutes: 30,
        sessionCount: 2,
        longestSessionMinutes: 20,
        messagesSent: 15,
        topicsDiscussed: ['gaming', 'school'],
        moodSummary: 'happy',
        safetyEvents: 0,
        escalationEvents: 0,
        engagementScore: 0.8,
        learningOpportunities: 3,
      },
      {
        childAccountId: 'child2',
        date: new Date(),
        totalMinutes: 45,
        sessionCount: 3,
        longestSessionMinutes: 25,
        messagesSent: 20,
        topicsDiscussed: ['sports', 'homework'],
        moodSummary: 'content',
        safetyEvents: 1,
        escalationEvents: 0,
        engagementScore: 0.9,
        learningOpportunities: 5,
      },
    ];

    const mockSafetyEvents = [
      {
        childAccountId: 'child1',
        severityLevel: 1,
        status: 'resolved',
        detectedAt: new Date(),
      },
      {
        childAccountId: 'child2',
        severityLevel: 2,
        status: 'active',
        detectedAt: new Date(),
      },
    ];

    const mockKnowledgeUsage = [
      {
        childAccountId: 'child1',
        queryTerm: 'minecraft commands',
        confidence: 0.8,
        knowledgeEntry: {
          category: 'gaming',
          subcategory: 'minecraft',
        },
      },
      {
        childAccountId: 'child1',
        queryTerm: 'math homework',
        confidence: 0.9,
        knowledgeEntry: {
          category: 'education',
          subcategory: 'math',
        },
      },
    ];

    const mockConversations = [
      {
        childAccountId: 'child1',
        mood: 'happy',
        moodConfidence: 0.8,
        emotionalTrend: 'positive',
      },
      {
        childAccountId: 'child2',
        mood: 'excited',
        moodConfidence: 0.9,
        emotionalTrend: 'positive',
      },
    ];

    beforeEach(() => {
      (prisma.childAccount.findMany as any).mockResolvedValue(mockChildren);
      (prisma.dailyUsage.findMany as any).mockResolvedValue(mockDailyUsage);
      (prisma.safetyEvent.findMany as any).mockResolvedValue(mockSafetyEvents);
      (prisma.knowledgeUsage.findMany as any).mockResolvedValue(mockKnowledgeUsage);
      (prisma.conversation.findMany as any).mockResolvedValue(mockConversations);

      (SiblingInteractionManager.getFamilyInteractionInsights as any).mockResolvedValue({
        totalInteractions: 5,
        interactionTypes: {
          'shared_topic_discussion': 2,
          'family_activity_mention': 1,
          'sibling_mention': 2,
        },
        familyBenefitScore: 0.7,
        privacyRiskScore: 0.3,
        recommendations: ['Test recommendation'],
        siblingPairs: [],
      });
    });

    it('should generate comprehensive family analytics', async () => {
      const analytics = await FamilyAnalyticsEngine.generateFamilyAnalytics({
        parentClerkUserId: 'parent1',
        timeframe: 'weekly',
        respectPrivacy: true,
      });

      expect(analytics.familyId).toBe('parent1');
      expect(analytics.timeframe).toBe('weekly');
      expect(analytics.familyMetrics.totalChildren).toBe(2);
      expect(analytics.familyMetrics.activeChildren).toBe(2);
      expect(analytics.childSummaries).toHaveLength(2);
      expect(analytics.familyInsights).toBeDefined();
      expect(analytics.privacyCompliance).toBeDefined();
    });

    it('should respect child privacy levels', async () => {
      const analytics = await FamilyAnalyticsEngine.generateFamilyAnalytics({
        parentClerkUserId: 'parent1',
        timeframe: 'weekly',
        respectPrivacy: true,
      });

      const aliceData = analytics.childSummaries.find(child => child.childName === 'Alice');
      const bobData = analytics.childSummaries.find(child => child.childName === 'Bob');

      expect(aliceData?.privacyLevel).toBe('full');
      expect(bobData?.privacyLevel).toBe('summaries_only');
    });

    it('should calculate engagement metrics correctly', async () => {
      const analytics = await FamilyAnalyticsEngine.generateFamilyAnalytics({
        parentClerkUserId: 'parent1',
        timeframe: 'weekly',
        metricTypes: ['engagement'],
      });

      const aliceData = analytics.childSummaries.find(child => child.childName === 'Alice');
      expect(aliceData?.metrics.engagement.totalSessions).toBeGreaterThanOrEqual(2);
      expect(aliceData?.metrics.engagement.totalMinutes).toBeGreaterThanOrEqual(30);
      expect(aliceData?.metrics.engagement.messagesSent).toBeGreaterThanOrEqual(15);
      expect(aliceData?.metrics.engagement.topicsExplored).toBeGreaterThanOrEqual(2);
    });

    it('should calculate safety metrics correctly', async () => {
      const analytics = await FamilyAnalyticsEngine.generateFamilyAnalytics({
        parentClerkUserId: 'parent1',
        timeframe: 'weekly',
        metricTypes: ['safety'],
      });

      const childData = analytics.childSummaries.find(child => child.childName === 'Alice');
      expect(childData?.metrics.safety.totalEvents).toBeGreaterThanOrEqual(0);
      expect(childData?.metrics.safety.safetyTrend).toMatch(/improving|stable|concerning/);
    });

    it('should calculate learning metrics correctly', async () => {
      const analytics = await FamilyAnalyticsEngine.generateFamilyAnalytics({
        parentClerkUserId: 'parent1',
        timeframe: 'weekly',
        metricTypes: ['learning'],
      });

      const aliceData = analytics.childSummaries.find(child => child.childName === 'Alice');
      expect(aliceData?.metrics.learning.knowledgeQueriesCount).toBe(2);
      expect(aliceData?.metrics.learning.newTopicsExplored).toBe(2);
      expect(aliceData?.metrics.learning.curiosityScore).toBeGreaterThan(0);
      expect(aliceData?.metrics.learning.learningMomentum).toMatch(/high|medium|low/);
    });

    it('should calculate emotional wellbeing metrics correctly', async () => {
      const analytics = await FamilyAnalyticsEngine.generateFamilyAnalytics({
        parentClerkUserId: 'parent1',
        timeframe: 'weekly',
        metricTypes: ['emotional_wellbeing'],
      });

      const childData = analytics.childSummaries.find(child => child.childName === 'Alice');
      expect(childData?.metrics.emotionalWellbeing.dominantMood).toBeDefined();
      expect(childData?.metrics.emotionalWellbeing.moodVariability).toBeGreaterThanOrEqual(0);
      expect(childData?.metrics.emotionalWellbeing.moodVariability).toBeLessThanOrEqual(1);
    });

    it('should calculate screen time metrics correctly', async () => {
      const analytics = await FamilyAnalyticsEngine.generateFamilyAnalytics({
        parentClerkUserId: 'parent1',
        timeframe: 'weekly',
        metricTypes: ['screen_time'],
      });

      const aliceData = analytics.childSummaries.find(child => child.childName === 'Alice');
      expect(aliceData?.metrics.screenTime.totalMinutes).toBeGreaterThanOrEqual(30);
      expect(aliceData?.metrics.screenTime.withinLimits).toBeDefined();
      expect(aliceData?.metrics.screenTime.timeManagementScore).toBeGreaterThanOrEqual(0);
      expect(aliceData?.metrics.screenTime.timeManagementScore).toBeLessThanOrEqual(1);
    });

    it('should filter children when includeChildren is specified', async () => {
      const analytics = await FamilyAnalyticsEngine.generateFamilyAnalytics({
        parentClerkUserId: 'parent1',
        timeframe: 'weekly',
        includeChildren: ['child1'],
      });

      expect(analytics.childSummaries).toHaveLength(1);
      expect(analytics.childSummaries[0].childName).toBe('Alice');
    });

    it('should calculate family-wide metrics from child summaries', async () => {
      const analytics = await FamilyAnalyticsEngine.generateFamilyAnalytics({
        parentClerkUserId: 'parent1',
        timeframe: 'weekly',
      });

      expect(analytics.familyMetrics.familyEngagementScore).toBeGreaterThanOrEqual(0);
      expect(analytics.familyMetrics.familyEngagementScore).toBeLessThanOrEqual(1);
      expect(analytics.familyMetrics.familySafetyScore).toBeGreaterThanOrEqual(0);
      expect(analytics.familyMetrics.familySafetyScore).toBeLessThanOrEqual(1);
      expect(analytics.familyMetrics.familyLearningScore).toBeGreaterThanOrEqual(0);
      expect(analytics.familyMetrics.familyLearningScore).toBeLessThanOrEqual(1);
    });

    it('should generate family insights and recommendations', async () => {
      const analytics = await FamilyAnalyticsEngine.generateFamilyAnalytics({
        parentClerkUserId: 'parent1',
        timeframe: 'weekly',
      });

      expect(analytics.familyInsights.topSharedInterests).toBeInstanceOf(Array);
      expect(analytics.familyInsights.familyStrengths).toBeInstanceOf(Array);
      expect(analytics.familyInsights.areasForImprovement).toBeInstanceOf(Array);
      expect(analytics.familyInsights.recommendedActivities).toBeInstanceOf(Array);
      expect(analytics.familyInsights.parentActionItems).toBeInstanceOf(Array);
    });

    it('should track privacy compliance', async () => {
      const analytics = await FamilyAnalyticsEngine.generateFamilyAnalytics({
        parentClerkUserId: 'parent1',
        timeframe: 'weekly',
        respectPrivacy: true,
      });

      expect(analytics.privacyCompliance.complianceScore).toBeGreaterThanOrEqual(0);
      expect(analytics.privacyCompliance.complianceScore).toBeLessThanOrEqual(1);
      expect(analytics.privacyCompliance.dataCategories).toBeInstanceOf(Array);
    });
  });

  describe('exportFamilyAnalytics', () => {
    beforeEach(() => {
      // Mock children for export
      (prisma.childAccount.findMany as any).mockResolvedValue([
        {
          id: 'child1',
          name: 'Alice',
          age: 8,
          visibilityLevel: 'full',
          accountStatus: 'active',
        },
      ]);

      (prisma.dailyUsage.findMany as any).mockResolvedValue([]);
      (prisma.safetyEvent.findMany as any).mockResolvedValue([]);
      (prisma.knowledgeUsage.findMany as any).mockResolvedValue([]);
      (prisma.conversation.findMany as any).mockResolvedValue([]);

      (SiblingInteractionManager.getFamilyInteractionInsights as any).mockResolvedValue({
        totalInteractions: 0,
        interactionTypes: {},
        familyBenefitScore: 0.5,
        privacyRiskScore: 0.2,
        recommendations: [],
        siblingPairs: [],
      });
    });

    it('should export analytics in JSON format', async () => {
      const exportResult = await FamilyAnalyticsEngine.exportFamilyAnalytics(
        'parent1',
        'json',
        { timeframe: 'weekly' }
      );

      expect(exportResult.format).toBe('json');
      expect(exportResult.data).toBeDefined();
      expect(exportResult.compliance.childrenCount).toBe(1);
      expect(exportResult.compliance.personalDataIncluded).toBe(false);
    });

    it('should export analytics in CSV format', async () => {
      const exportResult = await FamilyAnalyticsEngine.exportFamilyAnalytics(
        'parent1',
        'csv',
        { timeframe: 'weekly' }
      );

      expect(exportResult.format).toBe('csv');
      expect(typeof exportResult.data).toBe('string');
      expect(exportResult.data).toContain('Child Name');
    });

    it('should export analytics in PDF format', async () => {
      const exportResult = await FamilyAnalyticsEngine.exportFamilyAnalytics(
        'parent1',
        'pdf',
        { timeframe: 'weekly' }
      );

      expect(exportResult.format).toBe('pdf');
      expect(exportResult.data).toHaveProperty('title');
      expect(exportResult.data).toHaveProperty('dateRange');
      expect(exportResult.data).toHaveProperty('familyOverview');
    });

    it('should include personal data when requested', async () => {
      const exportResult = await FamilyAnalyticsEngine.exportFamilyAnalytics(
        'parent1',
        'json',
        { 
          timeframe: 'weekly',
          includePersonalData: true,
        }
      );

      expect(exportResult.compliance.personalDataIncluded).toBe(true);
    });

    it('should filter children when requested', async () => {
      const exportResult = await FamilyAnalyticsEngine.exportFamilyAnalytics(
        'parent1',
        'json',
        { 
          timeframe: 'weekly',
          childrenFilter: ['child1'],
        }
      );

      expect(exportResult.compliance.childrenCount).toBe(1);
    });
  });

  describe('date range calculation', () => {
    it('should calculate correct date range for different timeframes', async () => {
      const weeklyQuery = {
        parentClerkUserId: 'parent1',
        timeframe: 'weekly' as AnalyticsTimeframe,
      };

      const monthlyQuery = {
        parentClerkUserId: 'parent1',
        timeframe: 'monthly' as AnalyticsTimeframe,
      };

      // Mock minimal data to test date ranges
      (prisma.childAccount.findMany as any).mockResolvedValue([]);
      (SiblingInteractionManager.getFamilyInteractionInsights as any).mockResolvedValue({
        totalInteractions: 0,
        interactionTypes: {},
        familyBenefitScore: 0.5,
        privacyRiskScore: 0.2,
        recommendations: [],
        siblingPairs: [],
      });

      const weeklyAnalytics = await FamilyAnalyticsEngine.generateFamilyAnalytics(weeklyQuery);
      const monthlyAnalytics = await FamilyAnalyticsEngine.generateFamilyAnalytics(monthlyQuery);

      const weeklyDuration = weeklyAnalytics.dateRange.end.getTime() - weeklyAnalytics.dateRange.start.getTime();
      const monthlyDuration = monthlyAnalytics.dateRange.end.getTime() - monthlyAnalytics.dateRange.start.getTime();

      expect(weeklyDuration).toBeCloseTo(7 * 24 * 60 * 60 * 1000, -1); // 7 days
      expect(monthlyDuration).toBeCloseTo(30 * 24 * 60 * 60 * 1000, -1); // 30 days
    });

    it('should use custom date range when provided', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const query = {
        parentClerkUserId: 'parent1',
        timeframe: 'weekly' as AnalyticsTimeframe,
        startDate,
        endDate,
      };

      (prisma.childAccount.findMany as any).mockResolvedValue([]);
      (SiblingInteractionManager.getFamilyInteractionInsights as any).mockResolvedValue({
        totalInteractions: 0,
        interactionTypes: {},
        familyBenefitScore: 0.5,
        privacyRiskScore: 0.2,
        recommendations: [],
        siblingPairs: [],
      });

      const analytics = await FamilyAnalyticsEngine.generateFamilyAnalytics(query);

      expect(analytics.dateRange.start).toEqual(startDate);
      expect(analytics.dateRange.end).toEqual(endDate);
    });
  });
});