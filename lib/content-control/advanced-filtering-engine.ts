/**
 * Advanced Content Control System - Filtering Engine
 * Provides granular content filtering and topic management for child safety
 * 
 * Features:
 * - Topic allow/block lists with intelligent categorization
 * - Content appropriateness scoring with parental override
 * - Real-time content monitoring with instant alerts
 * - Educational content integration and suggestions
 */

import { prisma } from '@/lib/prisma';

// Content categories for intelligent classification
export enum ContentCategory {
  EDUCATIONAL = 'educational',
  ENTERTAINMENT = 'entertainment',
  SOCIAL = 'social',
  CREATIVE = 'creative',
  SPORTS = 'sports',
  SCIENCE = 'science',
  ARTS = 'arts',
  FAMILY = 'family',
  EMOTIONAL = 'emotional',
  INAPPROPRIATE = 'inappropriate',
  UNKNOWN = 'unknown'
}

// Topic management actions
export enum TopicAction {
  ALLOW = 'allow',
  BLOCK = 'block',
  MONITOR = 'monitor',
  REDIRECT = 'redirect'
}

// Content scoring levels
export enum ContentScore {
  EXCELLENT = 5,    // Highly educational/beneficial
  GOOD = 4,         // Generally positive
  NEUTRAL = 3,      // Age-appropriate but not particularly beneficial
  CONCERNING = 2,   // May require parent attention
  INAPPROPRIATE = 1 // Should be blocked
}

// Alert severity levels
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

export interface TopicRule {
  id: string;
  parentClerkUserId: string;
  childAccountId?: string; // null means applies to all children
  topic: string;
  category: ContentCategory;
  action: TopicAction;
  score: ContentScore;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentAnalysis {
  topics: string[];
  category: ContentCategory;
  score: ContentScore;
  confidence: number;
  flags: string[];
  educationalValue: number;
  appropriatenessReason: string;
}

export interface ContentAlert {
  id: string;
  parentClerkUserId: string;
  childAccountId: string;
  conversationId: string;
  messageId: string;
  severity: AlertSeverity;
  category: ContentCategory;
  topic: string;
  content: string;
  reason: string;
  action: TopicAction;
  timestamp: Date;
  acknowledged: boolean;
}

export interface EducationalSuggestion {
  topic: string;
  category: ContentCategory;
  suggestion: string;
  reason: string;
  resources: string[];
}

export class AdvancedFilteringEngine {
  
  /**
   * Analyze content and determine its appropriateness
   */
  static async analyzeContent(
    content: string,
    childAge: number,
    context?: string
  ): Promise<ContentAnalysis> {
    try {
      // Extract topics from content using AI analysis
      const topics = await this.extractTopics(content);
      
      // Categorize the content
      const category = await this.categorizeContent(content, topics);
      
      // Score content appropriateness
      const score = await this.scoreContent(content, category, childAge);
      
      // Calculate confidence level
      const confidence = await this.calculateConfidence(content, topics, category);
      
      // Identify any concerning flags
      const flags = await this.identifyFlags(content, topics, childAge);
      
      // Assess educational value
      const educationalValue = await this.assessEducationalValue(content, category, childAge);
      
      // Generate appropriateness reason
      const appropriatenessReason = await this.generateAppropriatenessReason(
        content, category, score, flags, childAge
      );
      
      return {
        topics,
        category,
        score,
        confidence,
        flags,
        educationalValue,
        appropriatenessReason
      };
    } catch (error) {
      console.error('Content analysis error:', error);
      // Fail safe - treat unknown content as concerning
      return {
        topics: ['unknown'],
        category: ContentCategory.UNKNOWN,
        score: ContentScore.CONCERNING,
        confidence: 0.1,
        flags: ['analysis_error'],
        educationalValue: 0,
        appropriatenessReason: 'Content could not be analyzed - manual review required'
      };
    }
  }

