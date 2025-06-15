import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { alertId } = params;

    // Verify the alert belongs to this parent
    const safetyEvent = await prisma.safetyEvent.findFirst({
      where: {
        id: alertId,
        childAccount: {
          parent: {
            clerkUserId: userId,
          },
        },
      },
    });

    if (!safetyEvent) {
      return NextResponse.json(
        { error: 'Safety alert not found or access denied' },
        { status: 404 }
      );
    }

    // Update the alert status
    await prisma.safetyEvent.update({
      where: {
        id: alertId,
      },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Alert marked as resolved',
    });
  } catch (error) {
    console.error('Safety alert resolution error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
