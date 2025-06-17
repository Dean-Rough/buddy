import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { FamilyAnalyticsEngine, AnalyticsTimeframe, FamilyMetricType } from '@/lib/multi-child/family-analytics';
import { SiblingInteractionManager } from '@/lib/multi-child/sibling-interaction';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeframe = (searchParams.get('timeframe') || 'weekly') as AnalyticsTimeframe;
    const includeChildren = searchParams.get('children')?.split(',').filter(Boolean);
    const metricTypesParam = searchParams.get('metrics');
    const respectPrivacy = searchParams.get('respectPrivacy') !== 'false';
    
    const metricTypes = metricTypesParam?.split(',') as FamilyMetricType[] || undefined;

    // Parse date range if provided
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    // Generate family analytics
    const analytics = await FamilyAnalyticsEngine.generateFamilyAnalytics({
      parentClerkUserId: userId,
      timeframe,
      startDate,
      endDate,
      includeChildren,
      metricTypes,
      respectPrivacy,
    });

    // Get sibling interaction insights
    const interactionInsights = await SiblingInteractionManager.getFamilyInteractionInsights(
      userId,
      timeframe === 'daily' ? 1 : timeframe === 'weekly' ? 7 : timeframe === 'monthly' ? 30 : 365
    );

    return NextResponse.json({
      success: true,
      analytics,
      interactionInsights,
      metadata: {
        generatedAt: new Date().toISOString(),
        timeframe,
        childrenIncluded: analytics.childSummaries.length,
        privacyCompliant: analytics.privacyCompliance.complianceScore >= 0.9,
      },
    });
  } catch (error) {
    console.error('Family analytics GET error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate family analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      action,
      timeframe = 'weekly',
      format = 'json',
      includePersonalData = false,
      childrenFilter,
    } = body;

    if (action === 'export') {
      // Export family analytics
      const exportResult = await FamilyAnalyticsEngine.exportFamilyAnalytics(
        userId,
        format,
        {
          timeframe,
          includePersonalData,
          childrenFilter,
        }
      );

      return NextResponse.json({
        success: true,
        export: exportResult,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Family analytics POST error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process family analytics request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}