  /**
   * Apply topic rules and determine action
   */
  static async applyTopicRules(
    parentClerkUserId: string,
    childAccountId: string,
    analysis: ContentAnalysis
  ): Promise<{
    action: TopicAction;
    matchedRule?: TopicRule;
    overrideReason?: string;
  }> {
    try {
      // Get all applicable rules for this child
      const rules = await this.getApplicableRules(parentClerkUserId, childAccountId);
      
      // Check for exact topic matches first
      for (const topic of analysis.topics) {
        const exactMatch = rules.find(rule => 
          rule.topic.toLowerCase() === topic.toLowerCase()
        );
        if (exactMatch) {
          return {
            action: exactMatch.action,
            matchedRule: exactMatch
          };
        }
      }
      
      // Check for category-based rules
      const categoryRule = rules.find(rule => 
        rule.category === analysis.category
      );
      if (categoryRule) {
        return {
          action: categoryRule.action,
          matchedRule: categoryRule
        };
      }
      
      // Default behavior based on content score
      if (analysis.score <= ContentScore.CONCERNING) {
        return {
          action: TopicAction.MONITOR,
          overrideReason: 'Content score below threshold - requires monitoring'
        };
      }
      
      if (analysis.flags.length > 0) {
        return {
          action: TopicAction.MONITOR,
          overrideReason: 'Content flags detected - requires monitoring'
        };
      }
      
      return {
        action: TopicAction.ALLOW,
        overrideReason: 'No matching rules - default allow with standard safety'
      };
      
    } catch (error) {
      console.error('Rule application error:', error);
      // Fail safe - monitor unknown content
      return {
        action: TopicAction.MONITOR,
        overrideReason: 'Rule application failed - defaulting to monitoring'
      };
    }
  }

  /**
   * Create content alert for parent notification
   */
  static async createContentAlert(
    parentClerkUserId: string,
    childAccountId: string,
    conversationId: string,
    messageId: string,
    analysis: ContentAnalysis,
    action: TopicAction,
    content: string
  ): Promise<ContentAlert> {
    try {
      const severity = this.determineSeverity(analysis, action);
      
      const alert = await prisma.contentAlert.create({
        data: {
          parentClerkUserId,
          childAccountId,
          conversationId,
          messageId,
          severity,
          category: analysis.category,
          topic: analysis.topics[0] || 'unknown',
          content: content.substring(0, 500), // Limit content length
          reason: analysis.appropriatenessReason,
          action,
          acknowledged: false
        }
      });
      
      return alert as ContentAlert;
    } catch (error) {
      console.error('Alert creation error:', error);
      throw new Error('Failed to create content alert');
    }
  }

  /**
   * Get educational suggestions based on content
   */
  static async getEducationalSuggestions(
    analysis: ContentAnalysis,
    childAge: number
  ): Promise<EducationalSuggestion[]> {
    const suggestions: EducationalSuggestion[] = [];
    
    try {
      // Generate suggestions based on topics and category
      for (const topic of analysis.topics) {
        if (analysis.category === ContentCategory.EDUCATIONAL) {
          suggestions.push({
            topic,
            category: analysis.category,
            suggestion: await this.generateEducationalSuggestion(topic, childAge),
            reason: 'Child showed interest in educational topic',
            resources: await this.getEducationalResources(topic, childAge)
          });
        } else if (analysis.score >= ContentScore.GOOD) {
          suggestions.push({
            topic,
            category: analysis.category,
            suggestion: await this.generateRelatedEducationalContent(topic, childAge),
            reason: 'Build on positive interest',
            resources: await this.getRelatedResources(topic, childAge)
          });
        }
      }
      
      return suggestions.slice(0, 3); // Limit to top 3 suggestions
    } catch (error) {
      console.error('Educational suggestion error:', error);
      return [];
    }
  }

  // Private helper methods

  private static async extractTopics(content: string): Promise<string[]> {
    // This would use AI to extract topics from content
    // For now, implementing basic keyword extraction
    const keywords = content.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3)
      .slice(0, 10);
    
    return keywords;
  }

  private static async categorizeContent(content: string, topics: string[]): Promise<ContentCategory> {
    // Simple categorization logic - would be enhanced with AI
    const educationalKeywords = ['learn', 'study', 'school', 'homework', 'science', 'math'];
    const entertainmentKeywords = ['fun', 'game', 'play', 'movie', 'music'];
    const socialKeywords = ['friend', 'family', 'talk', 'share'];
    
    const contentLower = content.toLowerCase();
    
    if (educationalKeywords.some(keyword => contentLower.includes(keyword))) {
      return ContentCategory.EDUCATIONAL;
    }
    if (entertainmentKeywords.some(keyword => contentLower.includes(keyword))) {
      return ContentCategory.ENTERTAINMENT;
    }
    if (socialKeywords.some(keyword => contentLower.includes(keyword))) {
      return ContentCategory.SOCIAL;
    }
    
    return ContentCategory.UNKNOWN;
  }

