import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { WeeklySummaryGenerator } from '@/lib/email-summary';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify that the user is a parent
    const parent = await prisma.parent.findUnique({
      where: { clerkUserId: userId },
    });

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    // Get global stats
    const generator = new WeeklySummaryGenerator();
    const globalStats = await generator.getSummaryStats();

    // Get parent-specific summaries
    const parentSummaries = await prisma.weeklySummary.findMany({
      where: {
        parentClerkUserId: userId,
      },
      include: {
        childAccount: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        weekStart: 'desc',
      },
      take: 10, // Last 10 summaries
    });

    const parentStats = {
      totalSummaries: parentSummaries.length,
      emailsSent: parentSummaries.filter(s => s.emailSent).length,
      averageTokenCost:
        parentSummaries.length > 0
          ? parentSummaries.reduce((sum, s) => sum + (s.tokenCost || 0), 0) /
            parentSummaries.length
          : 0,
    };

    return NextResponse.json({
      success: true,
      globalStats,
      parentStats,
      recentSummaries: parentSummaries.map(summary => ({
        id: summary.id,
        childName: summary.childAccount.name,
        weekStart: summary.weekStart,
        weekEnd: summary.weekEnd,
        sessionCount: summary.sessionCount,
        totalChatTime: summary.totalChatTime,
        emailSent: summary.emailSent,
        emailSentAt: summary.emailSentAt,
        createdAt: summary.generatedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching summary stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch summary statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
