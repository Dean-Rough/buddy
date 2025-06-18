import { prisma } from './prisma';
import { getMemories, storeMemory, type MemoryContext } from './memory';

export interface ConversationContext {
  id: string;
  childAccountId: string;
  sessionId: string;
  currentTopic?: string;
  emotionalState: EmotionalState;
  conversationFlow: TopicFlow[];
  lastActivityAt: Date;
  metadata: Record<string, any>;
}

export interface EmotionalState {
  primaryEmotion: string;
  intensity: number; // 1-10 scale
  confidence: number; // 0-1 confidence in detection
  triggers: string[]; // What caused this emotion
  timestamp: Date;
}

export interface TopicFlow {
  topic: string;
  subtopics: string[];
  startedAt: Date;
  endedAt?: Date;
  emotionalContext: string[];
  keyMessages: string[];
}

export interface ContextUpdate {
  newTopic?: string;
  emotionalState?: Partial<EmotionalState>;
  keyMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Initialize or retrieve conversation context for a session
 */
export async function getConversationContext(
  childAccountId: string,
  sessionId?: string
): Promise<ConversationContext> {
  try {
    // Try to find existing context for this session
    let context = await prisma.conversationContext.findFirst({
      where: {
        childAccountId,
        // Consider context active if updated within last 24 hours
        lastUpdated: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        lastUpdated: 'desc',
      },
    });

    if (!context) {
      // Create new context
      const newSessionId =
        sessionId ||
        `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      context = await prisma.conversationContext.create({
        data: {
          childAccountId,
          conversationId: `conv_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          topics: ['greeting'],
          mood: 'neutral',
          interests: [],
          unknownTerms: [],
          knowledgeUsed: [],
          trendingContext: [],
        },
      });
    }

    return {
      id: context.id,
      childAccountId: context.childAccountId,
      sessionId: `session_${context.id}`,
      currentTopic: context.topics[0] || undefined,
      emotionalState: {
        primaryEmotion: context.mood || 'neutral',
        intensity: 5,
        confidence: 0.5,
        triggers: [],
        timestamp: context.lastUpdated,
      } as EmotionalState,
      conversationFlow: [] as TopicFlow[],
      lastActivityAt: context.lastUpdated,
      metadata: {},
    };
  } catch (error) {
    console.error('Error getting conversation context:', error);

    // Return default context if database fails
    return {
      id: 'default',
      childAccountId,
      sessionId: sessionId || 'default_session',
      emotionalState: {
        primaryEmotion: 'neutral',
        intensity: 5,
        confidence: 0.5,
        triggers: [],
        timestamp: new Date(),
      },
      conversationFlow: [],
      lastActivityAt: new Date(),
      metadata: {},
    };
  }
}

/**
 * Update conversation context with new information
 */
export async function updateConversationContext(
  contextId: string,
  update: ContextUpdate
): Promise<void> {
  try {
    const existingContext = await prisma.conversationContext.findUnique({
      where: { id: contextId },
    });

    if (!existingContext) {
      console.warn('Cannot update non-existent context:', contextId);
      return;
    }

    const currentEmotionalState = {
      primaryEmotion: existingContext.mood || 'neutral',
      intensity: 5,
      confidence: 0.5,
      triggers: [],
      timestamp: existingContext.lastUpdated,
    } as EmotionalState;
    const currentFlow = [] as TopicFlow[];
    const currentMetadata = {};

    // Update emotional state
    const updatedEmotionalState = update.emotionalState
      ? {
          ...currentEmotionalState,
          ...update.emotionalState,
          timestamp: new Date(),
        }
      : currentEmotionalState;

    // Update conversation flow if topic changed
    let updatedFlow = [...currentFlow];
    if (update.newTopic && update.newTopic !== existingContext.topics[0]) {
      // End current topic if exists
      if (
        updatedFlow.length > 0 &&
        !updatedFlow[updatedFlow.length - 1].endedAt
      ) {
        updatedFlow[updatedFlow.length - 1].endedAt = new Date();
      }

      // Start new topic
      updatedFlow.push({
        topic: update.newTopic,
        subtopics: [],
        startedAt: new Date(),
        emotionalContext: [updatedEmotionalState.primaryEmotion],
        keyMessages: update.keyMessage ? [update.keyMessage] : [],
      });
    } else if (update.keyMessage && updatedFlow.length > 0) {
      // Add key message to current topic
      const currentTopicIndex = updatedFlow.length - 1;
      updatedFlow[currentTopicIndex].keyMessages.push(update.keyMessage);

      // Update emotional context if emotion changed significantly
      const lastEmotion =
        updatedFlow[currentTopicIndex].emotionalContext.slice(-1)[0];
      if (lastEmotion !== updatedEmotionalState.primaryEmotion) {
        updatedFlow[currentTopicIndex].emotionalContext.push(
          updatedEmotionalState.primaryEmotion
        );
      }
    }

    // Update metadata
    const updatedMetadata = update.metadata
      ? { ...currentMetadata, ...update.metadata }
      : currentMetadata;

    await prisma.conversationContext.update({
      where: { id: contextId },
      data: {
        topics: update.newTopic
          ? [update.newTopic, ...existingContext.topics.slice(0, 4)]
          : existingContext.topics,
        mood: updatedEmotionalState.primaryEmotion,
        lastUpdated: new Date(),
        messageCount: { increment: 1 },
      },
    });
  } catch (error) {
    console.error('Error updating conversation context:', error);
  }
}

