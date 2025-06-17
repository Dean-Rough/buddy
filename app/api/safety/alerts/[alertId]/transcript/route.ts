import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { alertId } = params;

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    // Verify that the user is a parent
    const parent = await prisma.parent.findUnique({
      where: { clerkUserId: userId },
      include: {
        childAccounts: true,
      },
    });

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    // Get the alert and verify ownership
    const alert = await prisma.safetyEvent.findUnique({
      where: { id: alertId },
      include: {
        childAccount: true,
      },
    });

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    // Verify the alert belongs to one of this parent's children
    const childAccountIds = parent.childAccounts.map((child: any) => child.id);
    if (!childAccountIds.includes(alert.childAccountId)) {
      return NextResponse.json(
        { error: 'This alert does not belong to your children' },
        { status: 403 }
      );
    }

    // Get the conversation associated with this alert
    let transcript = null;

    if (alert.conversationId) {
      // For new Clerk-based conversations
      const conversation = await prisma.conversation.findUnique({
        where: { id: alert.conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              content: true,
              role: true,
              createdAt: true,
            },
          },
        },
      });

      if (conversation) {
        transcript = {
          conversationId: conversation.id,
          childId: conversation.childAccountId,
          startedAt: conversation.startedAt,
          messages: conversation.messages.map(msg => ({
            id: msg.id,
            content: msg.content,
            role: msg.role,
            timestamp: msg.createdAt,
          })),
        };
      }
    }

    if (!transcript) {
      return NextResponse.json({
        alert: {
          id: alert.id,
          eventType: alert.eventType,
          severityLevel: alert.severityLevel,
          triggerContent: alert.triggerContent,
          detectedAt: alert.detectedAt,
          childName: alert.childAccount.name,
        },
        transcript: null,
        message: 'No conversation transcript available for this alert',
      });
    }

    // Log the transcript access for audit purposes
    await prisma.parentNotification.create({
      data: {
        parentClerkUserId: parent.clerkUserId,
        childAccountId: alert.childAccountId,
        notificationType: 'TRANSCRIPT_ACCESS',
        subject: 'Transcript Accessed',
        content: `Accessed conversation transcript for alert: ${alert.eventType}`,
        deliveryMethod: 'system',
        safetyEventId: alert.id,
      },
    });

    return NextResponse.json({
      alert: {
        id: alert.id,
        eventType: alert.eventType,
        severityLevel: alert.severityLevel,
        triggerContent: alert.triggerContent,
        detectedAt: alert.detectedAt,
        childName: alert.childAccount.name,
      },
      transcript,
    });
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
