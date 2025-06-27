/**
 * Calendar OAuth2 Callback Endpoint
 * Handles the OAuth callback and stores credentials
 */

import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarService } from '@/lib/calendar/google-calendar-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // parentClerkUserId
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4288';
      return NextResponse.redirect(
        `${baseUrl}/parent/dashboard?error=calendar_auth_failed&message=${encodeURIComponent(error)}`
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4288';

    if (!code || !state) {
      return NextResponse.redirect(
        `${baseUrl}/parent/dashboard?error=calendar_auth_failed&message=Missing+authorization+code`
      );
    }

    // Handle the callback
    const result = await googleCalendarService.handleCallback(code, state);

    if (result.success) {
      return NextResponse.redirect(
        `${baseUrl}/parent/dashboard?success=calendar_connected&tab=settings`
      );
    } else {
      return NextResponse.redirect(
        `${baseUrl}/parent/dashboard?error=calendar_auth_failed&message=${encodeURIComponent(result.error || 'Unknown error')}`
      );
    }
  } catch (error) {
    console.error('Calendar callback error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4288';
    return NextResponse.redirect(
      `${baseUrl}/parent/dashboard?error=calendar_auth_failed&message=Internal+error`
    );
  }
}