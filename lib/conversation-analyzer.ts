import { ConversationContext } from './time-management';

export interface ConversationImportance {
  score: number; // 0.0 to 1.0
  category: 'trivial' | 'casual' | 'educational' | 'emotional' | 'critical';
  factors: string[];
  canOverride: boolean;
  maxOverrideMinutes: number;
}

export interface ConversationFlow {
  hasOpenLoop: boolean;
  isBuilding: boolean;
  needsClosure: boolean;
  interruptibility: 'high' | 'medium' | 'low';
}

/**
 * Advanced conversation analysis for intelligent time management
 */
export class ConversationAnalyzer {
  /**
   * Analyze conversation importance for time override decisions
   */
  static analyzeImportance(
    context: ConversationContext,
    recentMessages: Array<{ content: string; role: string; createdAt: Date }>,
    childAge: number
  ): ConversationImportance {
    const factors: string[] = [];
    let score = 0.0;

    // Emotional state analysis (highest priority)
    if (
      context.emotionalState === 'sad' ||
      context.emotionalState === 'anxious'
    ) {
      score += 0.4;
      factors.push('emotional_support_needed');
    }

    // Educational content detection
    const educationalScore = this.detectEducationalContent(
      recentMessages,
      childAge
    );
    score += educationalScore * 0.3;
    if (educationalScore > 0.5) {
      factors.push('active_learning');
    }

    // Important topic discussion
    if (context.isDiscussingImportantTopic) {
      score += 0.25;
      factors.push('important_topic');
    }

    // Story progression
    if (context.isInMiddleOfStory) {
      score += 0.2;
      factors.push('story_in_progress');
    }

    // Topic depth consideration
    switch (context.topicDepth) {
      case 'personal':
        score += 0.2;
        factors.push('personal_sharing');
        break;
      case 'deep':
        score += 0.15;
        factors.push('deep_discussion');
        break;
    }

    // Active questioning (learning mode)
    if (context.isAskingQuestions) {
      score += 0.1;
      factors.push('active_questioning');
    }

    // Recent message analysis
    const recentEngagement = this.analyzeRecentEngagement(recentMessages);
    score += recentEngagement * 0.15;
    if (recentEngagement > 0.7) {
      factors.push('high_engagement');
    }

    // Normalize score
    score = Math.min(1.0, score);

    // Determine category and override policy
    const { category, canOverride, maxOverrideMinutes } =
      this.categorizeImportance(score, factors);

    return {
      score,
      category,
      factors,
      canOverride,
      maxOverrideMinutes,
    };
  }

  /**
   * Detect educational content in conversation
   */
  private static detectEducationalContent(
    messages: Array<{ content: string; role: string }>,
    childAge: number
  ): number {
    const recentContent = messages
      .slice(0, 5)
      .map(m => m.content)
      .join(' ')
      .toLowerCase();

    let educationalScore = 0;

    // Educational keywords by age group
    const educationalIndicators = {
      universal: [
        'learn',
        'teach',
        'explain',
        'understand',
        'how does',
        'why does',
        'what happens when',
        'can you help me with',
        'homework',
        'school',
        'practice',
        'study',
        'read',
        'book',
        'science',
        'math',
        'history',
      ],
      younger:
        childAge <= 9
          ? [
              'count',
              'spell',
              'letter',
              'number',
              'color',
              'shape',
              'animal',
              'plant',
              'weather',
              'family',
              'friend',
            ]
          : [],
      older:
        childAge >= 10
          ? [
              'research',
              'project',
              'experiment',
              'theory',
              'evidence',
              'analysis',
              'compare',
              'contrast',
              'opinion',
              'argument',
              'philosophy',
              'psychology',
              'geography',
              'biology',
            ]
          : [],
    };

    const allIndicators = [
      ...educationalIndicators.universal,
      ...educationalIndicators.younger,
      ...educationalIndicators.older,
    ];

    // Count educational indicators
    const matchCount = allIndicators.filter(indicator =>
      recentContent.includes(indicator)
    ).length;

    educationalScore = Math.min(1.0, matchCount * 0.15);

    // Boost for question patterns
    const questionPatterns = [
      /how (do|does|can|will)/g,
      /why (do|does|is|are)/g,
      /what (is|are|happens|would)/g,
      /where (do|does|is|are)/g,
      /when (do|does|is|are)/g,
    ];

    const questionMatches = questionPatterns
      .map(pattern => (recentContent.match(pattern) || []).length)
      .reduce((sum, count) => sum + count, 0);

    educationalScore += Math.min(0.3, questionMatches * 0.1);

    return Math.min(1.0, educationalScore);
  }

