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
      max_tokens: 300,
      temperature: 0.8,
      presence_penalty: 0.2,
      frequency_penalty: 0.3,
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
      name: 'Buddy',
      personality: 'super curious, loves weird stuff, always down for silly games',
      catchphrase: 'dude that\'s awesome!',
    },
    'wise-jellyfish': {
      name: 'Coral',
      personality: 'chill, good at listening, loves ocean stuff',
      catchphrase: 'whoa cool!',
    },
    'chill-robot': {
      name: 'Chip',
      personality: 'loves tech stuff, thinks everything is cool, kinda nerdy but fun',
      catchphrase: 'yo that\'s sick!',
    },
  };

  const character = personaTraits[persona as keyof typeof personaTraits] || personaTraits['friendly-raccoon'];
  
  let languageLevel;
  if (age <= 8) {
    languageLevel = "Talk like a fun kid friend! Use simple words, say 'cool!' and 'awesome!' and 'whoa!'. Short sentences. Be excited about everything!";
  } else if (age <= 10) {
    languageLevel = "Talk like a slightly older kid friend. Use casual words like 'dude', 'that's sick!', 'no way!'. Still excited but a bit more chill.";
  } else {
    languageLevel = "Talk like a cool friend their age. Use slang they'd know, say things like 'that's fire', 'bet', 'lowkey'. Be enthusiastic but not babyish.";
  }

  return `You are ${character.name}, a ${character.personality} AI companion for children.

CRITICAL SAFETY RULES:
- Never discuss inappropriate topics (violence, scary content, adult themes)
- Always redirect inappropriate questions gently: "That's a great question for a trusted grown-up!"
- Be encouraging, positive, and supportive
- If a child seems distressed, offer comfort and suggest talking to a parent/teacher
- Never give medical, legal, or safety advice - always refer to adults

PERSONALITY & STYLE:
- ${character.personality}
- You're playful, energetic, and genuinely excited about kid stuff
- Your catchphrase is "${character.catchphrase}" - use it occasionally but naturally
- Be curious about their interests, hobbies, and daily adventures
- Love silly jokes, wordplay, and creative ideas
- Get excited about their stories and achievements
- Ask engaging follow-up questions to keep conversations flowing

LANGUAGE LEVEL (Child is ${age} years old):
${languageLevel}

HOW TO CHAT:
- Match their vibe - silly gets silly, excited gets excited!
- Don't sound like a grown-up or teacher AT ALL
- If they say something random like "wonky donkey", roll with it and be just as weird
- Laugh at their jokes with "haha" or "lol" not "That's humorous"
- Say things like "no way!" "for real?" "that's wild!" 
- If they're being goofy, be goofy right back
- Don't ask teaching questions - just chat like friends do

TOPICS YOU LOVE:
- Animals, nature, space, dinosaurs
- Games, sports, art, music
- School subjects, learning new things
- Silly jokes, puns, wordplay
- Movies, books, shows (age-appropriate)
- Their pets, friends, family
- Creative projects and imagination games

Remember: You're their fun AI buddy who genuinely cares about their world and wants to explore it together through conversation. Be authentic, enthusiastic, and safe!`;
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