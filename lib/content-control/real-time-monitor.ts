/**
 * Real-Time Content Monitoring Service
 * Integrates with chat system to provide instant content analysis and alerts
 */

import { prisma } from '@/lib/prisma';
import { 
  AdvancedFilteringEngine, 
  ContentAnalysis, 
  TopicAction, 
  AlertSeverity,
  ContentAlert
} from './advanced-filtering-engine';
import { TopicManagementService } from './topic-management';

export interface MonitoringResult {
  allowed: boolean;
  action: TopicAction;
  score: number;
  warnings: string[];
  suggestedResponse?: string;
  alertCreated?: boolean;
  processingTimeMs: number;
}

export interface MonitoringOptions {
  enableRealTimeAlerts: boolean;
  parentNotificationThreshold: number; // 1-5, scores below trigger notification
  bypassForEmergency: boolean;
  logAllAnalysis: boolean;
}

export class RealTimeContentMonitor {
  
  /**
   * Monitor message content in real-time during conversation
   */
  static async monitorMessage(
    parentClerkUserId: string,
    childAccountId: string,
    conversationId: string,
    messageId: string,
    content: string,
    options: MonitoringOptions = {
      enableRealTimeAlerts: true,
      parentNotificationThreshold: 2,
      bypassForEmergency: false,
      logAllAnalysis: true
    }
  ): Promise<MonitoringResult> {
    const startTime = Date.now();
    
    try {
      // Get child age for context-appropriate analysis
      const childAge = await this.getChildAge(childAccountId);
      
      // Analyze content
      const analysis = await AdvancedFilteringEngine.analyzeContent(
        content,
        childAge,
        await this.getConversationContext(conversationId)
      );
      
      // Apply topic rules
      const ruleResult = await AdvancedFilteringEngine.applyTopicRules(
        parentClerkUserId,
        childAccountId,
        analysis
      );
      
      // Store content analysis if logging enabled
      if (options.logAllAnalysis) {
        await this.storeContentAnalysis(
          childAccountId,
          conversationId,
          messageId,
          analysis,
          Date.now() - startTime
        );
      }
      
      // Check if parent notification is needed
      let alertCreated = false;
      if (options.enableRealTimeAlerts && 
          this.shouldCreateAlert(analysis, ruleResult.action, options.parentNotificationThreshold)) {
        
        await AdvancedFilteringEngine.createContentAlert(
          parentClerkUserId,
          childAccountId,
          conversationId,
          messageId,
          analysis,
          ruleResult.action,
          content
        );
        
        alertCreated = true;
        
        // Send real-time notification to parent (if they're online)
        await this.sendRealTimeNotification(parentClerkUserId, {
          type: 'content_alert',
          severity: this.determineSeverity(analysis, ruleResult.action),
          childName: await this.getChildName(childAccountId),
          topic: analysis.topics[0] || 'unknown',
          action: ruleResult.action
        });
      }
      
      // Generate warnings for the chat system
      const warnings = this.generateWarnings(analysis, ruleResult);
      
      // Generate suggested response if content needs redirection
      const suggestedResponse = ruleResult.action === TopicAction.REDIRECT 
        ? await this.generateRedirectionResponse(analysis, childAge)
        : undefined;
      
      const processingTimeMs = Date.now() - startTime;
      
      return {
        allowed: ruleResult.action !== TopicAction.BLOCK,
        action: ruleResult.action,
        score: analysis.score,
        warnings,
        suggestedResponse,
        alertCreated,
        processingTimeMs
      };
      
    } catch (error) {
      console.error('Real-time monitoring error:', error);
      
      // Fail safe - always allow but log error
      return {
        allowed: true,
        action: TopicAction.MONITOR,
        score: 2, // Concerning due to error
        warnings: ['Content analysis failed - manual review recommended'],
        alertCreated: false,
        processingTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * Get monitoring statistics for parent dashboard
   */
  static async getMonitoringStats(
    parentClerkUserId: string,
    childAccountId?: string,
    days: number = 7
  ): Promise<{
    totalMessages: number;
    analyzedMessages: number;
    alertsCreated: number;
    topCategories: Array<{ category: string; count: number }>;
    averageScore: number;
    trendsOverTime: Array<{ date: string; score: number; alerts: number }>;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const whereClause = {
        parentClerkUserId,
        timestamp: { gte: startDate },
        ...(childAccountId ? { childAccountId } : {})
      };
      
      // Get alerts
      const alerts = await prisma.contentAlert.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' }
      });
      
      // Get content scores
      const scores = await prisma.contentScore.findMany({
        where: {
          childAccountId: childAccountId || undefined,
          analyzedAt: { gte: startDate }
        }
      });
      
      // Calculate category distribution
      const categoryCount = new Map<string, number>();
      scores.forEach(score => {
        const count = categoryCount.get(score.category) || 0;
        categoryCount.set(score.category, count + 1);
      });
      
      const topCategories = Array.from(categoryCount.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // Calculate average score
      const averageScore = scores.length > 0 
        ? scores.reduce((sum, score) => sum + score.score, 0) / scores.length
        : 0;
      
      // Generate trends over time
      const trendsOverTime = await this.generateTrends(scores, alerts, days);
      
      return {
        totalMessages: scores.length,
        analyzedMessages: scores.length,
        alertsCreated: alerts.length,
        topCategories,
        averageScore,
        trendsOverTime
      };
      
    } catch (error) {
      console.error('Failed to get monitoring stats:', error);
      return {
        totalMessages: 0,
        analyzedMessages: 0,
        alertsCreated: 0,
        topCategories: [],
        averageScore: 0,
        trendsOverTime: []
      };
    }
  }

  /**
   * Update monitoring settings for a family
   */
  static async updateMonitoringSettings(
    parentClerkUserId: string,
    settings: {
      enableRealTimeAlerts?: boolean;
      notificationThreshold?: number;
      alertMethods?: string[]; // ['email', 'push', 'sms']
      quietHours?: { start: string; end: string };
      categoryFilters?: string[];
    }
  ): Promise<void> {
    try {
      // This would be stored in a MonitoringSettings model
      // For now, we'll use the existing ParentSettings
      // Store content monitoring settings in parent settings
      // Note: Add contentMonitoringEnabled and alertThreshold fields to ParentSettings model later
      console.log('Content monitoring settings updated for parent:', parentClerkUserId, settings);
    } catch (error) {
      console.error('Failed to update monitoring settings:', error);
      throw new Error('Failed to update monitoring settings');
    }
  }

  /**
   * Get active alerts that need parent attention
   */
  static async getActiveAlerts(
    parentClerkUserId: string,
    limit: number = 20
  ): Promise<ContentAlert[]> {
    try {
      const alerts = await prisma.contentAlert.findMany({
        where: {
          parentClerkUserId,
          acknowledged: false
        },
        orderBy: [
          { severity: 'desc' },
          { timestamp: 'desc' }
        ],
        take: limit,
        include: {
          childAccount: {
            select: { name: true, username: true }
          }
        }
      });
      
      return alerts as ContentAlert[];
    } catch (error) {
      console.error('Failed to get active alerts:', error);
      return [];
    }
  }

  /**
   * Acknowledge alerts
   */
  static async acknowledgeAlerts(
    parentClerkUserId: string,
    alertIds: string[]
  ): Promise<number> {
    try {
      const result = await prisma.contentAlert.updateMany({
        where: {
          id: { in: alertIds },
          parentClerkUserId, // Ensure ownership
          acknowledged: false
        },
        data: {
          acknowledged: true,
          acknowledgedAt: new Date()
        }
      });
      
      return result.count;
    } catch (error) {
      console.error('Failed to acknowledge alerts:', error);
      return 0;
    }
  }

  // Private helper methods

  private static async getChildAge(childAccountId: string): Promise<number> {
    try {
      const child = await prisma.childAccount.findUnique({
        where: { id: childAccountId },
        select: { age: true }
      });
      
      return child?.age || 8;
    } catch (error) {
      return 8;
    }
  }

  private static async getConversationContext(conversationId: string): Promise<string> {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { topics: true, mood: true }
      });
      
