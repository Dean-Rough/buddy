/**
 * Topic Analysis & Natural Transition Detection
 * AI-powered system for understanding conversation flow and optimal bridging moments
 */

import {
  ConversationTopic,
  ConversationMessage,
  // ConversationContext, // TODO: Used for conversation context analysis
  ContextAnalysis,
  // TopicTransition, // TODO: Used for topic transition analysis
} from './types';

interface TopicDetectionResult {
  topic: ConversationTopic;
  confidence: number; // 0-1
  keywords: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  engagement: number; // 1-10
}

interface TransitionSignal {
  type:
    | 'topic_exhaustion'
    | 'natural_pause'
    | 'question_bridge'
    | 'interest_shift'
    | 'energy_change';
  strength: number; // 1-10
  detected_at: number; // Message index
  indicators: string[];
}

interface ConversationPattern {
  childAccountId: string;
  typicalTopicDuration: number; // average messages per topic
  preferredTransitionTypes: string[];
  attentionSpanPattern: number[]; // engagement over time
  topicSwitchingBehavior: 'gradual' | 'abrupt' | 'guided';
  engagementTriggers: string[];
}

/**
 * Advanced Topic Analysis System
 * Uses NLP and conversation patterns to understand and predict topic flow
 */
export class TopicAnalyzer {
  private topicDatabase: Map<string, ConversationTopic> = new Map();
  private conversationPatterns: Map<string, ConversationPattern> = new Map();

  // Topic detection keywords and weights
  private topicKeywords = {
    school: {
      primary: [
        'school',
        'teacher',
        'homework',
        'class',
        'student',
        'lesson',
        'test',
        'grade',
      ],
      secondary: [
        'math',
        'reading',
        'science',
        'friend',
        'lunch',
        'recess',
        'playground',
      ],
      context: ['today', 'yesterday', 'tomorrow', 'week'],
      weight: 1.0,
    },
    family: {
      primary: [
        'mom',
        'dad',
        'family',
        'home',
        'dinner',
        'parent',
        'sibling',
        'brother',
        'sister',
      ],
      secondary: [
        'grandma',
        'grandpa',
        'uncle',
        'aunt',
        'cousin',
        'together',
        'house',
      ],
      context: ['we', 'us', 'our', 'family'],
      weight: 1.2,
    },
    hobbies: {
      primary: [
        'game',
        'play',
        'sport',
        'hobby',
        'activity',
        'fun',
        'enjoy',
        'like',
      ],
      secondary: [
        'soccer',
        'basketball',
        'art',
        'music',
        'dance',
        'build',
        'create',
      ],
      context: ['favorite', 'best', 'love', 'awesome'],
      weight: 1.1,
    },
    emotions: {
      primary: [
        'feel',
        'happy',
        'sad',
        'angry',
        'scared',
        'excited',
        'worried',
        'proud',
      ],
      secondary: [
        'emotion',
        'feeling',
        'heart',
        'mind',
        'think',
        'hope',
        'wish',
      ],
      context: ['because', 'when', 'if', 'sometimes'],
      weight: 1.3,
    },
    weekend: {
      primary: [
        'weekend',
        'saturday',
        'sunday',
        'vacation',
        'trip',
        'visit',
        'park',
      ],
      secondary: [
        'movie',
        'beach',
        'mall',
        'zoo',
        'museum',
        'restaurant',
        'adventure',
      ],
      context: ['going', 'went', 'will', 'plan'],
      weight: 1.0,
    },
    friends: {
      primary: [
        'friend',
        'buddy',
        'pal',
        'playdate',
        'party',
        'birthday',
        'invite',
      ],
      secondary: [
        'share',
        'together',
        'group',
        'team',
        'club',
        'talk',
        'laugh',
      ],
      context: ['with', 'and', 'we', 'they'],
      weight: 1.1,
    },
  };

  // Transition signal patterns
  private transitionSignals = {
    topic_exhaustion: [
      'anyway',
      'so',
      'well',
      'um',
      'uh',
      'i guess',
      'i dont know',
      'thats all',
      'nothing else',
      'whatever',
      'yeah sure',
    ],
    natural_pause: [
      'what else',
      'what now',
      'whats next',
      'anything else',
      'what should we talk about',
      'i dont know what to say',
    ],
    question_bridge: [
      'what about you',
      'do you',
      'have you',
      'what do you think',
      'can you',
      'will you',
      'tell me about',
    ],
    interest_shift: [
      'oh',
      'actually',
      'wait',
      'also',
      'by the way',
      'speaking of',
      'that reminds me',
      'i just remembered',
    ],
    energy_change: [
      'tired',
      'bored',
      'excited',
      'wow',
      'amazing',
      'cool',
      'awesome',
      'boring',
      'whatever',
      'meh',
    ],
  };

