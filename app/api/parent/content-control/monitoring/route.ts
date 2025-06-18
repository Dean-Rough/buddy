/**
 * Content Monitoring API
 * Provides monitoring statistics and settings management
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { RealTimeContentMonitor } from '@/lib/content-control/real-time-monitor';

export const dynamic = 'force-dynamic';

// GET /api/parent/content-control/monitoring - Get monitoring statistics
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childAccountId = searchParams.get('childAccountId');
    const days = parseInt(searchParams.get('days') || '7');

    const stats = await RealTimeContentMonitor.getMonitoringStats(
      userId,
      childAccountId || undefined,
      days
    );

    return NextResponse.json({
      success: true,
      stats,
      period: `${days} days`,
    });
  } catch (error) {
    console.error('Monitoring stats GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monitoring statistics' },
      { status: 500 }
    );
  }
}

// PUT /api/parent/content-control/monitoring - Update monitoring settings
export async function PUT(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      enableRealTimeAlerts,
      notificationThreshold,
      alertMethods,
      quietHours,
      categoryFilters,
    } = body;

    // Validate notification threshold
    if (
      notificationThreshold !== undefined &&
      (notificationThreshold < 1 || notificationThreshold > 5)
    ) {
      return NextResponse.json(
        { error: 'notificationThreshold must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate alert methods
    if (alertMethods !== undefined && !Array.isArray(alertMethods)) {
      return NextResponse.json(
        { error: 'alertMethods must be an array' },
        { status: 400 }
      );
    }

    await RealTimeContentMonitor.updateMonitoringSettings(userId, {
      enableRealTimeAlerts,
      notificationThreshold,
      alertMethods,
      quietHours,
      categoryFilters,
    });

    return NextResponse.json({
      success: true,
      message: 'Monitoring settings updated successfully',
    });
  } catch (error) {
    console.error('Monitoring settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update monitoring settings' },
      { status: 500 }
    );
  }
}