  private static async scoreContent(
    content: string,
    category: ContentCategory,
    childAge: number
  ): Promise<ContentScore> {
    // Basic scoring logic - would be enhanced with AI
    if (category === ContentCategory.EDUCATIONAL) return ContentScore.EXCELLENT;
    if (category === ContentCategory.CREATIVE) return ContentScore.GOOD;
    if (category === ContentCategory.SOCIAL) return ContentScore.GOOD;
    if (category === ContentCategory.ENTERTAINMENT) return ContentScore.NEUTRAL;
    if (category === ContentCategory.UNKNOWN) return ContentScore.CONCERNING;
    
    return ContentScore.NEUTRAL;
  }

  private static async calculateConfidence(
    content: string,
    topics: string[],
    category: ContentCategory
  ): Promise<number> {
    // Simple confidence calculation
    const topicCount = topics.length;
    const contentLength = content.length;
    
    if (category === ContentCategory.UNKNOWN) return 0.3;
    if (topicCount > 5 && contentLength > 100) return 0.9;
    if (topicCount > 2 && contentLength > 50) return 0.7;
    
    return 0.5;
  }

  private static async identifyFlags(
    content: string,
    topics: string[],
    childAge: number
  ): Promise<string[]> {
    const flags: string[] = [];
    const contentLower = content.toLowerCase();
    
    // Check for concerning content
    const concerningWords = ['inappropriate', 'dangerous', 'harmful'];
    if (concerningWords.some(word => contentLower.includes(word))) {
      flags.push('concerning_content');
    }
    
    // Check for age appropriateness
    if (childAge < 8 && contentLower.includes('complex')) {
      flags.push('too_advanced');
    }
    
    return flags;
  }

  private static async assessEducationalValue(
    content: string,
    category: ContentCategory,
    childAge: number
  ): Promise<number> {
    // Educational value scoring (0-1)
    if (category === ContentCategory.EDUCATIONAL) return 0.9;
    if (category === ContentCategory.SCIENCE) return 0.8;
    if (category === ContentCategory.CREATIVE) return 0.7;
    if (category === ContentCategory.SOCIAL) return 0.5;
    
    return 0.2;
  }

  private static async generateAppropriatenessReason(
    content: string,
    category: ContentCategory,
    score: ContentScore,
    flags: string[],
    childAge: number
  ): Promise<string> {
    if (flags.length > 0) {
      return `Content flagged for: ${flags.join(', ')}`;
    }
    
    if (score >= ContentScore.GOOD) {
      return `${category} content appropriate for age ${childAge}`;
    }
    
    return `Content requires review - ${category} category with score ${score}`;
  }

  private static async getApplicableRules(
    parentClerkUserId: string,
    childAccountId: string
  ): Promise<TopicRule[]> {
    try {
      const rules = await prisma.topicRule.findMany({
        where: {
          parentClerkUserId,
          OR: [
            { childAccountId },
            { childAccountId: null } // Family-wide rules
          ]
        },
        orderBy: [
          { childAccountId: 'desc' }, // Child-specific rules first
          { updatedAt: 'desc' }
        ]
      });
      
      return rules as TopicRule[];
    } catch (error) {
      console.error('Failed to get topic rules:', error);
      return [];
    }
  }

  private static determineSeverity(analysis: ContentAnalysis, action: TopicAction): AlertSeverity {
    if (action === TopicAction.BLOCK) return AlertSeverity.CRITICAL;
    if (analysis.score <= ContentScore.CONCERNING) return AlertSeverity.WARNING;
    if (analysis.flags.length > 0) return AlertSeverity.WARNING;
    
    return AlertSeverity.INFO;
  }

  private static async generateEducationalSuggestion(topic: string, childAge: number): Promise<string> {
    // This would use AI to generate personalized suggestions
    return `Explore more about ${topic} with age-appropriate activities for ${childAge} year olds`;
  }

  private static async getEducationalResources(topic: string, childAge: number): Promise<string[]> {
    // This would fetch curated educational resources
    return [
      `Educational games about ${topic}`,
      `Age-appropriate books on ${topic}`,
      `Interactive activities for ${topic}`
    ];
  }

  private static async generateRelatedEducationalContent(topic: string, childAge: number): Promise<string> {
    return `Build on interest in ${topic} with educational activities`;
  }

  private static async getRelatedResources(topic: string, childAge: number): Promise<string[]> {
    return [
      `Related educational content for ${topic}`,
      `Hands-on activities about ${topic}`
    ];
  }
}