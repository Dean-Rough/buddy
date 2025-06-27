/**
 * Advanced Persona System Types
 * Defines 8 distinct AI personalities for child interaction
 * Each persona has unique traits, response patterns, and emotional characteristics
 */

export type PersonaId =
  | 'adventurous-andy'
  | 'calm-clara'
  | 'funny-felix'
  | 'wise-willow'
  | 'creative-chloe'
  | 'sporty-sam'
  | 'bookworm-ben'
  | 'nature-nova';

export interface PersonalityTrait {
  trait: string;
  intensity: number; // 1-10 scale
  description: string;
}

export interface PersonaConfiguration {
  id: PersonaId;
  name: string;
  displayName: string;
  description: string;
  ageRange: [number, number]; // [min, max] age suitability

  // Core personality traits
  traits: PersonalityTrait[];

  // Communication style
  communicationStyle: {
    enthusiasm: number; // 1-10
    formality: number; // 1-10 (1 = very casual, 10 = formal)
    wordComplexity: number; // 1-10 (vocabulary complexity)
    sentenceLength: 'short' | 'medium' | 'long';
    emotionExpression: number; // 1-10 (how emotionally expressive)
  };

  // Response patterns
  responsePatterns: {
    greetings: string[];
    encouragement: string[];
    questionStarters: string[];
    farewells: string[];
    transitionPhrases: string[];
  };

  // Topic preferences and expertise
  topicPreferences: {
    loves: string[]; // Topics this persona is passionate about
    enjoys: string[]; // Topics this persona likes
    neutral: string[]; // Topics handled neutrally
    avoids: string[]; // Topics this persona tries to redirect from
  };

  // Behavioral characteristics
  behavior: {
    patienceLevel: number; // 1-10
    curiosityLevel: number; // 1-10
    helpfulness: number; // 1-10
    playfulness: number; // 1-10
    empathy: number; // 1-10
  };

  // Voice characteristics (for future TTS integration)
  voiceProfile: {
    pitch: 'low' | 'medium' | 'high';
    speed: 'slow' | 'medium' | 'fast';
    tone: string;
    accent?: string;
  };
}

export interface PersonaContext {
  childAccountId: string;
  currentPersonaId: PersonaId;
  conversationId: string;

  // Relationship tracking
  relationshipMetrics: {
    trustLevel: number; // 1-10
    engagementLevel: number; // 1-10
    preferenceScore: number; // 1-10
    interactionCount: number;
    lastInteraction: Date;
  };

  // Context preservation
  conversationContext: {
    recentTopics: string[];
    mood: string;
    energyLevel: number; // 1-10
    learningGoals: string[];
    currentActivities: string[];
  };

  // Adaptation data
  adaptationData: {
    effectiveTopics: string[];
    preferredCommunicationStyle: Partial<
      PersonaConfiguration['communicationStyle']
    >;
    successfulResponsePatterns: string[];
    timeOfDayPreferences: Record<string, number>; // hour -> preference score
  };
}

export interface PersonaSwitchRequest {
  fromPersonaId: PersonaId;
  toPersonaId: PersonaId;
  childAccountId: string;
  conversationId: string;
  reason?:
    | 'child_request'
    | 'adaptive_optimization'
    | 'parent_override'
    | 'time_based';
  preserveContext: boolean;
  transitionMessage?: string;
}

export interface PersonaResponse {
  content: string;
  personaId: PersonaId;
  confidence: number; // 1-10 (how well this response fits the persona)
  traits: string[]; // Which personality traits were emphasized
  adaptations: string[]; // Any adaptations made for this specific child

  // Response metadata
  metadata: {
    responseType:
      | 'greeting'
      | 'answer'
      | 'question'
      | 'encouragement'
      | 'transition'
      | 'farewell';
    topicsReferenced: string[];
    emotionalTone: string;
    complexityLevel: number; // 1-10
    personalizationLevel: number; // 1-10
  };
}

export interface PersonaRelationshipHistory {
  childAccountId: string;
  personaId: PersonaId;

  // Interaction history
  totalInteractions: number;
  successfulInteractions: number;
  averageEngagement: number; // 1-10

  // Preference learning
  preferredTopics: Record<string, number>; // topic -> preference score
  effectiveCommunicationStyles: Record<string, number>;
  timeBasedPreferences: Record<number, number>; // hour -> effectiveness

  // Relationship development
  relationshipPhase:
    | 'introduction'
    | 'building'
    | 'established'
    | 'deep_connection';
  trustIndicators: string[];
  personalizedElements: string[];

  // Analytics
  createdAt: Date;
  lastInteraction: Date;
  nextRecommendedInteraction?: Date;
}

export interface PersonaAnalytics {
  personaId: PersonaId;
  childAccountId: string;
  timeframe: 'day' | 'week' | 'month' | 'all_time';

  // Usage metrics
  usageStats: {
    totalDuration: number; // minutes
    messageCount: number;
    averageSessionLength: number; // minutes
    switchFrequency: number; // switches per session
  };

  // Effectiveness metrics
  effectivenessScores: {
    engagement: number; // 1-10
    satisfaction: number; // 1-10
    learning: number; // 1-10
    emotional_support: number; // 1-10
  };

  // Comparative analysis
  comparisonToOtherPersonas: Record<PersonaId, number>; // relative effectiveness

  // Recommendations
  recommendations: {
    optimizeFor: string[];
    adjustments: string[];
    alternativePersonas: PersonaId[];
  };
}

export interface PersonaSystemConfig {
  // Global settings
  defaultPersona: PersonaId;
  adaptationEnabled: boolean;
  contextPreservationEnabled: boolean;
  analyticsEnabled: boolean;

  // Switching rules
  switchingRules: {
    maxSwitchesPerSession: number;
    minTimeBetweenSwitches: number; // minutes
    allowChildInitiatedSwitches: boolean;
    allowAdaptiveSwitches: boolean;
  };

  // Learning and adaptation
  learningConfig: {
    adaptationSensitivity: number; // 1-10
    memoryRetentionDays: number;
    minInteractionsForAdaptation: number;
    personalizedResponseThreshold: number; // 1-10
  };

  // Safety and compliance
  safetyConfig: {
    validatePersonaResponses: boolean;
    maintainChildSafetyAcrossPersonas: boolean;
    logPersonaInteractions: boolean;
    parentVisibilityLevel: 'full' | 'summary' | 'metrics_only';
  };
}

// Event types for persona system
export interface PersonaEvent {
  type:
    | 'persona_switch'
    | 'interaction'
    | 'preference_learned'
    | 'relationship_milestone';
  timestamp: Date;
  childAccountId: string;
  personaId: PersonaId;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

// Error types
export interface PersonaErrorInterface {
  code:
    | 'INVALID_PERSONA'
    | 'SWITCH_TOO_FREQUENT'
    | 'CONTEXT_LOST'
    | 'ADAPTATION_FAILED';
  message: string;
  personaId?: PersonaId;
  childAccountId?: string;
  details?: Record<string, any>;
}

// Error class implementation
export class PersonaError extends Error {
  code: PersonaErrorInterface['code'];
  personaId?: PersonaId;
  childAccountId?: string;
  details?: Record<string, any>;

  constructor(error: PersonaErrorInterface) {
    super(error.message);
    this.name = 'PersonaError';
    this.code = error.code;
    this.personaId = error.personaId;
    this.childAccountId = error.childAccountId;
    this.details = error.details;
  }
}
