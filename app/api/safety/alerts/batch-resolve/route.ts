import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { alertIds, resolution, notes } = await req.json();

    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      return NextResponse.json(
        { error: 'Alert IDs are required' },
        { status: 400 }
      );
    }

    // Verify that the user is a parent who owns these alerts' children
    const parent = await prisma.parent.findUnique({
      where: { clerkUserId: userId },
      include: {
        children: true,
      },
    });

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    const childNames = parent.children.map(child => child.name);

    // Verify all alerts belong to this parent's children
    const alerts = await prisma.safetyEvent.findMany({
      where: {
        id: { in: alertIds },
        childName: { in: childNames },
      },
    });

    if (alerts.length !== alertIds.length) {
      return NextResponse.json(
        { error: 'Some alerts do not belong to your children' },
        { status: 403 }
      );
    }

    // Batch update alerts to resolved status
    const updateResult = await prisma.safetyEvent.updateMany({
      where: {
        id: { in: alertIds },
        resolved: false, // Only update unresolved alerts
      },
      data: {
        resolved: true,
        status: 'resolved',
        resolvedAt: new Date(),
        resolution: resolution || 'reviewed_by_parent',
        resolutionNotes: notes || 'Bulk resolved via alert management system',
      },
    });

    // Log the batch resolution action
    await prisma.parentNotification.create({
      data: {
        parentId: parent.id,
        type: 'BATCH_ALERT_RESOLUTION',
        title: 'Bulk Alert Resolution',
        message: `Resolved ${updateResult.count} safety alerts`,
        metadata: {
          alertIds,
          resolution,
          notes,
          resolvedCount: updateResult.count,
        },
        read: true, // Mark as read since it's an action they initiated
      },
    });

    return NextResponse.json({
      success: true,
      resolvedCount: updateResult.count,
      message: `Successfully resolved ${updateResult.count} alerts`,
    });

  } catch (error) {
    console.error('Error in batch resolve alerts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}