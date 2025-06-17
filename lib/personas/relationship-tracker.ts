/**
 * Persona Relationship Tracker
 * Tracks and analyzes child-persona relationships and interactions
 */

import {
  PersonaId,
  PersonaRelationshipHistory,
  PersonaAnalytics,
  PersonaSystemConfig,
} from './types';

export class PersonaRelationshipTracker {
  private config: PersonaSystemConfig;
  private relationshipData: Map<string, PersonaRelationshipHistory[]> =
    new Map();

  constructor(config: PersonaSystemConfig) {
    this.config = config;
  }

  /**
   * Initialize relationship tracking for a child-persona pair
   */
  async initializeRelationship(
    childAccountId: string,
    personaId: PersonaId
  ): Promise<void> {
    const existingRelationships =
      this.relationshipData.get(childAccountId) || [];

    // Check if relationship already exists
    const existingRelationship = existingRelationships.find(
      r => r.personaId === personaId
    );

    if (!existingRelationship) {
      const newRelationship: PersonaRelationshipHistory = {
        childAccountId,
        personaId,
        totalInteractions: 0,
        successfulInteractions: 0,
        averageEngagement: 5.0,
        preferredTopics: {},
        effectiveCommunicationStyles: {},
        timeBasedPreferences: {},
        relationshipPhase: 'introduction',
        trustIndicators: [],
        personalizedElements: [],
        createdAt: new Date(),
        lastInteraction: new Date(),
      };

      existingRelationships.push(newRelationship);
      this.relationshipData.set(childAccountId, existingRelationships);
    }
  }

  /**
   * Record an interaction between child and persona
   */
  async recordInteraction(
    childAccountId: string,
    personaId: PersonaId,
    interactionData: {
      input: string;
      context: any;
      success?: boolean;
      engagement?: number;
    }
  ): Promise<void> {
    const relationships = this.relationshipData.get(childAccountId) || [];
    const relationship = relationships.find(r => r.personaId === personaId);

    if (!relationship) {
      await this.initializeRelationship(childAccountId, personaId);
      return this.recordInteraction(childAccountId, personaId, interactionData);
    }

    // Update interaction counts
    relationship.totalInteractions++;
    if (interactionData.success !== false) {
      relationship.successfulInteractions++;
    }

    // Update engagement average
    if (interactionData.engagement !== undefined) {
      const currentAvg = relationship.averageEngagement;
      const totalInteractions = relationship.totalInteractions;
      relationship.averageEngagement =
        (currentAvg * (totalInteractions - 1) + interactionData.engagement) /
        totalInteractions;
    }

    // Extract and track topics
    await this.extractAndTrackTopics(relationship, interactionData.input);

    // Update relationship phase based on interaction count and engagement
    this.updateRelationshipPhase(relationship);

    // Update last interaction timestamp
    relationship.lastInteraction = new Date();

    // Store updated relationships
    this.relationshipData.set(childAccountId, relationships);
  }

  /**
   * Record a persona switch event
   */
  async recordPersonaSwitch(
    childAccountId: string,
    fromPersonaId: PersonaId,
    toPersonaId: PersonaId,
    reason?: string
  ): Promise<void> {
    // This would typically be stored in the database
    // For now, we'll track it in memory as part of the relationship data

    const relationships = this.relationshipData.get(childAccountId) || [];
    const toRelationship = relationships.find(r => r.personaId === toPersonaId);

    // Record switch preference in the destination persona's data
    if (toRelationship) {
      if (!toRelationship.personalizedElements.includes('switch_preference')) {
        toRelationship.personalizedElements.push('switch_preference');
      }
    }

    // Update trust indicators if this was a child-initiated switch
    if (reason === 'child_request' && toRelationship) {
      if (!toRelationship.trustIndicators.includes('child_initiated_switch')) {
        toRelationship.trustIndicators.push('child_initiated_switch');
      }
    }
  }

  /**
   * Record learning from successful interactions
   */
  async recordLearning(
    childAccountId: string,
    personaId: PersonaId,
    learningData: {
      effectiveTopics: string[];
      successfulPatterns: string[];
      timePreferences: Record<string, number>;
    }
  ): Promise<void> {
    const relationships = this.relationshipData.get(childAccountId) || [];
    const relationship = relationships.find(r => r.personaId === personaId);

    if (!relationship) return;

    // Update effective topics
    learningData.effectiveTopics.forEach(topic => {
      relationship.preferredTopics[topic] =
        (relationship.preferredTopics[topic] || 0) + 1;
    });

    // Update effective communication styles
    learningData.successfulPatterns.forEach(pattern => {
      relationship.effectiveCommunicationStyles[pattern] =
        (relationship.effectiveCommunicationStyles[pattern] || 0) + 1;
    });

    // Update time-based preferences
    Object.entries(learningData.timePreferences).forEach(
      ([hour, preference]) => {
        relationship.timeBasedPreferences[parseInt(hour)] = preference;
      }
    );

    // Add personalized learning indicator
    if (!relationship.personalizedElements.includes('adaptive_learning')) {
      relationship.personalizedElements.push('adaptive_learning');
    }
  }

