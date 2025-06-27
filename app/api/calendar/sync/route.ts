/**
 * Calendar Sync API Endpoint
 * Manually trigger calendar synchronization
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { googleCalendarService } from '@/lib/calendar/google-calendar-service';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Verify parent authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Parent authentication required' },
        { status: 401 }
      );
    }

    // Check if calendar is connected
    const credentials = await prisma.calendarCredentials.findFirst({
      where: {
        parentClerkUserId: userId,
        provider: 'google',
        isActive: true,
      },
    });

    if (!credentials) {
      return NextResponse.json(
        { error: 'No calendar connected. Please connect your Google Calendar first.' },
        { status: 400 }
      );
    }

    // Perform sync
    const result = await googleCalendarService.syncCalendarEvents(userId);

    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Calendar sync failed', 
          details: result.errors 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Calendar synced successfully',
      stats: {
        eventsProcessed: result.eventsProcessed,
        eventsAdded: result.eventsAdded,
        eventsUpdated: result.eventsUpdated,
        eventsRemoved: result.eventsRemoved,
        syncDuration: `${result.syncDuration}ms`,
      },
    });
  } catch (error) {
    console.error('Calendar sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync calendar' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify parent authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Parent authentication required' },
        { status: 401 }
      );
    }

    // Get sync status
    const credentials = await prisma.calendarCredentials.findFirst({
      where: {
        parentClerkUserId: userId,
        provider: 'google',
        isActive: true,
      },
      include: {
        _count: {
          select: {
            events: true,
          },
        },
      },
    });

    if (!credentials) {
      return NextResponse.json({
        connected: false,
        provider: null,
        lastSync: null,
        eventCount: 0,
      });
    }

    // Get recent sync metrics
    const recentSync = await prisma.calendarSyncMetric.findFirst({
      where: {
        credentialsId: credentials.id,
      },
      orderBy: {
        syncCompleted: 'desc',
      },
    });

    return NextResponse.json({
      connected: true,
      provider: credentials.provider,
      lastSync: credentials.lastSyncAt,
      eventCount: credentials._count.events,
      recentSync: recentSync ? {
        duration: recentSync.syncDuration,
        eventsProcessed: recentSync.eventsProcessed,
        completedAt: recentSync.syncCompleted,
      } : null,
    });
  } catch (error) {
    console.error('Calendar status error:', error);
    return NextResponse.json(
      { error: 'Failed to get calendar status' },
      { status: 500 }
    );
  }
}