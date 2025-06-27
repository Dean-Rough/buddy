/**
 * Nudge Queue API Endpoint
 * Get nudge queue status and pending nudges
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ContextWeavingEngine } from '@/lib/conversation/context-weaver';

export const dynamic = 'force-dynamic';

const contextWeaver = new ContextWeavingEngine();

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

    // Get child account ID from query
    const { searchParams } = new URL(request.url);
    const childAccountId = searchParams.get('childAccountId');

    if (!childAccountId) {
      return NextResponse.json(
        { error: 'childAccountId is required' },
        { status: 400 }
      );
    }

    // Get queue status from context weaver
    const queueStatus = await contextWeaver.getNudgeQueueStatus(childAccountId);

    return NextResponse.json(queueStatus);
  } catch (error) {
    console.error('Nudge queue error:', error);
    return NextResponse.json(
      { error: 'Failed to get nudge queue status' },
      { status: 500 }
    );
  }
}