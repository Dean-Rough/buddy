import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
// Simple authentication for moderation dashboard
// In production, this should use proper moderator authentication
function isAuthorizedModerator(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.MODERATOR_API_KEY}`;

  // For development, allow access without auth
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return authHeader === expectedAuth;
}

export async function GET(request: NextRequest) {
  try {
    // Check moderator authorization
    if (!isAuthorizedModerator(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'pending';

    // Build where clause
    const whereClause: any = {};

    if (filter === 'pending') {
      whereClause.moderatorDecision = null;
      whereClause.severityLevel = { gte: 2 }; // Only show level 2+ for moderation
    } else if (filter === 'reviewed') {
      whereClause.moderatorDecision = { not: null };
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
      orderBy: [{ severityLevel: 'desc' }, { detectedAt: 'desc' }],
      take: 100, // Limit results
    });

    // Format events for frontend
    const events = safetyEvents.map(event => ({
      id: event.id,
      eventType: event.eventType,
      severityLevel: event.severityLevel,
      triggerContent: event.triggerContent,
      aiReasoning: event.aiReasoning || '',
      contextSummary: event.contextSummary || '',
      detectedAt: event.detectedAt.toISOString(),
      childName: event.childAccount.name,
      status: event.status,
      moderatorDecision: event.moderatorDecision,
      moderatorNotes: event.moderatorNotes,
      moderatorName: event.moderatorId ? 'Moderator' : null, // Simple fallback since we don't have moderator model
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Moderation events fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
