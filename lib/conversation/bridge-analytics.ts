/**
 * Bridge Effectiveness Analytics
 * Comprehensive tracking and analysis of conversation bridge success
 */

import {
  BridgeAttempt,
  // ParentNudgeRequest, // TODO: Used for parent nudge analytics
  // ConversationBridge, // TODO: Used for bridge effectiveness analysis
  // ContextWeaverMetrics, // TODO: Used for context weaving performance
  ConversationFlow,
} from './types';

interface AnalyticsTimeframe {
  start: Date;
  end: Date;
  label: string;
}

interface BridgePerformanceMetrics {
  bridgeId: string;
  bridgeName: string;
  totalAttempts: number;
  successfulAttempts: number;
  successRate: number;
  averageNaturalness: number;
  averageEngagement: number;
  averageResponseTime: number;
  childSatisfactionScore: number;
  parentSatisfactionScore: number;
  topPerformingAgeGroups: string[];
  bestTimingPatterns: string[];
  improvementAreas: string[];
}

interface ChildSpecificAnalytics {
  childAccountId: string;
  totalBridgesReceived: number;
  successfulBridges: number;
  personalSuccessRate: number;
  preferredBridgeTypes: { [key: string]: number };
  optimalTimingWindows: string[];
  topicPreferences: { [key: string]: number };
  engagementPatterns: number[];
  trustMetrics: {
    overallTrust: number; // 1-10
    bridgeAwareness: number; // How often child detects bridges
    parentTransparency: number; // Child's awareness of parent involvement
  };
  behaviorChanges: {
    routineAdherence: number; // Improvement in following routines
    familyCommunication: number; // Improvement in family discussions
    emotionalExpression: number; // Comfort expressing feelings
  };
}

interface ParentNudgeEffectiveness {
  parentClerkUserId: string;
  totalNudgesRequested: number;
  successfulNudges: number;
  nudgeSuccessRate: number;
  averageNudgeQuality: number; // How natural/effective parent phrases are
  mostEffectiveTopics: string[];
  leastEffectiveTopics: string[];
  optimalRequestTiming: string[];
  recommendedImprovements: string[];
  familyGoalsAchieved: string[];
}

interface SystemPerformanceMetrics {
  overallBridgeSuccessRate: number;
  averageResponseTime: number;
  systemUptime: number;
  errorRate: number;
  childSatisfactionTrend: number[];
  parentSatisfactionTrend: number[];
  scalabilityMetrics: {
    concurrent_conversations: number;
    peak_usage_hours: number[];
    resource_utilization: number;
  };
}

/**
 * Bridge Analytics Engine
 * Tracks and analyzes conversation bridge effectiveness across all dimensions
 */
export class BridgeAnalytics {
  private attempts: Map<string, BridgeAttempt[]> = new Map(); // childAccountId -> attempts
  private bridgePerformance: Map<string, BridgePerformanceMetrics> = new Map();
  private childAnalytics: Map<string, ChildSpecificAnalytics> = new Map();
  private parentAnalytics: Map<string, ParentNudgeEffectiveness> = new Map();

  /**
   * Record a bridge attempt and update analytics
   */
  async recordBridgeAttempt(attempt: BridgeAttempt): Promise<void> {
    try {
      // Store the attempt
      const childAttempts = this.attempts.get(attempt.childAccountId) || [];
      childAttempts.push(attempt);
      this.attempts.set(attempt.childAccountId, childAttempts);

      // Update bridge performance metrics
      await this.updateBridgePerformance(attempt);

      // Update child-specific analytics
      await this.updateChildAnalytics(attempt);

      // Update parent nudge effectiveness
      await this.updateParentAnalytics(attempt);
    } catch (error) {
      console.error('Failed to record bridge attempt:', error);
    }
  }

  /**
   * Get comprehensive bridge performance metrics
   */
  async getBridgePerformanceMetrics(
    bridgeId?: string,
    timeframe?: AnalyticsTimeframe
  ): Promise<BridgePerformanceMetrics[]> {
    const allMetrics = Array.from(this.bridgePerformance.values());

    if (bridgeId) {
      const specific = allMetrics.filter(m => m.bridgeId === bridgeId);
      return specific;
    }

    if (timeframe) {
      // Filter by timeframe - would integrate with database queries
      return allMetrics; // Simplified for demo
    }

    return allMetrics.sort((a, b) => b.successRate - a.successRate);
  }

