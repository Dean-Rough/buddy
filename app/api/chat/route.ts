import { NextRequest, NextResponse } from 'next/server';
import { generateChatResponse } from '@/lib/ai/client';
import { validateMessageSafety, getSafetyResponse } from '@/lib/ai/safety';
import { prisma } from '@/lib/prisma';
import { getMemoryContext, extractMemoriesFromMessage } from '@/lib/memory';

export async function POST(request: NextRequest) {
  try {
    const { message, childAccountId, conversationId, whisperMode } =
      await request.json();

    if (!message || !childAccountId) {
      return NextResponse.json(
        { error: 'Message and childAccountId are required' },
        { status: 400 }
      );
    }

    // Get child profile
    const child = await prisma.childAccount.findUnique({
      where: { id: childAccountId },
      select: { id: true, name: true, age: true, persona: true },
    });

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          childAccountId: child.id,
          messageCount: 0,
        },
        include: {
          messages: true,
        },
      });
    }

    // Build context for safety validation
    const recentMessages = conversation.messages.reverse().map(m => m.content);

    // Step 1: Safety validation with GPT-4o mini
    const safetyResult = await validateMessageSafety(message, {
      childAccountId: child.id,
      childAge: child.age,
      conversationId: conversation.id,
      recentMessages,
    });

    // If message is not safe, return safety response
    if (!safetyResult.isSafe) {
      const safetyResponse = getSafetyResponse(safetyResult, child.age);

      // Still log the child's message (for parent review)
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: message,
          role: 'child',
          safetyScore: safetyResult.severity,
          safetyFlags: safetyResult.flaggedTerms,
        },
      });

      // Log safety response
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: safetyResponse,
          role: 'assistant',
          safetyScore: 0,
          safetyFlags: [],
        },
      });

      return NextResponse.json({
        response: safetyResponse,
        conversationId: conversation.id,
        safety: {
          blocked: true,
          reason: 'Content not appropriate for children',
        },
      });
    }

    // Step 2: Get memory context for personalized responses
    const memoryContext = await getMemoryContext(child.id);

    // Extract and store memories from child's message
    await extractMemoriesFromMessage(
      {
        childAccountId: child.id,
        conversationId: conversation.id,
      },
      message,
      child.age
    );

    // Step 3: Generate chat response with GPT-4o (with memory context)
    const conversationHistory = conversation.messages.map(m => ({
      role: m.role === 'child' ? ('user' as const) : ('assistant' as const),
      content: m.content,
    }));

    const chatResult = await generateChatResponse(
      [...conversationHistory, { role: 'user', content: message }],
      child.age,
      child.persona,
      memoryContext,
      whisperMode,
      child.name
    );

    // Step 4: Safety validate AI response (belt and suspenders)
    const responseValidation = await validateMessageSafety(chatResult.content, {
      childAccountId: child.id,
      childAge: child.age,
      conversationId: conversation.id,
    });

    // If AI response is somehow unsafe, use fallback
    const finalResponse = responseValidation.isSafe
      ? chatResult.content
      : "I'm sorry, I'm having trouble thinking of a good response right now. Could you ask me something else?";

    // Step 5: Save messages to database
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: message,
        role: 'child',
        safetyScore: safetyResult.severity,
        safetyFlags: safetyResult.flaggedTerms,
      },
    });

    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: finalResponse,
        role: 'assistant',
        aiModel: 'gpt-4o',
        safetyScore: responseValidation.severity,
        safetyFlags: responseValidation.flaggedTerms,
        processingTimeMs: Date.now() - Date.now(), // TODO: implement proper timing
      },
    });

    // Step 5: Update conversation stats
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        messageCount: { increment: 2 },
        lastActivity: new Date(),
      },
    });

    return NextResponse.json({
      response: finalResponse,
      conversationId: conversation.id,
      messageId: assistantMessage.id,
      safety: {
        blocked: false,
        inputSafety: safetyResult.severity,
        outputSafety: responseValidation.severity,
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
