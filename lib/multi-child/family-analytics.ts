/**
 * Family-Wide Analytics with Individual Child Privacy
 * Aggregates family insights while respecting individual child privacy boundaries
 */

import { prisma } from '@/lib/prisma';
import { PrivacyIsolationService, DataCategory } from './privacy-isolation';
import { SiblingInteractionManager } from './sibling-interaction';

export type AnalyticsTimeframe = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type FamilyMetricType = 
  | 'engagement' 
  | 'safety' 
  | 'learning' 
  | 'emotional_wellbeing' 
  | 'screen_time' 
  | 'family_interaction';

interface FamilyAnalyticsQuery {
  parentClerkUserId: string;
  timeframe: AnalyticsTimeframe;
  startDate?: Date;
  endDate?: Date;
  includeChildren?: string[]; // Specific children to include
  metricTypes?: FamilyMetricType[];
  respectPrivacy?: boolean;
}

interface ChildAnalyticsSummary {
  childId: string;
  childName: string;
  age: number;
  privacyLevel: 'full' | 'summaries_only' | 'safety_only';
  metrics: {
    engagement: {
      totalSessions: number;
      totalMinutes: number;
      averageSessionLength: number;
      messagesSent: number;
      topicsExplored: number;
      engagementTrend: 'increasing' | 'stable' | 'decreasing';
    };
    safety: {
      totalEvents: number;
      criticalEvents: number;
      resolvedEvents: number;
      safetyTrend: 'improving' | 'stable' | 'concerning';
    };
    learning: {
      knowledgeQueriesCount: number;
      newTopicsExplored: number;
      curiosityScore: number; // 0-1
      learningMomentum: 'high' | 'medium' | 'low';
    };
    emotionalWellbeing: {
      dominantMood: string;
      moodVariability: number; // 0-1, higher = more mood swings
      positiveInteractions: number;
      concerningPatterns: number;
    };
    screenTime: {
      totalMinutes: number;
      dailyAverage: number;
      withinLimits: boolean;
      timeManagementScore: number; // 0-1
    };
  };
  insights: string[];
  recommendations: string[];
}

interface FamilyAnalyticsSummary {
  familyId: string;
  timeframe: AnalyticsTimeframe;
  dateRange: {
    start: Date;
    end: Date;
  };
  familyMetrics: {
    totalChildren: number;
    activeChildren: number;
    familyEngagementScore: number; // 0-1
    familySafetyScore: number; // 0-1
    familyLearningScore: number; // 0-1
    familyWellbeingScore: number; // 0-1
    familyScreenTimeBalance: number; // 0-1
    siblingInteractionHealth: number; // 0-1
  };
  childSummaries: ChildAnalyticsSummary[];
  familyInsights: {
    topSharedInterests: string[];
    familyStrengths: string[];
    areasForImprovement: string[];
    recommendedActivities: string[];
    parentActionItems: string[];
  };
  privacyCompliance: {
    childrenWithRestrictedData: string[];
    dataCategories: DataCategory[];
    complianceScore: number; // 0-1
  };
}

/**
 * Family Analytics Engine
 * Core service for generating privacy-compliant family insights
 */