  constructor() {
    this.initializeTopicDatabase();
  }

  /**
   * Analyze current conversation context and detect active topics
   */
  async analyzeConversationContext(
    messages: ConversationMessage[],
    childAge: number
  ): Promise<ContextAnalysis> {
    try {
      const recentMessages = messages.slice(-10); // Last 10 messages for context
      // const currentMessage = messages[messages.length - 1]; // TODO: Used for current message analysis

      // Detect current topic
      const topicDetection = await this.detectCurrentTopic(
        recentMessages,
        childAge
      );

      // Analyze emotional state
      const emotionalState = this.analyzeEmotionalState(recentMessages);

      // Calculate engagement level
      const engagementLevel = this.calculateEngagementLevel(recentMessages);

      // Assess bridge readiness
      const bridgeReadiness = this.assessBridgeReadiness(recentMessages);

      // Analyze conversation flow
      const conversationFlow = this.analyzeConversationFlow(recentMessages);

      // Calculate topic saturation
      const topicSaturation = this.calculateTopicSaturation(
        recentMessages,
        topicDetection.topic
      );

      // Detect transition signals
      const transitionSignals = this.detectTransitionSignals(recentMessages);

      return {
        currentTopicConfidence: topicDetection.confidence * 10,
        emotionalState: emotionalState.primary,
        engagementLevel,
        bridgeReadiness,
        conversationFlow: conversationFlow.quality,
        childInterestLevel: engagementLevel,
        topicSaturation,
        transitionSignals: transitionSignals.map(s => s.type),
      };
    } catch (error) {
      console.error('Failed to analyze conversation context:', error);
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Detect the most likely current topic from conversation
   */
  async detectCurrentTopic(
    messages: ConversationMessage[],
    childAge: number
  ): Promise<TopicDetectionResult> {
    const topicScores = new Map<string, number>();
    const detectedKeywords = new Map<string, string[]>();

    // Analyze messages for topic indicators
    for (const message of messages) {
      const messageWords = message.message.toLowerCase().split(/\s+/);

      for (const [topicId, keywords] of Object.entries(this.topicKeywords)) {
        let score = 0;
        const foundKeywords: string[] = [];

        // Check primary keywords (highest weight)
        for (const keyword of keywords.primary) {
          if (messageWords.some(word => word.includes(keyword))) {
            score += keywords.weight * 3;
            foundKeywords.push(keyword);
          }
        }

        // Check secondary keywords (medium weight)
        for (const keyword of keywords.secondary) {
          if (messageWords.some(word => word.includes(keyword))) {
            score += keywords.weight * 2;
            foundKeywords.push(keyword);
          }
        }

        // Check context keywords (low weight)
        for (const keyword of keywords.context) {
          if (messageWords.some(word => word.includes(keyword))) {
            score += keywords.weight * 1;
          }
        }

        // Apply recency weight (recent messages matter more)
        const messageIndex = messages.indexOf(message);
        const recencyMultiplier = 1 + (messageIndex / messages.length) * 0.5;
        score *= recencyMultiplier;

        // Apply age appropriateness
        score *= this.getAgeAppropriatenessMultiplier(topicId, childAge);

        topicScores.set(topicId, (topicScores.get(topicId) || 0) + score);

        if (foundKeywords.length > 0) {
          const existing = detectedKeywords.get(topicId) || [];
          detectedKeywords.set(topicId, [...existing, ...foundKeywords]);
        }
      }
    }

    // Find the highest scoring topic
    const sortedTopics = Array.from(topicScores.entries()).sort(
      (a, b) => b[1] - a[1]
    );

    if (sortedTopics.length === 0) {
      return this.getDefaultTopicDetection();
    }

    const [topicId, score] = sortedTopics[0];
    const topic = this.topicDatabase.get(topicId);

    if (!topic) {
      return this.getDefaultTopicDetection();
    }

    // Calculate confidence based on score distribution
    const totalScore = Array.from(topicScores.values()).reduce(
      (sum, s) => sum + s,
      0
    );
    const confidence = totalScore > 0 ? Math.min(score / totalScore, 1.0) : 0;

    // Analyze sentiment of topic-related messages
    const sentiment = this.analyzeSentimentForTopic(messages, topicId);

    // Calculate engagement for this topic
    const engagement = this.calculateTopicEngagement(messages, topicId);

    return {
      topic,
      confidence,
      keywords: detectedKeywords.get(topicId) || [],
      sentiment,
      engagement,
    };
  }

  /**
   * Detect natural transition signals in conversation
   */
  detectTransitionSignals(messages: ConversationMessage[]): TransitionSignal[] {
    const signals: TransitionSignal[] = [];

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const messageText = message.message.toLowerCase();
      // const words = messageText.split(/\s+/); // TODO: Used for word-level analysis

      for (const [signalType, patterns] of Object.entries(
        this.transitionSignals
      )) {
        const indicators: string[] = [];
        let strength = 0;

        for (const pattern of patterns) {
          if (messageText.includes(pattern)) {
            indicators.push(pattern);
            strength += this.getSignalStrength(pattern, signalType);
          }
        }

        if (indicators.length > 0) {
          // Apply contextual modifiers
          strength = this.applyContextualModifiers(
            strength,
            message,
            messages,
            i
          );

          signals.push({
            type: signalType as TransitionSignal['type'],
            strength: Math.min(strength, 10),
            detected_at: i,
            indicators,
          });
        }
      }
    }

    return signals.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Analyze conversation flow quality and patterns
   */
  analyzeConversationFlow(messages: ConversationMessage[]): {
    quality: 'natural' | 'choppy' | 'forced';
    topicSwitches: number;
    averageMessageLength: number;
    engagementTrend: 'increasing' | 'decreasing' | 'stable';
  } {
    if (messages.length < 3) {
      return {
        quality: 'natural',
        topicSwitches: 0,
        averageMessageLength: 0,
        engagementTrend: 'stable',
      };
    }

    // Calculate topic switches
    let topicSwitches = 0;
    let previousTopic = '';

    for (const message of messages) {
      const currentTopic = message.topic;
      if (previousTopic && currentTopic !== previousTopic) {
        topicSwitches++;
      }
      previousTopic = currentTopic;
    }

    // Calculate average message length
    const totalWords = messages.reduce((sum, m) => sum + m.wordCount, 0);
    const averageMessageLength = totalWords / messages.length;

    // Analyze engagement trend
    const engagements = messages.map(m => m.engagement);
    const firstHalf = engagements.slice(0, Math.floor(engagements.length / 2));
    const secondHalf = engagements.slice(Math.floor(engagements.length / 2));

    const firstAvg =
      firstHalf.reduce((sum, e) => sum + e, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, e) => sum + e, 0) / secondHalf.length;

    let engagementTrend: 'increasing' | 'decreasing' | 'stable';
    if (secondAvg > firstAvg + 0.5) engagementTrend = 'increasing';
    else if (secondAvg < firstAvg - 0.5) engagementTrend = 'decreasing';
    else engagementTrend = 'stable';

    // Determine flow quality
    let quality: 'natural' | 'choppy' | 'forced';
    const switchRate = topicSwitches / messages.length;

    if (switchRate > 0.4) quality = 'choppy';
    else if (averageMessageLength < 3 && engagementTrend === 'decreasing')
      quality = 'forced';
    else quality = 'natural';

    return {
      quality,
      topicSwitches,
      averageMessageLength,
      engagementTrend,
    };
  }

  /**
   * Calculate how saturated/tired the child is of current topic
   */
  calculateTopicSaturation(
    messages: ConversationMessage[],
    topic: ConversationTopic
  ): number {
    const topicMessages = messages.filter(m => m.topic === topic.id);

    if (topicMessages.length < 2) return 1; // Fresh topic

    // Calculate engagement decline over topic duration
    const engagements = topicMessages.map(m => m.engagement);
    const firstHalf = engagements.slice(0, Math.ceil(engagements.length / 2));
    const secondHalf = engagements.slice(Math.ceil(engagements.length / 2));

    if (firstHalf.length === 0 || secondHalf.length === 0) return 3;

    const firstAvg =
      firstHalf.reduce((sum, e) => sum + e, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, e) => sum + e, 0) / secondHalf.length;

    // Higher saturation = more tired of topic
    const engagementDecline = Math.max(0, firstAvg - secondAvg);
    const durationFactor = Math.min(topicMessages.length / 8, 1); // 8 messages = full saturation

    return Math.min(engagementDecline * 2 + durationFactor * 5, 10);
  }

