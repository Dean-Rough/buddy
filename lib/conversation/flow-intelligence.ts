/**
 * Conversation Flow Intelligence
 * Advanced timing and flow analysis for optimal nudge delivery
 */

import {
  ConversationMessage,
  ConversationContext,
  ParentNudgeRequest,
  // BridgeAttempt, // TODO: Used for bridge attempt tracking
} from './types';

interface FlowPattern {
  id: string;
  name: string;
  description: string;
  indicators: string[];
  optimalTiming: 'immediate' | 'next_exchange' | 'topic_end' | 'natural_pause';
  successRate: number;
  childAgeRange: [number, number];
  conversationLength: [number, number]; // Min/max messages for this pattern
}

interface ConversationRhythm {
  childAccountId: string;
  averageResponseTime: number; // seconds
  typicalMessageLength: number; // words
  preferredConversationLength: number; // messages
  attentionSpanPattern: number[]; // engagement levels over time
  energyPeaks: number[]; // Hours when child is most engaged
  topicSwitchFrequency: number; // How often child naturally changes topics
  lastUpdated: Date;
}

interface FlowIntelligenceConfig {
  minAnalysisMessages: number;
  maxLookbackMessages: number;
  engagementThreshold: number;
  naturalPauseDetectionSensitivity: number;
  timingWindowMinutes: number;
}

interface OptimalTimingResult {
  shouldAttempt: boolean;
  confidence: number; // 1-10
  timing:
    | 'immediate'
    | 'next_message'
    | 'wait_for_pause'
    | 'end_of_topic'
    | 'not_suitable';
  waitMinutes?: number;
  reasoning: string[];
  alternativeStrategies?: string[];
}

/**
 * Conversation Flow Intelligence System
 * Analyzes conversation patterns to determine optimal nudge timing
 */
export class ConversationFlowIntelligence {
  private config: FlowIntelligenceConfig = {
    minAnalysisMessages: 5,
    maxLookbackMessages: 50,
    engagementThreshold: 6,
    naturalPauseDetectionSensitivity: 0.7,
    timingWindowMinutes: 15,
  };

  private flowPatterns: Map<string, FlowPattern> = new Map();
  private conversationRhythms: Map<string, ConversationRhythm> = new Map();

  constructor() {
    this.initializeFlowPatterns();
  }

  /**
   * Analyze optimal timing for nudge delivery
   */
  async analyzeOptimalTiming(
    nudgeRequest: ParentNudgeRequest,
    conversationContext: ConversationContext,
    recentMessages: ConversationMessage[]
  ): Promise<OptimalTimingResult> {
    try {
      // Get child's conversation rhythm
      const rhythm = await this.getConversationRhythm(
        conversationContext.childAccountId
      );

      // Analyze current conversation flow
      const flowAnalysis = this.analyzeCurrentFlow(
        recentMessages,
        conversationContext
      );

      // Detect conversation patterns
      const patterns = this.detectActivePatterns(
        recentMessages,
        conversationContext.childAge
      );

      // Calculate optimal timing
      const timing = this.calculateOptimalTiming(
        nudgeRequest,
        conversationContext,
        flowAnalysis,
        patterns,
        rhythm
      );

      return timing;
    } catch (error) {
      console.error('Failed to analyze optimal timing:', error);
      return {
        shouldAttempt: false,
        confidence: 0,
        timing: 'not_suitable',
        reasoning: ['Analysis failed - defaulting to not suitable'],
      };
    }
  }

