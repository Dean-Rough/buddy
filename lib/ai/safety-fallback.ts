import { SafetyResult, SafetyContext } from './safety';
import { getCompiledSafetyPatterns } from '../config-loader';

/**
 * Fallback safety system for AI service downtime
 * Provides robust rule-based safety validation with enhanced pattern detection
 */
export class SafetyFallbackSystem {
  private isAIServiceDown = false;
  private lastAICheck = 0;
  private checkInterval = 30000; // Check AI service every 30 seconds

  /**
   * Enhanced rule-based safety validation with multiple layers
   */
  validateWithFallback(message: string, context: SafetyContext): SafetyResult {
    try {
      const patterns = getCompiledSafetyPatterns();

      // Layer 1: Critical pattern detection (immediate escalation)
      const criticalResult = this.checkCriticalPatterns(
        message,
        patterns.critical
      );
      if (criticalResult) return criticalResult;

      // Layer 2: Enhanced keyword detection with context
      const keywordResult = this.checkEnhancedKeywords(message, context);
      if (keywordResult) return keywordResult;

      // Layer 3: Behavioral pattern analysis
      const behaviorResult = this.analyzeBehavioralPatterns(message, context);
      if (behaviorResult) return behaviorResult;

      // Layer 4: Length and complexity analysis
      const complexityResult = this.analyzeMessageComplexity(message, context);
      if (complexityResult) return complexityResult;

      // Default safe result
      return {
        isSafe: true,
        severity: 0,
        reason: 'Fallback validation passed - no concerns detected',
        action: 'allow',
        flaggedTerms: ['fallback_validated'],
        fallbackUsed: true,
      };
    } catch (error) {
      console.error('Fallback safety validation error:', error);

      // Ultra-safe fallback
      return {
        isSafe: false,
        severity: 2,
        reason: 'Fallback system error - using maximum safety',
        action: 'warn',
        flaggedTerms: ['system_error'],
        fallbackUsed: true,
      };
    }
  }

  /**
   * Check critical patterns that require immediate escalation
   */
  private checkCriticalPatterns(
    message: string,
    patterns: any[]
  ): SafetyResult | null {
    for (const pattern of patterns) {
      if (pattern.regex.test(message)) {
        return {
          isSafe: false,
          severity: 3,
          reason: `Critical pattern detected: ${pattern.reason}`,
          action: 'escalate',
          flaggedTerms: [pattern.category, 'fallback_critical'],
          fallbackUsed: true,
        };
      }
    }
    return null;
  }

  /**
   * Enhanced keyword detection with contextual analysis
   */
  private checkEnhancedKeywords(
    message: string,
    _context: SafetyContext
  ): SafetyResult | null {
    const concernKeywords = [
      // Self-harm indicators
      {
        terms: ['hurt myself', 'want to die', 'kill myself', 'end it all'],
        severity: 3,
        reason: 'Self-harm language detected',
      },

      // Abuse indicators
      {
        terms: [
          'someone hurt me',
          'touched me',
          'inappropriate touch',
          'secret touching',
        ],
        severity: 3,
        reason: 'Potential abuse indicators',
      },

      // Bullying indicators
      {
        terms: [
          'everyone hates me',
          'nobody likes me',
          'they all laugh',
          'pick on me',
        ],
        severity: 2,
        reason: 'Potential bullying indicators',
      },

      // Substance concerns
      {
        terms: ['smoking', 'drinking', 'drugs', 'vaping', 'beer', 'wine'],
        severity: 2,
        reason: 'Substance mention detected',
      },

      // Age-inappropriate content
      {
        terms: ['sex', 'sexual', 'porn', 'naked', 'private parts'],
        severity: 2,
        reason: 'Age-inappropriate content',
      },
    ];

    const lowerMessage = message.toLowerCase();

    for (const keyword of concernKeywords) {
      for (const term of keyword.terms) {
        if (lowerMessage.includes(term)) {
          return {
            isSafe: false,
            severity: keyword.severity,
            reason: keyword.reason,
            action: keyword.severity >= 3 ? 'escalate' : 'warn',
            flaggedTerms: [term, 'fallback_keyword'],
            fallbackUsed: true,
          };
        }
      }
    }

    return null;
  }

