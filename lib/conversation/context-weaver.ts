/**
 * Context Weaving Engine
 * Sophisticated conversation topic bridging for organic parent nudges
 * Creates natural transitions that feel authentic to child conversations
 */

interface ConversationTopic {
  id: string;
  name: string;
  keywords: string[];
  emotionalTone:
    | 'positive'
    | 'neutral'
    | 'negative'
    | 'excited'
    | 'calm'
    | 'curious';
  childEngagement: 'high' | 'medium' | 'low';
  bridgeableTo: string[]; // Other topic IDs this can naturally bridge to
  difficulty: 'easy' | 'medium' | 'hard'; // How hard it is to transition from this topic
}

interface ParentNudgeRequest {
  id: string;
  parentClerkUserId: string;
  childAccountId: string;
  targetTopic: string; // What the parent wants to discuss
  urgency: 'low' | 'medium' | 'high' | 'immediate';
  naturalPhrasing: string; // How parent wants it mentioned
  context?: string; // Additional context for natural integration
  createdAt: Date;
  scheduledFor?: Date; // Optional timing preference
  maxAttempts: number;
  currentAttempts: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
}

interface ConversationBridge {
  id: string;
  fromTopic: string;
  toTopic: string;
  transitionType:
    | 'natural'
    | 'callback'
    | 'interest_pivot'
    | 'story_bridge'
    | 'question_bridge';
  transitionTemplates: string[];
  successRate: number; // Historical success rate
  averageDelay: number; // Average messages before bridge
  childAgeRange: [number, number]; // Age range this works for
  emotionalContext: string[]; // When this bridge works best
}

interface ConversationContext {
  currentTopic: ConversationTopic;
  recentTopics: ConversationTopic[];
  childMood: 'happy' | 'sad' | 'excited' | 'calm' | 'frustrated' | 'curious' | 'tired';
  engagementLevel: 'high' | 'medium' | 'low';
  conversationLength: number; // Number of messages
  lastBridgeAttempt?: Date;
  childAge: number;
  conversationHistory: {
    message: string;
    timestamp: Date;
    topic: string;
    engagement: number; // 1-10
  }[];
}

interface BridgeAttempt {
  id: string;
  nudgeRequestId: string;
  childAccountId: string;
  fromTopic: string;
  targetTopic: string;
  bridgeType: ConversationBridge['transitionType'];
  attemptedAt: Date;
  message: string;
  success: boolean;
  childResponse?: string;
  childEngagement?: number; // 1-10
  naturalness?: number; // 1-10 (how natural it felt)
  completedObjective?: boolean; // Did it achieve the parent's goal
}

interface ContextWeaverConfig {
  maxPendingNudges: number;
  bridgeAttemptCooldown: number; // Minutes between attempts
  maxBridgeAttemptsPerSession: number;
  naturalnesssThreshold: number; // Minimum naturalness score to attempt
  engagementRequirement: number; // Minimum engagement to attempt bridge
}

/**
 * Context Weaving Engine
 * Orchestrates natural conversation bridging for parent nudges
 */
export class ContextWeavingEngine {
  private config: ContextWeaverConfig = {
    maxPendingNudges: 5,
    bridgeAttemptCooldown: 10, // 10 minutes between attempts
    maxBridgeAttemptsPerSession: 2,
    naturalnesssThreshold: 7, // Out of 10
    engagementRequirement: 6, // Out of 10
  };

  private conversationTopics: Map<string, ConversationTopic> = new Map();
  private conversationBridges: Map<string, ConversationBridge[]> = new Map();
  private pendingNudges: Map<string, ParentNudgeRequest[]> = new Map(); // keyed by childAccountId

  constructor() {
    this.initializeTopics();
    this.initializeBridges();
  }