      return `Topics: ${conversation?.topics?.join(', ') || 'none'}, Mood: ${conversation?.mood || 'neutral'}`;
    } catch (error) {
      return '';
    }
  }

  private static async storeContentAnalysis(
    childAccountId: string,
    conversationId: string,
    messageId: string,
    analysis: ContentAnalysis,
    processingTimeMs: number
  ): Promise<void> {
    try {
      await prisma.contentScore.create({
        data: {
          childAccountId,
          conversationId,
          messageId,
          topics: analysis.topics,
          category: analysis.category,
          score: analysis.score,
          confidence: analysis.confidence,
          flags: analysis.flags,
          educationalValue: analysis.educationalValue,
          analysisMethod: 'hybrid',
          processingTime: processingTimeMs
        }
      });
    } catch (error) {
      console.error('Failed to store content analysis:', error);
    }
  }

  private static shouldCreateAlert(
    analysis: ContentAnalysis,
    action: TopicAction,
    threshold: number
  ): boolean {
    // Create alert if action is block or if score is below threshold
    if (action === TopicAction.BLOCK) return true;
    if (analysis.score <= threshold) return true;
    if (analysis.flags.length > 0) return true;
    
    return false;
  }

  private static determineSeverity(analysis: ContentAnalysis, action: TopicAction): AlertSeverity {
    if (action === TopicAction.BLOCK) return AlertSeverity.CRITICAL;
    if (analysis.score <= 2) return AlertSeverity.WARNING;
    if (analysis.flags.length > 0) return AlertSeverity.WARNING;
    
    return AlertSeverity.INFO;
  }

  private static generateWarnings(
    analysis: ContentAnalysis,
    ruleResult: { action: TopicAction; matchedRule?: any; overrideReason?: string }
  ): string[] {
    const warnings: string[] = [];
    
    if (ruleResult.action === TopicAction.BLOCK) {
      warnings.push('Content blocked by topic rule');
    }
    
    if (ruleResult.action === TopicAction.MONITOR) {
      warnings.push('Content flagged for monitoring');
    }
    
    if (analysis.flags.length > 0) {
      warnings.push(`Flags detected: ${analysis.flags.join(', ')}`);
    }
    
    if (analysis.score <= 2) {
      warnings.push('Content score below recommended threshold');
    }
    
    return warnings;
  }

  private static async generateRedirectionResponse(
    analysis: ContentAnalysis,
    childAge: number
  ): Promise<string> {
    // This would use AI to generate natural redirections
    const topic = analysis.topics[0] || 'that topic';
    
    if (childAge <= 8) {
      return `That's an interesting topic! Let's talk about something fun instead. What's your favorite game?`;
    } else {
      return `I understand you're curious about ${topic}. Let's explore something else that might be even more interesting!`;
    }
  }

  private static async sendRealTimeNotification(
    parentClerkUserId: string,
    notification: {
      type: string;
      severity: AlertSeverity;
      childName: string;
      topic: string;
      action: TopicAction;
    }
  ): Promise<void> {
    try {
      // This would integrate with push notification service
      console.log(`Real-time notification for parent ${parentClerkUserId}:`, notification);
      
      // Store notification for parent dashboard
      await prisma.parentNotification.create({
        data: {
          parentClerkUserId,
          type: 'content_alert',
          title: `Content Alert - ${notification.childName}`,
          message: `${notification.severity} alert for topic: ${notification.topic}`,
          severity: notification.severity,
          read: false
        }
      });
    } catch (error) {
      console.error('Failed to send real-time notification:', error);
    }
  }

  private static async getChildName(childAccountId: string): Promise<string> {
    try {
      const child = await prisma.childAccount.findUnique({
        where: { id: childAccountId },
        select: { name: true }
      });
      
      return child?.name || 'Child';
    } catch (error) {
      return 'Child';
    }
  }

  private static async generateTrends(
    scores: any[],
    alerts: any[],
    days: number
  ): Promise<Array<{ date: string; score: number; alerts: number }>> {
    const trends: Array<{ date: string; score: number; alerts: number }> = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayScores = scores.filter(s => 
        s.analyzedAt.toISOString().split('T')[0] === dateStr
      );
      
      const dayAlerts = alerts.filter(a => 
        a.timestamp.toISOString().split('T')[0] === dateStr
      );
      
      const averageScore = dayScores.length > 0 
        ? dayScores.reduce((sum, s) => sum + s.score, 0) / dayScores.length
        : 0;
      
      trends.push({
        date: dateStr,
        score: averageScore,
        alerts: dayAlerts.length
      });
    }
    
    return trends;
  }
}