export class FamilyAnalyticsEngine {
  /**
   * Generate comprehensive family analytics
   */
  static async generateFamilyAnalytics(
    query: FamilyAnalyticsQuery
  ): Promise<FamilyAnalyticsSummary> {
    try {
      const {
        parentClerkUserId,
        timeframe,
        startDate,
        endDate,
        includeChildren,
        metricTypes = ['engagement', 'safety', 'learning', 'emotional_wellbeing', 'screen_time', 'family_interaction'],
        respectPrivacy = true,
      } = query;

      // Calculate date range
      const dateRange = this.calculateDateRange(timeframe, startDate, endDate);

      // Get family children
      const allChildren = await prisma.childAccount.findMany({
        where: { parentClerkUserId },
        select: {
          id: true,
          name: true,
          age: true,
          visibilityLevel: true,
          accountStatus: true,
        },
      });

      // Filter to requested children
      const targetChildren = includeChildren 
        ? allChildren.filter(child => includeChildren.includes(child.id))
        : allChildren.filter(child => child.accountStatus === 'active');

      // Generate analytics for each child
      const childSummaries: ChildAnalyticsSummary[] = [];
      let familyPrivacyCompliance = {
        childrenWithRestrictedData: [] as string[],
        dataCategories: ['conversations', 'safety_events', 'usage_analytics', 'memories'] as DataCategory[],
        complianceScore: 1.0,
      };

      for (const child of targetChildren) {
        try {
          const childSummary = await this.generateChildAnalytics(
            child,
            parentClerkUserId,
            dateRange,
            metricTypes,
            respectPrivacy
          );

          childSummaries.push(childSummary);

          // Track privacy compliance
          if (childSummary.privacyLevel !== 'full') {
            familyPrivacyCompliance.childrenWithRestrictedData.push(child.id);
            familyPrivacyCompliance.complianceScore *= 0.9; // Slight reduction for each restricted child
          }
        } catch (error) {
          console.error(`Error generating analytics for child ${child.id}:`, error);
          // Continue with other children
        }
      }

      // Calculate family-wide metrics
      const familyMetrics = this.calculateFamilyMetrics(childSummaries);

      // Generate family insights
      const familyInsights = await this.generateFamilyInsights(
        parentClerkUserId,
        childSummaries,
        dateRange
      );

      return {
        familyId: parentClerkUserId,
        timeframe,
        dateRange,
        familyMetrics,
        childSummaries,
        familyInsights,
        privacyCompliance: familyPrivacyCompliance,
      };
    } catch (error) {
      console.error('Error generating family analytics:', error);
      throw error;
    }
  }

  /**
   * Generate analytics for an individual child
   */
  private static async generateChildAnalytics(
    child: { id: string; name: string; age: number; visibilityLevel: string },
    parentClerkUserId: string,
    dateRange: { start: Date; end: Date },
    metricTypes: FamilyMetricType[],
    respectPrivacy: boolean
  ): Promise<ChildAnalyticsSummary> {
    const privacyLevel = child.visibilityLevel as 'full' | 'summaries_only' | 'safety_only';

    // Initialize child summary
    const childSummary: ChildAnalyticsSummary = {
      childId: child.id,
      childName: child.name,
      age: child.age,
      privacyLevel,
      metrics: {
        engagement: {
          totalSessions: 0,
          totalMinutes: 0,
          averageSessionLength: 0,
          messagesSent: 0,
          topicsExplored: 0,
          engagementTrend: 'stable',
        },
        safety: {
          totalEvents: 0,
          criticalEvents: 0,
          resolvedEvents: 0,
          safetyTrend: 'stable',
        },
        learning: {
          knowledgeQueriesCount: 0,
          newTopicsExplored: 0,
          curiosityScore: 0.5,
          learningMomentum: 'medium',
        },
        emotionalWellbeing: {
          dominantMood: 'neutral',
          moodVariability: 0.3,
          positiveInteractions: 0,
          concerningPatterns: 0,
        },
        screenTime: {
          totalMinutes: 0,
          dailyAverage: 0,
          withinLimits: true,
          timeManagementScore: 0.8,
        },
      },
      insights: [],
      recommendations: [],
    };

    // Generate metrics based on privacy level and requested types
    for (const metricType of metricTypes) {
      try {
        await this.calculateMetricForChild(
          child.id,
          metricType,
          dateRange,
          parentClerkUserId,
          respectPrivacy,
          privacyLevel,
          childSummary
        );
      } catch (error) {
        console.error(`Error calculating ${metricType} for child ${child.id}:`, error);
      }
    }

    // Generate insights and recommendations
    childSummary.insights = this.generateChildInsights(childSummary);
    childSummary.recommendations = this.generateChildRecommendations(childSummary);

    return childSummary;
  }

