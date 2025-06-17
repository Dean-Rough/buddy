/**
 * Persona Response Generator
 * Generates personality-consistent responses for each persona
 */

import {
  PersonaConfiguration,
  PersonaContext,
  PersonaResponse,
  PersonaSystemConfig,
} from './types';

export class PersonaResponseGenerator {
  private config: PersonaSystemConfig;

  constructor(config: PersonaSystemConfig) {
    this.config = config;
  }

  /**
   * Generate a persona-specific response
   */
  async generatePersonaResponse(
    input: string,
    personaConfig: PersonaConfiguration,
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
      // Determine response type if not specified
      const responseType =
        options?.responseType || this.detectResponseType(input, context);

      // Generate base response content
      const content = await this.generateResponseContent(
        input,
        personaConfig,
        context,
        responseType,
        options
      );

      // Calculate response confidence
      const confidence = this.calculateResponseConfidence(
        content,
        personaConfig,
        context,
        responseType
      );

      // Extract emphasized traits
      const traits = this.extractEmphasizedTraits(
        content,
        personaConfig,
        responseType
      );

      // Generate adaptations made for this child
      const adaptations = this.generateAdaptations(personaConfig, context);

      // Extract topics referenced
      const topicsReferenced =
        options?.topicsReferenced ||
        this.extractTopicsFromResponse(content, personaConfig);

      // Determine emotional tone
      const emotionalTone = this.determineEmotionalTone(
        content,
        personaConfig,
        responseType
      );

      // Calculate complexity and personalization levels
      const complexityLevel = this.calculateComplexityLevel(
        content,
        personaConfig
      );
      const personalizationLevel = this.calculatePersonalizationLevel(
        content,
        context
      );

      return {
        content,
        personaId: personaConfig.id,
        confidence,
        traits,
        adaptations,
        metadata: {
          responseType,
          topicsReferenced,
          emotionalTone,
          complexityLevel,
          personalizationLevel,
        },
      };
    } catch (error) {
      throw new Error(`Failed to generate persona response: ${error}`);
    }
  }

  private detectResponseType(
    input: string,
    _context: PersonaContext
  ): PersonaResponse['metadata']['responseType'] {
    const lowerInput = input.toLowerCase();

    // Check for greetings
    if (lowerInput.match(/^(hi|hello|hey|good morning|good afternoon)/)) {
      return 'greeting';
    }

    // Check for farewells
    if (lowerInput.match(/(bye|goodbye|see you|gotta go|talk later)/)) {
      return 'farewell';
    }

    // Check for questions
    if (
      lowerInput.includes('?') ||
      lowerInput.match(/^(what|how|why|when|where|can you|do you|will you)/)
    ) {
      return 'answer';
    }

    // Check if child seems to need encouragement
    if (
      lowerInput.match(/(sad|worried|scared|can't|difficult|hard|stressed)/)
    ) {
      return 'encouragement';
    }

    // Default to answer for most interactions
    return 'answer';
  }

  private async generateResponseContent(
    input: string,
    personaConfig: PersonaConfiguration,
    _context: PersonaContext,
    responseType: PersonaResponse['metadata']['responseType'],
    _options?: any
  ): Promise<string> {
    // Get response pattern based on type
    let baseResponse = '';

    switch (responseType) {
      case 'greeting':
        baseResponse = this.selectRandomPattern(
          personaConfig.responsePatterns.greetings
        );
        break;
      case 'encouragement':
        baseResponse = this.selectRandomPattern(
          personaConfig.responsePatterns.encouragement
        );
        break;
      case 'farewell':
        baseResponse = this.selectRandomPattern(
          personaConfig.responsePatterns.farewells
        );
        break;
      case 'question':
        baseResponse = this.selectRandomPattern(
          personaConfig.responsePatterns.questionStarters
        );
        break;
      case 'transition':
        baseResponse = this.selectRandomPattern(
          personaConfig.responsePatterns.transitionPhrases
        );
        break;
      default:
        // For 'answer' type, generate contextual response
        baseResponse = await this.generateContextualAnswer(
          input,
          personaConfig,
          context
        );
        break;
    }

    // Apply persona communication style
    return this.applyPersonaStyle(baseResponse, personaConfig, context);
  }

  private async generateContextualAnswer(
    input: string,
    personaConfig: PersonaConfiguration,
    _context: PersonaContext
  ): Promise<string> {
    // This is a simplified implementation - in production, this would use AI
    // to generate responses that match the persona's personality and knowledge

    const { communicationStyle, topicPreferences, behavior } = personaConfig;

    // Check if input relates to persona's loved topics
    const relatedTopics = topicPreferences.loves.filter(topic =>
      input.toLowerCase().includes(topic.toLowerCase())
    );

    if (relatedTopics.length > 0) {
      // Generate enthusiastic response about loved topics
      const enthusiasm = communicationStyle.enthusiasm;
      if (enthusiasm > 8) {
        return `Oh wow! I absolutely love ${relatedTopics[0]}! That's such an amazing topic to explore together!`;
      } else if (enthusiasm > 6) {
        return `That's really interesting! I enjoy talking about ${relatedTopics[0]}.`;
      } else {
        return `I find ${relatedTopics[0]} quite fascinating. What specifically interests you about it?`;
      }
    }

    // Check for avoided topics
    const avoidedTopics = topicPreferences.avoids.filter(topic =>
      input.toLowerCase().includes(topic.toLowerCase())
    );

    if (avoidedTopics.length > 0) {
      // Gently redirect from avoided topics
      const transitionPhrase = this.selectRandomPattern(
        personaConfig.responsePatterns.transitionPhrases
      );
      return `${transitionPhrase} Let's explore something that might be more fun for both of us!`;
    }

    // Generate general response based on persona traits
    if (behavior.helpfulness > 8) {
      return "I'd love to help you with that! Let me think about the best way to approach this together.";
    } else if (behavior.curiosityLevel > 8) {
      return "That's such an interesting question! It makes me curious - what made you think about this?";
    } else if (behavior.playfulness > 8) {
      return "Ooh, that sounds like it could be fun to explore! What's the most exciting part about this for you?";
    }

    // Default helpful response
    return "That's a great point! I'd love to learn more about what you're thinking.";
  }

  private applyPersonaStyle(
    content: string,
    personaConfig: PersonaConfiguration,
    _context: PersonaContext
  ): string {
    const { communicationStyle } = personaConfig;
    let styledContent = content;

    // Apply enthusiasm level
    if (communicationStyle.enthusiasm > 8) {
      // Add exclamation points and energetic language
      styledContent = styledContent.replace(/\./g, '!');
      if (!styledContent.includes('!')) {
        styledContent += '!';
      }
    } else if (communicationStyle.enthusiasm < 4) {
      // More subdued language
      styledContent = styledContent.replace(/!/g, '.');
    }

    // Apply formality level
    if (communicationStyle.formality < 3) {
      // Very casual - add contractions and informal language
      styledContent = styledContent
        .replace(/you are/gi, "you're")
        .replace(/I am/gi, "I'm")
        .replace(/cannot/gi, "can't")
        .replace(/will not/gi, "won't");
    } else if (communicationStyle.formality > 7) {
      // More formal - expand contractions
      styledContent = styledContent
        .replace(/you're/gi, 'you are')
        .replace(/I'm/gi, 'I am')
        .replace(/can't/gi, 'cannot')
        .replace(/won't/gi, 'will not');
    }

    // Apply word complexity (simplified - in production would use more sophisticated vocab adjustment)
    if (communicationStyle.wordComplexity < 4) {
      // Simpler vocabulary
      styledContent = styledContent
        .replace(/fascinating/gi, 'cool')
        .replace(/incredible/gi, 'amazing')
        .replace(/magnificent/gi, 'awesome');
    }

    // Apply sentence length preference
    if (communicationStyle.sentenceLength === 'short') {
      // Break long sentences into shorter ones
      styledContent = styledContent.replace(/,/g, '. ');
    }

    return styledContent;
  }

  private selectRandomPattern(patterns: string[]): string {
    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  private calculateResponseConfidence(
    content: string,
    personaConfig: PersonaConfiguration,
    context: PersonaContext,
    responseType: PersonaResponse['metadata']['responseType']
  ): number {
    let confidence = 7; // Base confidence

    // Increase confidence for persona's preferred topics
    const contentLower = content.toLowerCase();
    personaConfig.topicPreferences.loves.forEach(topic => {
      if (contentLower.includes(topic.toLowerCase())) {
        confidence += 1;
      }
    });

    // Increase confidence based on relationship strength
    if (context.relationshipMetrics.trustLevel > 7) {
      confidence += 0.5;
    }

    // Adjust based on response type match
    if (
      responseType === 'encouragement' &&
      personaConfig.behavior.empathy > 8
    ) {
      confidence += 1;
    }

    return Math.min(10, Math.max(1, confidence));
  }

  private extractEmphasizedTraits(
    content: string,
    personaConfig: PersonaConfiguration,
    responseType: PersonaResponse['metadata']['responseType']
  ): string[] {
    const traits: string[] = [];
    const contentLower = content.toLowerCase();

    // Map response characteristics to personality traits
    if (
      content.includes('!') &&
      personaConfig.communicationStyle.enthusiasm > 7
    ) {
      traits.push('enthusiasm');
    }

    if (responseType === 'encouragement') {
      traits.push('empathy', 'helpfulness');
    }

    if (contentLower.includes('curious') || contentLower.includes('wonder')) {
      traits.push('curiosity');
    }

    if (contentLower.includes('fun') || contentLower.includes('play')) {
      traits.push('playfulness');
    }

    return traits;
  }

  private generateAdaptations(
    personaConfig: PersonaConfiguration,
    context: PersonaContext
  ): string[] {
    const adaptations: string[] = [];

    // Check for age-specific adaptations
    const currentAge = this.estimateChildAge(context);
    if (
      currentAge < personaConfig.ageRange[0] ||
      currentAge > personaConfig.ageRange[1]
    ) {
      adaptations.push('age-adjusted-vocabulary');
    }

    // Check for mood-based adaptations
    if (
      context.conversationContext.mood === 'sad' ||
      context.conversationContext.mood === 'worried'
    ) {
      adaptations.push('emotional-support-tone');
    }

    // Check for energy level adaptations
    if (context.conversationContext.energyLevel < 3) {
      adaptations.push('gentle-encouragement');
    } else if (context.conversationContext.energyLevel > 8) {
      adaptations.push('high-energy-matching');
    }

    return adaptations;
  }

  private extractTopicsFromResponse(
    content: string,
    personaConfig: PersonaConfiguration
  ): string[] {
    const topics: string[] = [];
    const contentLower = content.toLowerCase();

    // Check for topics mentioned in the response
    [
      ...personaConfig.topicPreferences.loves,
      ...personaConfig.topicPreferences.enjoys,
    ].forEach(topic => {
      if (contentLower.includes(topic.toLowerCase())) {
        topics.push(topic);
      }
    });

    return topics;
  }

  private determineEmotionalTone(
    content: string,
    personaConfig: PersonaConfiguration,
    responseType: PersonaResponse['metadata']['responseType']
  ): string {
    const contentLower = content.toLowerCase();

    // Map content patterns to emotional tones
    if (contentLower.includes('excited') || content.includes('!')) {
      return 'excited';
    }

    if (responseType === 'encouragement') {
      return 'supportive';
    }

    if (contentLower.includes('curious') || contentLower.includes('wonder')) {
      return 'curious';
    }

    if (
      personaConfig.behavior.playfulness > 7 &&
      contentLower.includes('fun')
    ) {
      return 'playful';
    }

    return 'friendly';
  }

  private calculateComplexityLevel(
    content: string,
    personaConfig: PersonaConfiguration
  ): number {
    // Simple complexity calculation based on word length and sentence structure
    const words = content.split(' ');
    const avgWordLength =
      words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const sentenceCount = content.split(/[.!?]/).length - 1;

    let complexity = personaConfig.communicationStyle.wordComplexity;

    // Adjust based on actual content
    if (avgWordLength > 6) complexity += 1;
    if (sentenceCount > 2) complexity += 0.5;

    return Math.min(10, Math.max(1, complexity));
  }

  private calculatePersonalizationLevel(
    content: string,
    context: PersonaContext
  ): number {
    let personalization = 5; // Base level

    // Increase if response references child's interests or context
    if (context.adaptationData.effectiveTopics.length > 0) {
      const referencedTopics = context.adaptationData.effectiveTopics.filter(
        topic => content.toLowerCase().includes(topic.toLowerCase())
      );
      personalization += referencedTopics.length * 0.5;
    }

    // Increase based on relationship depth
    if (context.relationshipMetrics.interactionCount > 10) {
      personalization += 1;
    }

    return Math.min(10, Math.max(1, personalization));
  }

  private estimateChildAge(_context: PersonaContext): number {
    // This would typically come from the child account data
    // For now, return a default age in the middle of the target range
    return 9;
  }
}
