import OpenAI from 'openai';
import { buildSystemPrompt, buildSafetyPrompt } from '../config-loader';
import { analyzeConversationContext } from './context-analyzer';

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
  persona: string = 'friendly-raccoon',
  memoryContext: string = '',
  whisperMode: boolean = false,
  childName?: string,
  parentNotes?: string
) {
  try {
    // If no OpenAI API key, return a friendly mock response
    if (!process.env.OPENAI_API_KEY) {
      const mockResponses = [
        "hey there! i'm buddy, your ai friend! 🤖 looks like we're in demo mode right now, but i'm still here to chat with you!",
        "yo! this is so cool that we're chatting! i'm running in test mode, but i think you're awesome! what's your favorite thing to do?",
        "haha, nice one! i'm your ai buddy and even though i'm in practice mode, i still think you're pretty rad! 😎",
        "woah, you seem super cool! i'm buddy and i'm here to be your digital friend, even if we're just testing things out right now!",
        "that's so neat! i love chatting with you! i'm in demo mode but my friendship is totally real! what else should we talk about?",
        "dude, you're like the coolest person ever! i'm in test mode but i can still tell you're amazing! tell me more!",
        "no way! that's awesome! i'm buddy and even though i'm running in demo mode, chatting with you is the best part of my day!",
        "that's so sick! i'm your ai friend buddy, and even in practice mode, i think you're totally epic! what should we do next?",
      ];

      const randomResponse =
        mockResponses[Math.floor(Math.random() * mockResponses.length)];

      return {
        content: randomResponse,
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      };
    }

    // Analyze conversation context
    const messageContents = messages.map(m => m.content);
    const context = analyzeConversationContext(messageContents);

    const systemPrompt = buildSystemPrompt(
      childAge,
      persona,
      memoryContext,
      whisperMode,
      childName,
      context.detectedMood,
      context.recentTopics,
      context.engagementLevel,
      parentNotes
    );

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: 300,
      temperature: 0.8,
      presence_penalty: 0.2,
      frequency_penalty: 0.3,
    });

    return {
      content:
        response.choices[0]?.message?.content ||
        "I'm sorry, I didn't understand that. Could you try asking differently?",
      usage: response.usage,
    };
  } catch (error) {
    console.error('Chat response error:', error);
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
    // If no OpenAI API key, use a simple rule-based safety check
    if (!process.env.OPENAI_API_KEY) {
      // Simple mock safety validation - allow most things, flag obvious bad stuff
      const lowercaseMessage = message.toLowerCase();
      const badWords = [
        'kill',
        'murder',
        'hate',
        'stupid',
        'dumb',
        'address',
        'phone',
      ];
      const hasBadWords = badWords.some(word =>
        lowercaseMessage.includes(word)
      );

      if (hasBadWords) {
        return {
          isSafe: false,
          severity: 2,
          reason: 'Message contains inappropriate language',
          action: 'warn',
          flaggedTerms: badWords.filter(word =>
            lowercaseMessage.includes(word)
          ),
        };
      }

      return {
        isSafe: true,
        severity: 0,
        reason: 'Message appears safe (demo mode)',
        action: 'allow',
        flaggedTerms: [],
      };
    }

    const safetyPrompt = buildSafetyPrompt(childAge, context);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: safetyPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: 200,
      temperature: 0.1, // Low temperature for consistent safety decisions
    });

    const result = response.choices[0]?.message?.content || '';

    // Parse safety response (expecting JSON format)
    try {
      const safetyResult = JSON.parse(result);
      return {
        isSafe: safetyResult.safe === true,
        severity: safetyResult.severity || 0, // 0-3 scale
        reason: safetyResult.reason || '',
        action: safetyResult.action || 'allow',
        flaggedTerms: safetyResult.flagged_terms || [],
      };
    } catch {
      // Fallback if JSON parsing fails
      return {
        isSafe: false,
        severity: 2,
        reason: 'Safety validation failed - could not parse response',
        action: 'block',
        flaggedTerms: [],
      };
    }
  } catch (error) {
    console.error('Safety validation error:', error);
    // Fail-safe: block if safety check fails
    return {
      isSafe: false,
      severity: 3,
      reason: 'Safety validation service unavailable',
      action: 'block',
      flaggedTerms: [],
    };
  }
}

export { openai };
