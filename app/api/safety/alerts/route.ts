import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');

    // Build where clause for filtering
    const whereClause: any = {
      childAccount: {
        parent: {
          clerkUserId: userId,
        },
      },
    };

    if (childId) {
      whereClause.childAccountId = childId;
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (severity && severity !== 'all') {
      whereClause.severityLevel = parseInt(severity);
    }

    // Fetch safety events
    const safetyEvents = await prisma.safetyEvent.findMany({
      where: whereClause,
      include: {
        childAccount: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        detectedAt: 'desc',
      },
      take: 50, // Limit results
    });

    // Format alerts for frontend
    const alerts = safetyEvents.map(event => ({
      id: event.id,
      eventType: event.eventType,
      severityLevel: event.severityLevel,
      triggerContent: event.triggerContent,
      aiReasoning: event.aiReasoning || '',
      contextSummary: event.contextSummary || '',
      detectedAt: event.detectedAt.toISOString(),
      parentNotifiedAt: event.parentNotifiedAt?.toISOString() || null,
      resolvedAt: event.resolvedAt?.toISOString() || null,
      status: event.status,
      childName: event.childAccount.name,
    }));

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Safety alerts fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
