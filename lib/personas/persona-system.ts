/**
 * Advanced Persona System Core
 * Manages persona switching, context preservation, and response generation
 */

import {
  PersonaId,
  PersonaConfiguration,
  PersonaContext,
  PersonaSwitchRequest,
  PersonaResponse,
  PersonaSystemConfig,
  PersonaEvent,
  PersonaError,
} from './types';
import {
  PERSONA_CONFIGS,
  getPersonaConfig,
  getPersonasForAge,
} from './persona-configs';
import { PersonaResponseGenerator } from './response-generator';
import { PersonaRelationshipTracker } from './relationship-tracker';

/**
 * Core Persona System
 * Orchestrates all persona functionality including switching, responses, and tracking
 */
export class PersonaSystem {
  private responseGenerator: PersonaResponseGenerator;
  private relationshipTracker: PersonaRelationshipTracker;
  private config: PersonaSystemConfig;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(config?: Partial<PersonaSystemConfig>) {
    this.config = {
      defaultPersona: 'adventurous-andy',
      adaptationEnabled: true,
      contextPreservationEnabled: true,
      analyticsEnabled: true,
      switchingRules: {
        maxSwitchesPerSession: 3,
        minTimeBetweenSwitches: 5, // minutes
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
      ...config,
    };

    this.responseGenerator = new PersonaResponseGenerator(this.config);
    this.relationshipTracker = new PersonaRelationshipTracker(this.config);
  }

  /**
   * Initialize persona system for a child
   */
  async initializeForChild(
    childAccountId: string,
    childAge: number,
    preferences?: Partial<PersonaConfiguration>
  ): Promise<PersonaContext> {
    try {
      // Get age-appropriate personas
      const suitablePersonas = getPersonasForAge(childAge);

      // Determine initial persona (use preferences or default)
      let initialPersona = this.config.defaultPersona;
      if (preferences && suitablePersonas.some(p => p.id === preferences.id)) {
        initialPersona = preferences.id!;
      }

      // Create initial context
      const context: PersonaContext = {
        childAccountId,
        currentPersonaId: initialPersona,
        conversationId: '', // Will be set when conversation starts
        relationshipMetrics: {
          trustLevel: 5,
          engagementLevel: 5,
          preferenceScore: 5,
          interactionCount: 0,
          lastInteraction: new Date(),
        },
        conversationContext: {
          recentTopics: [],
          mood: 'neutral',
          energyLevel: 5,
          learningGoals: [],
          currentActivities: [],
        },
        adaptationData: {
          effectiveTopics: [],
          preferredCommunicationStyle: {},
          successfulResponsePatterns: [],
          timeOfDayPreferences: {},
        },
      };

      // Initialize relationship tracking
      await this.relationshipTracker.initializeRelationship(
        childAccountId,
        initialPersona
      );

      // Emit initialization event
      this.emitEvent({
        type: 'interaction',
        timestamp: new Date(),
        childAccountId,
        personaId: initialPersona,
        data: { action: 'initialized', childAge },
      });

      return context;
    } catch (error) {
      throw new PersonaError({
        code: 'CONTEXT_LOST',
        message: `Failed to initialize persona system for child: ${error}`,
        childAccountId,
      });
    }
  }

  /**
   * Generate a persona-specific response
   */
  async generateResponse(
    input: string,
    context: PersonaContext,
    options?: {
      responseType?:
        | 'greeting'
        | 'answer'
        | 'question'
        | 'encouragement'
        | 'transition'
        | 'farewell';
      topicsReferenced?: string[];
      emotionalContext?: string;
    }
  ): Promise<PersonaResponse> {
    try {
      // Get current persona configuration
      const personaConfig = getPersonaConfig(context.currentPersonaId);

      // Update relationship metrics
      await this.relationshipTracker.recordInteraction(
        context.childAccountId,
        context.currentPersonaId,
        { input, context: context.conversationContext }
      );

      // Generate response using the response generator
      const response = await this.responseGenerator.generatePersonaResponse(
        input,
        personaConfig,
        context,
        options
      );

      // Update context based on response
      this.updateConversationContext(context, input, response);

      // Learn from this interaction if adaptation is enabled
      if (this.config.adaptationEnabled) {
        await this.learnFromInteraction(context, input, response);
      }

      // Emit interaction event
      this.emitEvent({
        type: 'interaction',
        timestamp: new Date(),
        childAccountId: context.childAccountId,
        personaId: context.currentPersonaId,
        data: {
          input: input.substring(0, 100), // Truncate for privacy
          responseType: response.metadata.responseType,
          confidence: response.confidence,
        },
      });

      return response;
    } catch (error) {
      throw new PersonaError({
        code: 'ADAPTATION_FAILED',
        message: `Failed to generate persona response: ${error}`,
        personaId: context.currentPersonaId,
        childAccountId: context.childAccountId,
      });
    }
  }

  /**
   * Switch persona with context preservation
   */
  async switchPersona(
    request: PersonaSwitchRequest,
    context: PersonaContext
  ): Promise<PersonaContext> {
    try {
      // Validate switch request
      this.validateSwitchRequest(request, context);

      // Check if switch is allowed based on rules
      const canSwitch = await this.canSwitchPersona(request, context);
      if (!canSwitch.allowed) {
        throw new PersonaError({
          code: 'SWITCH_TOO_FREQUENT',
          message: canSwitch.reason || 'Persona switch not allowed',
          personaId: request.toPersonaId,
          childAccountId: request.childAccountId,
        });
      }

      // Create transition message if needed
      let transitionMessage = request.transitionMessage;
      if (!transitionMessage && request.preserveContext) {
        transitionMessage = await this.generateTransitionMessage(
          request.fromPersonaId,
          request.toPersonaId,
          context
        );
      }

      // Update context with new persona
      const newContext: PersonaContext = {
        ...context,
        currentPersonaId: request.toPersonaId,
      };

      // Preserve or reset context based on request
      if (!request.preserveContext) {
        newContext.conversationContext = {
          recentTopics: [],
          mood: 'neutral',
          energyLevel: 5,
          learningGoals: [],
          currentActivities: [],
        };
      }

      // Initialize relationship with new persona if needed
      await this.relationshipTracker.initializeRelationship(
        request.childAccountId,
        request.toPersonaId
      );

      // Update relationship metrics for the switch
      await this.relationshipTracker.recordPersonaSwitch(
        request.childAccountId,
        request.fromPersonaId,
        request.toPersonaId,
        request.reason
      );

      // Emit switch event
      this.emitEvent({
        type: 'persona_switch',
        timestamp: new Date(),
        childAccountId: request.childAccountId,
        personaId: request.toPersonaId,
        data: {
          fromPersona: request.fromPersonaId,
          reason: request.reason,
          preservedContext: request.preserveContext,
          transitionMessage,
        },
      });

      return newContext;
    } catch (error) {
      if (error instanceof PersonaError) {
        throw error;
      }
      throw new PersonaError({
        code: 'CONTEXT_LOST',
        message: `Failed to switch persona: ${error}`,
        personaId: request.toPersonaId,
        childAccountId: request.childAccountId,
      });
    }
  }

  /**
   * Get persona recommendations for a child
   */
  async getPersonaRecommendations(
    childAccountId: string,
    childAge: number,
    currentContext?: Partial<PersonaContext>
  ): Promise<{
    recommended: PersonaId[];
    reasons: Partial<Record<PersonaId, string>>;
    currentEffectiveness: number;
  }> {
    // Get age-appropriate personas
    const suitablePersonas = getPersonasForAge(childAge);

    // Get relationship data for analysis
    const relationships =
      await this.relationshipTracker.getChildRelationships(childAccountId);

    // Analyze current persona effectiveness
    const currentPersona =
      currentContext?.currentPersonaId || this.config.defaultPersona;
    const currentEffectiveness =
      await this.relationshipTracker.getPersonaEffectiveness(
        childAccountId,
        currentPersona
      );

    // Generate recommendations based on various factors
    const recommendations: PersonaId[] = [];
    const reasons: Partial<Record<PersonaId, string>> = {};

    for (const persona of suitablePersonas) {
      if (persona.id === currentPersona) continue;

      const effectiveness =
        await this.relationshipTracker.getPersonaEffectiveness(
          childAccountId,
          persona.id
        );

      const relationship = relationships.find(r => r.personaId === persona.id);

      // Score based on effectiveness, relationship depth, and variety
      let score = effectiveness * 0.4;
      if (relationship) {
        score += (relationship.averageEngagement / 10) * 0.3;
        score += (10 - relationship.totalInteractions) * 0.1; // Encourage variety
      } else {
        score += 0.2; // Bonus for trying new personas
      }

      // Add contextual bonuses
      if (currentContext?.conversationContext) {
        const topicAlignment = this.calculateTopicAlignment(
          persona,
          currentContext.conversationContext.recentTopics
        );
        score += topicAlignment * 0.2;
      }

      if (score > 0.6) {
        recommendations.push(persona.id);
        reasons[persona.id] = this.generateRecommendationReason(
          persona,
          score,
          relationship
        );
      }
    }

    // Sort by score (highest first)
    recommendations.sort((a, b) => {
      const scoreA = this.calculatePersonaScore(
        childAccountId,
        a,
        currentContext
      );
      const scoreB = this.calculatePersonaScore(
        childAccountId,
        b,
        currentContext
      );
      return scoreB - scoreA;
    });

    return {
      recommended: recommendations.slice(0, 3), // Top 3 recommendations
      reasons,
      currentEffectiveness,
    };
  }

  /**
   * Get analytics for persona usage
   */
  async getPersonaAnalytics(
    childAccountId: string,
    timeframe: 'day' | 'week' | 'month' | 'all_time'
  ) {
    return this.relationshipTracker.getAnalytics(childAccountId, timeframe);
  }

  // Private helper methods

  private validateSwitchRequest(
    request: PersonaSwitchRequest,
    context: PersonaContext
  ): void {
    if (!PERSONA_CONFIGS[request.toPersonaId]) {
      throw new PersonaError({
        code: 'INVALID_PERSONA',
        message: `Invalid persona ID: ${request.toPersonaId}`,
        personaId: request.toPersonaId,
      });
    }

    if (request.fromPersonaId !== context.currentPersonaId) {
      throw new PersonaError({
        code: 'CONTEXT_LOST',
        message: 'Switch request does not match current persona context',
        personaId: request.fromPersonaId,
      });
    }
  }

  private async canSwitchPersona(
    request: PersonaSwitchRequest,
    _context: PersonaContext
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Check max switches per session
    const sessionSwitches =
      await this.relationshipTracker.getSessionSwitchCount(
        request.childAccountId,
        request.conversationId
      );

    if (sessionSwitches >= this.config.switchingRules.maxSwitchesPerSession) {
      return {
        allowed: false,
        reason: 'Maximum persona switches per session reached',
      };
    }

    // Check minimum time between switches
    const lastSwitch = await this.relationshipTracker.getLastSwitchTime(
      request.childAccountId
    );

    if (lastSwitch) {
      const timeDiff = (Date.now() - lastSwitch.getTime()) / (1000 * 60); // minutes
      if (timeDiff < this.config.switchingRules.minTimeBetweenSwitches) {
        return {
          allowed: false,
          reason: `Please wait ${Math.ceil(this.config.switchingRules.minTimeBetweenSwitches - timeDiff)} more minutes before switching`,
        };
      }
    }

    // Check if child-initiated switches are allowed
    if (
      request.reason === 'child_request' &&
      !this.config.switchingRules.allowChildInitiatedSwitches
    ) {
      return {
        allowed: false,
        reason: 'Child-initiated persona switches are not enabled',
      };
    }

    return { allowed: true };
  }

  private async generateTransitionMessage(
    fromPersonaId: PersonaId,
    toPersonaId: PersonaId,
    _context: PersonaContext
  ): Promise<string> {
    const fromPersona = getPersonaConfig(fromPersonaId);
    const toPersona = getPersonaConfig(toPersonaId);

    // Use farewell from current persona and greeting from new persona
    const farewell =
      fromPersona.responsePatterns.farewells[
        Math.floor(
          Math.random() * fromPersona.responsePatterns.farewells.length
        )
      ];

    const greeting =
      toPersona.responsePatterns.greetings[
        Math.floor(Math.random() * toPersona.responsePatterns.greetings.length)
      ];

    return `${farewell}\n\n${greeting}`;
  }

  private updateConversationContext(
    context: PersonaContext,
    input: string,
    response: PersonaResponse
  ): void {
    // Update recent topics
    if (response.metadata.topicsReferenced.length > 0) {
      context.conversationContext.recentTopics = [
        ...response.metadata.topicsReferenced,
        ...context.conversationContext.recentTopics,
      ].slice(0, 10); // Keep last 10 topics
    }

    // Update mood based on emotional tone
    if (response.metadata.emotionalTone) {
      context.conversationContext.mood = response.metadata.emotionalTone;
    }

    // Update energy level based on response type and persona characteristics
    const persona = getPersonaConfig(context.currentPersonaId);
    if (response.metadata.responseType === 'encouragement') {
      context.conversationContext.energyLevel = Math.min(
        10,
        context.conversationContext.energyLevel + 1
      );
    } else if (persona.behavior.playfulness > 7) {
      context.conversationContext.energyLevel = Math.min(
        10,
        context.conversationContext.energyLevel + 0.5
      );
    }

    // Update relationship metrics
    context.relationshipMetrics.interactionCount++;
    context.relationshipMetrics.lastInteraction = new Date();

    // Adjust engagement based on response confidence
    if (response.confidence > 7) {
      context.relationshipMetrics.engagementLevel = Math.min(
        10,
        context.relationshipMetrics.engagementLevel + 0.1
      );
    }
  }

  private async learnFromInteraction(
    context: PersonaContext,
    input: string,
    response: PersonaResponse
  ): Promise<void> {
    // Learn effective topics
    if (
      response.confidence >
      this.config.learningConfig.personalizedResponseThreshold
    ) {
      response.metadata.topicsReferenced.forEach(topic => {
        if (!context.adaptationData.effectiveTopics.includes(topic)) {
          context.adaptationData.effectiveTopics.push(topic);
        }
      });
    }

    // Learn successful response patterns
    if (response.confidence > 8) {
      const pattern = response.metadata.responseType;
      if (
        !context.adaptationData.successfulResponsePatterns.includes(pattern)
      ) {
        context.adaptationData.successfulResponsePatterns.push(pattern);
      }
    }

    // Learn time-of-day preferences
    const hour = new Date().getHours();
    const currentScore = context.adaptationData.timeOfDayPreferences[hour] || 5;
    context.adaptationData.timeOfDayPreferences[hour] =
      (currentScore + response.confidence) / 2;

    // Store learning in relationship tracker
    await this.relationshipTracker.recordLearning(
      context.childAccountId,
      context.currentPersonaId,
      {
        effectiveTopics: context.adaptationData.effectiveTopics,
        successfulPatterns: context.adaptationData.successfulResponsePatterns,
        timePreferences: context.adaptationData.timeOfDayPreferences,
      }
    );
  }

  private calculateTopicAlignment(
    persona: PersonaConfiguration,
    recentTopics: string[]
  ): number {
    if (recentTopics.length === 0) return 0;

    let alignmentScore = 0;
    const totalTopics = recentTopics.length;

    recentTopics.forEach(topic => {
      if (
        persona.topicPreferences.loves.some(love =>
          topic.toLowerCase().includes(love)
        )
      ) {
        alignmentScore += 1;
      } else if (
        persona.topicPreferences.enjoys.some(enjoy =>
          topic.toLowerCase().includes(enjoy)
        )
      ) {
        alignmentScore += 0.6;
      } else if (
        persona.topicPreferences.neutral.some(neutral =>
          topic.toLowerCase().includes(neutral)
        )
      ) {
        alignmentScore += 0.3;
      }
    });

    return alignmentScore / totalTopics;
  }

  private calculatePersonaScore(
    _childAccountId: string,
    _personaId: PersonaId,
    _context?: Partial<PersonaContext>
  ): number {
    // This would be implemented with actual data
    // For now, return a placeholder score
    return Math.random() * 10;
  }

  private generateRecommendationReason(
    persona: PersonaConfiguration,
    score: number,
    relationship: any
  ): string {
    if (score > 0.8) {
      return `${persona.displayName} would be perfect for you right now! You two have great chemistry together.`;
    } else if (score > 0.7) {
      return `${persona.displayName} might be just what you need! They're great at ${persona.topicPreferences.loves[0]}.`;
    } else if (!relationship) {
      return `Why not try ${persona.displayName}? You haven't met them yet, and they're really friendly!`;
    } else {
      return `${persona.displayName} could bring a new perspective to our conversation!`;
    }
  }

  // Event system
  private emitEvent(event: PersonaEvent): void {
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in persona event listener:', error);
      }
    });
  }

  public addEventListener(eventType: string, listener: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  public removeEventListener(eventType: string, listener: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
}