  /**
   * Get child-specific analytics and insights
   */
  async getChildAnalytics(
    childAccountId: string
  ): Promise<ChildSpecificAnalytics | null> {
    return this.childAnalytics.get(childAccountId) || null;
  }

  /**
   * Get parent nudge effectiveness analysis
   */
  async getParentAnalytics(
    parentClerkUserId: string
  ): Promise<ParentNudgeEffectiveness | null> {
    return this.parentAnalytics.get(parentClerkUserId) || null;
  }

  /**
   * Generate comprehensive system metrics
   */
  async getSystemMetrics(
    timeframe?: AnalyticsTimeframe
  ): Promise<SystemPerformanceMetrics> {
    const allAttempts = Array.from(this.attempts.values()).flat();

    if (allAttempts.length === 0) {
      return this.getDefaultSystemMetrics();
    }

    const filteredAttempts = timeframe
      ? allAttempts.filter(
          a =>
            a.attemptedAt >= timeframe.start && a.attemptedAt <= timeframe.end
        )
      : allAttempts;

    const successfulAttempts = filteredAttempts.filter(a => a.success);
    const overallBridgeSuccessRate =
      successfulAttempts.length / filteredAttempts.length;

    const responseTimes = filteredAttempts
      .map(a => a.responseTime || 0)
      .filter(t => t > 0);
    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
        : 0;

    // Calculate satisfaction trends (simplified)
    const engagementScores = filteredAttempts.map(a => a.childEngagement || 5);
    const parentSatisfactionScores = filteredAttempts.map(
      a => a.parentSatisfaction || 7
    );

    return {
      overallBridgeSuccessRate,
      averageResponseTime,
      systemUptime: 99.9, // Would be calculated from monitoring
      errorRate: 0.01, // Would be calculated from error logs
      childSatisfactionTrend: this.calculateTrend(engagementScores),
      parentSatisfactionTrend: this.calculateTrend(parentSatisfactionScores),
      scalabilityMetrics: {
        concurrent_conversations: 150, // Would be from monitoring
        peak_usage_hours: [16, 17, 18, 19], // 4-7 PM
        resource_utilization: 0.65, // 65% average
      },
    };
  }

  /**
   * Generate insights and recommendations for bridge improvement
   */
  async generateBridgeInsights(
    bridgeId?: string,
    childAccountId?: string
  ): Promise<{
    insights: string[];
    recommendations: string[];
    opportunities: string[];
    warnings: string[];
  }> {
    const insights: string[] = [];
    const recommendations: string[] = [];
    const opportunities: string[] = [];
    const warnings: string[] = [];

    if (bridgeId) {
      const bridgeMetrics = this.bridgePerformance.get(bridgeId);
      if (bridgeMetrics) {
        // Analyze bridge-specific performance
        if (bridgeMetrics.successRate < 0.7) {
          warnings.push(
            `Bridge "${bridgeMetrics.bridgeName}" has low success rate (${Math.round(bridgeMetrics.successRate * 100)}%)`
          );
          recommendations.push(
            'Consider revising transition templates for more natural flow'
          );
        }

        if (bridgeMetrics.averageNaturalness < 7) {
          recommendations.push(
            'Focus on improving naturalness - bridges may feel forced'
          );
          opportunities.push('Test alternative phrasing patterns');
        }

        if (bridgeMetrics.successRate > 0.8) {
          insights.push(
            `Bridge "${bridgeMetrics.bridgeName}" is highly effective - consider similar patterns`
          );
          opportunities.push(
            'Expand this bridge type to similar topic transitions'
          );
        }
      }
    }

    if (childAccountId) {
      const childAnalytics = this.childAnalytics.get(childAccountId);
      if (childAnalytics) {
        // Analyze child-specific patterns
        if (childAnalytics.personalSuccessRate < 0.6) {
          warnings.push(
            'This child has low bridge acceptance - may be detecting artificial transitions'
          );
          recommendations.push(
            'Increase time between bridge attempts and improve naturalness'
          );
        }

        if (childAnalytics.trustMetrics.bridgeAwareness > 0.5) {
          warnings.push(
            'Child may be becoming aware of parent-directed conversations'
          );
          recommendations.push(
            'Reduce nudging frequency and improve conversation integration'
          );
        }

        // Identify successful patterns for this child
        const preferredTypes = Object.entries(
          childAnalytics.preferredBridgeTypes
        )
          .sort(([, a], [, b]) => b - a)
          .slice(0, 2);

        if (preferredTypes.length > 0) {
          insights.push(
            `This child responds best to ${preferredTypes.map(([type]) => type).join(' and ')} bridge types`
          );
          opportunities.push(
            'Focus future nudges on these successful bridge patterns'
          );
        }
      }
    }

    // System-wide insights
    const systemMetrics = await this.getSystemMetrics();
    if (systemMetrics.overallBridgeSuccessRate < 0.75) {
      warnings.push('Overall system bridge success rate is below target (75%)');
      recommendations.push(
        'Review and improve bridge templates and timing algorithms'
      );
    }

    return { insights, recommendations, opportunities, warnings };
  }