  /**
   * Analyze behavioral patterns for concerning trends
   */
  private analyzeBehavioralPatterns(
    message: string,
    context: SafetyContext
  ): SafetyResult | null {
    const message_lower = message.toLowerCase();

    // Check for excessive negative emotion
    const negativeWords = [
      'hate',
      'angry',
      'mad',
      'sad',
      'upset',
      'frustrated',
      'terrible',
      'awful',
      'horrible',
    ];
    const negativeCount = negativeWords.filter(word =>
      message_lower.includes(word)
    ).length;

    if (negativeCount >= 3) {
      return {
        isSafe: true,
        severity: 1,
        reason: 'High negative emotion detected - monitoring for support needs',
        action: 'allow',
        flaggedTerms: ['high_negative_emotion', 'fallback_behavioral'],
        fallbackUsed: true,
      };
    }

    // Check for repetitive concerning topics
    if (context.recentMessages && context.recentMessages.length >= 3) {
      const recentText = context.recentMessages.join(' ').toLowerCase();
      const concerningTopics = ['hurt', 'pain', 'alone', 'scared', 'worried'];

      let topicCount = 0;
      for (const topic of concerningTopics) {
        if (recentText.split(topic).length - 1 >= 3) {
          topicCount++;
        }
      }

      if (topicCount >= 2) {
        return {
          isSafe: true,
          severity: 2,
          reason: 'Repetitive concerning topics detected - needs attention',
          action: 'warn',
          flaggedTerms: ['repetitive_concern', 'fallback_behavioral'],
          fallbackUsed: true,
        };
      }
    }

    return null;
  }

  /**
   * Analyze message complexity and appropriateness for age
   */
  private analyzeMessageComplexity(
    message: string,
    context: SafetyContext
  ): SafetyResult | null {
    // Check for extremely long messages (possible copy-paste of inappropriate content)
    if (message.length > 1000) {
      return {
        isSafe: false,
        severity: 1,
        reason: 'Extremely long message flagged for review',
        action: 'allow',
        flaggedTerms: ['long_message', 'fallback_complexity'],
        fallbackUsed: true,
      };
    }

    // Check for age-inappropriate vocabulary complexity
    if (context.childAge <= 8) {
      const complexWords = [
        'inappropriate',
        'sophisticated',
        'phenomenon',
        'extraordinary',
        'magnificent',
      ];
      const hasComplexWords = complexWords.some(word =>
        message.toLowerCase().includes(word)
      );

      if (hasComplexWords && message.length > 200) {
        return {
          isSafe: true,
          severity: 1,
          reason:
            'Complex vocabulary for age - monitoring for copy-paste content',
          action: 'allow',
          flaggedTerms: ['complex_vocabulary', 'fallback_complexity'],
          fallbackUsed: true,
        };
      }
    }

    return null;
  }

  /**
   * Set AI service status
   */
  setAIServiceStatus(isDown: boolean): void {
    this.isAIServiceDown = isDown;
    this.lastAICheck = Date.now();
  }

  /**
   * Check if should use fallback
   */
  shouldUseFallback(): boolean {
    // Use fallback if AI service is known to be down
    if (this.isAIServiceDown) {
      return true;
    }

    // Use fallback if we haven't checked AI service recently
    return Date.now() - this.lastAICheck > this.checkInterval;
  }

  /**
   * Get fallback system status
   */
  getStatus() {
    return {
      isAIServiceDown: this.isAIServiceDown,
      lastAICheck: this.lastAICheck,
      shouldUseFallback: this.shouldUseFallback(),
      uptime: Date.now() - this.lastAICheck,
    };
  }
}

// Global fallback system instance
export const safetyFallback = new SafetyFallbackSystem();
