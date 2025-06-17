import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getConversationContext,
  updateConversationContext,
  analyzeEmotionalState,
  extractTopic,
  generateContextSummary,
  processMessage,
  cleanupOldContexts,
  type ConversationContext,
  type EmotionalState,
  type ContextUpdate,
} from '@/lib/conversation-context';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    conversationContext: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

// Mock memory functions
vi.mock('@/lib/memory', () => ({
  getMemories: vi.fn(),
  storeMemory: vi.fn(),
}));

// Import the mocked modules (note: importing after mocking)
import { prisma } from '@/lib/prisma';
import { getMemories, storeMemory } from '@/lib/memory';

const mockPrisma = prisma as any;
const mockGetMemories = getMemories as any;
const mockStoreMemory = storeMemory as any;

describe('Conversation Context Manager', () => {
  const mockChildAccountId = 'child-123';
  const mockSessionId = 'session-456';
  const mockContextId = 'context-789';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getConversationContext', () => {
    it('should return existing active context', async () => {
      const mockDbContext = {
        id: mockContextId,
        childAccountId: mockChildAccountId,
        sessionId: mockSessionId,
        currentTopic: 'school',
        emotionalState: JSON.stringify({
          primaryEmotion: 'happy',
          intensity: 7,
          confidence: 0.8,
          triggers: ['homework done'],
          timestamp: new Date(),
        }),
        conversationFlow: JSON.stringify([
          {
            topic: 'school',
            subtopics: ['homework'],
            startedAt: new Date(),
            emotionalContext: ['happy'],
            keyMessages: ['I finished my homework!'],
          },
        ]),
        lastActivityAt: new Date(),
        metadata: JSON.stringify({ mood: 'positive' }),
      };

      mockPrisma.conversationContext.findFirst.mockResolvedValue(mockDbContext);

      const result = await getConversationContext(
        mockChildAccountId,
        mockSessionId
      );

      expect(mockPrisma.conversationContext.findFirst).toHaveBeenCalledWith({
        where: {
          childAccountId: mockChildAccountId,
          sessionId: mockSessionId,
          lastActivityAt: {
            gte: expect.any(Date),
          },
        },
        orderBy: {
          lastActivityAt: 'desc',
        },
      });

      expect(result.id).toBe(mockContextId);
      expect(result.childAccountId).toBe(mockChildAccountId);
      expect(result.sessionId).toBe(mockSessionId);
      expect(result.currentTopic).toBe('school');
      expect(result.emotionalState.primaryEmotion).toBe('happy');
      expect(result.emotionalState.intensity).toBe(7);
      expect(result.conversationFlow).toHaveLength(1);
      expect(result.conversationFlow[0].topic).toBe('school');
      expect(result.metadata).toEqual({ mood: 'positive' });
    });

    it('should create new context when none exists', async () => {
      mockPrisma.conversationContext.findFirst.mockResolvedValue(null);
      mockPrisma.conversationContext.create.mockResolvedValue({
        id: 'new-context-id',
        childAccountId: mockChildAccountId,
        sessionId: expect.stringContaining('session_'),
        currentTopic: 'greeting',
        emotionalState: JSON.stringify({
          primaryEmotion: 'neutral',
          intensity: 5,
          confidence: 0.5,
          triggers: [],
          timestamp: new Date(),
        }),
        conversationFlow: JSON.stringify([]),
        lastActivityAt: new Date(),
        metadata: JSON.stringify({}),
      });

      const result = await getConversationContext(mockChildAccountId);

      expect(mockPrisma.conversationContext.create).toHaveBeenCalledWith({
        data: {
          childAccountId: mockChildAccountId,
          sessionId: expect.stringContaining('session_'),
          currentTopic: 'greeting',
          emotionalState: expect.stringContaining('neutral'),
          conversationFlow: '[]',
          metadata: '{}',
        },
      });

      expect(result.emotionalState.primaryEmotion).toBe('neutral');
      expect(result.currentTopic).toBe('greeting');
    });

    it('should return default context on database error', async () => {
      mockPrisma.conversationContext.findFirst.mockRejectedValue(
        new Error('DB error')
      );
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const result = await getConversationContext(
        mockChildAccountId,
        mockSessionId
      );

      expect(result).toEqual({
        id: 'default',
        childAccountId: mockChildAccountId,
        sessionId: mockSessionId,
        emotionalState: {
          primaryEmotion: 'neutral',
          intensity: 5,
          confidence: 0.5,
          triggers: [],
          timestamp: expect.any(Date),
        },
        conversationFlow: [],
        lastActivityAt: expect.any(Date),
        metadata: {},
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error getting conversation context:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('updateConversationContext', () => {
    const mockExistingContext = {
      id: mockContextId,
      currentTopic: 'school',
      emotionalState: JSON.stringify({
        primaryEmotion: 'neutral',
        intensity: 5,
        confidence: 0.5,
        triggers: [],
        timestamp: new Date(),
      }),
      conversationFlow: JSON.stringify([
        {
          topic: 'school',
          subtopics: [],
          startedAt: new Date(),
          emotionalContext: ['neutral'],
          keyMessages: ['Hi there!'],
        },
      ]),
      metadata: JSON.stringify({ session: 'active' }),
    };

    it('should update context with new topic', async () => {
      mockPrisma.conversationContext.findUnique.mockResolvedValue(
        mockExistingContext
      );
      mockPrisma.conversationContext.update.mockResolvedValue({});

      const update: ContextUpdate = {
        newTopic: 'games',
        keyMessage: 'I love playing Minecraft!',
      };

      await updateConversationContext(mockContextId, update);

      expect(mockPrisma.conversationContext.update).toHaveBeenCalledWith({
        where: { id: mockContextId },
        data: {
          currentTopic: 'games',
          emotionalState: expect.any(String),
          conversationFlow: expect.any(String),
          metadata: expect.any(String),
          lastActivityAt: expect.any(Date),
        },
      });
    });

    it('should update emotional state', async () => {
      mockPrisma.conversationContext.findUnique.mockResolvedValue(
        mockExistingContext
      );
      mockPrisma.conversationContext.update.mockResolvedValue({});

      const update: ContextUpdate = {
        emotionalState: {
          primaryEmotion: 'happy',
          intensity: 8,
          confidence: 0.9,
          triggers: ['got good grade'],
        },
      };

      await updateConversationContext(mockContextId, update);

      const updateCall = mockPrisma.conversationContext.update.mock.calls[0][0];
      const updatedEmotionalState = JSON.parse(updateCall.data.emotionalState);
      expect(updatedEmotionalState.primaryEmotion).toBe('happy');
      expect(updatedEmotionalState.intensity).toBe(8);
      expect(updatedEmotionalState.timestamp).toBeDefined();
    });

    it('should handle non-existent context gracefully', async () => {
      mockPrisma.conversationContext.findUnique.mockResolvedValue(null);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await updateConversationContext('non-existent', { newTopic: 'test' });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Cannot update non-existent context:',
        'non-existent'
      );
      expect(mockPrisma.conversationContext.update).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('generateContextSummary', () => {
    it('should generate comprehensive context summary', async () => {
      const mockContextData = {
        id: mockContextId,
        childAccountId: mockChildAccountId,
        sessionId: mockSessionId,
        currentTopic: 'games',
        emotionalState: JSON.stringify({
          primaryEmotion: 'excited',
          intensity: 8,
          confidence: 0.9,
          triggers: ['new game'],
          timestamp: new Date(),
        }),
        conversationFlow: JSON.stringify([
          {
            topic: 'school',
            subtopics: ['homework'],
            startedAt: new Date(),
            endedAt: new Date(),
            emotionalContext: ['neutral', 'happy'],
            keyMessages: ['Finished homework!'],
          },
          {
            topic: 'games',
            subtopics: ['minecraft'],
            startedAt: new Date(),
            emotionalContext: ['excited'],
            keyMessages: ['Got a new game!'],
          },
        ]),
        lastActivityAt: new Date(),
        metadata: JSON.stringify({ session: 'active' }),
      };

      mockPrisma.conversationContext.findUnique.mockResolvedValue(
        mockContextData
      );
      mockGetMemories.mockResolvedValue([
        { key: 'favorite_game', value: 'Minecraft', type: 'preference' },
        { key: 'age', value: '8 years old', type: 'fact' },
      ]);

      const result = await generateContextSummary(mockContextId, true);

      expect(result).toContain(
        'Current emotional state: excited (intensity: 8/10)'
      );
      expect(result).toContain('Current topic: games');
      expect(result).toContain(
        'Recent topics: school (emotions: neutral, happy) → games (emotions: excited)'
      );
      expect(result).toContain(
        'Key memories: favorite_game: Minecraft; age: 8 years old'
      );
    });

    it('should handle missing context gracefully', async () => {
      mockPrisma.conversationContext.findUnique.mockResolvedValue(null);

      const result = await generateContextSummary('non-existent');

      expect(result).toBe('');
    });

    it('should work without memories when includeMemories is false', async () => {
      const mockContextData = {
        id: mockContextId,
        childAccountId: mockChildAccountId,
        sessionId: mockSessionId,
        currentTopic: 'games',
        emotionalState: JSON.stringify({
          primaryEmotion: 'happy',
          intensity: 7,
          confidence: 0.8,
          triggers: [],
          timestamp: new Date(),
        }),
        conversationFlow: JSON.stringify([]),
        lastActivityAt: new Date(),
        metadata: JSON.stringify({}),
      };

      mockPrisma.conversationContext.findUnique.mockResolvedValue(
        mockContextData
      );

      const result = await generateContextSummary(mockContextId, false);

      expect(result).toContain(
        'Current emotional state: happy (intensity: 7/10)'
      );
      expect(result).toContain('Current topic: games');
      expect(result).not.toContain('Key memories');
      expect(mockGetMemories).not.toHaveBeenCalled();
    });
  });

  describe('processMessage', () => {
    it('should process child message and update context', async () => {
      const mockContext: ConversationContext = {
        id: mockContextId,
        childAccountId: mockChildAccountId,
        sessionId: mockSessionId,
        currentTopic: 'general_chat',
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

      // Mock getConversationContext calls
      mockPrisma.conversationContext.findFirst.mockResolvedValue({
        id: mockContextId,
        childAccountId: mockChildAccountId,
        sessionId: mockSessionId,
        currentTopic: 'general_chat',
        emotionalState: JSON.stringify(mockContext.emotionalState),
        conversationFlow: JSON.stringify([]),
        lastActivityAt: new Date(),
        metadata: JSON.stringify({}),
      });

      mockPrisma.conversationContext.findUnique.mockResolvedValue({
        id: mockContextId,
        currentTopic: 'general_chat',
        emotionalState: JSON.stringify(mockContext.emotionalState),
        conversationFlow: JSON.stringify([]),
        metadata: JSON.stringify({}),
      });

      mockPrisma.conversationContext.update.mockResolvedValue({});
      mockStoreMemory.mockResolvedValue(undefined);

      const message =
        'I am so excited about my new video game! This is absolutely amazing and I love it so much!';
      const result = await processMessage(
        mockChildAccountId,
        mockSessionId,
        message,
        true
      );

      expect(mockPrisma.conversationContext.update).toHaveBeenCalled();
      expect(mockStoreMemory).toHaveBeenCalledTimes(1); // topic interest (emotional requires confidence > 0.7)
      expect(result).toBeDefined();
    });

    it('should handle non-child messages without emotion analysis', async () => {
      const mockContext: ConversationContext = {
        id: mockContextId,
        childAccountId: mockChildAccountId,
        sessionId: mockSessionId,
        currentTopic: 'general_chat',
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

      mockPrisma.conversationContext.findFirst.mockResolvedValue({
        id: mockContextId,
        childAccountId: mockChildAccountId,
        sessionId: mockSessionId,
        currentTopic: 'general_chat',
        emotionalState: JSON.stringify(mockContext.emotionalState),
        conversationFlow: JSON.stringify([]),
        lastActivityAt: new Date(),
        metadata: JSON.stringify({}),
      });

      const result = await processMessage(
        mockChildAccountId,
        mockSessionId,
        'AI response',
        false
      );

      expect(mockStoreMemory).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should handle processing errors gracefully', async () => {
      mockPrisma.conversationContext.findFirst.mockRejectedValue(
        new Error('DB error')
      );
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const result = await processMessage(
        mockChildAccountId,
        mockSessionId,
        'test message'
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error getting conversation context:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('cleanupOldContexts', () => {
    it('should clean up contexts older than retention period', async () => {
      mockPrisma.conversationContext.deleteMany.mockResolvedValue({ count: 3 });

      await cleanupOldContexts(7);

      const expectedCutoff = new Date();
      expectedCutoff.setDate(expectedCutoff.getDate() - 7);

      expect(mockPrisma.conversationContext.deleteMany).toHaveBeenCalledWith({
        where: {
          lastActivityAt: {
            lt: expect.any(Date),
          },
        },
      });
    });

    it('should use default retention period of 7 days', async () => {
      mockPrisma.conversationContext.deleteMany.mockResolvedValue({ count: 2 });

      await cleanupOldContexts();

      expect(mockPrisma.conversationContext.deleteMany).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      mockPrisma.conversationContext.deleteMany.mockRejectedValue(
        new Error('DB error')
      );
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await cleanupOldContexts();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error cleaning up old contexts:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });
});

describe('Conversation Context Utilities', () => {
  describe('analyzeEmotionalState', () => {
    it('detects happy emotions correctly', () => {
      const messages = [
        'I am so happy today!',
        'This is awesome and amazing!',
        'I love this game so much!',
        'I feel great and excited!',
      ];

      messages.forEach(message => {
        const result = analyzeEmotionalState(message);
        expect(result.primaryEmotion).toBe('happy');
        expect(result.intensity).toBe(8);
        expect(result.confidence).toBeGreaterThan(0);
      });
    });

    it('detects sad emotions correctly', () => {
      const messages = [
        'I feel so sad right now',
        'I want to cry',
        'I am really down today',
        'This makes me feel blue',
      ];

      messages.forEach(message => {
        const result = analyzeEmotionalState(message);
        expect(result.primaryEmotion).toBe('sad');
        expect(result.intensity).toBe(3);
        expect(result.confidence).toBeGreaterThan(0);
      });
    });

    it('detects angry emotions correctly', () => {
      const messages = [
        'I am so angry about this',
        'This makes me mad',
        'I feel frustrated and furious',
        'I am really annoyed',
      ];

      messages.forEach(message => {
        const result = analyzeEmotionalState(message);
        expect(result.primaryEmotion).toBe('angry');
        expect(result.intensity).toBe(7);
        expect(result.confidence).toBeGreaterThan(0);
      });
    });

    it('detects scared emotions correctly', () => {
      const messages = [
        'I am scared of the dark',
        'I feel afraid of spiders',
        'I am terrified of heights',
        'This makes me worry a lot',
      ];

      messages.forEach(message => {
        const result = analyzeEmotionalState(message);
        expect(result.primaryEmotion).toBe('scared');
        expect(result.intensity).toBe(4);
        expect(result.confidence).toBeGreaterThan(0);
      });
    });

    it('detects curious emotions correctly', () => {
      const messages = [
        'I wonder how this works',
        'I am curious about dinosaurs',
        'Why do birds fly?',
        'What if we could time travel?',
        'This is so interesting!',
      ];

      messages.forEach(message => {
        const result = analyzeEmotionalState(message);
        expect(result.primaryEmotion).toBe('curious');
        expect(result.intensity).toBe(6);
        expect(result.confidence).toBeGreaterThan(0);
      });
    });

    it('defaults to neutral for unclear emotions', () => {
      const neutralMessages = [
        'Hello there',
        'The weather is nice',
        'I went to the store',
        'Can you help me with math?',
      ];

      neutralMessages.forEach(message => {
        const result = analyzeEmotionalState(message);
        expect(result.primaryEmotion).toBe('neutral');
        expect(result.intensity).toBe(5);
        expect(result.confidence).toBe(0);
      });
    });

    it('includes triggers in the result', () => {
      const result = analyzeEmotionalState('I am so happy and excited!');
      expect(result.triggers.length).toBeGreaterThan(0);
      expect(result.triggers).toContain('happy');
    });

    it('sets appropriate timestamps', () => {
      const result = analyzeEmotionalState('I feel great');
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(Date.now() - result.timestamp.getTime()).toBeLessThan(1000);
    });
  });

  describe('extractTopic', () => {
    it('extracts school-related topics', () => {
      const schoolMessages = [
        'I have homework to do',
        'My teacher is really nice',
        'I learned about science in class',
        'School was fun today',
      ];

      schoolMessages.forEach(message => {
        expect(extractTopic(message)).toBe('school');
      });
    });

    it('extracts family-related topics', () => {
      const familyMessages = [
        'My mom made dinner',
        'I played with my dad',
        'My brother is annoying',
        'Family time is important',
      ];

      familyMessages.forEach(message => {
        expect(extractTopic(message)).toBe('family');
      });
    });

    it('extracts friend-related topics', () => {
      const friendMessages = [
        'My friend is coming over',
        'My buddy is really nice',
        'I want to play with my best friend',
        'Can I invite my friend over?',
      ];

      friendMessages.forEach(message => {
        expect(extractTopic(message)).toBe('friends');
      });
    });

    it('extracts hobby-related topics', () => {
      const hobbyMessages = [
        'I like to draw',
        'I enjoy playing soccer',
        'My hobby is reading',
        'I love playing games',
        'Music is my favorite',
      ];

      hobbyMessages.forEach(message => {
        expect(extractTopic(message)).toBe('hobbies');
      });
    });

    it('extracts food-related topics', () => {
      const foodMessages = [
        'I am hungry',
        'Pizza is my favorite food',
        'What should I eat for lunch?',
        'I had a snack',
      ];

      foodMessages.forEach(message => {
        expect(extractTopic(message)).toBe('food');
      });
    });

    it('extracts animal-related topics', () => {
      const animalMessages = [
        'I love dogs',
        'My pet cat is cute',
        'We went to the zoo',
        'Birds are amazing animals',
      ];

      animalMessages.forEach(message => {
        expect(extractTopic(message)).toBe('animals');
      });
    });

    it('extracts technology-related topics', () => {
      const techMessages = [
        'I need to use the computer',
        'Can I use the tablet?',
        'This app is cool',
        'I want to watch a video',
      ];

      techMessages.forEach(message => {
        expect(extractTopic(message)).toBe('technology');
      });
    });

    it('extracts feelings-related topics', () => {
      const feelingMessages = [
        'I feel sad today',
        'My emotions are mixed',
        'How do you feel about this?',
        'I have strong feelings about this',
      ];

      feelingMessages.forEach(message => {
        expect(extractTopic(message)).toBe('feelings');
      });
    });

    it('extracts help-related topics', () => {
      const helpMessages = [
        'Can you help me?',
        'I have a problem',
        "I don't know what to do",
        'I am confused about this',
        'I need assistance',
      ];

      helpMessages.forEach(message => {
        expect(extractTopic(message)).toBe('help');
      });
    });

    it('extracts story-related topics', () => {
      const storyMessages = [
        'Tell me a story',
        'I read a book today',
        'Once upon a time',
        'Can you tell me about dragons?',
      ];

      storyMessages.forEach(message => {
        expect(extractTopic(message)).toBe('stories');
      });
    });

    it('defaults to general_chat for unmatched topics', () => {
      const generalMessages = [
        'Hello there',
        'Good morning',
        'The sky is blue',
        'It is sunny outside',
      ];

      generalMessages.forEach(message => {
        expect(extractTopic(message)).toBe('general_chat');
      });
    });

    it('handles case insensitive matching', () => {
      expect(extractTopic('I LOVE SCHOOL')).toBe('school');
      expect(extractTopic('my FAMILY is great')).toBe('family');
      expect(extractTopic('HELP me please')).toBe('help');
    });

    it('handles multiple topic indicators', () => {
      // When multiple topics are present, it should return the first match
      const result = extractTopic('I need help with my school homework');
      // Should match 'school' or 'help' depending on pattern order
      expect(['school', 'help']).toContain(result);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty messages', () => {
      expect(analyzeEmotionalState('')).toMatchObject({
        primaryEmotion: 'neutral',
        intensity: 5,
        confidence: 0,
      });

      expect(extractTopic('')).toBe('general_chat');
    });

    it('handles very long messages', () => {
      const longMessage = 'I am so happy '.repeat(100);
      const result = analyzeEmotionalState(longMessage);
      expect(result.primaryEmotion).toBe('happy');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('handles messages with special characters', () => {
      const result = analyzeEmotionalState('I am happy!!! 😊🎉');
      expect(result.primaryEmotion).toBe('happy');

      const topic = extractTopic('My mom said: "Do your homework!"');
      expect(['family', 'school']).toContain(topic);
    });

    it('handles mixed emotions in a single message', () => {
      // Should pick the first/strongest emotion detected
      const result = analyzeEmotionalState('I am happy but also a bit scared');
      expect(['happy', 'scared']).toContain(result.primaryEmotion);
    });
  });
});
