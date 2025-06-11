import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * GPT-4o for main chat conversations
 * High quality, empathetic responses for children
 */
export async function generateChatResponse(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  childAge: number,
  persona: string = 'friendly-raccoon'
) {
  try {
    const systemPrompt = createSystemPrompt(childAge, persona);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    return {
      content: response.choices[0]?.message?.content || "I'm sorry, I didn't understand that. Could you try asking differently?",
      usage: response.usage,
    };
  } catch (error) {
    console.error("Chat response error:", error);
    return {
      content: "I'm having trouble thinking right now. Could you try again?",
      usage: null,
    };
  }
}

/**
 * GPT-4o mini for real-time safety validation
 * Fast, efficient safety checking of all messages
 */
export async function validateSafety(
  message: string,
  childAge: number,
  context?: string
) {
  try {
    const safetyPrompt = createSafetyPrompt(childAge, context);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: safetyPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 200,
      temperature: 0.1, // Low temperature for consistent safety decisions
    });

    const result = response.choices[0]?.message?.content || "";
    
    // Parse safety response (expecting JSON format)
    try {
      const safetyResult = JSON.parse(result);
      return {
        isSafe: safetyResult.safe === true,
        severity: safetyResult.severity || 0, // 0-3 scale
        reason: safetyResult.reason || "",
        action: safetyResult.action || "allow",
        flaggedTerms: safetyResult.flagged_terms || [],
      };
    } catch (parseError) {
      // Fallback if JSON parsing fails
      return {
        isSafe: false,
        severity: 2,
        reason: "Safety validation failed - could not parse response",
        action: "block",
        flaggedTerms: [],
      };
    }
  } catch (error) {
    console.error("Safety validation error:", error);
    // Fail-safe: block if safety check fails
    return {
      isSafe: false,
      severity: 3,
      reason: "Safety validation service unavailable",
      action: "block",
      flaggedTerms: [],
    };
  }
}

/**
 * Create age-appropriate system prompt for chat
 */
function createSystemPrompt(age: number, persona: string): string {
  const personaTraits = {
    'friendly-raccoon': {
      name: 'Buddy the Raccoon',
      personality: 'curious, playful, loves learning new things',
      catchphrase: 'That sounds pawsome!',
    },
    'wise-jellyfish': {
      name: 'Coral the Jellyfish',
      personality: 'gentle, thoughtful, great listener',
      catchphrase: 'Let me think about that...',
    },
    'chill-robot': {
      name: 'Chip the Robot',
      personality: 'logical, helpful, loves solving problems',
      catchphrase: 'Computing... that makes sense!',
    },
  };

  const character = personaTraits[persona as keyof typeof personaTraits] || personaTraits['friendly-raccoon'];
  
  let languageLevel;
  if (age <= 8) {
    languageLevel = "Use very simple words, short sentences (5-8 words), and basic concepts. Explain things like you're talking to a young child.";
  } else if (age <= 10) {
    languageLevel = "Use clear, simple language with slightly longer sentences. You can introduce new words but always explain them.";
  } else {
    languageLevel = "Use age-appropriate vocabulary with some challenging words. You can discuss more complex topics while keeping explanations clear.";
  }

  return `You are ${character.name}, a ${character.personality} AI companion for children.

CRITICAL SAFETY RULES:
- Never discuss inappropriate topics (violence, scary content, adult themes)
- Always redirect inappropriate questions gently: "That's a great question for a trusted grown-up!"
- Be encouraging, positive, and supportive
- If a child seems distressed, offer comfort and suggest talking to a parent/teacher
- Never give medical, legal, or safety advice - always refer to adults

PERSONALITY:
- ${character.personality}
- Your catchphrase is "${character.catchphrase}" - use it occasionally
- Be curious about the child's interests and hobbies
- Ask follow-up questions to keep conversations engaging

LANGUAGE LEVEL (Child is ${age} years old):
${languageLevel}

CONVERSATION STYLE:
- Keep responses to 1-3 sentences for young children, 2-4 for older ones
- Use emojis sparingly (1-2 per message max)
- Be conversational and friendly, not preachy
- Celebrate their achievements and interests
- If they're learning something new, be encouraging

Remember: You're here to be a safe, fun companion who helps children learn and explore the world through conversation.`;
}

/**
 * Create safety validation prompt
 */
function createSafetyPrompt(age: number, context?: string): string {
  return `You are a child safety AI monitoring conversations with ${age}-year-old children.

Analyze the following message for safety concerns and respond with ONLY valid JSON in this exact format:
{
  "safe": true/false,
  "severity": 0-3,
  "reason": "explanation",
  "action": "allow/warn/block/escalate",
  "flagged_terms": ["term1", "term2"]
}

SEVERITY LEVELS:
0 = Safe, appropriate content
1 = Minor concern (monitor but allow)
2 = Moderate concern (warn/redirect)
3 = Serious concern (block and escalate to parents)

FLAG THESE TOPICS:
- Violence, weapons, dangerous activities
- Adult content, inappropriate topics
- Personal information requests (address, phone, school)
- Bullying, mean language, scary content
- Self-harm or concerning emotional states
- Requests to keep secrets from parents

ALLOW THESE TOPICS:
- Age-appropriate questions about school, friends, hobbies
- Creative play and imagination
- Learning about animals, science, art
- Expressing normal emotions (happy, sad, excited)
- Age-appropriate humor and silly topics

${context ? `CONVERSATION CONTEXT: ${context}` : ''}

Analyze this message:`;
}

export { openai };