  /**
   * Get all relationships for a child
   */
  async getChildRelationships(
    childAccountId: string
  ): Promise<PersonaRelationshipHistory[]> {
    return this.relationshipData.get(childAccountId) || [];
  }

  /**
   * Get effectiveness score for a specific persona
   */
  async getPersonaEffectiveness(
    childAccountId: string,
    personaId: PersonaId
  ): Promise<number> {
    const relationships = this.relationshipData.get(childAccountId) || [];
    const relationship = relationships.find(r => r.personaId === personaId);

    if (!relationship) return 5.0; // Default neutral effectiveness

    // Calculate effectiveness based on multiple factors
    const successRate =
      relationship.totalInteractions > 0
        ? relationship.successfulInteractions / relationship.totalInteractions
        : 0.5;

    const engagementScore = relationship.averageEngagement / 10;

    const relationshipDepth = this.calculateRelationshipDepth(relationship);

    // Weighted average of different factors
    const effectiveness =
      successRate * 0.4 + engagementScore * 0.4 + relationshipDepth * 0.2;

    return Math.min(10, Math.max(0, effectiveness * 10));
  }

  /**
   * Get session-specific metrics
   */
  async getSessionSwitchCount(
    _childAccountId: string,
    _conversationId: string
  ): Promise<number> {
    // This would typically query the database for session-specific data
    // For now, return a simulated count
    return Math.floor(Math.random() * 3);
  }

  /**
   * Get last persona switch time
   */
  async getLastSwitchTime(_childAccountId: string): Promise<Date | null> {
    // This would typically query the database
    // For now, return a simulated recent time or null
    return Math.random() > 0.5 ? new Date(Date.now() - 30 * 60 * 1000) : null; // 30 minutes ago or null
  }

  /**
   * Get analytics for persona usage
   */
  async getAnalytics(
    childAccountId: string,
    timeframe: 'day' | 'week' | 'month' | 'all_time'
  ): Promise<PersonaAnalytics[]> {
    const relationships = this.relationshipData.get(childAccountId) || [];

    return relationships.map(relationship => ({
      personaId: relationship.personaId,
      childAccountId,
      timeframe,
      usageStats: {
        totalDuration: this.calculateTotalDuration(relationship, timeframe),
        messageCount: this.calculateMessageCount(relationship, timeframe),
        averageSessionLength: this.calculateAverageSessionLength(
          relationship,
          timeframe
        ),
        switchFrequency: this.calculateSwitchFrequency(relationship, timeframe),
      },
      effectivenessScores: {
        engagement: relationship.averageEngagement,
        satisfaction: this.calculateSatisfactionScore(relationship),
        learning: this.calculateLearningScore(relationship),
        emotional_support: this.calculateEmotionalSupportScore(relationship),
      },
      comparisonToOtherPersonas: this.calculateComparisonScores(
        relationships,
        relationship
      ),
      recommendations: this.generateRecommendations(relationship),
    }));
  }

  // Private helper methods

  private async extractAndTrackTopics(
    relationship: PersonaRelationshipHistory,
    input: string
  ): Promise<void> {
    // Simple topic extraction - in production would use more sophisticated NLP
    const commonTopics = [
      'games',
      'school',
      'friends',
      'family',
      'animals',
      'sports',
      'art',
      'music',
      'books',
      'movies',
      'science',
      'nature',
      'food',
      'travel',
      'technology',
    ];

    const inputLower = input.toLowerCase();
    commonTopics.forEach(topic => {
      if (inputLower.includes(topic)) {
        relationship.preferredTopics[topic] =
          (relationship.preferredTopics[topic] || 0) + 1;
      }
    });
  }

  private updateRelationshipPhase(
    relationship: PersonaRelationshipHistory
  ): void {
    const interactions = relationship.totalInteractions;
    const engagement = relationship.averageEngagement;

    if (interactions >= 20 && engagement >= 8) {
      relationship.relationshipPhase = 'deep_connection';
    } else if (interactions >= 10 && engagement >= 7) {
      relationship.relationshipPhase = 'established';
    } else if (interactions >= 3) {
      relationship.relationshipPhase = 'building';
    } else {
      relationship.relationshipPhase = 'introduction';
    }
  }

  private calculateRelationshipDepth(
    relationship: PersonaRelationshipHistory
  ): number {
    let depth = 0;

    // Factor in interaction count
    depth += Math.min(relationship.totalInteractions / 20, 1) * 0.3;

    // Factor in trust indicators
    depth += relationship.trustIndicators.length * 0.1;

    // Factor in personalized elements
    depth += relationship.personalizedElements.length * 0.1;

    // Factor in relationship phase
    const phaseScores = {
      introduction: 0,
      building: 0.3,
      established: 0.6,
      deep_connection: 1.0,
    };
    depth += phaseScores[relationship.relationshipPhase] * 0.3;

    return Math.min(1, depth);
  }