  /**
   * Calculate a specific metric for a child
   */
  private static async calculateMetricForChild(
    childId: string,
    metricType: FamilyMetricType,
    dateRange: { start: Date; end: Date },
    parentClerkUserId: string,
    respectPrivacy: boolean,
    privacyLevel: 'full' | 'summaries_only' | 'safety_only',
    childSummary: ChildAnalyticsSummary
  ): Promise<void> {
    // Check data access permissions
    if (respectPrivacy && privacyLevel === 'safety_only' && metricType !== 'safety') {
      return; // Skip non-safety metrics for privacy-restricted children
    }

    switch (metricType) {
      case 'engagement':
        await this.calculateEngagementMetrics(childId, dateRange, childSummary);
        break;
      case 'safety':
        await this.calculateSafetyMetrics(childId, dateRange, childSummary);
        break;
      case 'learning':
        await this.calculateLearningMetrics(childId, dateRange, childSummary);
        break;
      case 'emotional_wellbeing':
        await this.calculateEmotionalWellbeingMetrics(childId, dateRange, childSummary);
        break;
      case 'screen_time':
        await this.calculateScreenTimeMetrics(childId, dateRange, childSummary);
        break;
      case 'family_interaction':
        // Family interaction metrics are calculated at family level
        break;
    }
  }

