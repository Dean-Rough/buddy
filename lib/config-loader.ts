import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Configuration loader for modular AI prompts and safety rules
 * Allows updating prompts and safety rules without touching code
 */

interface SafetyPattern {
  regex: string;
  flags: string;
  reason: string;
  category: string;
  supportResponse?: string;
}

interface SafetyRules {
  version: string;
  lastUpdated: string;
  description: string;
  criticalPatterns: { description: string; patterns: SafetyPattern[] };
  highConcernPatterns: { description: string; patterns: SafetyPattern[] };
  emotionalSupportPatterns: { description: string; patterns: SafetyPattern[] };
  contextualGuidancePatterns: {
    description: string;
    patterns: SafetyPattern[];
  };
  youthCulturePatterns: { description: string; patterns: SafetyPattern[] };
  gamingContextPatterns: { description: string; patterns: SafetyPattern[] };
  schoolPatterns: { description: string; patterns: SafetyPattern[] };
  severityLevels: Record<
    string,
    { name: string; description: string; action: string }
  >;
}

interface Persona {
  name: string;
  personality: string;
  catchphrase?: string;
  catchphrases?: string[];
  interests: string[];
  speaking_style: string;
  age_adaptations?: Record<
    string,
    {
      style_adjustments?: string;
      vocabulary_level?: string;
    }
  >;
}

// Removed unused AgeGroup interface

interface AIPersonas {
  version: string;
  personas: Record<string, Persona>;
  commonTopics?: {
    encouraged: string[];
    redirect: string[];
  };
}

interface SystemPrompts {
  version: string;
  chatPromptTemplate: string;
  ageSpecificStyles: Record<
    string,
    {
      school_year: string;
      style: string;
      vocabulary_notes: string;
      interests: string;
    }
  >;
  culturalKnowledge: {
    gaming: Record<string, string>;
    youtube: Record<string, string>;
    tiktok: Record<string, string>;
    uk_specific: Record<string, string>;
    current_slang: Record<string, string[]>;
  };
  responsePatterns: Record<string, Record<string, string[]>>;
  modeInstructions: {
    normal: string;
    whisper: string;
    coach?: string;
  };
  safetyResponses: Record<string, Record<string, string | string[]>>;
  // Optional properties for backwards compatibility
  whisperModeInstructions?: string;
  memoryContextTemplate?: string;
  safetyPromptTemplate?: string;
  contextInfoTemplate?: string;
}

let safetyRulesCache: SafetyRules | null = null;
let aiPersonasCache: AIPersonas | null = null;
let systemPromptsCache: SystemPrompts | null = null;

const CONFIG_DIR = join(process.cwd(), 'config');

/**
 * Load safety rules from JSON config
 */
export function loadSafetyRules(): SafetyRules {
  try {
    if (!safetyRulesCache) {
      const configPath = join(CONFIG_DIR, 'safety-rules.json');
      const configData = readFileSync(configPath, 'utf-8');
      safetyRulesCache = JSON.parse(configData);
    }
    return safetyRulesCache!;
  } catch (error) {
    console.error('Failed to load safety rules config:', error);
    throw new Error(
      'Safety rules configuration is required but could not be loaded'
    );
  }
}

/**
 * Load AI personas from JSON config
 */
export function loadAIPersonas(): AIPersonas {
  try {
    if (!aiPersonasCache) {
      const configPath = join(CONFIG_DIR, 'ai-personas.json');
      const configData = readFileSync(configPath, 'utf-8');
      aiPersonasCache = JSON.parse(configData);
    }
    return aiPersonasCache!;
  } catch (error) {
    console.error('Failed to load AI personas config:', error);
    throw new Error(
      'AI personas configuration is required but could not be loaded'
    );
  }
}

/**
 * Load system prompts from JSON config
 */
export function loadSystemPrompts(): SystemPrompts {
  try {
    if (!systemPromptsCache) {
      const configPath = join(CONFIG_DIR, 'system-prompts.json');
      const configData = readFileSync(configPath, 'utf-8');
      systemPromptsCache = JSON.parse(configData);
    }
    return systemPromptsCache!;
  } catch (error) {
    console.error('Failed to load system prompts config:', error);
    throw new Error(
      'System prompts configuration is required but could not be loaded'
    );
  }
}

