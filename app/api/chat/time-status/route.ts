import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { TimeManager } from '@/lib/time-management';
import { ContextAwareWarnings } from '@/lib/context-aware-warnings';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const childAccountId = searchParams.get('childAccountId');
    const includeContext = searchParams.get('includeContext') === 'true';

    if (!childAccountId) {
      return NextResponse.json(
        { error: 'childAccountId is required' },
        { status: 400 }
      );
    }

    // Verify child belongs to authenticated user
    const child = await prisma.childAccount.findFirst({
      where: {
        id: childAccountId,
        parentClerkUserId: userId,
      },
    });

    if (!child) {
      return NextResponse.json(
        { error: 'Child account not found or not authorized' },
        { status: 404 }
      );
    }

    // Get conversation context if requested
    let conversationContext;
    if (includeContext) {
      const recentMessages = await prisma.message.findMany({
        where: {
          conversation: {
            childAccountId,
            endedAt: null,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          content: true,
          role: true,
          createdAt: true,
        },
      });

      conversationContext = ContextAwareWarnings.analyzeConversationContext(
        recentMessages.map(m => ({
          content: m.content,
          role: m.role as 'child' | 'assistant',
          createdAt: m.createdAt,
        })),
        child.age
      );
    }

    // Get time status
    const timeStatus = await TimeManager.getTimeStatus(
      childAccountId,
      conversationContext
    );

    // Update session timing
    await TimeManager.updateSessionTiming(childAccountId);

    // Generate contextual warning if needed
    let contextualWarning;
    if (timeStatus.shouldShowWarning && conversationContext) {
      contextualWarning = ContextAwareWarnings.generateContextualWarning(
        conversationContext,
        timeStatus.minutesRemaining || 0,
        child.age
      );

      // If contextual warning is empty, conversation shouldn't be interrupted
      if (!contextualWarning) {
        timeStatus.shouldShowWarning = false;
      } else {
        timeStatus.warningMessage = contextualWarning;
      }
    }

    // Check if it's a good time to end
    let shouldDelay = false;
    if (timeStatus.shouldEndConversation && conversationContext) {
      shouldDelay = !ContextAwareWarnings.isGoodTimeToEnd(conversationContext);

      if (shouldDelay) {
        timeStatus.shouldEndConversation = false;
        timeStatus.endingMessage = undefined;
      } else {
        // Generate graceful ending
        const parentSettings = await prisma.parentSettings.findUnique({
          where: { parentClerkUserId: userId },
        });

        timeStatus.endingMessage = ContextAwareWarnings.generateGracefulEnding(
          conversationContext,
          child.age,
          (parentSettings?.timeEndBehavior as any) || 'gradual'
        );
      }
    }

    return NextResponse.json({
      timeStatus: {
        ...timeStatus,
        shouldDelay,
        nextWarningDelay: conversationContext
          ? ContextAwareWarnings.getNextWarningDelay(conversationContext)
          : 3,
      },
      conversationContext: includeContext ? conversationContext : undefined,
      childInfo: {
        name: child.name,
        age: child.age,
      },
    });
  } catch (error) {
    console.error('Time status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { childAccountId, action, parentOverride } = body;

    if (!childAccountId) {
      return NextResponse.json(
        { error: 'childAccountId is required' },
        { status: 400 }
      );
    }

    // Verify child belongs to authenticated user
    const child = await prisma.childAccount.findFirst({
      where: {
        id: childAccountId,
        parentClerkUserId: userId,
      },
    });

    if (!child) {
      return NextResponse.json(
        { error: 'Child account not found or not authorized' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'end_session':
        await TimeManager.endSession(
          childAccountId,
          parentOverride ? 'parent_override' : 'time_limit'
        );

        return NextResponse.json({
          success: true,
          message: 'Session ended successfully',
        });

      case 'extend_time':
        if (!parentOverride) {
          return NextResponse.json(
            { error: 'Parent authorization required for time extension' },
            { status: 403 }
          );
        }

        // Log parent override in database
        await prisma.safetyEvent.create({
          data: {
            eventType: 'parent_time_override',
            severityLevel: 0,
            childAccountId,
            triggerContent: 'Parent extended chat time beyond limit',
            detectedAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Time extended by parent',
        });

      case 'update_timing':
        await TimeManager.updateSessionTiming(childAccountId);

        return NextResponse.json({
          success: true,
          message: 'Session timing updated',
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Time status POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { childAccountId, timeSettings } = body;

    if (!childAccountId) {
      return NextResponse.json(
        { error: 'childAccountId is required' },
        { status: 400 }
      );
    }

    // Verify child belongs to authenticated user
    const child = await prisma.childAccount.findFirst({
      where: {
        id: childAccountId,
        parentClerkUserId: userId,
      },
    });

    if (!child) {
      return NextResponse.json(
        { error: 'Child account not found or not authorized' },
        { status: 404 }
      );
    }

    // Update parent settings with new time configuration
    const updatedSettings = await prisma.parentSettings.upsert({
      where: { parentClerkUserId: userId },
      update: {
        dailyTimeLimitMinutes: timeSettings.dailyTimeLimitMinutes || null,
        weeklyTimeLimitMinutes: timeSettings.weeklyTimeLimitMinutes || null,
        timeWarningMinutes: timeSettings.timeWarningMinutes || 10,
        timeEndBehavior: timeSettings.timeEndBehavior || 'gradual',
        allowedStartHour: timeSettings.allowedStartHour || null,
        allowedEndHour: timeSettings.allowedEndHour || null,
        restrictWeekends: timeSettings.restrictWeekends || false,
      },
      create: {
        parentClerkUserId: userId,
        dailyTimeLimitMinutes: timeSettings.dailyTimeLimitMinutes || null,
        weeklyTimeLimitMinutes: timeSettings.weeklyTimeLimitMinutes || null,
        timeWarningMinutes: timeSettings.timeWarningMinutes || 10,
        timeEndBehavior: timeSettings.timeEndBehavior || 'gradual',
        allowedStartHour: timeSettings.allowedStartHour || null,
        allowedEndHour: timeSettings.allowedEndHour || null,
        restrictWeekends: timeSettings.restrictWeekends || false,
      },
    });

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
    });
  } catch (error) {
    console.error('Time settings PUT API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
