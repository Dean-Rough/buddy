import { ConversationContext } from './time-management';
import { NaturalExitGenerator, ExitContext } from './natural-exit-generator';

/**
 * Context-aware warning system that analyzes conversation state
 * to determine optimal timing for time warnings and endings
 */
export class ContextAwareWarnings {
  /**
   * Analyze current conversation context to determine if it's a good time for warnings
   */
  static analyzeConversationContext(
    recentMessages: Array<{
      content: string;
      role: 'child' | 'assistant';
      createdAt: Date;
    }>,
    childAge: number
  ): ConversationContext {
    const lastMessage = recentMessages[0];
    const last3Messages = recentMessages.slice(0, 3);
    const last5Messages = recentMessages.slice(0, 5);

    return {
      isInMiddleOfStory: this.detectStoryInProgress(last5Messages),
      isDiscussingImportantTopic: this.detectImportantTopic(
        last3Messages,
        childAge
      ),
      emotionalState: this.detectEmotionalState(last3Messages),
      recentMessageLength: lastMessage?.content.length || 0,
      isAskingQuestions: this.detectQuestionAsking(last3Messages),
      topicDepth: this.analyzeTopicDepth(last5Messages),
    };
  }

  /**
   * Detect if child is in the middle of telling a story
   */
  private static detectStoryInProgress(
    messages: Array<{ content: string; role: string }>
  ): boolean {
    const childMessages = messages.filter(m => m.role === 'child');

    if (childMessages.length === 0) return false;

    const recentContent = childMessages
      .slice(0, 2)
      .map(m => m.content)
      .join(' ')
      .toLowerCase();

    // Story continuation indicators
    const storyIndicators = [
      'and then',
      'after that',
      'next',
      'suddenly',
      'but then',
      'meanwhile',
      'later',
      'first',
      'second',
      'finally',
      'once upon a time',
      'so anyway',
      'but wait',
      'let me tell you about',
      'this reminds me of',
      'continuing the story',
      'chapter',
      'part',
    ];

    // Narrative patterns
    const narrativePatterns = [
      /and (then|next|after)/,
      /(first|second|third|finally)/,
      /(so|but|and) (then|next)/,
      /let me (tell|explain)/,
      /(this|that) reminds me/,
    ];

    // Check for story indicators
    const hasStoryIndicators = storyIndicators.some(indicator =>
      recentContent.includes(indicator)
    );

    // Check for narrative patterns
    const hasNarrativePatterns = narrativePatterns.some(pattern =>
      pattern.test(recentContent)
    );

    // Check for incomplete thoughts (ending with "and", "but", "so")
    const endsWithContinuation = /\b(and|but|so|then|because)\s*$/.test(
      recentContent
    );

    return hasStoryIndicators || hasNarrativePatterns || endsWithContinuation;
  }

  /**
   * Detect if conversation involves important topics that shouldn't be interrupted
   */
  private static detectImportantTopic(
    messages: Array<{ content: string; role: string }>,
    childAge: number
  ): boolean {
    const allContent = messages
      .map(m => m.content)
      .join(' ')
      .toLowerCase();

    // Age-appropriate important topics
    const importantTopics = {
      universal: [
        'sad',
        'scared',
        'worried',
        'afraid',
        'upset',
        'angry',
        'bullying',
        'bully',
        'mean',
        'hurt',
        'crying',
        'family',
        'mom',
        'dad',
        'parent',
        'divorce',
        'moving',
        'death',
        'died',
        'sick',
        'hospital',
        'doctor',
        'school problem',
        'trouble',
        'fight',
        'argument',
        'feeling bad',
        'depressed',
        'anxious',
        'nervous',
        'secret',
        'private',
        'personal',
        'important',
      ],
      older:
        childAge >= 10
          ? [
              'friend drama',
              'friendship',
              'relationship',
              'identity',
              'growing up',
              'changing',
              'future',
              'career',
              'dreams',
              'goals',
              'pressure',
              'stress',
              'expectations',
            ]
          : [],
    };

    const allImportantTopics = [
      ...importantTopics.universal,
      ...importantTopics.older,
    ];

    // Check for emotional processing phrases
    const emotionalProcessing = [
      'i feel like',
      'i think about',
      'i wonder if',
      "i'm confused about",
      "i don't understand",
      'it makes me feel',
      "i'm worried that",
      'i need to talk about',
      'can i tell you',
    ];

    const hasImportantTopic = allImportantTopics.some(topic =>
      allContent.includes(topic)
    );

    const hasEmotionalProcessing = emotionalProcessing.some(phrase =>
      allContent.includes(phrase)
    );

    return hasImportantTopic || hasEmotionalProcessing;
  }