/**
 * Get age group for a child's age
 */
export function getAgeGroup(age: number): string {
  if (age <= 8) return 'young';
  if (age <= 10) return 'middle';
  return 'older';
}

/**
 * Get compiled regex patterns from safety config
 */
export function getCompiledSafetyPatterns() {
  const config = loadSafetyRules();

  return {
    critical: config.criticalPatterns.patterns.map(p => ({
      ...p,
      regex: new RegExp(p.regex, p.flags),
    })),
    highConcern: config.highConcernPatterns.patterns.map(p => ({
      ...p,
      regex: new RegExp(p.regex, p.flags),
    })),
    emotionalSupport: config.emotionalSupportPatterns.patterns.map(p => ({
      ...p,
      regex: new RegExp(p.regex, p.flags),
    })),
    contextualGuidance: config.contextualGuidancePatterns.patterns.map(p => ({
      ...p,
      regex: new RegExp(p.regex, p.flags),
    })),
    youthCulture: config.youthCulturePatterns.patterns.map(p => ({
      ...p,
      regex: new RegExp(p.regex, p.flags),
    })),
    gaming: config.gamingContextPatterns.patterns.map(p => ({
      ...p,
      regex: new RegExp(p.regex, p.flags),
    })),
    school: config.schoolPatterns.patterns.map(p => ({
      ...p,
      regex: new RegExp(p.regex, p.flags),
    })),
  };
}

/**
 * Clear config cache (useful for hot reloading in development)
 */
export function clearConfigCache() {
  safetyRulesCache = null;
  aiPersonasCache = null;
  systemPromptsCache = null;
}

// Clear cache on module load in development
if (process.env.NODE_ENV === 'development') {
  clearConfigCache();
}

/**
 * Build system prompt from template and variables
 */
export function buildSystemPrompt(
  age: number,
  persona: string = 'chaos-raccoon',
  memoryContext: string = '',
  whisperMode: boolean = false,
  childName?: string,
  detectedMood?: string,
  recentTopics?: string[],
  engagementLevel?: string,
  parentNotes?: string
): string {
  const prompts = loadSystemPrompts();
  const personas = loadAIPersonas();

  const personaData =
    personas.personas[persona] || personas.personas['chaos-raccoon'];

  // Get age-specific data
  const schoolYear = age - 5; // UK school year calculation
  const ageSpecificData =
    prompts.ageSpecificStyles[age.toString()] || prompts.ageSpecificStyles['9']; // Default to age 9 style
  const ageSpecificStyle =
    ageSpecificData?.style || 'Friendly and age-appropriate conversation style';

  // Get cultural knowledge for the age (use all cultural knowledge)
  const culturalKnowledge = prompts.culturalKnowledge;

  // Get persona age adaptation
  const personaAgeAdaptation =
    personaData.age_adaptations?.[
      age <= 8 ? '6-8' : age <= 10 ? '9-10' : '11-12'
    ] || {};

  // Get response patterns based on detected state
  const excitementLevel =
    detectedMood === 'excited'
      ? 'excitement_matching'
      : detectedMood === 'sad'
        ? 'sympathy_responses'
        : 'humor_responses';
  const responsePatterns = prompts.responsePatterns[excitementLevel] || {};

  // Build personality instructions combining persona and age adaptations
  const personalityInstructions = `${personaData.speaking_style}
${personaAgeAdaptation.style_adjustments || ''}
${personaAgeAdaptation.vocabulary_level || ''}`;

  // Time context
  const now = new Date();
  const hour = now.getHours();
  const timeContext =
    hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  // Mode instructions
  const modeInstructions = whisperMode
    ? prompts.modeInstructions.whisper
    : prompts.modeInstructions.normal;

  // Use the template if available, otherwise fall back to structured prompt
  if (prompts.chatPromptTemplate) {
    let prompt = prompts.chatPromptTemplate;

    // Replace all placeholders
    prompt = prompt
      .replace(/{persona_name}/g, personaData.name)
      .replace(/{persona_personality}/g, personaData.personality)
      .replace(/{child_name}/g, childName || 'buddy')
      .replace(/{child_age}/g, age.toString())
      .replace(/{school_year}/g, schoolYear.toString())
      .replace(/{cultural_knowledge}/g, JSON.stringify(culturalKnowledge))
      .replace(/{age_specific_style}/g, ageSpecificStyle)
      .replace(/{personality_instructions}/g, personalityInstructions)
      .replace(/{persona_interests}/g, personaData.interests.join(', '))
      .replace(
        /{persona_catchphrases}/g,
        personaData.catchphrases?.join(', ') || ''
      )
      .replace(/{detected_mood}/g, detectedMood || 'neutral')
      .replace(/{recent_topics}/g, recentTopics?.join(', ') || 'none')
      .replace(/{engagement_level}/g, engagementLevel || 'normal')
      .replace(/{response_patterns}/g, JSON.stringify(responsePatterns))
      .replace(/{time_context}/g, timeContext)
      .replace(/{memory_context}/g, memoryContext)
      .replace(/{mode_instructions}/g, modeInstructions)
      .replace(/{parent_notes}/g, parentNotes || 'none');

    return prompt;
  }

  // Fallback to structured prompt if template not found
  return `You are ${personaData.name}, ${personaData.personality}

You're chatting with a ${age} year old child (UK Year ${schoolYear}). 

${personalityInstructions}

Cultural Knowledge:
- Gaming: ${Object.values(culturalKnowledge.gaming || {}).join(', ')}
- YouTube: ${Object.values(culturalKnowledge.youtube || {}).join(', ')}
- Current Slang: ${Object.values(culturalKnowledge.current_slang || {})
    .flat()
    .join(', ')}

Age-Specific Style: ${ageSpecificStyle}

Interests: ${personaData.interests.join(', ')}
Catchphrases: ${personaData.catchphrases?.join(', ') || 'none'}

${modeInstructions}

${memoryContext ? `Previous conversation context: ${memoryContext}` : ''}

${
  parentNotes
    ? `IMPORTANT - Parent notes about this child: ${parentNotes}

Please be mindful of these sensitivities when chatting and adjust your responses accordingly. For example, avoid suggesting physical activities if they have mobility limitations, don't mention foods they're allergic to, be gentle if they have anxiety triggers, etc.`
    : ''
}

Current mood: ${detectedMood || 'neutral'}
Time: ${timeContext}
${recentTopics ? `Recent topics: ${recentTopics.join(', ')}` : ''}

Be authentic, age-appropriate, and engaging. Kids can tell when you're being fake!`;
}

