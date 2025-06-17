import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  storeMemory,
  recallMemory,
  updateEmotionalPattern,
  getMemoryContext,
  extractMemoriesFromMessage,
  referenceMemory,
  cleanupOldMemories,
  MemoryContext,
  MemoryEntry,
} from '../../lib/memory';

// Mock Prisma
vi.mock('../../lib/prisma', () => ({
  prisma: {
    childMemory: {
      upsert: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

// Import the mocked prisma
import { prisma } from '../../lib/prisma';
const mockPrisma = prisma as any;

describe('Memory Service', () => {
  const mockContext: MemoryContext = {
    childAccountId: 'child-123',
    conversationId: 'conv-456',
    messageId: 'msg-789',
  };

  const mockMemory: MemoryEntry = {
    type: 'preference',
    key: 'favorite_game',
    value: 'Minecraft',
    confidence: 0.9,
    context: 'Child mentioned loving Minecraft',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('storeMemory', () => {
    it('should store a memory successfully', async () => {
      mockPrisma.childMemory.upsert.mockResolvedValue({
        id: 'memory-1',
        childAccountId: 'child-123',
        memoryType: 'preference',
        key: 'favorite_game',
        value: 'Minecraft',
        confidence: 0.9,
        createdAt: new Date(),
        lastReferenced: new Date(),
        sourceConversationId: 'conv-456',
        sourceMessageId: 'msg-789',
        aiReasoning: 'Child mentioned loving Minecraft',
      });

      await storeMemory(mockContext, mockMemory);

      expect(mockPrisma.childMemory.upsert).toHaveBeenCalledWith({
        where: {
          childAccountId_memoryType_key: {
            childAccountId: 'child-123',
            memoryType: 'preference',
            key: 'favorite_game',
          },
        },
        update: {
          value: 'Minecraft',
          confidence: 0.9,
          lastReferenced: expect.any(Date),
          sourceConversationId: 'conv-456',
          sourceMessageId: 'msg-789',
          aiReasoning: 'Child mentioned loving Minecraft',
        },
        create: {
          childAccountId: 'child-123',
          memoryType: 'preference',
          key: 'favorite_game',
          value: 'Minecraft',
          confidence: 0.9,
          sourceConversationId: 'conv-456',
          sourceMessageId: 'msg-789',
          aiReasoning: 'Child mentioned loving Minecraft',
        },
      });
    });

    it('should handle storage errors gracefully', async () => {
      mockPrisma.childMemory.upsert.mockRejectedValue(
        new Error('Database error')
      );
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await storeMemory(mockContext, mockMemory);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to store memory:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('recallMemory', () => {
    it('should recall memories for a child', async () => {
      const mockDbMemories = [
        {
          memoryType: 'preference',
          key: 'favorite_game',
          value: 'Minecraft',
          confidence: 0.9,
          aiReasoning: 'Child mentioned loving Minecraft',
        },
        {
          memoryType: 'fact',
          key: 'school',
          value: 'Hillview Primary',
          confidence: 0.8,
          aiReasoning: null,
        },
      ];

      mockPrisma.childMemory.findMany.mockResolvedValue(mockDbMemories as any);

      const result = await recallMemory('child-123', 'preference', 10);

      expect(mockPrisma.childMemory.findMany).toHaveBeenCalledWith({
        where: {
          childAccountId: 'child-123',
          memoryType: 'preference',
        },
        orderBy: {
          lastReferenced: 'desc',
        },
        take: 10,
      });

      expect(result).toEqual([
        {
          type: 'preference',
          key: 'favorite_game',
          value: 'Minecraft',
          confidence: 0.9,
          context: 'Child mentioned loving Minecraft',
        },
        {
          type: 'fact',
          key: 'school',
          value: 'Hillview Primary',
          confidence: 0.8,
          context: undefined,
        },
      ]);
    });

    it('should handle recall errors gracefully', async () => {
      mockPrisma.childMemory.findMany.mockRejectedValue(
        new Error('Database error')
      );
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const result = await recallMemory('child-123');

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to retrieve memories:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('updateEmotionalPattern', () => {
    it('should update emotional patterns successfully', async () => {
      mockPrisma.childMemory.upsert.mockResolvedValue({} as any);

      await updateEmotionalPattern(
        mockContext,
        'happy',
        8,
        'finished homework'
      );

      expect(mockPrisma.childMemory.upsert).toHaveBeenCalledWith({
        where: {
          childAccountId_memoryType_key: {
            childAccountId: 'child-123',
            memoryType: 'emotional_pattern',
            key: 'happy',
          },
        },
        update: expect.objectContaining({
          confidence: 0.8,
          aiReasoning: 'Emotional response to: finished homework',
        }),
        create: expect.objectContaining({
          childAccountId: 'child-123',
          memoryType: 'emotional_pattern',
          key: 'happy',
          confidence: 0.8,
        }),
      });

      const updateCall = mockPrisma.childMemory.upsert.mock.calls[0][0];
      const parsedValue = JSON.parse(updateCall.update.value);
      expect(parsedValue).toEqual({
        emotion: 'happy',
        intensity: 8,
        trigger: 'finished homework',
        timestamp: expect.any(String),
      });
    });

    it('should handle emotional patterns without triggers', async () => {
      mockPrisma.childMemory.upsert.mockResolvedValue({} as any);

      await updateEmotionalPattern(mockContext, 'sad', 6);

      const updateCall = mockPrisma.childMemory.upsert.mock.calls[0][0];
      expect(updateCall.update.aiReasoning).toBe('Emotional state update');
    });
  });

  describe('getMemoryContext', () => {
    it('should generate memory context string for AI prompts', async () => {
      const mockMemories = [
        {
          type: 'preference',
          key: 'favorite_game',
          value: 'Minecraft',
          confidence: 0.9,
        },
        {
          type: 'fact',
          key: 'personal_info',
          value: 'I have a pet dog',
          confidence: 0.8,
        },
        {
          type: 'emotional_pattern',
          key: 'recent_emotion',
          value: 'I feel excited about the school trip',
          confidence: 0.7,
        },
        {
          type: 'interest',
          key: 'hobby',
          value: 'playing piano',
          confidence: 0.8,
        },
      ];

      mockPrisma.childMemory.findMany.mockResolvedValue(mockMemories as any);

      const result = await getMemoryContext('child-123');

      expect(result).toBe(
        'Previous conversation context:\n' +
          'favorite_game: Minecraft\n' +
          'personal_info: I have a pet dog\n' +
          'recent_emotion: I feel excited about the school trip\n' +
          'hobby: playing piano'
      );
    });

    it('should return empty string when no memories exist', async () => {
      mockPrisma.childMemory.findMany.mockResolvedValue([]);

      const result = await getMemoryContext('child-123');

      expect(result).toBe('');
    });
  });

  describe('extractMemoriesFromMessage', () => {
    it('should extract preferences from child messages', async () => {
      mockPrisma.childMemory.upsert.mockResolvedValue({} as any);

      await extractMemoriesFromMessage(
        mockContext,
        'I love playing Minecraft and I like pizza too!',
        8
      );

      expect(mockPrisma.childMemory.upsert).toHaveBeenCalledTimes(2);

      // Check first memory (I love playing Minecraft and I like pizza too!)
      const firstCall = mockPrisma.childMemory.upsert.mock.calls[0][0];
      expect(firstCall.create.memoryType).toBe('preference');
      expect(firstCall.create.key).toBe('likes');
      expect(firstCall.create.value).toBe(
        'playing Minecraft and I like pizza too'
      );

      // Check second memory (I like pizza too!)
      const secondCall = mockPrisma.childMemory.upsert.mock.calls[1][0];
      expect(secondCall.create.value).toBe('pizza too');
    });

    it('should extract facts from child messages', async () => {
      mockPrisma.childMemory.upsert.mockResolvedValue({} as any);

      await extractMemoriesFromMessage(
        mockContext,
        'My name is Emma and I am 8 years old. I go to Hillview Primary school.',
        8
      );

      expect(mockPrisma.childMemory.upsert).toHaveBeenCalledTimes(3);

      const calls = mockPrisma.childMemory.upsert.mock.calls;
      expect(calls[0][0].create.memoryType).toBe('fact');
      expect(calls[0][0].create.value).toBe(
        'My name is Emma and I am 8 years old'
      );
      expect(calls[1][0].create.value).toBe('I am 8 years old');
      expect(calls[2][0].create.value).toBe('I go to Hillview Primary school');
    });

    it('should extract emotional patterns from child messages', async () => {
      mockPrisma.childMemory.upsert.mockResolvedValue({} as any);

      await extractMemoriesFromMessage(
        mockContext,
        'I feel sad today and I am worried about the test.',
        8
      );

      expect(mockPrisma.childMemory.upsert).toHaveBeenCalledTimes(2);

      const calls = mockPrisma.childMemory.upsert.mock.calls;
      expect(calls[0][0].create.memoryType).toBe('emotional_pattern');
      expect(calls[0][0].create.value).toBe(
        'I feel sad today and I am worried about the test'
      );
      expect(calls[1][0].create.value).toBe('I am worried');
    });
  });

  describe('referenceMemory', () => {
    it('should update memory reference timestamp', async () => {
      mockPrisma.childMemory.updateMany.mockResolvedValue({ count: 1 });

      await referenceMemory('child-123', 'preference', 'favorite_game');

      expect(mockPrisma.childMemory.updateMany).toHaveBeenCalledWith({
        where: {
          childAccountId: 'child-123',
          memoryType: 'preference',
          key: 'favorite_game',
        },
        data: {
          lastReferenced: expect.any(Date),
        },
      });
    });

    it('should handle reference errors gracefully', async () => {
      mockPrisma.childMemory.updateMany.mockRejectedValue(
        new Error('Database error')
      );
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await referenceMemory('child-123', 'preference', 'favorite_game');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to update memory reference:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('cleanupOldMemories', () => {
    it('should clean up memories older than retention period', async () => {
      mockPrisma.childMemory.deleteMany.mockResolvedValue({ count: 5 });
      const mockDate = new Date('2024-01-15');
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      await cleanupOldMemories('child-123', 30);

      const expectedCutoff = new Date('2023-12-16'); // 30 days before mock date
      expect(mockPrisma.childMemory.deleteMany).toHaveBeenCalledWith({
        where: {
          childAccountId: 'child-123',
          createdAt: {
            lt: expectedCutoff,
          },
        },
      });

      vi.restoreAllMocks();
    });

    it('should handle cleanup errors gracefully', async () => {
      mockPrisma.childMemory.deleteMany.mockRejectedValue(
        new Error('Database error')
      );
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await cleanupOldMemories('child-123');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to cleanup old memories:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });
});
