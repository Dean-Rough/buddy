/**
 * Content Alerts Management API
 * Handles content alerts and real-time monitoring for parents
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { RealTimeContentMonitor } from '@/lib/content-control/real-time-monitor';

export const dynamic = 'force-dynamic';

// GET /api/parent/content-control/alerts - Get active content alerts
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const alerts = await RealTimeContentMonitor.getActiveAlerts(userId, limit);

    return NextResponse.json({
      success: true,
      alerts,
      count: alerts.length
    });
    
  } catch (error) {
    console.error('Content alerts GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content alerts' },
      { status: 500 }
    );
  }
}

// POST /api/parent/content-control/alerts/acknowledge - Acknowledge alerts
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { alertIds } = body;

    if (!Array.isArray(alertIds) || alertIds.length === 0) {
      return NextResponse.json(
        { error: 'alertIds must be a non-empty array' },
        { status: 400 }
      );
    }

    const acknowledgedCount = await RealTimeContentMonitor.acknowledgeAlerts(
      userId,
      alertIds
    );

    return NextResponse.json({
      success: true,
      acknowledgedCount,
      message: `${acknowledgedCount} alerts acknowledged`
    });
    
  } catch (error) {
    console.error('Alert acknowledgment error:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge alerts' },
      { status: 500 }
    );
  }
}