  /**
   * Track conversation flow quality for a complete session
   */
  async recordConversationFlow(flow: ConversationFlow): Promise<void> {
    try {
      // Update child analytics with flow data
      const childAnalytics = await this.getOrCreateChildAnalytics(
        flow.childAccountId
      );

      // Update engagement patterns
      childAnalytics.engagementPatterns.push(flow.overallEngagement);
      if (childAnalytics.engagementPatterns.length > 100) {
        childAnalytics.engagementPatterns =
          childAnalytics.engagementPatterns.slice(-100); // Keep last 100
      }

      // Update behavior change tracking
      if (flow.parentGoalsAchieved.length > 0) {
        // Simplified behavior change tracking
        childAnalytics.behaviorChanges.routineAdherence += 0.1;
        childAnalytics.behaviorChanges.familyCommunication += 0.05;
      }

      this.childAnalytics.set(flow.childAccountId, childAnalytics);
    } catch (error) {
      console.error('Failed to record conversation flow:', error);
    }
  }

  /**
   * Generate A/B test recommendations for bridge optimization
   */
  async generateABTestRecommendations(): Promise<{
    currentBaseline: number;
    testVariants: {
      name: string;
      description: string;
      expectedImprovement: number;
      risk: 'low' | 'medium' | 'high';
      implementation: string;
    }[];
  }> {
    const systemMetrics = await this.getSystemMetrics();
    const currentBaseline = systemMetrics.overallBridgeSuccessRate;

    const testVariants = [
      {
        name: 'Extended Pause Detection',
        description: 'Wait for longer natural pauses before attempting bridges',
        expectedImprovement: 0.05, // 5% improvement
        risk: 'low' as const,
        implementation: 'Increase pause detection threshold from 0.7 to 0.9',
      },
      {
        name: 'Emotion-Aware Timing',
        description:
          'Only attempt bridges when child emotional state is positive',
        expectedImprovement: 0.08, // 8% improvement
        risk: 'medium' as const,
        implementation: 'Add emotional state filter to timing algorithm',
      },
      {
        name: 'Personalized Bridge Templates',
        description: 'Use child-specific successful phrase patterns',
        expectedImprovement: 0.12, // 12% improvement
        risk: 'medium' as const,
        implementation:
          'Build child-specific template library based on success history',
      },
      {
        name: 'Progressive Disclosure',
        description: 'Start with subtle hints before full topic introduction',
        expectedImprovement: 0.15, // 15% improvement
        risk: 'high' as const,
        implementation: 'Multi-step bridge process with engagement validation',
      },
    ];

    return { currentBaseline, testVariants };
  }

  // Private helper methods

  private async updateBridgePerformance(attempt: BridgeAttempt): Promise<void> {
    const bridgeId = `${attempt.fromTopic}_to_${attempt.targetTopic}_${attempt.bridgeType}`;
    let metrics = this.bridgePerformance.get(bridgeId);

    if (!metrics) {
      metrics = {
        bridgeId,
        bridgeName: `${attempt.fromTopic} → ${attempt.targetTopic} (${attempt.bridgeType})`,
        totalAttempts: 0,
        successfulAttempts: 0,
        successRate: 0,
        averageNaturalness: 0,
        averageEngagement: 0,
        averageResponseTime: 0,
        childSatisfactionScore: 0,
        parentSatisfactionScore: 0,
        topPerformingAgeGroups: [],
        bestTimingPatterns: [],
        improvementAreas: [],
      };
    }

    // Update metrics with exponential moving average
    const alpha = 0.1;

    metrics.totalAttempts++;
    if (attempt.success) metrics.successfulAttempts++;

    metrics.successRate = metrics.successfulAttempts / metrics.totalAttempts;

    if (attempt.naturalness) {
      metrics.averageNaturalness =
        alpha * attempt.naturalness + (1 - alpha) * metrics.averageNaturalness;
    }

    if (attempt.childEngagement) {
      metrics.averageEngagement =
        alpha * attempt.childEngagement +
        (1 - alpha) * metrics.averageEngagement;
    }

    if (attempt.responseTime) {
      metrics.averageResponseTime =
        alpha * attempt.responseTime +
        (1 - alpha) * metrics.averageResponseTime;
    }

    this.bridgePerformance.set(bridgeId, metrics);
  }

