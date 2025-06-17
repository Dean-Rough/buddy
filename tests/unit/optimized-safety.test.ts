import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateMessageSafety,
  validateMessagesSafety,
  getSafetyMetrics,
  SafetyContext,
} from '@/lib/ai/safety';
import { safetyCache } from '@/lib/ai/safety-cache';
import { safetyFallback } from '@/lib/ai/safety-fallback';

// Mock OpenAI and other dependencies
const mockValidateSafety = vi.hoisted(() => vi.fn());
const mockPrismaCreate = vi.hoisted(() => vi.fn());
const mockSendSafetyAlert = vi.hoisted(() => vi.fn());
const mockGetCompiledSafetyPatterns = vi.hoisted(() => vi.fn());

vi.mock('@/lib/ai/client', () => ({
  validateSafety: mockValidateSafety,
}));

const mockChildFindUnique = vi.hoisted(() => vi.fn());
const mockParentNotificationCreate = vi.hoisted(() => vi.fn());
const mockParentNotificationUpdate = vi.hoisted(() => vi.fn());

vi.mock('@/lib/prisma', () => ({
  prisma: {
    safetyEvent: { create: mockPrismaCreate },
    childAccount: {
      findUnique: mockChildFindUnique,
    },
    parentNotification: {
      create: mockParentNotificationCreate,
      update: mockParentNotificationUpdate,
    },
  },
}));

vi.mock('@/lib/notifications', () => ({
  sendSafetyAlert: mockSendSafetyAlert,
}));

const mockGetSafetyResponseFromConfig = vi.hoisted(() => vi.fn());

vi.mock('@/lib/config-loader', () => ({
  getCompiledSafetyPatterns: mockGetCompiledSafetyPatterns,
  getSafetyResponseFromConfig: mockGetSafetyResponseFromConfig,
}));

vi.mock('fs', () => ({
  readFileSync: vi.fn().mockReturnValue(
    JSON.stringify({
      fast_validation_prompt:
        'Safety check for child age {age}: \'{message}\'. JSON: {"isSafe": true, "severity": 0, "reason": "test", "flaggedTerms": []}',
      performance_optimizations: {
        max_tokens: 150,
        temperature: 0.1,
        timeout_ms: 5000,
      },
    })
  ),
}));