  private calculateTotalDuration(
    relationship: PersonaRelationshipHistory,
    timeframe: string
  ): number {
    // Simulated calculation - would query actual data in production
    const baseMinutes = relationship.totalInteractions * 5; // 5 minutes average per interaction

    switch (timeframe) {
      case 'day':
        return Math.min(baseMinutes, 120); // Max 2 hours per day
      case 'week':
        return Math.min(baseMinutes, 840); // Max 14 hours per week
      case 'month':
        return baseMinutes;
      case 'all_time':
        return baseMinutes;
      default:
        return baseMinutes;
    }
  }

  private calculateMessageCount(
    relationship: PersonaRelationshipHistory,
    timeframe: string
  ): number {
    // Simulated calculation
    const baseMessages = relationship.totalInteractions * 8; // Average 8 messages per interaction

    switch (timeframe) {
      case 'day':
        return Math.floor(baseMessages / 30); // Rough daily average
      case 'week':
        return Math.floor(baseMessages / 4); // Rough weekly average
      default:
        return baseMessages;
    }
  }

  private calculateAverageSessionLength(
    relationship: PersonaRelationshipHistory,
    _timeframe: string
  ): number {
    // Simulated calculation - would be based on actual session data
    return 15 + (relationship.averageEngagement - 5) * 2; // 15-25 minutes based on engagement
  }

  private calculateSwitchFrequency(
    _relationship: PersonaRelationshipHistory,
    _timeframe: string
  ): number {
    // Simulated calculation
    return Math.random() * 2; // 0-2 switches per session average
  }

  private calculateSatisfactionScore(
    relationship: PersonaRelationshipHistory
  ): number {
    // Base satisfaction on engagement and relationship depth
    const engagementFactor = relationship.averageEngagement / 10;
    const depthFactor = this.calculateRelationshipDepth(relationship);
    return (engagementFactor * 0.7 + depthFactor * 0.3) * 10;
  }

  private calculateLearningScore(
    relationship: PersonaRelationshipHistory
  ): number {
    // Base learning on variety of topics and personalized elements
    const topicVariety = Object.keys(relationship.preferredTopics).length / 10; // Normalize
    const personalizationFactor = relationship.personalizedElements.length / 5; // Normalize
    return Math.min(10, (topicVariety + personalizationFactor) * 5);
  }

  private calculateEmotionalSupportScore(
    relationship: PersonaRelationshipHistory
  ): number {
    // Check for emotional support indicators
    const supportIndicators = relationship.trustIndicators.filter(
      indicator =>
        indicator.includes('emotional') || indicator.includes('support')
    ).length;

    const baseScore = relationship.averageEngagement;
    return Math.min(10, baseScore + supportIndicators);
  }

  private calculateComparisonScores(
    allRelationships: PersonaRelationshipHistory[],
    currentRelationship: PersonaRelationshipHistory
  ): Record<PersonaId, number> {
    const comparisons: Record<PersonaId, number> = {} as Record<
      PersonaId,
      number
    >;

    const currentEffectiveness =
      this.calculateRelationshipDepth(currentRelationship) * 10;

    allRelationships.forEach(relationship => {
      if (relationship.personaId !== currentRelationship.personaId) {
        const otherEffectiveness =
          this.calculateRelationshipDepth(relationship) * 10;
        comparisons[relationship.personaId] =
          currentEffectiveness - otherEffectiveness;
      }
    });

    return comparisons;
  }

  private generateRecommendations(relationship: PersonaRelationshipHistory): {
    optimizeFor: string[];
    adjustments: string[];
    alternativePersonas: PersonaId[];
  } {
    const recommendations = {
      optimizeFor: [] as string[],
      adjustments: [] as string[],
      alternativePersonas: [] as PersonaId[],
    };

    // Generate optimization suggestions
    if (relationship.averageEngagement < 6) {
      recommendations.optimizeFor.push('engagement');
      recommendations.adjustments.push(
        'increase playfulness and interaction variety'
      );
    }

    if (Object.keys(relationship.preferredTopics).length < 3) {
      recommendations.optimizeFor.push('topic_variety');
      recommendations.adjustments.push(
        'explore more diverse conversation topics'
      );
    }

    if (
      relationship.relationshipPhase === 'introduction' &&
      relationship.totalInteractions > 5
    ) {
      recommendations.adjustments.push(
        'focus on building trust and personal connection'
      );
    }

    // Suggest alternative personas if current one isn't highly effective
    if (relationship.averageEngagement < 7) {
      // This would be more sophisticated in production
      const alternatives: PersonaId[] = [
        'calm-clara',
        'funny-felix',
        'creative-chloe',
      ];
      recommendations.alternativePersonas = alternatives
        .filter(p => p !== relationship.personaId)
        .slice(0, 2);
    }

    return recommendations;
  }
}
