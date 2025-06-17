/**
 * Comprehensive Persona System Tests
 * Tests all components of the advanced persona system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PersonaSystem } from '../../lib/personas/persona-system';
import { PersonaResponseGenerator } from '../../lib/personas/response-generator';
import { PersonaRelationshipTracker } from '../../lib/personas/relationship-tracker';
import {
  getPersonaConfig,
  getPersonasForAge,
  getAllPersonaIds,
  getDefaultPersona,
} from '../../lib/personas/persona-configs';
import type {
  PersonaId,
  PersonaContext,
  PersonaSwitchRequest,
  PersonaSystemConfig,
} from '../../lib/personas/types';

describe('Persona System', () => {
  let personaSystem: PersonaSystem;
  let mockContext: PersonaContext;
  let mockConfig: PersonaSystemConfig;

  beforeEach(() => {
    mockConfig = {
      defaultPersona: 'adventurous-andy',
      adaptationEnabled: true,
      contextPreservationEnabled: true,
      analyticsEnabled: true,
      switchingRules: {
        maxSwitchesPerSession: 3,
        minTimeBetweenSwitches: 5,
        allowChildInitiatedSwitches: true,
        allowAdaptiveSwitches: false,
      },
      learningConfig: {
        adaptationSensitivity: 7,
        memoryRetentionDays: 30,
        minInteractionsForAdaptation: 5,
        personalizedResponseThreshold: 6,
      },
      safetyConfig: {
        validatePersonaResponses: true,
        maintainChildSafetyAcrossPersonas: true,
        logPersonaInteractions: true,
        parentVisibilityLevel: 'summary',
      },
    };

    personaSystem = new PersonaSystem(mockConfig);

    mockContext = {
      childAccountId: 'child_123',
      currentPersonaId: 'adventurous-andy',
      conversationId: 'conv_456',
      relationshipMetrics: {
        trustLevel: 7,
        engagementLevel: 8,
        preferenceScore: 6,
        interactionCount: 15,
        lastInteraction: new Date(),
      },
      conversationContext: {
        recentTopics: ['nature', 'exploration'],
        mood: 'excited',
        energyLevel: 8,
        learningGoals: ['outdoor activities'],
        currentActivities: ['planning adventure'],
      },
      adaptationData: {
        effectiveTopics: ['nature', 'animals'],
        preferredCommunicationStyle: {
          enthusiasm: 8,
          formality: 3,
        },
        successfulResponsePatterns: ['encouragement', 'question'],
        timeOfDayPreferences: {
          '14': 8.5, // 2 PM
          '16': 7.2, // 4 PM
        },
      },
    };
  });

  describe('PersonaSystem Core', () => {
    it('should initialize with default configuration', () => {
      const system = new PersonaSystem();
      expect(system).toBeDefined();
      expect(system.addEventListener).toBeDefined();
      expect(system.removeEventListener).toBeDefined();
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        ...mockConfig,
        defaultPersona: 'calm-clara' as PersonaId,
      };
      const system = new PersonaSystem(customConfig);
      expect(system).toBeDefined();
    });

    it('should initialize context for a child', async () => {
      const context = await personaSystem.initializeForChild('child_123', 8);

      expect(context).toBeDefined();
      expect(context.childAccountId).toBe('child_123');
      expect(context.currentPersonaId).toBe('adventurous-andy');
      expect(context.relationshipMetrics.trustLevel).toBe(5);
      expect(context.relationshipMetrics.engagementLevel).toBe(5);
      expect(context.conversationContext.mood).toBe('neutral');
    });

    it('should generate persona-specific responses', async () => {
      const response = await personaSystem.generateResponse(
        'I love exploring nature!',
        mockContext,
        { responseType: 'encouragement' }
      );

      expect(response).toBeDefined();
      expect(response.personaId).toBe('adventurous-andy');
      expect(response.content).toBeTruthy();
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.confidence).toBeLessThanOrEqual(10);
      expect(response.metadata.responseType).toBe('encouragement');
    });

    it('should handle persona switching with context preservation', async () => {
      const switchRequest: PersonaSwitchRequest = {
        fromPersonaId: 'adventurous-andy',
        toPersonaId: 'calm-clara',
        childAccountId: 'child_123',
        conversationId: 'conv_456',
        reason: 'child_request',
        preserveContext: true,
      };

      const newContext = await personaSystem.switchPersona(
        switchRequest,
        mockContext
      );

      expect(newContext.currentPersonaId).toBe('calm-clara');
      expect(newContext.conversationContext.recentTopics).toEqual([
        'nature',
        'exploration',
      ]);
      expect(newContext.conversationContext.mood).toBe('excited');
    });

    it('should handle persona switching without context preservation', async () => {
      const switchRequest: PersonaSwitchRequest = {
        fromPersonaId: 'adventurous-andy',
        toPersonaId: 'funny-felix',
        childAccountId: 'child_123',
        conversationId: 'conv_456',
        reason: 'parent_override',
        preserveContext: false,
      };

      const newContext = await personaSystem.switchPersona(
        switchRequest,
        mockContext
      );

      expect(newContext.currentPersonaId).toBe('funny-felix');
      expect(newContext.conversationContext.recentTopics).toEqual([]);
      expect(newContext.conversationContext.mood).toBe('neutral');
    });

    it('should provide persona recommendations', async () => {
      const recommendations = await personaSystem.getPersonaRecommendations(
        'child_123',
        9,
        mockContext
      );

      expect(recommendations).toBeDefined();
      expect(recommendations.recommended).toBeInstanceOf(Array);
      expect(recommendations.recommended.length).toBeLessThanOrEqual(3);
      expect(recommendations.reasons).toBeDefined();
      expect(recommendations.currentEffectiveness).toBeGreaterThanOrEqual(0);
    });

    it('should get persona analytics', async () => {
      const analytics = await personaSystem.getPersonaAnalytics(
        'child_123',
        'week'
      );

      expect(analytics).toBeDefined();
      expect(analytics).toBeInstanceOf(Array);
    });

    it('should emit events for persona interactions', async () => {
      const eventSpy = vi.fn();
      personaSystem.addEventListener('interaction', eventSpy);

      await personaSystem.generateResponse('Hello!', mockContext);

      expect(eventSpy).toHaveBeenCalled();
      const eventData = eventSpy.mock.calls[0][0];
      expect(eventData.type).toBe('interaction');
      expect(eventData.childAccountId).toBe('child_123');
      expect(eventData.personaId).toBe('adventurous-andy');
    });
  });

  describe('PersonaResponseGenerator', () => {
    let responseGenerator: PersonaResponseGenerator;

    beforeEach(() => {
      responseGenerator = new PersonaResponseGenerator(mockConfig);
    });

    it('should generate greeting responses', async () => {
      const persona = getPersonaConfig('adventurous-andy');
      const response = await responseGenerator.generatePersonaResponse(
        'Hello!',
        persona,
        mockContext,
        { responseType: 'greeting' }
      );

      expect(response.content).toBeTruthy();
      expect(response.metadata.responseType).toBe('greeting');
      expect(response.confidence).toBeGreaterThan(0);
    });

    it('should generate encouragement responses', async () => {
      const persona = getPersonaConfig('calm-clara');
      const response = await responseGenerator.generatePersonaResponse(
        'I feel sad',
        persona,
        mockContext,
        { responseType: 'encouragement' }
      );

      expect(response.content).toBeTruthy();
      expect(response.metadata.responseType).toBe('encouragement');
      expect(response.traits).toContain('empathy');
    });

    it('should adapt response style to persona characteristics', async () => {
      const adventurousPersona = getPersonaConfig('adventurous-andy');
      const calmPersona = getPersonaConfig('calm-clara');

      const adventurousResponse =
        await responseGenerator.generatePersonaResponse(
          'What should we do?',
          adventurousPersona,
          mockContext
        );

      const calmResponse = await responseGenerator.generatePersonaResponse(
        'What should we do?',
        calmPersona,
        mockContext
      );

      // Adventurous Andy should be more enthusiastic
      expect(adventurousResponse.content.includes('!')).toBeTruthy();
      // Calm Clara should be more measured
      expect(calmResponse.metadata.complexityLevel).toBeGreaterThanOrEqual(6);
    });

    it('should extract topics from responses', async () => {
      const persona = getPersonaConfig('nature-nova');
      const response = await responseGenerator.generatePersonaResponse(
        'Tell me about animals',
        persona,
        mockContext
      );

      expect(response.metadata.topicsReferenced.length).toBeGreaterThan(0);
    });

    it('should calculate appropriate confidence scores', async () => {
      const persona = getPersonaConfig('adventurous-andy');
      const highConfidenceResponse =
        await responseGenerator.generatePersonaResponse(
          'I love exploring nature!', // Topic Andy loves
          persona,
          mockContext
        );

      const neutralResponse = await responseGenerator.generatePersonaResponse(
        'What is math?', // Neutral topic
        persona,
        mockContext
      );

      expect(highConfidenceResponse.confidence).toBeGreaterThan(
        neutralResponse.confidence
      );
    });
  });

  describe('PersonaRelationshipTracker', () => {
    let relationshipTracker: PersonaRelationshipTracker;

    beforeEach(() => {
      relationshipTracker = new PersonaRelationshipTracker(mockConfig);
    });

    it('should initialize relationships for new child-persona pairs', async () => {
      await relationshipTracker.initializeRelationship(
        'child_123',
        'adventurous-andy'
      );

      const relationships =
        await relationshipTracker.getChildRelationships('child_123');
      expect(relationships.length).toBe(1);
      expect(relationships[0].personaId).toBe('adventurous-andy');
      expect(relationships[0].relationshipPhase).toBe('introduction');
    });

    it('should record interactions and update metrics', async () => {
      await relationshipTracker.initializeRelationship(
        'child_123',
        'adventurous-andy'
      );

      await relationshipTracker.recordInteraction(
        'child_123',
        'adventurous-andy',
        {
          input: 'I love nature!',
          context: {},
          success: true,
          engagement: 9,
        }
      );

      const relationships =
        await relationshipTracker.getChildRelationships('child_123');
      const relationship = relationships[0];

      expect(relationship.totalInteractions).toBe(1);
      expect(relationship.successfulInteractions).toBe(1);
      expect(relationship.averageEngagement).toBe(9);
    });

    it('should track persona switches', async () => {
      await relationshipTracker.initializeRelationship(
        'child_123',
        'adventurous-andy'
      );
      await relationshipTracker.initializeRelationship(
        'child_123',
        'calm-clara'
      );

      await relationshipTracker.recordPersonaSwitch(
        'child_123',
        'adventurous-andy',
        'calm-clara',
        'child_request'
      );

      const relationships =
        await relationshipTracker.getChildRelationships('child_123');
      const claraRelationship = relationships.find(
        r => r.personaId === 'calm-clara'
      );

      expect(claraRelationship?.personalizedElements).toContain(
        'switch_preference'
      );
      expect(claraRelationship?.trustIndicators).toContain(
        'child_initiated_switch'
      );
    });

    it('should record learning data', async () => {
      await relationshipTracker.initializeRelationship(
        'child_123',
        'adventurous-andy'
      );

      await relationshipTracker.recordLearning(
        'child_123',
        'adventurous-andy',
        {
          effectiveTopics: ['nature', 'animals'],
          successfulPatterns: ['encouragement'],
          timePreferences: { '14': 8.5 },
        }
      );

      const relationships =
        await relationshipTracker.getChildRelationships('child_123');
      const relationship = relationships[0];

      expect(relationship.preferredTopics['nature']).toBe(1);
      expect(relationship.preferredTopics['animals']).toBe(1);
      expect(relationship.effectiveCommunicationStyles['encouragement']).toBe(
        1
      );
      expect(relationship.timeBasedPreferences[14]).toBe(8.5);
    });

    it('should calculate persona effectiveness', async () => {
      await relationshipTracker.initializeRelationship(
        'child_123',
        'adventurous-andy'
      );

      // Record multiple successful interactions
      for (let i = 0; i < 5; i++) {
        await relationshipTracker.recordInteraction(
          'child_123',
          'adventurous-andy',
          {
            input: 'Great!',
            context: {},
            success: true,
            engagement: 8,
          }
        );
      }

      const effectiveness = await relationshipTracker.getPersonaEffectiveness(
        'child_123',
        'adventurous-andy'
      );
      expect(effectiveness).toBeGreaterThan(6);
    });

    it('should update relationship phases based on interactions', async () => {
      await relationshipTracker.initializeRelationship(
        'child_123',
        'adventurous-andy'
      );

      // Record enough interactions to move past introduction phase
      for (let i = 0; i < 5; i++) {
        await relationshipTracker.recordInteraction(
          'child_123',
          'adventurous-andy',
          {
            input: 'Hello!',
            context: {},
            success: true,
            engagement: 7,
          }
        );
      }

      const relationships =
        await relationshipTracker.getChildRelationships('child_123');
      const relationship = relationships[0];

      expect(relationship.relationshipPhase).toBe('building');
    });

    it('should generate analytics data', async () => {
      await relationshipTracker.initializeRelationship(
        'child_123',
        'adventurous-andy'
      );

      const analytics = await relationshipTracker.getAnalytics(
        'child_123',
        'week'
      );

      expect(analytics).toBeInstanceOf(Array);
      expect(analytics[0]).toBeDefined();
      expect(analytics[0].usageStats).toBeDefined();
      expect(analytics[0].effectivenessScores).toBeDefined();
      expect(analytics[0].recommendations).toBeDefined();
    });
  });

  describe('Persona Configurations', () => {
    it('should have all 8 personas defined', () => {
      const allPersonaIds = getAllPersonaIds();
      expect(allPersonaIds).toHaveLength(8);

      const expectedPersonas: PersonaId[] = [
        'adventurous-andy',
        'calm-clara',
        'funny-felix',
        'wise-willow',
        'creative-chloe',
        'sporty-sam',
        'bookworm-ben',
        'nature-nova',
      ];

      expectedPersonas.forEach(personaId => {
        expect(allPersonaIds).toContain(personaId);
      });
    });

    it('should return valid persona configurations', () => {
      const andyConfig = getPersonaConfig('adventurous-andy');

      expect(andyConfig.id).toBe('adventurous-andy');
      expect(andyConfig.displayName).toBe('Adventurous Andy');
      expect(andyConfig.traits).toBeInstanceOf(Array);
      expect(andyConfig.traits.length).toBeGreaterThan(0);
      expect(andyConfig.communicationStyle).toBeDefined();
      expect(andyConfig.responsePatterns).toBeDefined();
      expect(andyConfig.topicPreferences).toBeDefined();
      expect(andyConfig.behavior).toBeDefined();
      expect(andyConfig.voiceProfile).toBeDefined();
    });

    it('should filter personas by age appropriately', () => {
      const personasFor6YearOld = getPersonasForAge(6);
      const personasFor12YearOld = getPersonasForAge(12);

      expect(personasFor6YearOld.length).toBeGreaterThan(0);
      expect(personasFor12YearOld.length).toBeGreaterThan(0);

      // All returned personas should include the specified age in their range
      personasFor6YearOld.forEach(persona => {
        expect(persona.ageRange[0]).toBeLessThanOrEqual(6);
        expect(persona.ageRange[1]).toBeGreaterThanOrEqual(6);
      });
    });

    it('should return default persona', () => {
      const defaultPersona = getDefaultPersona();
      expect(defaultPersona.id).toBe('adventurous-andy');
    });

    it('should have complete persona configurations', () => {
      const allPersonaIds = getAllPersonaIds();

      allPersonaIds.forEach(personaId => {
        const config = getPersonaConfig(personaId);

        // Check required fields
        expect(config.id).toBeTruthy();
        expect(config.displayName).toBeTruthy();
        expect(config.description).toBeTruthy();
        expect(config.ageRange).toHaveLength(2);
        expect(config.traits.length).toBeGreaterThan(0);

        // Check communication style
        expect(config.communicationStyle.enthusiasm).toBeBetween(1, 10);
        expect(config.communicationStyle.formality).toBeBetween(1, 10);
        expect(config.communicationStyle.wordComplexity).toBeBetween(1, 10);
        expect(config.communicationStyle.emotionExpression).toBeBetween(1, 10);

        // Check response patterns
        expect(config.responsePatterns.greetings.length).toBeGreaterThan(0);
        expect(config.responsePatterns.encouragement.length).toBeGreaterThan(0);
        expect(config.responsePatterns.questionStarters.length).toBeGreaterThan(
          0
        );
        expect(config.responsePatterns.farewells.length).toBeGreaterThan(0);

        // Check behavior characteristics
        expect(config.behavior.patienceLevel).toBeBetween(1, 10);
        expect(config.behavior.curiosityLevel).toBeBetween(1, 10);
        expect(config.behavior.helpfulness).toBeBetween(1, 10);
        expect(config.behavior.playfulness).toBeBetween(1, 10);
        expect(config.behavior.empathy).toBeBetween(1, 10);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid persona switching requests', async () => {
      const invalidSwitchRequest: PersonaSwitchRequest = {
        fromPersonaId: 'adventurous-andy',
        toPersonaId: 'invalid-persona' as PersonaId,
        childAccountId: 'child_123',
        conversationId: 'conv_456',
        reason: 'child_request',
        preserveContext: true,
      };

      await expect(
        personaSystem.switchPersona(invalidSwitchRequest, mockContext)
      ).rejects.toThrow();
    });

    it('should handle context mismatch in persona switching', async () => {
      const mismatchedSwitchRequest: PersonaSwitchRequest = {
        fromPersonaId: 'calm-clara', // Different from mockContext.currentPersonaId
        toPersonaId: 'funny-felix',
        childAccountId: 'child_123',
        conversationId: 'conv_456',
        reason: 'child_request',
        preserveContext: true,
      };

      await expect(
        personaSystem.switchPersona(mismatchedSwitchRequest, mockContext)
      ).rejects.toThrow();
    });

    it('should handle response generation errors gracefully', async () => {
      // Test with extremely long input that might cause issues
      const veryLongInput = 'a'.repeat(10000);

      await expect(
        personaSystem.generateResponse(veryLongInput, mockContext)
      ).resolves.toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should generate responses quickly', async () => {
      const startTime = Date.now();

      await personaSystem.generateResponse('Hello!', mockContext);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (< 1 second for test environment)
      expect(duration).toBeLessThan(1000);
    });

    it('should handle multiple concurrent persona operations', async () => {
      const promises = [
        personaSystem.generateResponse('Hello!', mockContext),
        personaSystem.getPersonaRecommendations('child_123', 9),
        personaSystem.getPersonaAnalytics('child_123', 'day'),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results[0]).toBeDefined(); // Response
      expect(results[1]).toBeDefined(); // Recommendations
      expect(results[2]).toBeDefined(); // Analytics
    });
  });
});

// Custom matchers for cleaner test assertions
expect.extend({
  toBeBetween(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be between ${floor} and ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be between ${floor} and ${ceiling}`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace Vi {
    interface Assertion<T = any> {
      toBeBetween(floor: number, ceiling: number): T;
    }
  }
}
