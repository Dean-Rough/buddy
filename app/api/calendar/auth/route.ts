/**
 * Calendar OAuth2 Authorization Endpoint
 * Initiates the OAuth flow for calendar integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { googleCalendarService } from '@/lib/calendar/google-calendar-service';

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

    // Get calendar provider from query params
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') || 'google';

    if (provider !== 'google') {
      return NextResponse.json(
        { error: 'Unsupported calendar provider' },
        { status: 400 }
      );
    }

    // Generate OAuth URL
    const authUrl = googleCalendarService.generateAuthUrl(userId);

    // Redirect to OAuth provider
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Calendar auth error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate calendar authentication' },
      { status: 500 }
    );
  }
}