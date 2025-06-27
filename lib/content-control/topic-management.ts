/**
 * Topic Management Service
 * Handles topic allow/block lists with intelligent categorization
 */

import { prisma } from '@/lib/prisma';
import {
  TopicRule,
  TopicAction,
  ContentCategory,
  ContentScore,
  AdvancedFilteringEngine,
} from './advanced-filtering-engine';

export interface CreateTopicRuleRequest {
  parentClerkUserId: string;
  childAccountId?: string;
  topic: string;
  action: TopicAction;
  reason: string;
  category?: ContentCategory;
}

export interface UpdateTopicRuleRequest {
  action?: TopicAction;
  reason?: string;
  category?: ContentCategory;
}

export interface TopicRuleWithStats extends TopicRule {
  usageCount: number;
  lastTriggered?: Date;
  effectivenessScore: number;
}

export interface TopicSuggestion {
  topic: string;
  category: ContentCategory;
  frequency: number;
  lastMentioned: Date;
  suggestedAction: TopicAction;
  reason: string;
}

export class TopicManagementService {
  /**
   * Create a new topic rule
   */
  static async createTopicRule(
    request: CreateTopicRuleRequest
  ): Promise<TopicRule> {
    try {
      // Auto-categorize topic if not provided
      const category =
        request.category ||
        (await this.categorizeTopicIntelligently(request.topic));

      // Determine default score based on action
      const score = this.getDefaultScoreForAction(request.action);

      const rule = await prisma.topicRule.create({
        data: {
          parentClerkUserId: request.parentClerkUserId,
          childAccountId: request.childAccountId,
          topic: request.topic.toLowerCase().trim(),
          category,
          action: request.action,
          score,
          reason: request.reason,
        },
      });

      return rule as TopicRule;
    } catch (error) {
      console.error('Failed to create topic rule:', error);
      throw new Error('Failed to create topic rule');
    }
  }

  /**
   * Update an existing topic rule
   */
  static async updateTopicRule(
    ruleId: string,
    parentClerkUserId: string,
    updates: UpdateTopicRuleRequest
  ): Promise<TopicRule> {
    try {
      // Verify ownership
      const existingRule = await prisma.topicRule.findFirst({
        where: { id: ruleId, parentClerkUserId },
      });

      if (!existingRule) {
        throw new Error('Topic rule not found or access denied');
      }

      const rule = await prisma.topicRule.update({
        where: { id: ruleId },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });

      return rule as TopicRule;
    } catch (error) {
      console.error('Failed to update topic rule:', error);
      throw new Error('Failed to update topic rule');
    }
  }

  /**
   * Delete a topic rule
   */
  static async deleteTopicRule(
    ruleId: string,
    parentClerkUserId: string
  ): Promise<void> {
    try {
      const result = await prisma.topicRule.deleteMany({
        where: { id: ruleId, parentClerkUserId },
      });

      if (result.count === 0) {
        throw new Error('Topic rule not found or access denied');
      }
    } catch (error) {
      console.error('Failed to delete topic rule:', error);
      throw new Error('Failed to delete topic rule');
    }
  }

  /**
   * Get all topic rules for a parent with usage statistics
   */
  static async getTopicRulesWithStats(
    parentClerkUserId: string,
    childAccountId?: string
  ): Promise<TopicRuleWithStats[]> {
    try {
      const whereClause = {
        parentClerkUserId,
        ...(childAccountId
          ? {
              OR: [{ childAccountId }, { childAccountId: null }],
            }
          : {}),
      };

      const rules = await prisma.topicRule.findMany({
        where: whereClause,
        orderBy: [
          { childAccountId: 'desc' }, // Child-specific first
          { updatedAt: 'desc' },
        ],
      });

      // Add usage statistics
      const rulesWithStats = await Promise.all(
        rules.map(async rule => {
          const stats = await this.getTopicRuleStats(rule.id);
          return {
            ...rule,
            ...stats,
          } as TopicRuleWithStats;
        })
      );

      return rulesWithStats;
    } catch (error) {
      console.error('Failed to get topic rules:', error);
      return [];
    }
  }

