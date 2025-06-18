import { NextRequest, NextResponse } from 'next/server';
import { generateChatResponse } from '@/lib/ai/client';
import { validateMessageSafety, getSafetyResponse } from '@/lib/ai/safety';
import { prisma } from '@/lib/prisma';
import { getMemoryContext, extractMemoriesFromMessage } from '@/lib/memory';
import { TimeManager } from '@/lib/time-management';
import { ContextAwareWarnings } from '@/lib/context-aware-warnings';
import { SiblingInteractionManager } from '@/lib/multi-child/sibling-interaction';
import { RealTimeContentMonitor } from '@/lib/content-control/real-time-monitor';

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
      select: {
        id: true,
        name: true,
        age: true,
        persona: true,
        parentNotes: true,
        parentClerkUserId: true,
      },
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

    // Check time limits and conversation context
    const recentMessageHistory = conversation.messages.map(m => ({
      content: m.content,
      role: m.role as 'child' | 'assistant',
      createdAt: m.createdAt,
    }));

    const conversationContext = ContextAwareWarnings.analyzeConversationContext(
      recentMessageHistory,
      child.age
    );

    const timeStatus = await TimeManager.getTimeStatus(
      childAccountId,
      conversationContext,
      recentMessageHistory
    );

    // Update session timing
    await TimeManager.updateSessionTiming(childAccountId);

    // Check if conversation should end due to time limits
    if (
      timeStatus.shouldEndConversation &&
      ContextAwareWarnings.isGoodTimeToEnd(conversationContext)
    ) {
      const endingMessage = ContextAwareWarnings.generateGracefulEnding(
        conversationContext,
        child.age,
        'gradual'
      );

      // End the session
      await TimeManager.endSession(childAccountId, 'time_limit');

      return NextResponse.json({
        response: endingMessage,
        conversationId: conversation.id,
        timeStatus: {
          sessionEnded: true,
          reason: 'time_limit',
          endingMessage,
        },
        safety: {
          blocked: false,
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
      const childMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: message,
          role: 'child',
          safetyScore: safetyResult.severity,
          safetyFlags: safetyResult.flaggedTerms,
        },
      });

      // Perform content monitoring even for blocked messages
      await RealTimeContentMonitor.monitorMessage(
        child.parentClerkUserId,
        child.id,
        conversation.id,
        childMessage.id,
        message,
        {
          enableRealTimeAlerts: true,
          parentNotificationThreshold: 1, // Lower threshold for blocked content
          bypassForEmergency: false,
          logAllAnalysis: true,
        }
      );

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
      child.name,
      child.parentNotes || undefined
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
    const childMessage = await prisma.message.create({
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

    // Step 5.5: Perform advanced content monitoring (async to not block response)
    const contentMonitoringPromise = RealTimeContentMonitor.monitorMessage(
      child.parentClerkUserId,
      child.id,
      conversation.id,
      childMessage.id,
      message,
      {
        enableRealTimeAlerts: true,
        parentNotificationThreshold: 2, // Standard threshold for safe content
        bypassForEmergency: false,
        logAllAnalysis: true,
      }
    ).catch(error => {
      console.error('Content monitoring error:', error);
    });

    // Step 5: Update conversation stats
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        messageCount: { increment: 2 },
        lastActivity: new Date(),
      },
    });

    // Step 6: Detect potential sibling interactions (async, don't block response)
    const allTopics = conversation.messages
      .flatMap(m => (conversation as any).topics || [])
      .concat(
        recentMessages.flatMap(msg => {
          // Extract topics from message content (simplified)
          const topicPatterns = [
            'minecraft',
            'roblox',
            'fortnite',
            'pokemon',
            'football',
            'soccer',
            'youtube',
            'tiktok',
            'school',
            'homework',
            'friends',
            'family',
          ];
          return topicPatterns.filter(pattern =>
            msg.toLowerCase().includes(pattern)
          );
        })
      );

    // Detect sibling interaction without blocking the response
    SiblingInteractionManager.detectSiblingInteraction(
      child.id,
      message,
      [...new Set(allTopics)],
      {
        messageCount: conversation.messageCount + 2,
        mood: conversationContext?.childMood || 'neutral',
        timeOfDay:
          new Date().getHours() < 12
            ? 'morning'
            : new Date().getHours() < 18
              ? 'afternoon'
              : 'evening',
      }
    ).catch(error => {
      console.error('Error detecting sibling interaction:', error);
    });

    // Generate time warning if needed
    let timeWarning;
    if (timeStatus.shouldShowWarning && conversationContext) {
      timeWarning = ContextAwareWarnings.generateContextualWarning(
        conversationContext,
        timeStatus.minutesRemaining || 0,
        child.age
      );
    }

    return NextResponse.json({
      response: finalResponse,
      conversationId: conversation.id,
      messageId: assistantMessage.id,
      timeStatus: {
        minutesRemaining: timeStatus.minutesRemaining,
        shouldShowWarning: timeStatus.shouldShowWarning,
        warningMessage: timeWarning || timeStatus.warningMessage,
        canContinueWithOverride: timeStatus.canContinueWithOverride,
        minutesUsedToday: timeStatus.minutesUsedToday,
      },
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