  /**
   * Analyze current conversation and determine if nudge opportunity exists
   */
  async analyzeConversationForNudgeOpportunity(
    childAccountId: string,
    currentMessage: string,
    conversationContext: ConversationContext
  ): Promise<{
    hasOpportunity: boolean;
    confidence: number; // 1-10
    suggestedNudge?: ParentNudgeRequest;
    bridgeStrategy?: ConversationBridge;
    timing: 'immediate' | 'next_message' | 'wait' | 'not_suitable';
  }> {
    try {
      // Get pending nudges for this child
      const pendingNudges = this.getPendingNudges(childAccountId);
      if (pendingNudges.length === 0) {
        return { hasOpportunity: false, confidence: 0, timing: 'not_suitable' };
      }

      // Analyze current conversation context
      const contextAnalysis = await this.analyzeConversationContext(
        currentMessage,
        conversationContext
      );

      // Check if child is in good state for nudging
      if (!this.isChildReadyForNudge(conversationContext, contextAnalysis)) {
        return { hasOpportunity: false, confidence: 0, timing: 'wait' };
      }

      // Find the best nudge opportunity
      const bestOpportunity = await this.findBestNudgeOpportunity(
        pendingNudges,
        conversationContext,
        contextAnalysis
      );

      if (!bestOpportunity) {
        return { hasOpportunity: false, confidence: 0, timing: 'wait' };
      }

      return {
        hasOpportunity: true,
        confidence: bestOpportunity.confidence,
        suggestedNudge: bestOpportunity.nudge,
        bridgeStrategy: bestOpportunity.bridge,
        timing: bestOpportunity.timing,
      };
    } catch (error) {
      console.error('Failed to analyze nudge opportunity:', error);
      return { hasOpportunity: false, confidence: 0, timing: 'not_suitable' };
    }
  }

  /**
   * Generate natural bridge message for parent nudge
   */
  async generateBridgeMessage(
    nudgeRequest: ParentNudgeRequest,
    bridge: ConversationBridge,
    conversationContext: ConversationContext
  ): Promise<{
    message: string;
    naturalness: number; // 1-10
    expectedEngagement: number; // 1-10
    followUpStrategy?: string;
  }> {
    try {
      // Select appropriate transition template
      const template = this.selectBridgeTemplate(bridge, conversationContext);

      // Generate personalized bridge message
      const message = await this.generatePersonalizedBridge(
        template,
        nudgeRequest,
        conversationContext
      );

      // Predict message effectiveness
      const effectiveness = this.predictBridgeEffectiveness(
        message,
        bridge,
        conversationContext
      );

      return {
        message,
        naturalness: effectiveness.naturalness,
        expectedEngagement: effectiveness.engagement,
        followUpStrategy: effectiveness.followUpStrategy,
      };
    } catch (error) {
      console.error('Failed to generate bridge message:', error);
      throw error;
    }
  }

  /**
   * Track bridge attempt success and update learning
   */
  async trackBridgeAttempt(attempt: BridgeAttempt): Promise<void> {
    try {
      // Store attempt for analytics
      await this.storeBridgeAttempt(attempt);

      // Update bridge success rates
      await this.updateBridgeAnalytics(attempt);

      // Update nudge request status
      await this.updateNudgeRequestStatus(attempt);

      // Learn from success/failure patterns
      await this.updateLearningModel(attempt);
    } catch (error) {
      console.error('Failed to track bridge attempt:', error);
    }
  }

  /**
   * Queue parent nudge request
   */
  async queueParentNudge(nudgeRequest: ParentNudgeRequest): Promise<{
    success: boolean;
    queuePosition?: number;
    estimatedDelay?: number; // minutes
    error?: string;
  }> {
    try {
      // Validate nudge request
      const validation = this.validateNudgeRequest(nudgeRequest);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Check queue capacity
      const currentQueue = this.getPendingNudges(nudgeRequest.childAccountId);
      if (currentQueue.length >= this.config.maxPendingNudges) {
        return {
          success: false,
          error: 'Queue full. Please wait for current nudges to complete.',
        };
      }

      // Add to queue with priority sorting
      await this.addToNudgeQueue(nudgeRequest);

      // Calculate queue position and estimated delay
      const queuePosition = currentQueue.length + 1;
      const estimatedDelay = this.calculateEstimatedDelay(queuePosition);

      return {
        success: true,
        queuePosition,
        estimatedDelay,
      };
    } catch (error) {
      console.error('Failed to queue parent nudge:', error);
      return { success: false, error: 'Internal error' };
    }
  }

