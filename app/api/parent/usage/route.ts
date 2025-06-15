import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

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
    const days = parseInt(searchParams.get('days') || '30');
    const childId = searchParams.get('childId');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Build query conditions
    const whereConditions: any = {
      parentClerkUserId: userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (childId) {
      whereConditions.childAccountId = childId;
    }

    // Get daily usage data
    const usageData = await prisma.dailyUsage.findMany({
      where: whereConditions,
      include: {
        childAccount: {
          select: {
            name: true,
            username: true,
            age: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Transform data for frontend
    const formattedUsage = usageData.map(usage => ({
      date: usage.date.toISOString().split('T')[0],
      childName: usage.childAccount.name,
      childUsername: usage.childAccount.username,
      childAge: usage.childAccount.age,
      totalMinutes: usage.totalMinutes,
      sessionCount: usage.sessionCount,
      longestSessionMinutes: usage.longestSessionMinutes,
      messagesSent: usage.messagesSent,
      topicsDiscussed: usage.topicsDiscussed,
      moodSummary: usage.moodSummary,
      safetyEvents: usage.safetyEvents,
      escalationEvents: usage.escalationEvents,
      engagementScore: usage.engagementScore
        ? parseFloat(usage.engagementScore.toString())
        : 0,
      learningOpportunities: usage.learningOpportunities,
    }));

    // Calculate summary statistics
    const totalMinutes = usageData.reduce(
      (sum, day) => sum + day.totalMinutes,
      0
    );
    const totalSessions = usageData.reduce(
      (sum, day) => sum + day.sessionCount,
      0
    );
    const totalMessages = usageData.reduce(
      (sum, day) => sum + day.messagesSent,
      0
    );
    const totalSafetyEvents = usageData.reduce(
      (sum, day) => sum + day.safetyEvents,
      0
    );
    const averageEngagement =
      usageData.length > 0
        ? usageData.reduce(
            (sum, day) =>
              sum + parseFloat(day.engagementScore?.toString() || '0'),
            0
          ) / usageData.length
        : 0;

    // Get unique topics discussed
    const allTopics = usageData.flatMap(day => day.topicsDiscussed);
    const topicCounts = allTopics.reduce(
      (counts: Record<string, number>, topic) => {
        counts[topic] = (counts[topic] || 0) + 1;
        return counts;
      },
      {}
    );

    const topTopics = Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));

    return NextResponse.json({
      usage: formattedUsage,
      summary: {
        totalMinutes,
        totalSessions,
        totalMessages,
        totalSafetyEvents,
        averageEngagement: Math.round(averageEngagement * 100) / 100,
        topTopics,
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
        },
      },
    });
  } catch (error) {
    console.error('Parent usage GET error:', error);
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
    const { childAccountId, date, ...usageData } = body;

    // Validate required fields
    if (!childAccountId || !date) {
      return NextResponse.json(
        { error: 'childAccountId and date are required' },
        { status: 400 }
      );
    }

    // Verify child belongs to parent
    const child = await prisma.childAccount.findFirst({
      where: {
        id: childAccountId,
        parentClerkUserId: userId,
      },
    });

    if (!child) {
      return NextResponse.json(
        { error: 'Child not found or not authorized' },
        { status: 404 }
      );
    }

    // Parse date
    const usageDate = new Date(date);

    // Upsert daily usage record
    const usage = await prisma.dailyUsage.upsert({
      where: {
        childAccountId_date: {
          childAccountId,
          date: usageDate,
        },
      },
      update: {
        totalMinutes: usageData.totalMinutes || 0,
        sessionCount: usageData.sessionCount || 0,
        longestSessionMinutes: usageData.longestSessionMinutes || 0,
        messagesSent: usageData.messagesSent || 0,
        topicsDiscussed: usageData.topicsDiscussed || [],
        moodSummary: usageData.moodSummary,
        safetyEvents: usageData.safetyEvents || 0,
        escalationEvents: usageData.escalationEvents || 0,
        engagementScore: usageData.engagementScore || 0,
        learningOpportunities: usageData.learningOpportunities || 0,
      },
      create: {
        parentClerkUserId: userId,
        childAccountId,
        date: usageDate,
        totalMinutes: usageData.totalMinutes || 0,
        sessionCount: usageData.sessionCount || 0,
        longestSessionMinutes: usageData.longestSessionMinutes || 0,
        messagesSent: usageData.messagesSent || 0,
        topicsDiscussed: usageData.topicsDiscussed || [],
        moodSummary: usageData.moodSummary,
        safetyEvents: usageData.safetyEvents || 0,
        escalationEvents: usageData.escalationEvents || 0,
        engagementScore: usageData.engagementScore || 0,
        learningOpportunities: usageData.learningOpportunities || 0,
      },
    });

    return NextResponse.json({ success: true, usage });
  } catch (error) {
    console.error('Parent usage POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