  /**
   * Detect emotional state from recent messages
   */
  private static detectEmotionalState(
    messages: Array<{ content: string; role: string }>
  ): 'excited' | 'sad' | 'anxious' | 'calm' | 'neutral' {
    const childMessages = messages.filter(m => m.role === 'child');
    if (childMessages.length === 0) return 'neutral';

    const content = childMessages
      .map(m => m.content)
      .join(' ')
      .toLowerCase();

    // Emotional indicators
    const emotionalMarkers = {
      excited: [
        '!!!',
        'wow',
        'amazing',
        'awesome',
        'cool',
        'yes!',
        'omg',
        'epic',
        'fantastic',
        'love it',
        'so fun',
        "can't wait",
        'exciting',
        'yay',
        'woohoo',
      ],
      sad: [
        'sad',
        'upset',
        'crying',
        'tears',
        'depressed',
        'down',
        'blue',
        'unhappy',
        'miserable',
        'hurt',
        'disappointed',
        'lonely',
        'miss',
        'wish',
      ],
      anxious: [
        'worried',
        'scared',
        'afraid',
        'nervous',
        'anxious',
        'panic',
        'stress',
        'concerned',
        'fear',
        'terrified',
        'overwhelmed',
        'pressure',
        'tense',
        'uneasy',
      ],
      calm: [
        'peaceful',
        'relaxed',
        'calm',
        'content',
        'serene',
        'comfortable',
        'at ease',
        'tranquil',
        'steady',
        'balanced',
        'centered',
        'quiet',
      ],
    };

    // Check for emotional patterns
    for (const [emotion, markers] of Object.entries(emotionalMarkers)) {
      const markerCount = markers.filter(marker =>
        content.includes(marker)
      ).length;
      if (markerCount >= 1) {
        return emotion as any;
      }
    }

    // Check punctuation and capitalization for excitement
    const exclamationCount = (content.match(/!/g) || []).length;
    const capsWords = (content.match(/[A-Z]{2,}/g) || []).length;

    if (exclamationCount >= 2 || capsWords >= 1) {
      return 'excited';
    }

    return 'neutral';
  }

  /**
   * Detect if child is actively asking questions
   */
  private static detectQuestionAsking(
    messages: Array<{ content: string; role: string }>
  ): boolean {
    const childMessages = messages.filter(m => m.role === 'child');
    if (childMessages.length === 0) return false;

    const recentContent = childMessages[0].content;

    // Question indicators
    const questionMarkers = [
      '?',
      'what',
      'how',
      'why',
      'when',
      'where',
      'who',
      'can you',
      'do you',
      'will you',
      'could you',
      'tell me',
      'explain',
      'help me understand',
    ];

    return questionMarkers.some(marker =>
      recentContent.toLowerCase().includes(marker)
    );
  }

  /**
   * Analyze depth of current topic discussion
   */
  private static analyzeTopicDepth(
    messages: Array<{ content: string; role: string }>
  ): 'surface' | 'deep' | 'personal' {
    const allContent = messages
      .map(m => m.content)
      .join(' ')
      .toLowerCase();

    // Personal depth indicators
    const personalIndicators = [
      'i feel',
      'i think',
      'i believe',
      'in my opinion',
      'personally',
      'for me',
      'i experience',
      'i worry',
      'i love',
      'i hate',
      'i fear',
      'i hope',
      'my family',
      'my life',
      'my experience',
    ];

    // Deep discussion indicators
    const deepIndicators = [
      'because',
      'the reason',
      'it means',
      'it represents',
      'for example',
      'like when',
      'similar to',
      'different from',
      'connects to',
      'reminds me of',
      'makes me think',
      'philosophy',
      'meaning',
      'purpose',
      'significance',
    ];

    const personalCount = personalIndicators.filter(indicator =>
      allContent.includes(indicator)
    ).length;

    const deepCount = deepIndicators.filter(indicator =>
      allContent.includes(indicator)
    ).length;

    if (personalCount >= 2) return 'personal';
    if (deepCount >= 2 || personalCount >= 1) return 'deep';
    return 'surface';
  }

  /**
   * Generate context-aware time warning that fits the conversation flow
   */
  static generateContextualWarning(
    context: ConversationContext,
    minutesRemaining: number,
    childAge: number
  ): string {
    // Don't interrupt important moments
    if (context.isInMiddleOfStory) {
      return ''; // Return empty - will be handled by calling code
    }

    if (context.isDiscussingImportantTopic) {
      return ''; // Let them finish the important conversation
    }

    // Emotional state-appropriate warnings
    if (
      context.emotionalState === 'sad' ||
      context.emotionalState === 'anxious'
    ) {
      return ''; // Don't warn during emotional moments
    }

    // Determine warning level based on time remaining
    let warningLevel: 'gentle' | 'preparation' | 'final';
    if (minutesRemaining <= 2) {
      warningLevel = 'preparation';
    } else if (minutesRemaining <= 5) {
      warningLevel = 'gentle';
    } else {
      return this.generateDefaultWarning(minutesRemaining, childAge, context);
    }

    // Use natural exit generator for warnings
    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    const exitContext: ExitContext = {
      childAge,
      timeOfDay: NaturalExitGenerator.getCurrentTimeContext(isWeekend),
      conversationTone: NaturalExitGenerator.analyzeConversationTone(
        context.emotionalState,
        context.topicDepth,
        context.isAskingQuestions
      ),
      isWeekend,
    };

    const naturalWarning = NaturalExitGenerator.generateNaturalExit(
      exitContext,
      warningLevel
    );

    // Fallback to emotional state warnings for edge cases
    if (context.emotionalState === 'excited') {
      return this.generateExcitedWarning(minutesRemaining, childAge);
    }

    if (context.isAskingQuestions) {
      return this.generateQuestionWarning(minutesRemaining, childAge);
    }

    return (
      naturalWarning ||
      this.generateDefaultWarning(minutesRemaining, childAge, context)
    );
  }

