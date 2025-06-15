import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import {
  generateWeeklySummary,
  formatSummaryForEmail,
} from '@/lib/summary-generator';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { childAccountId, weekStartDate } = await request.json();

    if (!childAccountId || !weekStartDate) {
      return NextResponse.json(
        { error: 'childAccountId and weekStartDate are required' },
        { status: 400 }
      );
    }

    // Verify parent has access to this child
    const child = await prisma.childAccount.findFirst({
      where: {
        id: childAccountId,
        parent: {
          clerkUserId: userId,
        },
      },
      include: {
        parent: true,
      },
    });

    if (!child) {
      return NextResponse.json(
        { error: 'Child not found or access denied' },
        { status: 404 }
      );
    }

    // Generate summary
    const startDate = new Date(weekStartDate);
    const summary = await generateWeeklySummary(childAccountId, startDate);

    if (!summary) {
      return NextResponse.json(
        { error: 'Failed to generate summary' },
        { status: 500 }
      );
    }

    // Format for email
    const emailContent = formatSummaryForEmail(summary);

    return NextResponse.json({
      summary,
      emailContent,
      success: true,
    });
  } catch (error) {
    console.error('Summary generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get summary for a specific week (for parent dashboard)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childAccountId = searchParams.get('childAccountId');
    const weekStartDate = searchParams.get('weekStartDate');

    if (!childAccountId || !weekStartDate) {
      return NextResponse.json(
        { error: 'childAccountId and weekStartDate are required' },
        { status: 400 }
      );
    }

    // Verify parent has access to this child
    const child = await prisma.childAccount.findFirst({
      where: {
        id: childAccountId,
        parent: {
          clerkUserId: userId,
        },
      },
    });

    if (!child) {
      return NextResponse.json(
        { error: 'Child not found or access denied' },
        { status: 404 }
      );
    }

    // Generate summary
    const startDate = new Date(weekStartDate);
    const summary = await generateWeeklySummary(childAccountId, startDate);

    if (!summary) {
      return NextResponse.json(
        { error: 'No data available for this week' },
        { status: 404 }
      );
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summary retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
