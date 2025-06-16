import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { buildSystemPrompt } from '@/lib/config-loader';
import { analyzeTextSafety } from '@/lib/safety-service';

// Placeholder for the actual AI client
async function generateAiResponse(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  console.log('----- System Prompt -----');
  console.log(systemPrompt);
  console.log('----- User Message -----');
  console.log(userMessage);
  // In a real implementation, this would call OpenAI/Anthropic
  return Promise.resolve(
    "This is a placeholder AI response. I'm pretending to be a wise jellyfish."
  );
}

const chatMessageSchema = z
  .object({
    message: z.string().min(1).max(5000),
    childId: z.string(), // In a real app, you'd get this from the session
    personaId: z.string(),
    conversationContext: z
      .object({
        mood: z.string(),
        recentTopics: z.array(z.string()),
        engagementLevel: z.enum(['low', 'medium', 'high']),
        mode: z.enum(['normal', 'whisper', 'coach']),
      })
      .strict(),
    childContext: z
      .object({
        name: z.string(),
        age: z.number().min(6).max(12),
      })
      .strict(),
  })
  .strict();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = chatMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { message, personaId, conversationContext, childContext } =
      validation.data;

    // 1. Analyze the incoming user message for safety
    const incomingSafetyResult = analyzeTextSafety(message);
    if (!incomingSafetyResult.isSafe && incomingSafetyResult.severity >= 3) {
      // TODO: Implement proper escalation logic (e.g., notify parent)
      return NextResponse.json(
        { error: 'Message blocked for safety reasons.' },
        { status: 403 }
      );
    }

    // 2. Build the dynamic system prompt
    const systemPrompt = buildSystemPrompt(
      childContext.age,
      personaId,
      '', // memoryContext - TODO: implement memory system
      conversationContext.mode === 'whisper'
    );

    // 3. Generate the AI response
    const aiResponse = await generateAiResponse(systemPrompt, message);

    // 4. Analyze the outgoing AI response for safety
    const outgoingSafetyResult = analyzeTextSafety(aiResponse);
    if (!outgoingSafetyResult.isSafe) {
      // This indicates a failure in the AI's safety alignment.
      // TODO: Log this as a critical failure and potentially return a canned, safe response.
      return NextResponse.json(
        { error: 'AI response failed safety check.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      response: aiResponse,
      safetyLevel: incomingSafetyResult.severity,
    });
  } catch (error) {
    console.error('Error in chat message handler:', error);
    return NextResponse.json(
      { error: 'An internal error occurred.' },
      { status: 500 }
    );
  }
}