  /**
   * Get nudge queue status for parent
   */
  async getNudgeQueueStatus(childAccountId: string): Promise<{
    pendingNudges: ParentNudgeRequest[];
    recentAttempts: BridgeAttempt[];
    queueHealth: 'healthy' | 'backed_up' | 'stalled';
    recommendations: string[];
  }> {
    try {
      const pendingNudges = this.getPendingNudges(childAccountId);
      const recentAttempts = await this.getRecentBridgeAttempts(childAccountId);

      const queueHealth = this.assessQueueHealth(pendingNudges, recentAttempts);
      const recommendations = this.generateQueueRecommendations(
        queueHealth,
        pendingNudges
      );

      return {
        pendingNudges,
        recentAttempts,
        queueHealth,
        recommendations,
      };
    } catch (error) {
      console.error('Failed to get queue status:', error);
      throw error;
    }
  }

  // Private methods

  /**
   * Initialize conversation topics database
   */
  private initializeTopics(): void {
    const topics: ConversationTopic[] = [
      {
        id: 'school',
        name: 'School & Learning',
        keywords: [
          'school',
          'teacher',
          'homework',
          'test',
          'class',
          'friends',
          'lunch',
        ],
        emotionalTone: 'neutral',
        childEngagement: 'medium',
        bridgeableTo: ['family', 'weekend', 'hobbies'],
        difficulty: 'easy',
      },
      {
        id: 'family',
        name: 'Family Time',
        keywords: [
          'family',
          'mom',
          'dad',
          'sibling',
          'grandma',
          'grandpa',
          'dinner',
        ],
        emotionalTone: 'positive',
        childEngagement: 'high',
        bridgeableTo: ['weekend', 'activities', 'school'],
        difficulty: 'easy',
      },
      {
        id: 'hobbies',
        name: 'Hobbies & Interests',
        keywords: [
          'game',
          'sport',
          'music',
          'art',
          'reading',
          'dancing',
          'building',
        ],
        emotionalTone: 'excited',
        childEngagement: 'high',
        bridgeableTo: ['school', 'weekend', 'friends'],
        difficulty: 'medium',
      },
      {
        id: 'emotions',
        name: 'Feelings & Emotions',
        keywords: [
          'happy',
          'sad',
          'angry',
          'scared',
          'excited',
          'worried',
          'proud',
        ],
        emotionalTone: 'neutral',
        childEngagement: 'medium',
        bridgeableTo: ['family', 'school', 'friends'],
        difficulty: 'hard',
      },
      {
        id: 'weekend',
        name: 'Weekend & Activities',
        keywords: [
          'weekend',
          'park',
          'movie',
          'playground',
          'vacation',
          'trip',
          'fun',
        ],
        emotionalTone: 'positive',
        childEngagement: 'high',
        bridgeableTo: ['family', 'hobbies', 'friends'],
        difficulty: 'easy',
      },
      {
        id: 'friends',
        name: 'Friends & Social',
        keywords: [
          'friend',
          'playdate',
          'party',
          'birthday',
          'share',
          'play',
          'together',
        ],
        emotionalTone: 'positive',
        childEngagement: 'high',
        bridgeableTo: ['school', 'hobbies', 'weekend'],
        difficulty: 'medium',
      },
    ];

    topics.forEach(topic => {
      this.conversationTopics.set(topic.id, topic);
    });
  }