/**
 * Analyze message and determine emotional state
 */
export function analyzeEmotionalState(message: string): EmotionalState {
  const emotionPatterns = [
    {
      emotion: 'happy',
      patterns: [/happy|excited|joy|great|awesome|love|amazing/i],
      intensity: 8,
    },
    {
      emotion: 'sad',
      patterns: [/sad|cry|tear|depressed|down|blue/i],
      intensity: 3,
    },
    {
      emotion: 'angry',
      patterns: [/angry|mad|furious|annoyed|frustrated/i],
      intensity: 7,
    },
    {
      emotion: 'scared',
      patterns: [/scared|afraid|frightened|terrified|worry/i],
      intensity: 4,
    },
    {
      emotion: 'anxious',
      patterns: [/anxious|nervous|worried|stress/i],
      intensity: 5,
    },
    {
      emotion: 'confused',
      patterns: [/confused|don't understand|unclear|puzzled/i],
      intensity: 5,
    },
    {
      emotion: 'bored',
      patterns: [/bored|boring|tired|sleepy/i],
      intensity: 4,
    },
    {
      emotion: 'curious',
      patterns: [/wonder|curious|how|why|what if|interesting/i],
      intensity: 6,
    },
  ];

  let detectedEmotion = 'neutral';
  let maxConfidence = 0;
  let intensity = 5;
  const triggers: string[] = [];

  for (const {
    emotion,
    patterns,
    intensity: emotionIntensity,
  } of emotionPatterns) {
    for (const pattern of patterns) {
      const matches = message.match(pattern);
      if (matches) {
        const confidence = matches.length * 0.3; // Simple confidence based on matches
        if (confidence > maxConfidence) {
          detectedEmotion = emotion;
          maxConfidence = confidence;
          intensity = emotionIntensity;
          triggers.push(...matches);
        }
      }
    }
  }

  return {
    primaryEmotion: detectedEmotion,
    intensity,
    confidence: Math.min(maxConfidence, 1),
    triggers,
    timestamp: new Date(),
  };
}

/**
 * Determine topic from message content
 */
export function extractTopic(message: string): string {
  const topicPatterns = [
    {
      topic: 'school',
      patterns: [/school|teacher|homework|class|student|learn/i],
    },
    {
      topic: 'family',
      patterns: [/mom|dad|parent|sibling|brother|sister|family/i],
    },
    { topic: 'friends', patterns: [/friend|buddy|classmate|play.*with/i] },
    {
      topic: 'hobbies',
      patterns: [/hobby|like.*to|enjoy|play|game|sport|music|art/i],
    },
    {
      topic: 'food',
      patterns: [/food|eat|hungry|lunch|dinner|snack|favorite.*food/i],
    },
    { topic: 'animals', patterns: [/animal|pet|dog|cat|bird|fish|zoo/i] },
    {
      topic: 'technology',
      patterns: [/computer|game|phone|tablet|video|app/i],
    },
    {
      topic: 'feelings',
      patterns: [/feel|emotion|sad|happy|angry|scared|worried/i],
    },
    { topic: 'help', patterns: [/help|problem|don't know|confused|need/i] },
    { topic: 'stories', patterns: [/story|book|read|once upon|tell.*about/i] },
  ];

  for (const { topic, patterns } of topicPatterns) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        return topic;
      }
    }
  }

  return 'general_chat';
}

