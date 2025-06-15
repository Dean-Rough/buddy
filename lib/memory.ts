import { prisma } from './prisma';

export interface MemoryContext {
  childAccountId: string;
  conversationId?: string;
  messageId?: string;
}

export interface MemoryEntry {
  type: string;
  key: string;
  value: string;
  confidence: number;
  context?: string;
}

/**
 * Store a memory for a child
 */
export async function storeMemory(
  context: MemoryContext,
  memory: MemoryEntry
): Promise<void> {
  try {
    await prisma.childMemory.upsert({
      where: {
        childAccountId_memoryType_key: {
          childAccountId: context.childAccountId,
          memoryType: memory.type,
          key: memory.key,
        },
      },
      update: {
        value: memory.value,
        confidence: memory.confidence,
        lastReferenced: new Date(),
        sourceConversationId: context.conversationId,
        sourceMessageId: context.messageId,
        aiReasoning: memory.context,
      },
      create: {
        childAccountId: context.childAccountId,
        memoryType: memory.type,
        key: memory.key,
        value: memory.value,
        confidence: memory.confidence,
        sourceConversationId: context.conversationId,
        sourceMessageId: context.messageId,
        aiReasoning: memory.context,
      },
    });
  } catch (error) {
    console.error('Failed to store memory:', error);
  }
}

/**
 * Retrieve memories for a child
 */
export async function getMemories(
  childAccountId: string,
  memoryType?: string,
  limit: number = 20
): Promise<MemoryEntry[]> {
  try {
    const memories = await prisma.childMemory.findMany({
      where: {
        childAccountId,
        ...(memoryType && { memoryType }),
      },
      orderBy: {
        lastReferenced: 'desc',
      },
      take: limit,
    });

    return memories.map(memory => ({
      type: memory.memoryType,
      key: memory.key,
      value: memory.value,
      confidence: Number(memory.confidence),
      context: memory.aiReasoning || undefined,
    }));
  } catch (error) {
    console.error('Failed to retrieve memories:', error);
    return [];
  }
}

/**
 * Get memory context string for AI prompts
 */
export async function getMemoryContext(
  childAccountId: string
): Promise<string> {
  try {
    const memories = await getMemories(childAccountId, undefined, 10);

    if (memories.length === 0) {
      return '';
    }

    const contextParts = memories.map(memory => {
      switch (memory.type) {
        case 'preference':
          return `${memory.key}: ${memory.value}`;
        case 'fact':
          return `They told you: ${memory.value}`;
        case 'emotional_pattern':
          return `Emotional note: ${memory.value}`;
        case 'interest':
          return `Interested in: ${memory.value}`;
        default:
          return `${memory.key}: ${memory.value}`;
      }
    });

    return `Previous conversation context:\n${contextParts.join('\n')}`;
  } catch (error) {
    console.error('Failed to get memory context:', error);
    return '';
  }
}

/**
 * Extract and store memories from a conversation
 */
export async function extractMemoriesFromMessage(
  context: MemoryContext,
  childMessage: string,
  _childAge: number
): Promise<void> {
  // Simple rule-based memory extraction
  // In production, this could use AI to extract more sophisticated memories

  const memories: MemoryEntry[] = [];

  // Extract preferences
  const preferencePatterns = [
    /i love ([^.!?]+)/gi,
    /i like ([^.!?]+)/gi,
    /my favorite ([^.!?]+) is ([^.!?]+)/gi,
    /i really enjoy ([^.!?]+)/gi,
  ];

  preferencePatterns.forEach(pattern => {
    const matches = Array.from(childMessage.matchAll(pattern));
    for (const match of matches) {
      memories.push({
        type: 'preference',
        key: 'likes',
        value: match[1].trim(),
        confidence: 0.8,
        context: `Child expressed liking: "${match[0]}"`,
      });
    }
  });

  // Extract facts about themselves
  const factPatterns = [
    /my name is ([^.!?]+)/gi,
    /i am (\d+) years old/gi,
    /i go to ([^.!?]+) school/gi,
    /i have a ([^.!?]+)/gi,
  ];

  factPatterns.forEach(pattern => {
    const matches = Array.from(childMessage.matchAll(pattern));
    for (const match of matches) {
      memories.push({
        type: 'fact',
        key: 'personal_info',
        value: match[0].trim(),
        confidence: 0.9,
        context: `Child shared personal information`,
      });
    }
  });

  // Extract emotional patterns
  const emotionPatterns = [
    /i feel ([^.!?]+)/gi,
    /i am (sad|happy|angry|excited|worried|scared)/gi,
    /that makes me (feel )?([^.!?]+)/gi,
  ];

  emotionPatterns.forEach(pattern => {
    const matches = Array.from(childMessage.matchAll(pattern));
    for (const match of matches) {
      memories.push({
        type: 'emotional_pattern',
        key: 'recent_emotion',
        value: match[0].trim(),
        confidence: 0.7,
        context: `Child expressed emotion`,
      });
    }
  });

  // Store all extracted memories
  for (const memory of memories) {
    await storeMemory(context, memory);
  }
}

/**
 * Update memory reference timestamp
 */
export async function referenceMemory(
  childAccountId: string,
  memoryType: string,
  key: string
): Promise<void> {
  try {
    await prisma.childMemory.updateMany({
      where: {
        childAccountId,
        memoryType,
        key,
      },
      data: {
        lastReferenced: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to update memory reference:', error);
  }
}

/**
 * Clean up old memories (for data retention compliance)
 */
export async function cleanupOldMemories(
  childAccountId: string,
  retentionDays: number = 90
): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    await prisma.childMemory.deleteMany({
      where: {
        childAccountId,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
  } catch (error) {
    console.error('Failed to cleanup old memories:', error);
  }
}