  private async updateChildAnalytics(attempt: BridgeAttempt): Promise<void> {
    const analytics = await this.getOrCreateChildAnalytics(
      attempt.childAccountId
    );

    analytics.totalBridgesReceived++;
    if (attempt.success) analytics.successfulBridges++;

    analytics.personalSuccessRate =
      analytics.successfulBridges / analytics.totalBridgesReceived;

    // Update preferred bridge types
    const bridgeType = attempt.bridgeType;
    const currentPreference = analytics.preferredBridgeTypes[bridgeType] || 0;
    const weight = attempt.success ? 1 : -0.5; // Successful bridges get positive weight
    analytics.preferredBridgeTypes[bridgeType] = currentPreference + weight;

    // Update trust metrics (simplified)
    if (attempt.naturalness && attempt.naturalness < 6) {
      analytics.trustMetrics.bridgeAwareness += 0.05; // Child may be noticing forced transitions
    }

    this.childAnalytics.set(attempt.childAccountId, analytics);
  }

  private async updateParentAnalytics(attempt: BridgeAttempt): Promise<void> {
    // Would get parent ID from nudge request - simplified for demo
    const parentId = 'parent_' + attempt.childAccountId;

    let analytics = this.parentAnalytics.get(parentId);
    if (!analytics) {
      analytics = {
        parentClerkUserId: parentId,
        totalNudgesRequested: 0,
        successfulNudges: 0,
        nudgeSuccessRate: 0,
        averageNudgeQuality: 7,
        mostEffectiveTopics: [],
        leastEffectiveTopics: [],
        optimalRequestTiming: [],
        recommendedImprovements: [],
        familyGoalsAchieved: [],
      };
    }

    analytics.totalNudgesRequested++;
    if (attempt.success) analytics.successfulNudges++;
    analytics.nudgeSuccessRate =
      analytics.successfulNudges / analytics.totalNudgesRequested;

    this.parentAnalytics.set(parentId, analytics);
  }

  private async getOrCreateChildAnalytics(
    childAccountId: string
  ): Promise<ChildSpecificAnalytics> {
    let analytics = this.childAnalytics.get(childAccountId);

    if (!analytics) {
      analytics = {
        childAccountId,
        totalBridgesReceived: 0,
        successfulBridges: 0,
        personalSuccessRate: 0,
        preferredBridgeTypes: {},
        optimalTimingWindows: [],
        topicPreferences: {},
        engagementPatterns: [],
        trustMetrics: {
          overallTrust: 8, // Start with high trust
          bridgeAwareness: 0.1, // Low initial awareness
          parentTransparency: 7, // Good transparency
        },
        behaviorChanges: {
          routineAdherence: 5, // Baseline
          familyCommunication: 5, // Baseline
          emotionalExpression: 5, // Baseline
        },
      };

      this.childAnalytics.set(childAccountId, analytics);
    }

    return analytics;
  }

  private calculateTrend(values: number[]): number[] {
    if (values.length < 5) return values;

    // Calculate moving average trend
    const windowSize = Math.min(5, values.length);
    const trend: number[] = [];

    for (let i = windowSize - 1; i < values.length; i++) {
      const window = values.slice(i - windowSize + 1, i + 1);
      const average = window.reduce((sum, v) => sum + v, 0) / window.length;
      trend.push(average);
    }

    return trend;
  }

  private getDefaultSystemMetrics(): SystemPerformanceMetrics {
    return {
      overallBridgeSuccessRate: 0.8,
      averageResponseTime: 45,
      systemUptime: 99.9,
      errorRate: 0.01,
      childSatisfactionTrend: [8, 8, 8, 8],
      parentSatisfactionTrend: [7, 7, 8, 8],
      scalabilityMetrics: {
        concurrent_conversations: 0,
        peak_usage_hours: [16, 17, 18, 19],
        resource_utilization: 0.1,
      },
    };
  }
}