  /**
   * Analyze conversation flow quality and characteristics
   */
  analyzeCurrentFlow(
    messages: ConversationMessage[],
    context: ConversationContext
  ): {
    flowQuality: 'excellent' | 'good' | 'choppy' | 'declining';
    engagementTrend: 'increasing' | 'stable' | 'decreasing';
    topicStability: number; // 1-10, how stable is current topic
    conversationEnergy: number; // 1-10, overall energy level
    naturalPauses: number; // Count of natural pause opportunities
    bridgeReadiness: number; // 1-10, how ready for bridge
  } {
    if (messages.length < this.config.minAnalysisMessages) {
      return {
        flowQuality: 'good',
        engagementTrend: 'stable',
        topicStability: 5,
        conversationEnergy: 5,
        naturalPauses: 0,
        bridgeReadiness: 5,
      };
    }

    const analysisMessages = messages.slice(-this.config.maxLookbackMessages);

    // Analyze engagement trend
    const engagements = analysisMessages.map(m => m.engagement);
    const firstHalf = engagements.slice(0, Math.floor(engagements.length / 2));
    const secondHalf = engagements.slice(Math.floor(engagements.length / 2));

    const firstAvg =
      firstHalf.reduce((sum, e) => sum + e, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, e) => sum + e, 0) / secondHalf.length;

    let engagementTrend: 'increasing' | 'stable' | 'decreasing';
    if (secondAvg > firstAvg + 1) engagementTrend = 'increasing';
    else if (secondAvg < firstAvg - 1) engagementTrend = 'decreasing';
    else engagementTrend = 'stable';

    // Calculate topic stability
    const topicChanges = this.countTopicChanges(analysisMessages);
    const topicStability = Math.max(1, 10 - topicChanges * 2);

    // Calculate conversation energy
    const avgEngagement =
      engagements.reduce((sum, e) => sum + e, 0) / engagements.length;
    const excitementMarkers = analysisMessages.filter(
      m =>
        m.message.includes('!') ||
        m.message.includes('wow') ||
        m.message.includes('awesome')
    ).length;
    const conversationEnergy = Math.min(
      10,
      avgEngagement + excitementMarkers * 0.5
    );

    // Detect natural pauses
    const naturalPauses = this.detectNaturalPauses(analysisMessages);

    // Calculate bridge readiness
    const bridgeReadiness = this.calculateBridgeReadiness(
      analysisMessages,
      context,
      engagementTrend,
      topicStability
    );

    // Determine flow quality
    let flowQuality: 'excellent' | 'good' | 'choppy' | 'declining';
    if (
      avgEngagement >= 8 &&
      topicStability >= 7 &&
      engagementTrend !== 'decreasing'
    ) {
      flowQuality = 'excellent';
    } else if (avgEngagement >= 6 && topicStability >= 5) {
      flowQuality = 'good';
    } else if (topicChanges > 3 || avgEngagement < 4) {
      flowQuality = 'choppy';
    } else {
      flowQuality = 'declining';
    }