  /**
   * Assess how ready the conversation is for a topic bridge
   */
  assessBridgeReadiness(messages: ConversationMessage[]): number {
    if (messages.length < 2) return 3;

    const recentMessage = messages[messages.length - 1];
    // const previousMessage = messages[messages.length - 2]; // TODO: Used for message comparison analysis

    let readiness = 5; // Base readiness

    // Check for transition signals
    const signals = this.detectTransitionSignals([recentMessage]);
    if (signals.length > 0) {
      readiness += signals[0].strength * 0.5;
    }

    // Check engagement level
    if (recentMessage.engagement >= 7) readiness += 1;
    else if (recentMessage.engagement <= 4) readiness -= 2;

    // Check for questions (show engagement)
    if (recentMessage.containsQuestion) readiness += 1;

    // Check message length (very short might indicate disengagement)
    if (recentMessage.wordCount < 3) readiness -= 1;
    if (recentMessage.wordCount > 15) readiness += 0.5;

    // Check sentiment
    if (recentMessage.sentiment === 'positive') readiness += 0.5;
    else if (recentMessage.sentiment === 'negative') readiness -= 1;

    return Math.max(1, Math.min(10, readiness));
  }

  /**
   * Analyze emotional state from recent messages
   */
  private analyzeEmotionalState(messages: ConversationMessage[]): {
    primary: string;
    secondary?: string;
    confidence: number;
  } {
    const emotionCounts = new Map<string, number>();
    const emotionWords = {
      happy: [
        'happy',
        'excited',
        'joy',
        'awesome',
        'great',
        'love',
        'amazing',
        'cool',
      ],
      sad: ['sad', 'cry', 'upset', 'down', 'disappointed', 'hurt', 'lonely'],
      angry: [
        'angry',
        'mad',
        'frustrated',
        'annoying',
        'hate',
        'stupid',
        'dumb',
      ],
      scared: [
        'scared',
        'afraid',
        'worried',
        'nervous',
        'anxious',
        'frightened',
      ],
      excited: ['excited', 'yay', 'wow', 'awesome', 'amazing', 'cant wait'],
      curious: ['wonder', 'why', 'how', 'what if', 'interesting', 'tell me'],
      calm: ['calm', 'peaceful', 'relaxed', 'quiet', 'chill', 'fine', 'okay'],
    };

    for (const message of messages) {
      const words = message.message.toLowerCase().split(/\s+/);

      for (const [emotion, keywords] of Object.entries(emotionWords)) {
        let count = 0;
        for (const keyword of keywords) {
          if (words.some(word => word.includes(keyword))) {
            count++;
          }
        }
        emotionCounts.set(emotion, (emotionCounts.get(emotion) || 0) + count);
      }
    }

    const sortedEmotions = Array.from(emotionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .filter(([_, count]) => count > 0);

    if (sortedEmotions.length === 0) {
      return { primary: 'neutral', confidence: 0.5 };
    }

    const [primaryEmotion, primaryCount] = sortedEmotions[0];
    const totalEmotions = Array.from(emotionCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );
    const confidence = totalEmotions > 0 ? primaryCount / totalEmotions : 0.5;

    const result = {
      primary: primaryEmotion,
      confidence,
    } as any;

    if (sortedEmotions.length > 1) {
      result.secondary = sortedEmotions[1][0];
    }

    return result;
  }

  /**
   * Calculate overall engagement level from messages
   */
  private calculateEngagementLevel(messages: ConversationMessage[]): number {
    if (messages.length === 0) return 5;

    const totalEngagement = messages.reduce((sum, m) => sum + m.engagement, 0);
    return Math.round(totalEngagement / messages.length);
  }

  // Helper methods

  private initializeTopicDatabase(): void {
    const topics: ConversationTopic[] = [
      {
        id: 'school',
        name: 'School & Learning',
        keywords: this.topicKeywords.school.primary,
        emotionalTone: 'neutral',
        childEngagement: 'medium',
        bridgeableTo: ['family', 'weekend', 'hobbies', 'friends'],
        difficulty: 'easy',
      },
      {
        id: 'family',
        name: 'Family Time',
        keywords: this.topicKeywords.family.primary,
        emotionalTone: 'positive',
        childEngagement: 'high',
        bridgeableTo: ['weekend', 'hobbies', 'school', 'emotions'],
        difficulty: 'easy',
      },
      {
        id: 'hobbies',
        name: 'Hobbies & Interests',
        keywords: this.topicKeywords.hobbies.primary,
        emotionalTone: 'excited',
        childEngagement: 'high',
        bridgeableTo: ['school', 'weekend', 'friends', 'family'],
        difficulty: 'medium',
      },
      {
        id: 'emotions',
        name: 'Feelings & Emotions',
        keywords: this.topicKeywords.emotions.primary,
        emotionalTone: 'neutral',
        childEngagement: 'medium',
        bridgeableTo: ['family', 'school', 'friends'],
        difficulty: 'hard',
      },
      {
        id: 'weekend',
        name: 'Weekend & Activities',
        keywords: this.topicKeywords.weekend.primary,
        emotionalTone: 'positive',
        childEngagement: 'high',
        bridgeableTo: ['family', 'hobbies', 'friends'],
        difficulty: 'easy',
      },
      {
        id: 'friends',
        name: 'Friends & Social',
        keywords: this.topicKeywords.friends.primary,
        emotionalTone: 'positive',
        childEngagement: 'high',
        bridgeableTo: ['school', 'hobbies', 'weekend'],
        difficulty: 'medium',
      },
    ];

    topics.forEach(topic => {
      this.topicDatabase.set(topic.id, topic);
    });
  }

  private getAgeAppropriatenessMultiplier(
    topicId: string,
    childAge: number
  ): number {
    // Adjust topic relevance based on child's age
    const ageMultipliers = {
      school: childAge >= 5 ? 1.2 : 0.8,
      family: 1.3, // Always highly relevant
      hobbies: childAge >= 7 ? 1.1 : 1.0,
      emotions: childAge >= 8 ? 1.1 : 0.9,
      weekend: 1.2, // Always relevant
      friends: childAge >= 6 ? 1.2 : 0.9,
    };

    return ageMultipliers[topicId as keyof typeof ageMultipliers] || 1.0;
  }

  private getSignalStrength(pattern: string, signalType: string): number {
    const strengthMap = {
      topic_exhaustion: {
        base: 6,
        patterns: { 'i dont know': 8, whatever: 7, anyway: 6 },
      },
      natural_pause: { base: 7, patterns: { 'what else': 9, 'whats next': 8 } },
      question_bridge: {
        base: 8,
        patterns: { 'what about you': 9, 'tell me about': 8 },
      },
      interest_shift: { base: 7, patterns: { oh: 6, wait: 7, actually: 8 } },
      energy_change: { base: 5, patterns: { excited: 8, tired: 7, bored: 8 } },
    };

    const config = strengthMap[signalType as keyof typeof strengthMap];
    if (!config) return 5;

    return (
      config.patterns[pattern as keyof typeof config.patterns] || config.base
    );
  }

  private applyContextualModifiers(
    baseStrength: number,
    message: ConversationMessage,
    messages: ConversationMessage[],
    messageIndex: number
  ): number {
    let modifiedStrength = baseStrength;

    // Recent messages are more significant
    const recencyMultiplier = 1 + (messageIndex / messages.length) * 0.3;
    modifiedStrength *= recencyMultiplier;

    // Higher engagement makes signals more meaningful
    if (message.engagement >= 7) modifiedStrength += 1;
    else if (message.engagement <= 4) modifiedStrength -= 1;

    // Questions often indicate good transition moments
    if (message.containsQuestion) modifiedStrength += 0.5;

    return modifiedStrength;
  }

  private analyzeSentimentForTopic(
    messages: ConversationMessage[],
    topicId: string
  ): 'positive' | 'neutral' | 'negative' {
    const topicMessages = messages.filter(m => m.topic === topicId);

    if (topicMessages.length === 0) return 'neutral';

    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    topicMessages.forEach(m => sentimentCounts[m.sentiment]++);

    const total = topicMessages.length;
    if (sentimentCounts.positive / total > 0.6) return 'positive';
    if (sentimentCounts.negative / total > 0.4) return 'negative';
    return 'neutral';
  }

  private calculateTopicEngagement(
    messages: ConversationMessage[],
    topicId: string
  ): number {
    const topicMessages = messages.filter(m => m.topic === topicId);

    if (topicMessages.length === 0) return 5;

    const totalEngagement = topicMessages.reduce(
      (sum, m) => sum + m.engagement,
      0
    );
    return Math.round(totalEngagement / topicMessages.length);
  }

  private getDefaultTopicDetection(): TopicDetectionResult {
    const defaultTopic = this.topicDatabase.get('family') || {
      id: 'general',
      name: 'General Chat',
      keywords: [],
      emotionalTone: 'neutral' as const,
      childEngagement: 'medium' as const,
      bridgeableTo: [],
      difficulty: 'easy' as const,
    };

    return {
      topic: defaultTopic,
      confidence: 0.3,
      keywords: [],
      sentiment: 'neutral',
      engagement: 5,
    };
  }

  private getDefaultAnalysis(): ContextAnalysis {
    return {
      currentTopicConfidence: 3,
      emotionalState: 'neutral',
      engagementLevel: 5,
      bridgeReadiness: 5,
      conversationFlow: 'natural',
      childInterestLevel: 5,
      topicSaturation: 3,
      transitionSignals: [],
    };
  }
}
