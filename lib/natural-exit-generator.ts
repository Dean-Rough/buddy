import exitResponses from '@/config/time-limit-responses.json';

export interface ExitContext {
  childAge: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'weekend';
  conversationTone: 'excited' | 'calm' | 'learning' | 'casual';
  isWeekend: boolean;
}

/**
 * Natural exit message generator using age-appropriate responses
 */
export class NaturalExitGenerator {
  /**
   * Generate a natural exit message based on context
   */
  static generateNaturalExit(
    context: ExitContext,
    warningLevel: 'gentle' | 'preparation' | 'final'
  ): string {
    const ageGroup = this.getAgeGroup(context.childAge);
    const timeCategory = this.getTimeCategory(
      context.timeOfDay,
      context.isWeekend
    );

    if (warningLevel === 'final') {
      return this.generateFinalExit(ageGroup, timeCategory, context);
    } else {
      return this.generateWarningMessage(ageGroup, warningLevel, context);
    }
  }

  /**
   * Get age group key for response lookup
   */
  private static getAgeGroup(age: number): '7-8' | '9-10' | '11-12' {
    if (age <= 8) return '7-8';
    if (age <= 10) return '9-10';
    return '11-12';
  }

  /**
   * Get time category for exit reason selection
   */
  private static getTimeCategory(
    timeOfDay: string,
    isWeekend: boolean
  ): string {
    if (isWeekend) return 'weekend';

    const _ageGroupCategories = {
      '7-8': {
        morning: 'morning',
        afternoon: 'afternoon',
        evening: 'evening',
      },
      '9-10': {
        morning: 'school_day',
        afternoon: 'school_day',
        evening: 'evening',
      },
      '11-12': {
        morning: 'weekday',
        afternoon: 'weekday',
        evening: 'social',
      },
    };

    return timeOfDay;
  }

  /**
   * Generate final exit message with natural reason
   */
  private static generateFinalExit(
    ageGroup: '7-8' | '9-10' | '11-12',
    _timeCategory: string,
    context: ExitContext
  ): string {
    // Get appropriate exit reasons for age and time
    const exitReasons = exitResponses.exitReasons[ageGroup];
    const reasonsForTime =
      (exitReasons as any)[_timeCategory] ||
      (exitReasons as any)['weekend'] ||
      (exitReasons as any)[Object.keys(exitReasons)[0]];

    // Select random reason
    const selectedReason =
      reasonsForTime[Math.floor(Math.random() * reasonsForTime.length)];

    // Get conversation ender template
    const conversationEnders = exitResponses.conversationEnders[ageGroup];
    const finalTemplates = conversationEnders.final;
    const selectedTemplate =
      finalTemplates[Math.floor(Math.random() * finalTemplates.length)];

    // Replace {reason} placeholder
    const finalMessage = selectedTemplate.replace('{reason}', selectedReason);

    // Add follow-up suggestion
    const followUps = exitResponses.followUpSuggestions[ageGroup];
    const followUp = followUps[Math.floor(Math.random() * followUps.length)];

    return `${finalMessage} ${followUp}`;
  }

  /**
   * Generate warning message (gentle/preparation)
   */
  private static generateWarningMessage(
    ageGroup: '7-8' | '9-10' | '11-12',
    warningLevel: 'gentle' | 'preparation',
    context: ExitContext
  ): string {
    const conversationEnders = exitResponses.conversationEnders[ageGroup];
    const templates = conversationEnders[warningLevel];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Get current time context
   */
  static getCurrentTimeContext(
    __isWeekend: boolean = false
  ): ExitContext['timeOfDay'] {
    const hour = new Date().getHours();

    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  /**
   * Determine conversation tone from recent messages
   */
  static analyzeConversationTone(
    emotionalState: 'excited' | 'sad' | 'anxious' | 'calm' | 'neutral',
    topicDepth: 'surface' | 'deep' | 'personal',
    ___isAskingQuestions: boolean
  ): ExitContext['conversationTone'] {
    if (emotionalState === 'excited') return 'excited';
    if (topicDepth === 'deep' || topicDepth === 'personal') return 'learning';
    if (emotionalState === 'calm') return 'calm';
    return 'casual';
  }

  /**
   * Check if conversation can override time limits
   */
  static shouldAllowOverride(
    conversationContext: any,
    strictnessLevel: 'flexible' | 'balanced' | 'strict' = 'balanced'
  ): boolean {
    const importanceOverrides = exitResponses.importanceOverrides;
    const _strictnessConfig = exitResponses.strictnessLevels[strictnessLevel];

    // Check for emotional support needs
    if (
      conversationContext.emotionalState === 'sad' ||
      conversationContext.emotionalState === 'anxious'
    ) {
      return importanceOverrides.emotional_support.allowOverrun;
    }

    // Check for learning discussions
    if (
      conversationContext.topicDepth === 'deep' &&
      conversationContext.isAskingQuestions
    ) {
      return importanceOverrides.learning_discussion.allowOverrun;
    }

    // Check for creative collaboration
    if (conversationContext.isInMiddleOfStory) {
      return importanceOverrides.creative_collaboration.allowOverrun;
    }

    // Check for social problem solving
    if (conversationContext.isDiscussingImportantTopic) {
      return importanceOverrides.social_problem_solving.allowOverrun;
    }

    return false;
  }

  /**
   * Get maximum override time in minutes
   */
  static getMaxOverrideTime(
    conversationContext: any,
    strictnessLevel: 'flexible' | 'balanced' | 'strict' = 'balanced'
  ): number {
    const importanceOverrides = exitResponses.importanceOverrides;
    const _strictnessConfig = exitResponses.strictnessLevels[strictnessLevel];

    if (
      conversationContext.emotionalState === 'sad' ||
      conversationContext.emotionalState === 'anxious'
    ) {
      return importanceOverrides.emotional_support.maxOverrunMinutes;
    }

    if (
      conversationContext.topicDepth === 'deep' &&
      conversationContext.isAskingQuestions
    ) {
      return importanceOverrides.learning_discussion.maxOverrunMinutes;
    }

    if (conversationContext.isInMiddleOfStory) {
      return importanceOverrides.creative_collaboration.maxOverrunMinutes;
    }

    if (conversationContext.isDiscussingImportantTopic) {
      return importanceOverrides.social_problem_solving.maxOverrunMinutes;
    }

    return _strictnessConfig.maxDailyOverrun;
  }

  private static getExitReasonByTimeContext(
    _timeCategory: string,
    _context: any
  ): string {
    return 'hey, getting a bit tired now - thanks for hanging out!';
  }

  private static getExitReasonByConversationTone(
    _tone: string,
    _context: any
  ): string {
    return 'this has been awesome - catch you later!';
  }

  private static getExitReasonByChildAge(
    _childAge: number,
    ___isWeekend: boolean = false
  ): string {
    return 'time to wrap up - thanks for the chat!';
  }
}