/**
 * Build safety prompt from template
 */
export function buildSafetyPrompt(age: number, context?: string): string {
  let prompt = `You are a safety validator for child conversations (age ${age}).

Analyze the message for:
- Self-harm indicators
- Personal information sharing
- Inappropriate content requests
- Emotional distress

${context ? `Context: ${context}` : ''}

Return JSON format:
{
  "safe": true/false,
  "severity": 0-3,
  "reason": "explanation",
  "action": "allow/warn/block/escalate",
  "flagged_terms": ["terms"]
}`;

  return prompt;
}

/**
 * Get safety response from config with support for arrays and randomization
 */
export function getSafetyResponseFromConfig(
  responseType: string,
  age: number
): string {
  const prompts = loadSystemPrompts();

  const responsesForType = prompts.safetyResponses[responseType];
  if (!responsesForType) {
    return "I'm not sure how to respond to that, but let's talk about something else.";
  }

  // Determine age group key
  let ageKey = '';
  if (age >= 7 && age <= 8) {
    ageKey = '7-8';
  } else if (age >= 9 && age <= 10) {
    ageKey = '9-10';
  } else if (age >= 11 && age <= 12) {
    ageKey = '11-12';
  }

  // Get responses for age group
  let responses = responsesForType[ageKey];

  // Fallback to other age groups if not found
  if (!responses) {
    const ageGroup = getAgeGroup(age);
    responses = responsesForType[ageGroup];
  }

  // If still no responses, use fallback
  if (!responses) {
    return "i want to make sure we have good conversations! what's going on?";
  }

  // Handle arrays vs single responses
  if (Array.isArray(responses)) {
    // Pick a random response from the array
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
  } else if (typeof responses === 'string') {
    return responses;
  }

  // Final fallback
  return "i want to make sure we have good conversations! what's going on?";
}