    return {
      flowQuality,
      engagementTrend,
      topicStability,
      conversationEnergy,
      naturalPauses,
      bridgeReadiness,
    };
  }

  /**
   * Detect active conversation patterns
   */
  detectActivePatterns(
    messages: ConversationMessage[],
    childAge: number
  ): FlowPattern[] {
    const activePatterns: FlowPattern[] = [];

    for (const [, pattern] of this.flowPatterns) {
      // Check age range
      const [minAge, maxAge] = pattern.childAgeRange;
      if (childAge < minAge || childAge > maxAge) continue;

      // Check conversation length range
      const [minLength, maxLength] = pattern.conversationLength;
      if (messages.length < minLength || messages.length > maxLength) continue;

      // Check for pattern indicators
      const indicatorCount = this.countPatternIndicators(
        messages,
        pattern.indicators
      );
      const indicatorThreshold = Math.ceil(pattern.indicators.length * 0.3); // 30% of indicators

      if (indicatorCount >= indicatorThreshold) {
        activePatterns.push(pattern);
      }
    }

    return activePatterns.sort((a, b) => b.successRate - a.successRate);
  }

  /**
   * Get or create conversation rhythm for child
   */
  async getConversationRhythm(
    childAccountId: string
  ): Promise<ConversationRhythm> {
    let rhythm = this.conversationRhythms.get(childAccountId);

    if (!rhythm) {
      // Create default rhythm - would be learned from conversation history
      rhythm = {
        childAccountId,
        averageResponseTime: 45, // 45 seconds
        typicalMessageLength: 8, // 8 words
        preferredConversationLength: 15, // 15 messages
        attentionSpanPattern: [8, 8, 7, 6, 5, 4, 3], // Decreasing attention
        energyPeaks: [16, 17, 18, 19], // 4-7 PM
        topicSwitchFrequency: 0.3, // Switch topics 30% of the time
        lastUpdated: new Date(),
      };

      this.conversationRhythms.set(childAccountId, rhythm);
    }

    return rhythm;
  }

  /**
   * Update conversation rhythm based on interaction data
   */
  async updateConversationRhythm(
    childAccountId: string,
    messages: ConversationMessage[],
    sessionDuration: number
  ): Promise<void> {
    const rhythm = await this.getConversationRhythm(childAccountId);

    // Update with exponential moving average
    const alpha = 0.1; // Learning rate

    // Update average response time (simplified - would track actual response times)
    const avgMessageTime = sessionDuration / messages.length;
    rhythm.averageResponseTime =
      alpha * avgMessageTime + (1 - alpha) * rhythm.averageResponseTime;

    // Update typical message length
    const avgWordCount =
      messages.reduce((sum, m) => sum + m.wordCount, 0) / messages.length;
    rhythm.typicalMessageLength =
      alpha * avgWordCount + (1 - alpha) * rhythm.typicalMessageLength;

    // Update preferred conversation length
    rhythm.preferredConversationLength =
      alpha * messages.length +
      (1 - alpha) * rhythm.preferredConversationLength;

    // Update topic switch frequency
    const topicChanges = this.countTopicChanges(messages);
    const switchFreq = topicChanges / messages.length;
    rhythm.topicSwitchFrequency =
      alpha * switchFreq + (1 - alpha) * rhythm.topicSwitchFrequency;

    rhythm.lastUpdated = new Date();
    this.conversationRhythms.set(childAccountId, rhythm);
  }

  /**
   * Predict conversation trajectory
   */
  predictConversationTrajectory(
    messages: ConversationMessage[],
    rhythm: ConversationRhythm,
    currentTime: Date
  ): {
    likelyDuration: number; // Estimated remaining minutes
    engagementPrediction: 'rising' | 'stable' | 'declining';
    naturalEndpoint: number; // Estimated messages until natural end
    optimalNudgeWindows: { start: number; end: number; confidence: number }[];
  } {
    const currentLength = messages.length;
    const timeOfDay = currentTime.getHours();

    // Calculate likely duration based on rhythm and energy peaks
    const energyMultiplier = rhythm.energyPeaks.includes(timeOfDay) ? 1.3 : 0.8;
    const baseDuration =
      (rhythm.preferredConversationLength - currentLength) *
      (rhythm.averageResponseTime / 60);
    const likelyDuration = Math.max(1, baseDuration * energyMultiplier);

    // Predict engagement trend
    const recentEngagements = messages.slice(-5).map(m => m.engagement);
    const avgRecent =
      recentEngagements.reduce((sum, e) => sum + e, 0) /
      recentEngagements.length;
    const baseline = 6; // Expected baseline engagement

    let engagementPrediction: 'rising' | 'stable' | 'declining';
    if (avgRecent > baseline + 1) engagementPrediction = 'rising';
    else if (avgRecent < baseline - 1) engagementPrediction = 'declining';
    else engagementPrediction = 'stable';

    // Calculate natural endpoint
    const attentionDecline = rhythm.attentionSpanPattern;
    const currentAttentionIndex = Math.min(
      currentLength,
      attentionDecline.length - 1
    );
    const remainingAttention = attentionDecline.slice(currentAttentionIndex);
    const naturalEndpoint =
      currentLength + remainingAttention.findIndex(a => a < 4);

    // Identify optimal nudge windows
    const optimalNudgeWindows = this.identifyNudgeWindows(
      messages,
      rhythm,
      likelyDuration,
      engagementPrediction
    );

    return {
      likelyDuration,
      engagementPrediction,
      naturalEndpoint:
        naturalEndpoint > 0 ? naturalEndpoint : currentLength + 5,
      optimalNudgeWindows,
    };
  }

  // Private helper methods

  private calculateOptimalTiming(
    nudgeRequest: ParentNudgeRequest,
    context: ConversationContext,
    flowAnalysis: any,
    patterns: FlowPattern[],
    _rhythm: ConversationRhythm
  ): OptimalTimingResult {
    const reasoning: string[] = [];
    let confidence = 5; // Base confidence
    let timing: OptimalTimingResult['timing'] = 'wait_for_pause';

    // Check urgency
    if (nudgeRequest.urgency === 'immediate') {
      confidence += 3;
      timing = 'immediate';
      reasoning.push('Immediate urgency overrides timing optimization');
    }

    // Check flow quality
    if (flowAnalysis.flowQuality === 'excellent') {
      confidence += 2;
      reasoning.push('Excellent conversation flow supports nudging');
    } else if (flowAnalysis.flowQuality === 'declining') {
      confidence -= 2;
      timing = 'not_suitable';
      reasoning.push('Declining conversation quality - wait for improvement');
    }

    // Check engagement trend
    if (flowAnalysis.engagementTrend === 'increasing') {
      confidence += 1;
      reasoning.push('Rising engagement is favorable for nudging');
    } else if (flowAnalysis.engagementTrend === 'decreasing') {
      confidence -= 1;
      timing = 'wait_for_pause';
      reasoning.push('Decreasing engagement - wait for natural pause');
    }

    // Check bridge readiness
    if (flowAnalysis.bridgeReadiness >= 8) {
      confidence += 2;
      timing = timing === 'not_suitable' ? 'next_message' : timing;
      reasoning.push('High bridge readiness detected');
    } else if (flowAnalysis.bridgeReadiness < 5) {
      confidence -= 1;
      reasoning.push('Low bridge readiness - conversation not ready');
    }

    // Check natural pauses
    if (flowAnalysis.naturalPauses > 0) {
      confidence += 1;
      if (timing === 'wait_for_pause') timing = 'immediate';
      reasoning.push('Natural pause opportunity detected');
    }

    // Check patterns
    const highSuccessPatterns = patterns.filter(p => p.successRate > 0.8);
    if (highSuccessPatterns.length > 0) {
      confidence += 1;
      const bestPattern = highSuccessPatterns[0];
      if (
        bestPattern.optimalTiming === 'immediate' &&
        timing !== 'not_suitable'
      ) {
        timing = 'immediate';
      }
      reasoning.push(`High-success pattern detected: ${bestPattern.name}`);
    }

    // Final confidence adjustment
    confidence = Math.max(1, Math.min(10, confidence));

    // Determine if should attempt
    const shouldAttempt = confidence >= 6 && timing !== 'not_suitable';

    return {
      shouldAttempt,
      confidence,
      timing,
      reasoning,
      waitMinutes: timing === 'wait_for_pause' ? 5 : undefined,
    };
  }

  private initializeFlowPatterns(): void {
    const patterns: FlowPattern[] = [
      {
        id: 'high_engagement_steady',
        name: 'High Engagement Steady State',
        description: 'Child is highly engaged and conversation is flowing well',
        indicators: [
          'excited',
          'cool',
          'awesome',
          'tell me more',
          'what about',
        ],
        optimalTiming: 'immediate',
        successRate: 0.9,
        childAgeRange: [6, 12],
        conversationLength: [5, 30],
      },
      {
        id: 'natural_pause_transition',
        name: 'Natural Pause Transition',
        description:
          'Child has reached natural pause and is ready for new topic',
        indicators: ['hmm', 'um', 'what else', 'i dont know', 'anything else'],
        optimalTiming: 'immediate',
        successRate: 0.85,
        childAgeRange: [6, 12],
        conversationLength: [3, 20],
      },
      {
        id: 'topic_exhaustion',
        name: 'Topic Exhaustion',
        description: 'Current topic is becoming exhausted, good for bridges',
        indicators: ['yeah', 'ok', 'sure', 'i guess', 'whatever'],
        optimalTiming: 'next_exchange',
        successRate: 0.75,
        childAgeRange: [8, 12],
        conversationLength: [8, 25],
      },
      {
        id: 'curious_questioning',
        name: 'Curious Questioning Phase',
        description: 'Child is asking questions and showing curiosity',
        indicators: ['why', 'how', 'what if', 'can you', 'do you know'],
        optimalTiming: 'next_exchange',
        successRate: 0.8,
        childAgeRange: [6, 12],
        conversationLength: [3, 15],
      },
    ];

    patterns.forEach(pattern => {
      this.flowPatterns.set(pattern.id, pattern);
    });
  }

  private countPatternIndicators(
    messages: ConversationMessage[],
    indicators: string[]
  ): number {
    let count = 0;
    const recentMessages = messages.slice(-10); // Last 10 messages

    for (const message of recentMessages) {
      const messageText = message.message.toLowerCase();
      for (const indicator of indicators) {
        if (messageText.includes(indicator)) {
          count++;
          break; // Count each message only once per pattern
        }
      }
    }

    return count;
  }

  private countTopicChanges(messages: ConversationMessage[]): number {
    let changes = 0;
    let previousTopic = '';

    for (const message of messages) {
      if (previousTopic && message.topic !== previousTopic) {
        changes++;
      }
      previousTopic = message.topic;
    }

    return changes;
  }

  private detectNaturalPauses(messages: ConversationMessage[]): number {
    const pauseIndicators = [
      'hmm',
      'um',
      'uh',
      'well',
      'so',
      'anyway',
      'what else',
      'i dont know',
      'not sure',
      'maybe',
      'what should we talk about',
    ];

    let pauseCount = 0;
    const recentMessages = messages.slice(-5); // Last 5 messages

    for (const message of recentMessages) {
      const messageText = message.message.toLowerCase();
      const hasIndicator = pauseIndicators.some(indicator =>
        messageText.includes(indicator)
      );
      const isShort = message.wordCount < 5;

      if (hasIndicator || (isShort && message.engagement < 6)) {
        pauseCount++;
      }
    }

    return pauseCount;
  }

  private calculateBridgeReadiness(
    messages: ConversationMessage[],
    context: ConversationContext,
    engagementTrend: string,
    topicStability: number
  ): number {
    let readiness = 5; // Base readiness

    // Recent engagement
    const recentEngagement =
      messages.slice(-3).reduce((sum, m) => sum + m.engagement, 0) / 3;
    readiness += (recentEngagement - 6) * 0.5;

    // Engagement trend
    if (engagementTrend === 'increasing') readiness += 1;
    else if (engagementTrend === 'decreasing') readiness -= 1;

    // Topic stability
    readiness += (topicStability - 5) * 0.3;

    // Time since last bridge
    if (context.lastBridgeAttempt) {
      const minutesSince =
        (Date.now() - context.lastBridgeAttempt.getTime()) / (60 * 1000);
      if (minutesSince > 10)
        readiness += 1; // Good gap since last attempt
      else if (minutesSince < 5) readiness -= 2; // Too soon
    }

    return Math.max(1, Math.min(10, readiness));
  }

  private identifyNudgeWindows(
    messages: ConversationMessage[],
    rhythm: ConversationRhythm,
    likelyDuration: number,
    engagementPrediction: string
  ): { start: number; end: number; confidence: number }[] {
    const windows = [];
    const currentLength = messages.length;

    // Immediate window (if engagement is high)
    const recentEngagement =
      messages.slice(-3).reduce((sum, m) => sum + m.engagement, 0) / 3;
    if (recentEngagement >= 7) {
      windows.push({
        start: currentLength,
        end: currentLength + 2,
        confidence: Math.min(9, recentEngagement),
      });
    }

    // Topic transition window
    if (rhythm.topicSwitchFrequency > 0.2) {
      const expectedSwitch = Math.round(
        currentLength + 1 / rhythm.topicSwitchFrequency
      );
      windows.push({
        start: expectedSwitch - 1,
        end: expectedSwitch + 1,
        confidence: 7,
      });
    }

    // Natural decline window (as attention wanes)
    if (engagementPrediction !== 'rising') {
      const declinePoint = Math.round(currentLength + likelyDuration * 0.7);
      windows.push({
        start: declinePoint,
        end: declinePoint + 2,
        confidence: 6,
      });
    }

    return windows.sort((a, b) => b.confidence - a.confidence);
  }
}