  /**
   * Initialize conversation bridges database
   */
  private initializeBridges(): void {
    const bridges: ConversationBridge[] = [
      {
        id: 'school_to_family',
        fromTopic: 'school',
        toTopic: 'family',
        transitionType: 'natural',
        transitionTemplates: [
          'Speaking of school, that reminds me - {naturalPhrasing}',
          'You know what? Your family was just talking about {targetTopic}',
          "That's cool! By the way, {naturalPhrasing}",
        ],
        successRate: 0.85,
        averageDelay: 2.3,
        childAgeRange: [6, 12],
        emotionalContext: ['positive', 'neutral', 'curious'],
      },
      {
        id: 'hobbies_to_weekend',
        fromTopic: 'hobbies',
        toTopic: 'weekend',
        transitionType: 'interest_pivot',
        transitionTemplates: [
          'That sounds fun! Speaking of fun things, {naturalPhrasing}',
          'I love how creative you are! Oh, that reminds me - {naturalPhrasing}',
          "You're so good at that! Hey, {naturalPhrasing}",
        ],
        successRate: 0.78,
        averageDelay: 1.8,
        childAgeRange: [6, 12],
        emotionalContext: ['excited', 'positive', 'curious'],
      },
      {
        id: 'family_to_activities',
        fromTopic: 'family',
        toTopic: 'weekend',
        transitionType: 'story_bridge',
        transitionTemplates: [
          'Family time is so special! Oh, I just remembered - {naturalPhrasing}',
          'Your family sounds awesome! By the way, {naturalPhrasing}',
          "That's really sweet! Speaking of family, {naturalPhrasing}",
        ],
        successRate: 0.82,
        averageDelay: 2.1,
        childAgeRange: [6, 12],
        emotionalContext: ['positive', 'calm', 'curious'],
      },
      {
        id: 'emotions_to_family',
        fromTopic: 'emotions',
        toTopic: 'family',
        transitionType: 'natural',
        transitionTemplates: [
          'I understand how you feel. You know what might help? {naturalPhrasing}',
          'Those feelings make sense. By the way, {naturalPhrasing}',
          'Thanks for sharing that with me. Oh, {naturalPhrasing}',
        ],
        successRate: 0.72,
        averageDelay: 3.2,
        childAgeRange: [6, 12],
        emotionalContext: ['neutral', 'calm', 'curious'],
      },
    ];

    // Group bridges by fromTopic for quick lookup
    bridges.forEach(bridge => {
      const fromTopicBridges =
        this.conversationBridges.get(bridge.fromTopic) || [];
      fromTopicBridges.push(bridge);
      this.conversationBridges.set(bridge.fromTopic, fromTopicBridges);
    });
  }

  /**
   * Analyze conversation context for bridging opportunities
   */
  private async analyzeConversationContext(
    message: string,
    context: ConversationContext
  ): Promise<{
    currentTopicConfidence: number;
    emotionalState: string;
    engagementLevel: number;
    bridgeReadiness: number;
  }> {
    // This would use AI analysis in production
    // For now, simplified heuristic analysis

    const words = message.toLowerCase().split(' ');

    // Calculate topic confidence
    const topicKeywords = context.currentTopic.keywords;
    const topicMatches = words.filter(word =>
      topicKeywords.some(keyword => word.includes(keyword))
    ).length;
    const currentTopicConfidence =
      Math.min(topicMatches / topicKeywords.length, 1.0) * 10;

    // Analyze emotional indicators
    const positiveWords = [
      'happy',
      'excited',
      'fun',
      'awesome',
      'cool',
      'love',
    ];
    const negativeWords = ['sad', 'angry', 'frustrated', 'boring', 'tired'];

    const positiveCount = words.filter(word =>
      positiveWords.includes(word)
    ).length;
    const negativeCount = words.filter(word =>
      negativeWords.includes(word)
    ).length;

    let emotionalState = 'neutral';
    if (positiveCount > negativeCount) emotionalState = 'positive';
    else if (negativeCount > positiveCount) emotionalState = 'negative';

    // Calculate engagement (message length, question marks, exclamation)
    const engagementIndicators = (message.match(/[!?]/g) || []).length;
    const messageLength = message.length;
    const engagementLevel = Math.min(
      messageLength / 50 + engagementIndicators,
      10
    );

    // Calculate bridge readiness
    const timeSinceLastBridge = context.lastBridgeAttempt
      ? Date.now() - context.lastBridgeAttempt.getTime()
      : Infinity;
    const bridgeReadiness =
      Math.min(
        timeSinceLastBridge / (this.config.bridgeAttemptCooldown * 60 * 1000),
        1.0
      ) * 10;

    return {
      currentTopicConfidence,
      emotionalState,
      engagementLevel,
      bridgeReadiness,
    };
  }

