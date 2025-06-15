import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Simple authentication for moderation dashboard
function isAuthorizedModerator(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.MODERATOR_API_KEY}`;

  // For development, allow access without auth
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return authHeader === expectedAuth;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    // Check moderator authorization
    if (!isAuthorizedModerator(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = params;
    const { decision, notes } = await request.json();

    if (!decision) {
      return NextResponse.json(
        { error: 'Decision is required' },
        { status: 400 }
      );
    }

    // Find the safety event
    const safetyEvent = await prisma.safetyEvent.findUnique({
      where: { id: eventId },
    });

    if (!safetyEvent) {
      return NextResponse.json(
        { error: 'Safety event not found' },
        { status: 404 }
      );
    }

    // Create or find a moderator record
    // In production, this would be based on authenticated moderator
    let moderator = await prisma.moderator.findFirst({
      where: { email: 'system@onda.ai' }, // Placeholder moderator
    });

    if (!moderator) {
      moderator = await prisma.moderator.create({
        data: {
          email: 'system@onda.ai',
          name: 'System Moderator',
          role: 'moderator',
          active: true,
        },
      });
    }

    // Update the safety event with moderator review
    await prisma.safetyEvent.update({
      where: { id: eventId },
      data: {
        moderatorId: moderator.id,
        moderatorDecision: decision,
        moderatorNotes: notes || null,
        status: decision === 'approved' ? 'resolved' : 'active',
      },
    });

    // Update moderator stats
    await prisma.moderator.update({
      where: { id: moderator.id },
      data: {
        reviewsCompleted: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
    });
  } catch (error) {
    console.error('Moderation review error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