  /**
   * Generate warning for excited children
   */
  private static generateExcitedWarning(
    minutesRemaining: number,
    _childAge: number
  ): string {
    const timeStr =
      minutesRemaining === 1 ? '1 minute' : `${minutesRemaining} minutes`;

    const excitedWarnings = [
      `I love how excited you are! We have ${timeStr} left - what's the most important thing to talk about?`,
      `Your enthusiasm is awesome! Just ${timeStr} left today - let's make it count!`,
      `This is so much fun! We've got ${timeStr} more - what should we focus on?`,
    ];

    return excitedWarnings[Math.floor(Math.random() * excitedWarnings.length)];
  }

  /**
   * Generate warning when child is asking questions
   */
  private static generateQuestionWarning(
    minutesRemaining: number,
    _childAge: number
  ): string {
    const timeStr =
      minutesRemaining === 1 ? '1 minute' : `${minutesRemaining} minutes`;

    const questionWarnings = [
      `Great question! We have ${timeStr} left, so let me give you a good answer.`,
      `I love your curiosity! ${timeStr} remaining - let's explore this together.`,
      `That's a thoughtful question! We have ${timeStr} to dive into this.`,
    ];

    return questionWarnings[
      Math.floor(Math.random() * questionWarnings.length)
    ];
  }

  /**
   * Generate default contextual warning
   */
  private static generateDefaultWarning(
    minutesRemaining: number,
    childAge: number,
    _context: ConversationContext
  ): string {
    const timeStr =
      minutesRemaining === 1 ? '1 minute' : `${minutesRemaining} minutes`;

    // Age-appropriate language
    if (childAge <= 8) {
      const youngWarnings = [
        `Hey buddy! We have ${timeStr} left to play. What should we do?`,
        `Just so you know, ${timeStr} more and then break time! What's next?`,
        `Time check! ${timeStr} left for our fun chat today!`,
      ];
      return youngWarnings[Math.floor(Math.random() * youngWarnings.length)];
    }

    if (childAge <= 10) {
      const middleWarnings = [
        `Quick heads up - ${timeStr} left today. Anything important to chat about?`,
        `We've got ${timeStr} remaining. What would you like to focus on?`,
        `Just letting you know - ${timeStr} left for today's conversation.`,
      ];
      return middleWarnings[Math.floor(Math.random() * middleWarnings.length)];
    }

    // Older children (11-12)
    const olderWarnings = [
      `Hey, we have ${timeStr} left today. Want to wrap up or start something new?`,
      `Time update: ${timeStr} remaining. What's most important to you right now?`,
      `${timeStr} left in our chat time today. What would you like to prioritize?`,
    ];
    return olderWarnings[Math.floor(Math.random() * olderWarnings.length)];
  }

  /**
   * Determine optimal timing for next warning based on context
   */
  static getNextWarningDelay(_context: ConversationContext): number {
    // Delay warnings during important moments
    if (_context.isInMiddleOfStory || _context.isDiscussingImportantTopic) {
      return 5; // Check again in 5 minutes
    }

    // More frequent warnings for surface-level chats
    if (_context.topicDepth === 'surface') {
      return 2; // Check every 2 minutes
    }

    // Standard warning interval
    return 3; // Check every 3 minutes
  }

  /**
   * Check if it's a good time to end conversation gracefully
   */
  static isGoodTimeToEnd(_context: ConversationContext): boolean {
    // Never end during important conversations
    if (_context.isInMiddleOfStory || _context.isDiscussingImportantTopic) {
      return false;
    }

    // Don't end during emotional support moments
    if (
      _context.emotionalState === 'sad' ||
      _context.emotionalState === 'anxious'
    ) {
      return false;
    }

    // Good time to end: surface conversation, neutral/calm state
    return (
      _context.topicDepth === 'surface' &&
      (_context.emotionalState === 'neutral' ||
        _context.emotionalState === 'calm')
    );
  }

  /**
   * Generate graceful conversation ending based on context
   */
  static generateGracefulEnding(
    _context: ConversationContext,
    childAge: number,
    _behavior: 'gradual' | 'warning_only' | 'hard_stop'
  ): string {
    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    const exitContext: ExitContext = {
      childAge,
      timeOfDay: NaturalExitGenerator.getCurrentTimeContext(isWeekend),
      conversationTone: NaturalExitGenerator.analyzeConversationTone(
        _context.emotionalState,
        _context.topicDepth,
        _context.isAskingQuestions
      ),
      isWeekend,
    };

    return NaturalExitGenerator.generateNaturalExit(exitContext, 'final');
  }
}