  /**
   * Check if child is ready for a nudge attempt
   */
  private isChildReadyForNudge(
    context: ConversationContext,
    analysis: {
      engagementLevel: number;
      emotionalState: string;
      bridgeReadiness: number;
    }
  ): boolean {
    // Don't attempt if child seems upset
    if (
      analysis.emotionalState === 'negative' &&
      context.childMood === 'frustrated'
    ) {
      return false;
    }

    // Don't attempt if engagement is too low
    if (analysis.engagementLevel < this.config.engagementRequirement) {
      return false;
    }

    // Don't attempt if too soon after last bridge
    if (analysis.bridgeReadiness < 5) {
      return false;
    }

    // Don't attempt if too many bridges this session
    const bridgeAttemptsThisSession = context.conversationHistory.filter(
      h => h.message.includes('Speaking of') || h.message.includes('By the way')
    ).length;

    if (bridgeAttemptsThisSession >= this.config.maxBridgeAttemptsPerSession) {
      return false;
    }

    return true;
  }

  /**
   * Find the best nudge opportunity from pending queue
   */
  private async findBestNudgeOpportunity(
    pendingNudges: ParentNudgeRequest[],
    context: ConversationContext,
    analysis: any
  ): Promise<{
    nudge: ParentNudgeRequest;
    bridge: ConversationBridge;
    confidence: number;
    timing: 'immediate' | 'next_message' | 'wait';
  } | null> {
    const opportunities = [];

    for (const nudge of pendingNudges) {
      // Skip if too many attempts
      if (nudge.currentAttempts >= nudge.maxAttempts) continue;

      // Find available bridges from current topic
      const availableBridges =
        this.conversationBridges.get(context.currentTopic.id) || [];

      for (const bridge of availableBridges) {
        // Check if bridge can reach target topic
        const canReachTarget = await this.canBridgeToTopic(
          bridge,
          nudge.targetTopic,
          context
        );
        if (!canReachTarget) continue;

        // Calculate opportunity confidence
        const confidence = this.calculateBridgeConfidence(
          bridge,
          nudge,
          context,
          analysis
        );

        if (confidence >= this.config.naturalnesssThreshold) {
          opportunities.push({
            nudge,
            bridge,
            confidence,
            timing: this.calculateOptimalTiming(confidence, analysis),
          });
        }
      }
    }

    // Return best opportunity
    if (opportunities.length === 0) return null;

    return opportunities.sort((a, b) => b.confidence - a.confidence)[0];
  }

  private async canBridgeToTopic(
    bridge: ConversationBridge,
    targetTopic: string,
    _context: ConversationContext
  ): Promise<boolean> {
    // Check direct bridge
    if (bridge.toTopic === targetTopic) return true;

    // Check if target topic is in bridgeable topics
    const bridgeToTopic = this.conversationTopics.get(bridge.toTopic);
    if (bridgeToTopic?.bridgeableTo.includes(targetTopic)) return true;

    return false;
  }

  private calculateBridgeConfidence(
    bridge: ConversationBridge,
    nudge: ParentNudgeRequest,
    context: ConversationContext,
    analysis: any
  ): number {
    let confidence = bridge.successRate * 10; // Base success rate

    // Adjust for child age
    const [minAge, maxAge] = bridge.childAgeRange;
    if (context.childAge >= minAge && context.childAge <= maxAge) {
      confidence += 1;
    } else {
      confidence -= 2;
    }

    // Adjust for emotional context
    if (bridge.emotionalContext.includes(analysis.emotionalState)) {
      confidence += 1;
    }

    // Adjust for urgency
    if (nudge.urgency === 'high') confidence += 0.5;
    if (nudge.urgency === 'immediate') confidence += 1;

    // Adjust for engagement
    confidence += (analysis.engagementLevel - 5) * 0.2;

    return Math.max(0, Math.min(10, confidence));
  }

  private calculateOptimalTiming(
    confidence: number,
    analysis: any
  ): 'immediate' | 'next_message' | 'wait' {
    if (confidence >= 9 && analysis.engagementLevel >= 8) return 'immediate';
    if (confidence >= 7 && analysis.engagementLevel >= 6) return 'next_message';
    return 'wait';
  }

  // Additional helper methods would be implemented here...

  private getPendingNudges(childAccountId: string): ParentNudgeRequest[] {
    return this.pendingNudges.get(childAccountId) || [];
  }

  private selectBridgeTemplate(
    bridge: ConversationBridge,
    _context: ConversationContext
  ): string {
    // Select template based on context - simplified for demo
    return bridge.transitionTemplates[0];
  }

