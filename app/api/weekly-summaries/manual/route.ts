import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { WeeklySummaryGenerator } from '@/lib/email-summary';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { childAccountId, weekStart, weekEnd } = await req.json();

    if (!childAccountId) {
      return NextResponse.json(
        { error: 'Child account ID is required' },
        { status: 400 }
      );
    }

    // Verify that the user is a parent who owns this child
    const parent = await prisma.parent.findUnique({
      where: { clerkUserId: userId },
      include: {
        children: {
          where: { id: childAccountId },
        },
      },
    });

    if (!parent || parent.children.length === 0) {
      return NextResponse.json(
        { error: 'Child not found or access denied' },
        { status: 404 }
      );
    }

    // Parse dates if provided
    let parsedWeekStart: Date | undefined;
    let parsedWeekEnd: Date | undefined;

    if (weekStart) {
      parsedWeekStart = new Date(weekStart);
      if (isNaN(parsedWeekStart.getTime())) {
        return NextResponse.json(
          { error: 'Invalid weekStart date' },
          { status: 400 }
        );
      }
    }

    if (weekEnd) {
      parsedWeekEnd = new Date(weekEnd);
      if (isNaN(parsedWeekEnd.getTime())) {
        return NextResponse.json(
          { error: 'Invalid weekEnd date' },
          { status: 400 }
        );
      }
    }

    console.log(`Generating manual summary for child ${childAccountId} by parent ${userId}`);
    
    const generator = new WeeklySummaryGenerator();
    await generator.generateManualSummary(
      userId,
      childAccountId,
      parsedWeekStart,
      parsedWeekEnd
    );

    return NextResponse.json({
      success: true,
      message: 'Weekly summary generated and email sent successfully',
    });

  } catch (error) {
    console.error('Error generating manual summary:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate weekly summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}