  /**
   * Calculate engagement metrics for a child
   */
  private static async calculateEngagementMetrics(
    childId: string,
    dateRange: { start: Date; end: Date },
    childSummary: ChildAnalyticsSummary
  ): Promise<void> {
    try {
      // Get daily usage data
      const dailyUsage = await prisma.dailyUsage.findMany({
        where: {
          childAccountId: childId,
          date: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
      });

      // Get conversation data
      const conversations = await prisma.conversation.findMany({
        where: {
          childAccountId: childId,
          startedAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
        select: {
          messageCount: true,
          durationSeconds: true,
          topics: true,
        },
      });

      // Calculate metrics
      const totalSessions = dailyUsage.reduce((sum, day) => sum + day.sessionCount, 0);
      const totalMinutes = dailyUsage.reduce((sum, day) => sum + day.totalMinutes, 0);
      const messagesSent = dailyUsage.reduce((sum, day) => sum + day.messagesSent, 0);
      
      const allTopics = conversations.flatMap(conv => conv.topics || []);
      const uniqueTopics = [...new Set(allTopics)];

      // Calculate trends (simplified - would be more sophisticated in production)
      const firstHalf = dailyUsage.slice(0, Math.floor(dailyUsage.length / 2));
      const secondHalf = dailyUsage.slice(Math.floor(dailyUsage.length / 2));
      
      const firstHalfAvg = firstHalf.length > 0 ? 
        firstHalf.reduce((sum, day) => sum + day.totalMinutes, 0) / firstHalf.length : 0;
      const secondHalfAvg = secondHalf.length > 0 ? 
        secondHalf.reduce((sum, day) => sum + day.totalMinutes, 0) / secondHalf.length : 0;

      let engagementTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
      if (secondHalfAvg > firstHalfAvg * 1.2) engagementTrend = 'increasing';
      else if (secondHalfAvg < firstHalfAvg * 0.8) engagementTrend = 'decreasing';

      childSummary.metrics.engagement = {
        totalSessions,
        totalMinutes,
        averageSessionLength: totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0,
        messagesSent,
        topicsExplored: uniqueTopics.length,
        engagementTrend,
      };
    } catch (error) {
      console.error('Error calculating engagement metrics:', error);
    }
  }

  /**
   * Calculate safety metrics for a child
   */
  private static async calculateSafetyMetrics(
    childId: string,
    dateRange: { start: Date; end: Date },
    childSummary: ChildAnalyticsSummary
  ): Promise<void> {
    try {
      const safetyEvents = await prisma.safetyEvent.findMany({
        where: {
          childAccountId: childId,
          detectedAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
        select: {
          severityLevel: true,
          status: true,
          detectedAt: true,
        },
      });

      const totalEvents = safetyEvents.length;
      const criticalEvents = safetyEvents.filter(event => event.severityLevel >= 3).length;
      const resolvedEvents = safetyEvents.filter(event => event.status === 'resolved').length;

      // Calculate safety trend
      const recentEvents = safetyEvents.filter(
        event => event.detectedAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
      const olderEvents = safetyEvents.filter(
        event => event.detectedAt < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );

      let safetyTrend: 'improving' | 'stable' | 'concerning' = 'stable';
      if (recentEvents.length > olderEvents.length * 1.5) safetyTrend = 'concerning';
      else if (recentEvents.length < olderEvents.length * 0.5) safetyTrend = 'improving';

      childSummary.metrics.safety = {
        totalEvents,
        criticalEvents,
        resolvedEvents,
        safetyTrend,
      };
    } catch (error) {
      console.error('Error calculating safety metrics:', error);
    }
  }

  /**
   * Calculate learning metrics for a child
   */
  private static async calculateLearningMetrics(
    childId: string,
    dateRange: { start: Date; end: Date },
    childSummary: ChildAnalyticsSummary
  ): Promise<void> {
    try {
      const knowledgeUsage = await prisma.knowledgeUsage.findMany({
        where: {
          childAccountId: childId,
          usedAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
        select: {
          queryTerm: true,
          confidence: true,
          knowledgeEntry: {
            select: {
              category: true,
              subcategory: true,
            },
          },
        },
      });

      const knowledgeQueriesCount = knowledgeUsage.length;
      const uniqueCategories = [...new Set(knowledgeUsage.map(usage => 
        usage.knowledgeEntry.category
      ))];
      const newTopicsExplored = uniqueCategories.length;

      // Calculate curiosity score based on query diversity and confidence
      const avgConfidence = knowledgeUsage.length > 0 ? 
        knowledgeUsage.reduce((sum, usage) => sum + Number(usage.confidence), 0) / knowledgeUsage.length : 0;
      const diversityScore = Math.min(newTopicsExplored / 10, 1); // Max 10 different topics
      const curiosityScore = (avgConfidence * 0.4) + (diversityScore * 0.6);

      let learningMomentum: 'high' | 'medium' | 'low' = 'medium';
      if (knowledgeQueriesCount > 20 && curiosityScore > 0.7) learningMomentum = 'high';
      else if (knowledgeQueriesCount < 5 || curiosityScore < 0.3) learningMomentum = 'low';

      childSummary.metrics.learning = {
        knowledgeQueriesCount,
        newTopicsExplored,
        curiosityScore: Math.round(curiosityScore * 100) / 100,
        learningMomentum,
      };
    } catch (error) {
      console.error('Error calculating learning metrics:', error);
    }
  }

  /**
   * Calculate emotional wellbeing metrics for a child
   */
  private static async calculateEmotionalWellbeingMetrics(
    childId: string,
    dateRange: { start: Date; end: Date },
    childSummary: ChildAnalyticsSummary
  ): Promise<void> {
    try {
      const conversations = await prisma.conversation.findMany({
        where: {
          childAccountId: childId,
          startedAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
        select: {
          mood: true,
          moodConfidence: true,
          emotionalTrend: true,
        },
      });

      const moods = conversations.map(conv => conv.mood).filter(Boolean);
      const moodCounts = moods.reduce((counts: Record<string, number>, mood) => {
        counts[mood!] = (counts[mood!] || 0) + 1;
        return counts;
      }, {});

      const dominantMood = Object.entries(moodCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'neutral';

      // Calculate mood variability
      const uniqueMoods = Object.keys(moodCounts).length;
      const moodVariability = Math.min(uniqueMoods / 5, 1); // Max 5 different moods

      // Count positive vs concerning patterns
      const positiveMoods = ['happy', 'excited', 'curious', 'content'];
      const concerningMoods = ['sad', 'angry', 'frustrated', 'anxious'];

      const positiveInteractions = moods.filter(mood => 
        positiveMoods.includes(mood?.toLowerCase() || '')
      ).length;

      const concerningPatterns = moods.filter(mood => 
        concerningMoods.includes(mood?.toLowerCase() || '')
      ).length;

      childSummary.metrics.emotionalWellbeing = {
        dominantMood,
        moodVariability: Math.round(moodVariability * 100) / 100,
        positiveInteractions,
        concerningPatterns,
      };
    } catch (error) {
      console.error('Error calculating emotional wellbeing metrics:', error);
    }
  }

  /**
   * Calculate screen time metrics for a child
   */
  private static async calculateScreenTimeMetrics(
    childId: string,
    dateRange: { start: Date; end: Date },
    childSummary: ChildAnalyticsSummary
  ): Promise<void> {
    try {
      const dailyUsage = await prisma.dailyUsage.findMany({
        where: {
          childAccountId: childId,
          date: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        },
      });

      const totalMinutes = dailyUsage.reduce((sum, day) => sum + day.totalMinutes, 0);
      const daysWithUsage = dailyUsage.filter(day => day.totalMinutes > 0).length;
      const dailyAverage = daysWithUsage > 0 ? Math.round(totalMinutes / daysWithUsage) : 0;

      // Check against typical limits (this would be configurable in production)
      const ageLimits = {
        6: 30, 7: 35, 8: 40, 9: 45, 10: 50, 11: 55, 12: 60
      };
      const recommendedLimit = ageLimits[childSummary.age as keyof typeof ageLimits] || 60;
      const withinLimits = dailyAverage <= recommendedLimit;

      // Calculate time management score
      const consistencyScore = daysWithUsage / dailyUsage.length; // How consistently they use the platform
      const moderationScore = withinLimits ? 1 : Math.max(0, 1 - ((dailyAverage - recommendedLimit) / recommendedLimit));
      const timeManagementScore = (consistencyScore * 0.3) + (moderationScore * 0.7);

      childSummary.metrics.screenTime = {
        totalMinutes,
        dailyAverage,
        withinLimits,
        timeManagementScore: Math.round(timeManagementScore * 100) / 100,
      };
    } catch (error) {
      console.error('Error calculating screen time metrics:', error);
    }
  }

  /**
   * Calculate family-wide metrics from individual child summaries
   */
  private static calculateFamilyMetrics(childSummaries: ChildAnalyticsSummary[]) {
    const totalChildren = childSummaries.length;
    const activeChildren = childSummaries.filter(child => 
      child.metrics.engagement.totalSessions > 0
    ).length;

    // Calculate averages for family scores
    const engagementScores = childSummaries.map(child => 
      Math.min(child.metrics.engagement.totalMinutes / 420, 1) // Max 7 hours per week
    );
    const familyEngagementScore = engagementScores.length > 0 ? 
      engagementScores.reduce((sum, score) => sum + score, 0) / engagementScores.length : 0;

    const safetyScores = childSummaries.map(child => 
      Math.max(0, 1 - (child.metrics.safety.criticalEvents / 10)) // Penalize critical events
    );
    const familySafetyScore = safetyScores.length > 0 ? 
      safetyScores.reduce((sum, score) => sum + score, 0) / safetyScores.length : 1;

    const learningScores = childSummaries.map(child => child.metrics.learning.curiosityScore);
    const familyLearningScore = learningScores.length > 0 ? 
      learningScores.reduce((sum, score) => sum + score, 0) / learningScores.length : 0;

    const wellbeingScores = childSummaries.map(child => 
      Math.max(0, 1 - (child.metrics.emotionalWellbeing.concerningPatterns / 10))
    );
    const familyWellbeingScore = wellbeingScores.length > 0 ? 
      wellbeingScores.reduce((sum, score) => sum + score, 0) / wellbeingScores.length : 1;

    const screenTimeScores = childSummaries.map(child => child.metrics.screenTime.timeManagementScore);
    const familyScreenTimeBalance = screenTimeScores.length > 0 ? 
      screenTimeScores.reduce((sum, score) => sum + score, 0) / screenTimeScores.length : 0;

    // Sibling interaction health (simplified - would use actual interaction data in production)
    const siblingInteractionHealth = totalChildren > 1 ? 0.8 : 1.0; // Default good score

    return {
      totalChildren,
      activeChildren,
      familyEngagementScore: Math.round(familyEngagementScore * 100) / 100,
      familySafetyScore: Math.round(familySafetyScore * 100) / 100,
      familyLearningScore: Math.round(familyLearningScore * 100) / 100,
      familyWellbeingScore: Math.round(familyWellbeingScore * 100) / 100,
      familyScreenTimeBalance: Math.round(familyScreenTimeBalance * 100) / 100,
      siblingInteractionHealth: Math.round(siblingInteractionHealth * 100) / 100,
    };
  }

  /**
   * Generate family-level insights and recommendations
   */
  private static async generateFamilyInsights(
    parentClerkUserId: string,
    childSummaries: ChildAnalyticsSummary[],
    dateRange: { start: Date; end: Date }
  ) {
    try {
      // Get family interaction insights
      const interactionInsights = await SiblingInteractionManager.getFamilyInteractionInsights(
        parentClerkUserId,
        Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24))
      );

      // Analyze common patterns across children
      const allTopics = childSummaries.flatMap(child => child.insights);
      const topicCounts = allTopics.reduce((counts: Record<string, number>, topic) => {
        counts[topic] = (counts[topic] || 0) + 1;
        return counts;
      }, {});

      const topSharedInterests = Object.entries(topicCounts)
        .filter(([, count]) => count > 1)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([topic]) => topic);

      // Identify family strengths
      const familyStrengths: string[] = [];
      const avgSafetyScore = childSummaries.reduce((sum, child) => 
        sum + (child.metrics.safety.totalEvents === 0 ? 1 : 0.8), 0
      ) / childSummaries.length;

      if (avgSafetyScore > 0.9) familyStrengths.push('Excellent safety record across all children');
      
      const avgLearningScore = childSummaries.reduce((sum, child) => 
        sum + child.metrics.learning.curiosityScore, 0
      ) / childSummaries.length;

      if (avgLearningScore > 0.7) familyStrengths.push('High curiosity and learning engagement');

      // Identify areas for improvement
      const areasForImprovement: string[] = [];
      const screenTimeIssues = childSummaries.filter(child => 
        !child.metrics.screenTime.withinLimits
      );
      
      if (screenTimeIssues.length > 0) {
        areasForImprovement.push(`Screen time management for ${screenTimeIssues.length} child(ren)`);
      }

      // Generate recommendations
      const recommendedActivities: string[] = [];
      if (topSharedInterests.length > 0) {
        recommendedActivities.push(`Plan family activities around shared interests: ${topSharedInterests.slice(0, 2).join(', ')}`);
      }

      const parentActionItems: string[] = [];
      if (interactionInsights.totalInteractions < 5) {
        parentActionItems.push('Consider encouraging more family discussion time');
      }

      return {
        topSharedInterests,
        familyStrengths,
        areasForImprovement,
        recommendedActivities,
        parentActionItems,
      };
    } catch (error) {
      console.error('Error generating family insights:', error);
      return {
        topSharedInterests: [],
        familyStrengths: [],
        areasForImprovement: [],
        recommendedActivities: [],
        parentActionItems: [],
      };
    }
  }

  /**
   * Generate insights for an individual child
   */
  private static generateChildInsights(childSummary: ChildAnalyticsSummary): string[] {
    const insights: string[] = [];

    // Engagement insights
    if (childSummary.metrics.engagement.engagementTrend === 'increasing') {
      insights.push('Showing increased engagement with conversations');
    }
    if (childSummary.metrics.engagement.topicsExplored > 10) {
      insights.push('Demonstrates strong curiosity across diverse topics');
    }

    // Learning insights
    if (childSummary.metrics.learning.learningMomentum === 'high') {
      insights.push('Actively exploring new knowledge and concepts');
    }

    // Emotional insights
    if (childSummary.metrics.emotionalWellbeing.positiveInteractions > childSummary.metrics.emotionalWellbeing.concerningPatterns * 3) {
      insights.push('Maintains positive emotional engagement');
    }

    return insights;
  }

  /**
   * Generate recommendations for an individual child
   */
  private static generateChildRecommendations(childSummary: ChildAnalyticsSummary): string[] {
    const recommendations: string[] = [];

    // Screen time recommendations
    if (!childSummary.metrics.screenTime.withinLimits) {
      recommendations.push('Consider setting daily time limits to promote healthy screen time habits');
    }

    // Safety recommendations
    if (childSummary.metrics.safety.criticalEvents > 0) {
      recommendations.push('Review conversation topics and consider additional safety discussions');
    }

    // Learning recommendations
    if (childSummary.metrics.learning.learningMomentum === 'low') {
      recommendations.push('Encourage exploration of new topics to boost curiosity');
    }

    return recommendations;
  }

  /**
   * Calculate date range for analytics
   */
  private static calculateDateRange(
    timeframe: AnalyticsTimeframe,
    startDate?: Date,
    endDate?: Date
  ): { start: Date; end: Date } {
    const end = endDate || new Date();
    let start: Date;

    if (startDate) {
      start = startDate;
    } else {
      switch (timeframe) {
        case 'daily':
          start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'weekly':
          start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'yearly':
          start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
    }

    return { start, end };
  }

  /**
   * Export family analytics with privacy compliance
   */
  static async exportFamilyAnalytics(
    parentClerkUserId: string,
    format: 'json' | 'csv' | 'pdf' = 'json',
    options: {
      timeframe?: AnalyticsTimeframe;
      includePersonalData?: boolean;
      childrenFilter?: string[];
    } = {}
  ): Promise<{
    data: any;
    format: string;
    compliance: {
      personalDataIncluded: boolean;
      childrenCount: number;
      exportTimestamp: Date;
    };
  }> {
    const {
      timeframe = 'weekly',
      includePersonalData = false,
      childrenFilter,
    } = options;

    // Generate analytics
    const analytics = await this.generateFamilyAnalytics({
      parentClerkUserId,
      timeframe,
      includeChildren: childrenFilter,
      respectPrivacy: !includePersonalData,
    });

    // Format data based on requested format
    let formattedData: any;
    
    switch (format) {
      case 'json':
        formattedData = analytics;
        break;
      case 'csv':
        formattedData = this.convertToCSV(analytics);
        break;
      case 'pdf':
        formattedData = this.convertToPDFData(analytics);
        break;
      default:
        formattedData = analytics;
    }

    return {
      data: formattedData,
      format,
      compliance: {
        personalDataIncluded: includePersonalData,
        childrenCount: analytics.childSummaries.length,
        exportTimestamp: new Date(),
      },
    };
  }

  /**
   * Convert analytics to CSV format
   */
  private static convertToCSV(analytics: FamilyAnalyticsSummary): string {
    const headers = [
      'Child Name',
      'Age',
      'Total Sessions',
      'Total Minutes',
      'Messages Sent',
      'Topics Explored',
      'Safety Events',
      'Engagement Trend',
      'Dominant Mood',
    ];

    const rows = analytics.childSummaries.map(child => [
      child.childName,
      child.age,
      child.metrics.engagement.totalSessions,
      child.metrics.engagement.totalMinutes,
      child.metrics.engagement.messagesSent,
      child.metrics.engagement.topicsExplored,
      child.metrics.safety.totalEvents,
      child.metrics.engagement.engagementTrend,
      child.metrics.emotionalWellbeing.dominantMood,
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Convert analytics to PDF-ready data
   */
  private static convertToPDFData(analytics: FamilyAnalyticsSummary): any {
    return {
      title: `Family Analytics Report - ${analytics.timeframe}`,
      dateRange: `${analytics.dateRange.start.toDateString()} to ${analytics.dateRange.end.toDateString()}`,
      familyOverview: {
        totalChildren: analytics.familyMetrics.totalChildren,
        activeChildren: analytics.familyMetrics.activeChildren,
        familyEngagementScore: analytics.familyMetrics.familyEngagementScore,
        familySafetyScore: analytics.familyMetrics.familySafetyScore,
      },
      childSummaries: analytics.childSummaries.map(child => ({
        name: child.childName,
        age: child.age,
        keyMetrics: {
          sessions: child.metrics.engagement.totalSessions,
          screenTime: child.metrics.screenTime.totalMinutes,
          safetyEvents: child.metrics.safety.totalEvents,
          mood: child.metrics.emotionalWellbeing.dominantMood,
        },
        insights: child.insights,
        recommendations: child.recommendations,
      })),
      familyInsights: analytics.familyInsights,
    };
  }
}