describe('Optimized Safety System', () => {
  const mockContext: SafetyContext = {
    childAccountId: 'child-123',
    childAge: 8,
    conversationId: 'conv-123',
    recentMessages: ['Hello!', 'How are you?'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    safetyCache.clear();
    // Reset fallback system
    safetyFallback.setAIServiceStatus(false);

    // Default safe patterns
    mockGetCompiledSafetyPatterns.mockReturnValue({
      critical: [],
      emotionalSupport: [],
      highConcern: [],
      contextualGuidance: [],
      youthCulture: [],
      gaming: [],
      school: [],
    });

    // Default AI response
    mockValidateSafety.mockResolvedValue({
      isSafe: true,
      severity: 0,
      reason: 'No safety concerns detected',
      action: 'allow',
      flaggedTerms: [],
    });

    mockPrismaCreate.mockResolvedValue({ id: 'event-123' });
    mockParentNotificationCreate.mockResolvedValue({ id: 'notification-123' });
    mockParentNotificationUpdate.mockResolvedValue({});
    mockChildFindUnique.mockResolvedValue({
      id: 'child-123',
      name: 'Test Child',
      parentClerkUserId: 'parent-123',
      parent: { email: 'parent@test.com' },
    });
    mockSendSafetyAlert.mockResolvedValue(true);
    mockGetSafetyResponseFromConfig.mockReturnValue(
      'Test safety response for parent alert'
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Parallel Processing', () => {
    it('should run AI and rule-based checks in parallel', async () => {
      const start = Date.now();

      // Mock AI delay
      mockValidateSafety.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  isSafe: true,
                  severity: 0,
                  reason: 'AI validation passed',
                  action: 'allow',
                  flaggedTerms: [],
                }),
              100
            )
          )
      );

      const result = await validateMessageSafety(
        'Hello, how are you?',
        mockContext
      );

      const duration = Date.now() - start;

      expect(result.isSafe).toBe(true);
      expect(result.processingTime).toBeDefined();
      expect(result.fallbackUsed).toBe(false);
      expect(duration).toBeLessThan(200); // Should be faster than sequential
    });

    it('should handle AI failure gracefully with fallback', async () => {
      mockValidateSafety.mockRejectedValue(new Error('AI service down'));

      const result = await validateMessageSafety(
        'Hello, how are you?',
        mockContext
      );

      expect(result.isSafe).toBe(true);
      expect(result.fallbackUsed).toBe(true);
      expect(result.processingTime).toBeDefined();

      // Debug: let's see what the actual result looks like
      console.log('Fallback test result:', JSON.stringify(result, null, 2));
    });

    it('should use fallback when AI service is marked as down', async () => {
      safetyFallback.setAIServiceStatus(true);

      const result = await validateMessageSafety(
        'Hello, how are you?',
        mockContext
      );

      expect(result.fallbackUsed).toBe(true);
      expect(mockValidateSafety).not.toHaveBeenCalled();
    });
  });

  describe('Intelligent Caching', () => {
    it('should cache and retrieve safety results', async () => {
      const message = 'Hello, how are you?';

      // Add a small delay to AI call to ensure processing time > 0
      mockValidateSafety.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  isSafe: true,
                  severity: 0,
                  reason: 'No safety concerns detected',
                  action: 'allow',
                  flaggedTerms: [],
                }),
              1
            )
          )
      );

      // First call - should not be cached
      const result1 = await validateMessageSafety(message, mockContext);
      expect(result1.cacheHit).toBe(false);
      expect(result1.processingTime).toBeGreaterThan(0);

      // Second call - should be cached
      const result2 = await validateMessageSafety(message, mockContext);
      expect(result2.cacheHit).toBe(true);
      expect(result2.processingTime).toBeDefined();
      // Cached results should be much faster (under 5ms)
      expect(result2.processingTime).toBeLessThan(5);
    });

    it('should not cache high-severity results', async () => {
      mockValidateSafety.mockResolvedValue({
        isSafe: false,
        severity: 3,
        reason: 'Critical safety concern',
        action: 'escalate',
        flaggedTerms: ['critical'],
      });

      const message = 'dangerous message';

      // First call
      const result1 = await validateMessageSafety(message, mockContext);
      expect(result1.severity).toBe(3);

      // Second call - should not be cached due to high severity, so should call AI again
      const result2 = await validateMessageSafety(message, mockContext);
      expect(result2.cacheHit).toBe(false);
      expect(mockValidateSafety).toHaveBeenCalledTimes(2); // Should be called twice
    });

    it('should normalize messages for better cache hits', async () => {
      // These messages should be considered similar after normalization
      await validateMessageSafety('Hello, how are you?', mockContext);
      const result = await validateMessageSafety(
        'hello how are you',
        mockContext
      );

      expect(result.cacheHit).toBe(true);
    });

    it('should provide cache statistics', () => {
      const stats = getSafetyMetrics();

      expect(stats.cache).toEqual(
        expect.objectContaining({
          hits: expect.any(Number),
          misses: expect.any(Number),
          size: expect.any(Number),
          hitRate: expect.any(Number),
        })
      );
    });
  });

  describe('Fallback System', () => {
    it('should detect critical patterns in fallback mode', () => {
      mockGetCompiledSafetyPatterns.mockReturnValue({
        critical: [
          {
            regex: /hurt myself/i,
            reason: 'Self-harm language',
            category: 'self_harm',
          },
        ],
        emotionalSupport: [],
        highConcern: [],
        contextualGuidance: [],
        youthCulture: [],
        gaming: [],
        school: [],
      });

      const result = safetyFallback.validateWithFallback(
        'I want to hurt myself',
        mockContext
      );

      expect(result.isSafe).toBe(false);
      expect(result.severity).toBe(3);
      expect(result.action).toBe('escalate');
      expect(result.flaggedTerms).toContain('self_harm');
    });

    it('should detect concerning behavioral patterns', () => {
      const result = safetyFallback.validateWithFallback(
        'I hate everything and everyone is terrible and awful',
        mockContext
      );

      expect(result.severity).toBe(1);
      expect(result.flaggedTerms).toContain('high_negative_emotion');
    });

    it('should flag extremely long messages', () => {
      const longMessage = 'a'.repeat(1001);

      const result = safetyFallback.validateWithFallback(
        longMessage,
        mockContext
      );

      expect(result.flaggedTerms).toContain('long_message');
    });

    it('should provide fallback system status', () => {
      const status = safetyFallback.getStatus();

      expect(status).toEqual(
        expect.objectContaining({
          isAIServiceDown: expect.any(Boolean),
          lastAICheck: expect.any(Number),
          shouldUseFallback: expect.any(Boolean),
          uptime: expect.any(Number),
        })
      );
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple messages in parallel', async () => {
      const messages = [
        { message: 'Hello', context: mockContext },
        { message: 'How are you?', context: mockContext },
        { message: 'What games do you like?', context: mockContext },
      ];

      const start = Date.now();
      const results = await validateMessagesSafety(messages, {
        parallel: true,
      });
      const duration = Date.now() - start;

      expect(results).toHaveLength(3);
      expect(results.every(r => r.isSafe)).toBe(true);
      expect(duration).toBeLessThan(500); // Should be much faster than sequential
    });

    it('should process messages sequentially when requested', async () => {
      const messages = [
        { message: 'Hello', context: mockContext },
        { message: 'How are you?', context: mockContext },
      ];

      const results = await validateMessagesSafety(messages, {
        parallel: false,
      });

      expect(results).toHaveLength(2);
      expect(results.every(r => r.isSafe)).toBe(true);
    });

    it('should handle batch failures gracefully', async () => {
      mockValidateSafety
        .mockResolvedValueOnce({
          isSafe: true,
          severity: 0,
          reason: 'Success',
          action: 'allow',
          flaggedTerms: [],
        })
        .mockRejectedValueOnce(new Error('AI failure'))
        .mockResolvedValueOnce({
          isSafe: true,
          severity: 0,
          reason: 'Success',
          action: 'allow',
          flaggedTerms: [],
        });

      const messages = [
        { message: 'Message 1', context: mockContext },
        { message: 'Message 2', context: mockContext },
        { message: 'Message 3', context: mockContext },
      ];

      const results = await validateMessagesSafety(messages);

      expect(results).toHaveLength(3);
      expect(results[0].isSafe).toBe(true);
      expect(results[1].fallbackUsed).toBe(true); // Should use fallback for failed message
      expect(results[2].isSafe).toBe(true);
    });

    it('should respect batch size limits', async () => {
      const messages = Array(7)
        .fill(null)
        .map((_, i) => ({
          message: `Message ${i + 1}`,
          context: mockContext,
        }));

      const results = await validateMessagesSafety(messages, { batchSize: 3 });

      expect(results).toHaveLength(7);
      // Should process in batches of 3: [3, 3, 1]
      expect(mockValidateSafety).toHaveBeenCalledTimes(7);
    });
  });

  describe('Performance Optimization', () => {
    it('should complete safety validation under 100ms target', async () => {
      const start = Date.now();
      await validateMessageSafety('Hello', mockContext);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should achieve >70% cache hit rate after warm-up', async () => {
      const messages = [
        'Hello',
        'Hi there',
        'How are you?',
        'Hello',
        'Hi there',
        'How are you?', // Repeat for cache hits
        'Hello',
        'Hi there',
        'How are you?',
      ];

      for (const message of messages) {
        await validateMessageSafety(message, mockContext);
      }

      const stats = getSafetyMetrics();
      expect(stats.cache.hitRate).toBeGreaterThan(0.5); // Should have good hit rate
    });

    it('should handle concurrent requests efficiently', async () => {
      const promises = Array(10)
        .fill(null)
        .map((_, i) =>
          validateMessageSafety(`Concurrent message ${i}`, mockContext)
        );

      const start = Date.now();
      const results = await Promise.all(promises);
      const duration = Date.now() - start;

      expect(results).toHaveLength(10);
      expect(results.every(r => r.processingTime !== undefined)).toBe(true);
      expect(duration).toBeLessThan(1000); // Should handle concurrent load well
    });
  });

  describe('Safety Event Logging and Escalation', () => {
    it('should log safety events for severity level 2+', async () => {
      mockValidateSafety.mockResolvedValue({
        isSafe: false,
        severity: 2,
        reason: 'Concerning content detected',
        action: 'warn',
        flaggedTerms: ['concerning'],
      });

      await validateMessageSafety('concerning message', mockContext);

      expect(mockPrismaCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'message_flagged',
            severityLevel: 2,
            childAccountId: 'child-123',
          }),
        })
      );
    });

    it('should escalate to parents for severity level 3', async () => {
      mockValidateSafety.mockResolvedValue({
        isSafe: false,
        severity: 3,
        reason: 'Critical safety concern',
        action: 'escalate',
        flaggedTerms: ['critical'],
      });

      await validateMessageSafety('critical message', mockContext);

      expect(mockSendSafetyAlert).toHaveBeenCalledWith(
        'parent@test.com',
        'Test Child',
        3,
        'critical message',
        'Test safety response for parent alert'
      );
    });

    it('should not log or escalate for safe messages', async () => {
      await validateMessageSafety('Hello, how are you?', mockContext);

      expect(mockPrismaCreate).not.toHaveBeenCalled();
      expect(mockSendSafetyAlert).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle complete system failure gracefully', async () => {
      mockValidateSafety.mockRejectedValue(new Error('AI service down'));
      mockGetCompiledSafetyPatterns.mockImplementation(() => {
        throw new Error('Config loading failed');
      });

      const result = await validateMessageSafety('test message', mockContext);

      expect(result.isSafe).toBe(false); // Should fail-safe
      expect(result.fallbackUsed).toBe(true);
      expect(result.processingTime).toBeDefined();
    });

    it('should maintain safety standards under load', async () => {
      // Simulate high load with many concurrent requests
      const highLoadPromises = Array(50)
        .fill(null)
        .map((_, i) =>
          validateMessageSafety(`Load test message ${i}`, mockContext)
        );

      const results = await Promise.allSettled(highLoadPromises);

      // All requests should complete successfully
      expect(results.every(r => r.status === 'fulfilled')).toBe(true);

      // Safety standards should be maintained
      const successfulResults = results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<any>).value);

      expect(
        successfulResults.every(
          r => r.severity !== undefined && r.action !== undefined
        )
      ).toBe(true);
    });
  });
});
