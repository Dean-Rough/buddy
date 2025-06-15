import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  generateWeeklySummary,
  formatSummaryForEmail,
} from '@/lib/summary-generator';
import { sendWeeklySummary } from '@/lib/notifications';

// This endpoint should be called by a cron job (e.g., Vercel Cron or external service)
// Security: Add authorization header in production
export async function POST(request: NextRequest) {
  try {
    // Security check - only allow cron jobs
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET || authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get all active children
    const children = await prisma.childAccount.findMany({
      where: {
        accountStatus: 'active',
      },
      include: {
        parent: {
          select: {
            id: true,
            email: true,
            emailNotifications: true,
            clerkUserId: true,
          },
        },
      },
    });

    const results = [];

    for (const child of children) {
      try {
        // Skip if parent has disabled email notifications
        if (!child.parent.emailNotifications) {
          continue;
        }

        // Generate summary for the past week
        const summary = await generateWeeklySummary(child.id, weekAgo);

        if (!summary) {
          continue; // No activity this week
        }

        // Format email content
        const emailContent = formatSummaryForEmail(summary);

        // Store notification in database
        const notification = await prisma.parentNotification.create({
          data: {
            parentClerkUserId: child.parent.clerkUserId,
            childAccountId: child.id,
            notificationType: 'weekly_summary',
            subject: `Weekly Summary: ${child.name}`,
            content: emailContent,
            deliveryMethod: 'email',
            status: 'pending',
          },
        });

        // Send actual email notification
        const emailSent = await sendWeeklySummary(
          child.parent.email,
          child.name,
          emailContent
        );

        // Update notification status based on email delivery
        await prisma.parentNotification.update({
          where: { id: notification.id },
          data: {
            status: emailSent ? 'sent' : 'failed',
            sentAt: emailSent ? new Date() : undefined,
          },
        });

        console.log(
          `Weekly summary for ${child.name} (${child.id}) - Email ${emailSent ? 'sent' : 'failed'}`
        );

        results.push({
          childId: child.id,
          childName: child.name,
          parentEmail: child.parent.email,
          status: emailSent ? 'sent' : 'failed',
        });
      } catch (error) {
        console.error(
          `Failed to process summary for child ${child.id}:`,
          error
        );
        results.push({
          childId: child.id,
          childName: child.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Weekly summary cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Manual trigger endpoint for testing
export async function GET(request: NextRequest) {
  // Allow manual triggers in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  // Create a mock request to trigger the POST handler
  const mockRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.CRON_SECRET || 'dev-secret'}`,
    },
  });

  return POST(mockRequest);
}
