/**
 * Child-Relevant Calendar Events API
 * Returns filtered calendar events safe for child conversations
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { googleCalendarService } from '@/lib/calendar/google-calendar-service';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const childAccountId = searchParams.get('childAccountId');
    const daysAhead = parseInt(searchParams.get('daysAhead') || '7');

    if (!childAccountId) {
      return NextResponse.json(
        { error: 'childAccountId is required' },
        { status: 400 }
      );
    }

    // Verify child belongs to parent
    const childAccount = await prisma.childAccount.findFirst({
      where: {
        id: childAccountId,
        parentClerkUserId: userId,
      },
    });

    if (!childAccount) {
      return NextResponse.json(
        { error: 'Child account not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get child-relevant events
    const events = await googleCalendarService.getChildRelevantEvents(
      userId,
      childAccountId,
      daysAhead
    );

    // Transform events for API response
    const transformedEvents = events.map(event => ({
      id: event.id,
      title: event.sanitizedTitle || event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      isAllDay: event.isAllDay,
      category: categorizeEvent(event.title),
      daysUntil: Math.ceil(
        (event.startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
    }));

    return NextResponse.json({
      success: true,
      events: transformedEvents,
      count: transformedEvents.length,
    });
  } catch (error) {
    console.error('Child events error:', error);
    return NextResponse.json(
      { error: 'Failed to get child-relevant events' },
      { status: 500 }
    );
  }
}

/**
 * Categorize events for child-friendly conversation
 */
function categorizeEvent(title: string): string {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('school') || titleLower.includes('homework')) {
    return 'school';
  }
  if (titleLower.includes('practice') || titleLower.includes('sports') || 
      titleLower.includes('game') || titleLower.includes('match')) {
    return 'sports';
  }
  if (titleLower.includes('birthday') || titleLower.includes('party')) {
    return 'celebration';
  }
  if (titleLower.includes('lesson') || titleLower.includes('class')) {
    return 'learning';
  }
  if (titleLower.includes('playdate') || titleLower.includes('friend')) {
    return 'social';
  }
  if (titleLower.includes('camp') || titleLower.includes('trip')) {
    return 'adventure';
  }
  
  return 'activity';
}