/**
 * Generate context summary for AI prompts
 */
export async function generateContextSummary(
  contextId: string,
  includeMemories: boolean = true
): Promise<string> {
  try {
    const contextData = await prisma.conversationContext.findUnique({
      where: { id: contextId },
    });

    if (!contextData) {
      return '';
    }

    const context: ConversationContext = {
      id: contextData.id,
      childAccountId: contextData.childAccountId,
      sessionId: `session_${contextData.id}`,
      currentTopic: contextData.topics[0] || undefined,
      emotionalState: {
        primaryEmotion: contextData.mood || 'neutral',
        intensity: 5,
        confidence: 0.5,
        triggers: [],
        timestamp: contextData.lastUpdated,
      },
      conversationFlow: [],
      lastActivityAt: contextData.lastUpdated,
      metadata: {},
    };

    const summaryParts: string[] = [];

    // Current emotional state
    summaryParts.push(
      `Current emotional state: ${context.emotionalState.primaryEmotion} (intensity: ${context.emotionalState.intensity}/10)`
    );

    // Current topic
    if (context.currentTopic) {
      summaryParts.push(`Current topic: ${context.currentTopic}`);
    }

    // Recent conversation flow
    if (context.conversationFlow.length > 0) {
      const recentTopics = context.conversationFlow
        .slice(-3)
        .map(
          flow =>
            `${flow.topic} (emotions: ${flow.emotionalContext.join(', ')})`
        );
      summaryParts.push(`Recent topics: ${recentTopics.join(' → ')}`);
    }

    // Include memories if requested
    if (includeMemories) {
      const memories = await getMemories(context.childAccountId, undefined, 5);
      if (memories.length > 0) {
        const memoryStrings = memories.map(m => `${m.key}: ${m.value}`);
        summaryParts.push(`Key memories: ${memoryStrings.join('; ')}`);
      }
    }

    return summaryParts.join('\n');
  } catch (error) {
    console.error('Error generating context summary:', error);
    return '';
  }
}

/**
 * Process a new message and update context
 */
export async function processMessage(
  childAccountId: string,
  sessionId: string,
  message: string,
  isFromChild: boolean = true
): Promise<ConversationContext> {
  try {
    // Get or create context
    const context = await getConversationContext(childAccountId, sessionId);

    if (isFromChild) {
      // Analyze emotional state
      const newEmotionalState = analyzeEmotionalState(message);

      // Extract topic
      const newTopic = extractTopic(message);

      // Check if this is a significant emotional shift
      const emotionalShift =
        Math.abs(
          newEmotionalState.intensity - context.emotionalState.intensity
        ) > 2;

      // Update context
      await updateConversationContext(context.id, {
        newTopic: newTopic !== context.currentTopic ? newTopic : undefined,
        emotionalState: emotionalShift ? newEmotionalState : undefined,
        keyMessage: message.slice(0, 100), // Store truncated version
      });

      // Store memories if this is a significant message
      if (newEmotionalState.confidence > 0.6 || message.length > 50) {
        const memoryContext: MemoryContext = {
          childAccountId,
          conversationId: sessionId,
        };

        // Store emotional memory
        if (newEmotionalState.confidence > 0.7) {
          await storeMemory(memoryContext, {
            type: 'emotional_pattern',
            key: 'recent_emotion',
            value: `${newEmotionalState.primaryEmotion} (${newEmotionalState.intensity}/10)`,
            confidence: newEmotionalState.confidence,
            context: `Message: "${message.slice(0, 50)}..."`,
          });
        }

        // Store topic interest
        await storeMemory(memoryContext, {
          type: 'interest',
          key: newTopic,
          value: `Discussed ${newTopic}`,
          confidence: 0.6,
          context: `Topic from: "${message.slice(0, 50)}..."`,
        });
      }
    }

    // Return updated context
    return await getConversationContext(childAccountId, sessionId);
  } catch (error) {
    console.error('Error processing message:', error);
    // Return basic context in case of error
    return await getConversationContext(childAccountId, sessionId);
  }
}

/**
 * Clean up old conversation contexts (for data retention)
 */
export async function cleanupOldContexts(
  retentionDays: number = 7
): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    await prisma.conversationContext.deleteMany({
      where: {
        lastUpdated: {
          lt: cutoffDate,
        },
      },
    });
  } catch (error) {
    console.error('Error cleaning up old contexts:', error);
  }
}