  /**
   * Analyze recent message engagement levels
   */
  private static analyzeRecentEngagement(
    messages: Array<{ content: string; role: string; createdAt: Date }>
  ): number {
    if (messages.length < 3) return 0.5; // Default for short conversations

    const recent = messages.slice(0, 5);
    let engagementScore = 0;

    // Message length analysis
    const avgLength =
      recent.map(m => m.content.length).reduce((sum, len) => sum + len, 0) /
      recent.length;

    if (avgLength > 100) engagementScore += 0.3;
    else if (avgLength > 50) engagementScore += 0.2;
    else if (avgLength > 20) engagementScore += 0.1;

    // Message frequency (time between messages)
    if (recent.length >= 2) {
      const timeDiffs = [];
      for (let i = 0; i < recent.length - 1; i++) {
        const diff =
          recent[i].createdAt.getTime() - recent[i + 1].createdAt.getTime();
        timeDiffs.push(diff / 1000); // Convert to seconds
      }

      const avgTimeBetween =
        timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;

      // Faster responses indicate higher engagement
      if (avgTimeBetween < 30) engagementScore += 0.3;
      else if (avgTimeBetween < 60) engagementScore += 0.2;
      else if (avgTimeBetween < 120) engagementScore += 0.1;
    }

    // Content richness (detailed responses)
    const contentRichness = recent
      .map(m => m.content)
      .join(' ')
      .toLowerCase();

    const richnessIndicators = [
      'because',
      'however',
      'although',
      'for example',
      'such as',
      'especially',
      'particularly',
      'specifically',
      'actually',
      'basically',
      'essentially',
      'definitely',
      'absolutely',
    ];

    const richnessCount = richnessIndicators.filter(indicator =>
      contentRichness.includes(indicator)
    ).length;

    engagementScore += Math.min(0.4, richnessCount * 0.1);

    return Math.min(1.0, engagementScore);
  }

  /**
   * Categorize conversation importance and set override policy
   */
  private static categorizeImportance(
    score: number,
    factors: string[]
  ): {
    category: ConversationImportance['category'];
    canOverride: boolean;
    maxOverrideMinutes: number;
  } {
    // Critical: Always allow override
    if (factors.includes('emotional_support_needed')) {
      return {
        category: 'critical',
        canOverride: true,
        maxOverrideMinutes: 20,
      };
    }

    // High importance: Educational or deep personal
    if (score >= 0.7 || factors.includes('active_learning')) {
      return {
        category: 'educational',
        canOverride: true,
        maxOverrideMinutes: 15,
      };
    }

    // Medium importance: Engaged conversation
    if (
      score >= 0.5 ||
      factors.includes('story_in_progress') ||
      factors.includes('important_topic')
    ) {
      return {
        category: 'emotional',
        canOverride: true,
        maxOverrideMinutes: 10,
      };
    }

    // Low importance: Casual chat
    if (score >= 0.3) {
      return {
        category: 'casual',
        canOverride: false,
        maxOverrideMinutes: 5,
      };
    }

    // Trivial: Easy to interrupt
    return {
      category: 'trivial',
      canOverride: false,
      maxOverrideMinutes: 0,
    };
  }

  /**
   * Analyze conversation flow for optimal interruption timing
   */
  static analyzeConversationFlow(
    messages: Array<{ content: string; role: string }>,
    context: ConversationContext
  ): ConversationFlow {
    const recent = messages.slice(0, 3);
    const lastMessage = recent[0];

    // Check for open loops (unfinished thoughts)
    const hasOpenLoop = this.detectOpenLoop(lastMessage?.content || '');

    // Check if conversation is building up
    const isBuilding = this.detectBuildingConversation(recent);

    // Check if conversation needs closure
    const needsClosure =
      context.isInMiddleOfStory ||
      context.isDiscussingImportantTopic ||
      hasOpenLoop;

    // Determine interruptibility
    let interruptibility: ConversationFlow['interruptibility'] = 'high';

    if (
      needsClosure ||
      context.emotionalState === 'sad' ||
      context.emotionalState === 'anxious'
    ) {
      interruptibility = 'low';
    } else if (isBuilding || context.topicDepth === 'deep') {
      interruptibility = 'medium';
    }

    return {
      hasOpenLoop,
      isBuilding,
      needsClosure,
      interruptibility,
    };
  }

  /**
   * Detect open loops in conversation (unfinished thoughts)
   */
  private static detectOpenLoop(lastMessage: string): boolean {
    const openLoopIndicators = [
      /\b(and|but|so|then|because|however|although)\s*$/i,
      /\?\s*$/,
      /\.\.\.\s*$/,
      /\bwait\b/i,
      /\bactually\b/i,
      /\boh\b/i,
      /\bhmm\b/i,
      /\blet me think\b/i,
      /\bby the way\b/i,
      /\bone more thing\b/i,
    ];

    return openLoopIndicators.some(pattern => pattern.test(lastMessage));
  }

  /**
   * Detect if conversation is building momentum
   */
  private static detectBuildingConversation(
    messages: Array<{ content: string; role: string }>
  ): boolean {
    if (messages.length < 3) return false;

    // Check for increasing message length (sign of engagement)
    const lengths = messages.map(m => m.content.length);
    const isLengthIncreasing =
      lengths[0] > lengths[1] && lengths[1] > lengths[2];

    // Check for building vocabulary complexity
    const content = messages
      .map(m => m.content)
      .join(' ')
      .toLowerCase();
    const buildingIndicators = [
      'tell me more',
      'what else',
      'and then',
      'also',
      'another thing',
      'speaking of',
      'that reminds me',
      'similarly',
      'in addition',
      'furthermore',
    ];

    const hasBuildingIndicators = buildingIndicators.some(indicator =>
      content.includes(indicator)
    );

    return isLengthIncreasing || hasBuildingIndicators;
  }
}