  private async generatePersonalizedBridge(
    template: string,
    nudge: ParentNudgeRequest,
    _context: ConversationContext
  ): Promise<string> {
    // Replace template variables with actual content
    return template
      .replace('{naturalPhrasing}', nudge.naturalPhrasing)
      .replace('{targetTopic}', nudge.targetTopic);
  }

  private predictBridgeEffectiveness(
    message: string,
    bridge: ConversationBridge,
    _context: ConversationContext
  ): {
    naturalness: number;
    engagement: number;
    followUpStrategy?: string;
  } {
    // Simplified prediction - would use ML in production
    return {
      naturalness: bridge.successRate * 10,
      engagement: 7.5,
      followUpStrategy: 'Continue conversation naturally, gauge child response',
    };
  }

  private validateNudgeRequest(nudge: ParentNudgeRequest): {
    isValid: boolean;
    error?: string;
  } {
    if (!nudge.targetTopic?.trim()) {
      return { isValid: false, error: 'Target topic is required' };
    }

    if (!nudge.naturalPhrasing?.trim()) {
      return { isValid: false, error: 'Natural phrasing is required' };
    }

    if (nudge.maxAttempts < 1 || nudge.maxAttempts > 5) {
      return { isValid: false, error: 'Max attempts must be between 1 and 5' };
    }

    return { isValid: true };
  }

  private async addToNudgeQueue(nudge: ParentNudgeRequest): Promise<void> {
    const currentQueue = this.getPendingNudges(nudge.childAccountId);

    // Add nudge and sort by urgency and creation time
    currentQueue.push(nudge);
    currentQueue.sort((a, b) => {
      const urgencyWeight = { immediate: 4, high: 3, medium: 2, low: 1 };
      const aWeight = urgencyWeight[a.urgency];
      const bWeight = urgencyWeight[b.urgency];

      if (aWeight !== bWeight) return bWeight - aWeight;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    this.pendingNudges.set(nudge.childAccountId, currentQueue);
  }

  private calculateEstimatedDelay(queuePosition: number): number {
    // Estimate based on average conversation flow - simplified
    return queuePosition * 15; // 15 minutes per nudge on average
  }

  private assessQueueHealth(
    pending: ParentNudgeRequest[],
    recent: BridgeAttempt[]
  ): 'healthy' | 'backed_up' | 'stalled' {
    if (pending.length > 3) return 'backed_up';

    const recentFailures = recent.filter(a => !a.success).length;
    const recentTotal = recent.length;

    if (recentTotal > 0 && recentFailures / recentTotal > 0.7) return 'stalled';

    return 'healthy';
  }

  private generateQueueRecommendations(
    health: 'healthy' | 'backed_up' | 'stalled',
    pending: ParentNudgeRequest[]
  ): string[] {
    const recommendations = [];

    if (health === 'backed_up') {
      recommendations.push(
        'Consider reducing nudge frequency to improve naturalness'
      );
      recommendations.push('Focus on highest priority nudges');
    }

    if (health === 'stalled') {
      recommendations.push("Recent nudges haven't been working well");
      recommendations.push('Try rephrasing nudges to be more natural');
      recommendations.push('Wait for better conversation opportunities');
    }

    if (pending.length === 0) {
      recommendations.push('Queue is empty - great job!');
    }

    return recommendations;
  }

  // Database interaction methods (would be implemented with actual database)
  private async storeBridgeAttempt(attempt: BridgeAttempt): Promise<void> {
    console.log('Storing bridge attempt:', attempt.id);
  }

  private async updateBridgeAnalytics(attempt: BridgeAttempt): Promise<void> {
    console.log('Updating bridge analytics for:', attempt.bridgeType);
  }

  private async updateNudgeRequestStatus(
    attempt: BridgeAttempt
  ): Promise<void> {
    console.log('Updating nudge request status:', attempt.nudgeRequestId);
  }

  private async updateLearningModel(attempt: BridgeAttempt): Promise<void> {
    console.log('Updating learning model with attempt:', attempt.success);
  }

  private async getRecentBridgeAttempts(
    _childAccountId: string
  ): Promise<BridgeAttempt[]> {
    return []; // Database lookup
  }
}