  /**
   * Get topic suggestions based on conversation history
   */
  static async getTopicSuggestions(
    parentClerkUserId: string,
    childAccountId: string,
    days: number = 7
  ): Promise<TopicSuggestion[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get conversation topics from recent history
      const conversations = await prisma.conversation.findMany({
        where: {
          childAccountId,
          startedAt: { gte: startDate },
        },
        include: {
          messages: {
            where: { role: 'child' },
            select: { content: true, createdAt: true },
          },
        },
      });

      // Extract and analyze topics
      const topicFrequency = new Map<
        string,
        {
          count: number;
          lastMentioned: Date;
          category: ContentCategory;
        }
      >();

      for (const conversation of conversations) {
        for (const message of conversation.messages) {
          const analysis = await AdvancedFilteringEngine.analyzeContent(
            message.content,
            await this.getChildAge(childAccountId)
          );

          for (const topic of analysis.topics) {
            const existing = topicFrequency.get(topic) || {
              count: 0,
              lastMentioned: new Date(0),
              category: analysis.category,
            };

            topicFrequency.set(topic, {
              count: existing.count + 1,
              lastMentioned:
                message.createdAt > existing.lastMentioned
                  ? message.createdAt
                  : existing.lastMentioned,
              category: analysis.category,
            });
          }
        }
      }

      // Get existing rules to avoid duplicates
      const existingRules = await this.getTopicRulesWithStats(
        parentClerkUserId,
        childAccountId
      );
      const existingTopics = new Set(existingRules.map(rule => rule.topic));

      // Generate suggestions
      const suggestions: TopicSuggestion[] = [];

      for (const [topic, data] of topicFrequency.entries()) {
        if (!existingTopics.has(topic) && data.count >= 2) {
          suggestions.push({
            topic,
            category: data.category,
            frequency: data.count,
            lastMentioned: data.lastMentioned,
            suggestedAction: this.suggestActionForTopic(topic, data.category),
            reason: this.generateSuggestionReason(
              topic,
              data.category,
              data.count
            ),
          });
        }
      }

      // Sort by frequency and return top 10
      return suggestions.sort((a, b) => b.frequency - a.frequency).slice(0, 10);
    } catch (error) {
      console.error('Failed to get topic suggestions:', error);
      return [];
    }
  }

  /**
   * Bulk create topic rules from suggestions
   */
  static async createBulkTopicRules(
    parentClerkUserId: string,
    childAccountId: string,
    rules: Array<{
      topic: string;
      action: TopicAction;
      reason: string;
    }>
  ): Promise<TopicRule[]> {
    try {
      const createdRules = await Promise.all(
        rules.map(rule =>
          this.createTopicRule({
            parentClerkUserId,
            childAccountId,
            topic: rule.topic,
            action: rule.action,
            reason: rule.reason,
          })
        )
      );

      return createdRules;
    } catch (error) {
      console.error('Failed to create bulk topic rules:', error);
      throw new Error('Failed to create bulk topic rules');
    }
  }

  /**
   * Get topic categories with counts
   */
  static async getTopicCategories(parentClerkUserId: string): Promise<
    Array<{
      category: ContentCategory;
      count: number;
      allowedCount: number;
      blockedCount: number;
      monitoredCount: number;
    }>
  > {
    try {
      const rules = await prisma.topicRule.findMany({
        where: { parentClerkUserId },
        select: { category: true, action: true },
      });

      const categoryStats = new Map<
        ContentCategory,
        {
          count: number;
          allowedCount: number;
          blockedCount: number;
          monitoredCount: number;
        }
      >();

      for (const rule of rules) {
        const existing = categoryStats.get(
          rule.category as ContentCategory
        ) || {
          count: 0,
          allowedCount: 0,
          blockedCount: 0,
          monitoredCount: 0,
        };

        existing.count++;

        switch (rule.action) {
          case TopicAction.ALLOW:
            existing.allowedCount++;
            break;
          case TopicAction.BLOCK:
            existing.blockedCount++;
            break;
          case TopicAction.MONITOR:
            existing.monitoredCount++;
            break;
        }

        categoryStats.set(rule.category as ContentCategory, existing);
      }

      return Array.from(categoryStats.entries()).map(([category, stats]) => ({
        category,
        ...stats,
      }));
    } catch (error) {
      console.error('Failed to get topic categories:', error);
      return [];
    }
  }

  // Private helper methods

  private static async categorizeTopicIntelligently(
    topic: string
  ): Promise<ContentCategory> {
    // This would use AI to categorize topics
    // For now, using simple keyword matching
    const topicLower = topic.toLowerCase();

    const categories = {
      [ContentCategory.EDUCATIONAL]: [
        'learn',
        'study',
        'school',
        'homework',
        'education',
      ],
      [ContentCategory.SCIENCE]: [
        'science',
        'math',
        'physics',
        'chemistry',
        'biology',
      ],
      [ContentCategory.ARTS]: [
        'art',
        'music',
        'drawing',
        'painting',
        'creative',
      ],
      [ContentCategory.SPORTS]: ['sport', 'game', 'play', 'team', 'exercise'],
      [ContentCategory.FAMILY]: ['family', 'parent', 'sibling', 'home'],
      [ContentCategory.SOCIAL]: ['friend', 'social', 'talk', 'share'],
      [ContentCategory.ENTERTAINMENT]: [
        'fun',
        'movie',
        'show',
        'video',
        'entertainment',
      ],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => topicLower.includes(keyword))) {
        return category as ContentCategory;
      }
    }

    return ContentCategory.UNKNOWN;
  }

  private static getDefaultScoreForAction(action: TopicAction): ContentScore {
    switch (action) {
      case TopicAction.ALLOW:
        return ContentScore.GOOD;
      case TopicAction.BLOCK:
        return ContentScore.INAPPROPRIATE;
      case TopicAction.MONITOR:
        return ContentScore.CONCERNING;
      case TopicAction.REDIRECT:
        return ContentScore.NEUTRAL;
      default:
        return ContentScore.NEUTRAL;
    }
  }

  private static async getTopicRuleStats(_ruleId: string): Promise<{
    usageCount: number;
    lastTriggered?: Date;
    effectivenessScore: number;
  }> {
    try {
      // Get usage statistics from content alerts
      const alerts = await prisma.contentAlert.findMany({
        where: {
          // This would need a ruleId field in ContentAlert model
          // For now, return default values
        },
        select: { timestamp: true },
      });

      return {
        usageCount: alerts.length,
        lastTriggered: alerts.length > 0 ? alerts[0].timestamp : undefined,
        effectivenessScore: Math.min(alerts.length * 0.1, 1.0), // Simple effectiveness calculation
      };
    } catch {
      return {
        usageCount: 0,
        effectivenessScore: 0,
      };
    }
  }

  private static async getChildAge(childAccountId: string): Promise<number> {
    try {
      const child = await prisma.childAccount.findUnique({
        where: { id: childAccountId },
        select: { age: true },
      });

      return child?.age || 8;
    } catch {
      return 8; // Default age
    }
  }

  private static suggestActionForTopic(
    topic: string,
    category: ContentCategory
  ): TopicAction {
    // Intelligent action suggestion based on topic and category
    if (category === ContentCategory.EDUCATIONAL) return TopicAction.ALLOW;
    if (category === ContentCategory.INAPPROPRIATE) return TopicAction.BLOCK;
    if (category === ContentCategory.UNKNOWN) return TopicAction.MONITOR;

    return TopicAction.ALLOW;
  }

  private static generateSuggestionReason(
    topic: string,
    category: ContentCategory,
    frequency: number
  ): string {
    return `Child mentioned "${topic}" ${frequency} times in recent conversations. Category: ${category}`;
  }
}
