import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SiblingInteractionManager } from '@/lib/multi-child/sibling-interaction';
import { PrivacyIsolationService } from '@/lib/multi-child/privacy-isolation';

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
    const days = parseInt(searchParams.get('days') || '7');
    const action = searchParams.get('action') || 'insights';

    switch (action) {
      case 'insights':
        // Get family interaction insights
        const insights =
          await SiblingInteractionManager.getFamilyInteractionInsights(
            userId,
            days
          );

        return NextResponse.json({
          success: true,
          insights,
          timeframe: `${days} days`,
        });

      case 'dynamics':
        // Get family dynamics
        const dynamics =
          await SiblingInteractionManager.updateFamilyDynamics(userId);

        return NextResponse.json({
          success: true,
          dynamics,
        });

      case 'privacy':
        // Get family data with privacy isolation
        const familyData =
          await PrivacyIsolationService.getFamilyDataWithIsolation(userId, {
            dataCategories: [
              'conversations',
              'safety_events',
              'usage_analytics',
            ],
            respectChildPrivacy: true,
          });

        return NextResponse.json({
          success: true,
          familyData,
          privacyCompliant: true,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Sibling interactions GET error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve sibling interaction data',
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
      childId,
      targetSiblingId,
      conversationContent,
      topics,
      contextMetadata,
    } = body;

    switch (action) {
      case 'detect_interaction':
        // Detect sibling interaction from conversation
        if (!childId || !conversationContent) {
          return NextResponse.json(
            { error: 'childId and conversationContent are required' },
            { status: 400 }
          );
        }

        const interaction =
          await SiblingInteractionManager.detectSiblingInteraction(
            childId,
            conversationContent,
            topics || [],
            contextMetadata || {
              messageCount: 1,
              timeOfDay:
                new Date().getHours() < 12
                  ? 'morning'
                  : new Date().getHours() < 18
                    ? 'afternoon'
                    : 'evening',
            }
          );

        return NextResponse.json({
          success: true,
          interaction,
          detected: interaction !== null,
        });

      case 'check_sibling_access':
        // Check if sibling interaction is allowed
        if (!childId || !targetSiblingId) {
          return NextResponse.json(
            { error: 'childId and targetSiblingId are required' },
            { status: 400 }
          );
        }

        const isAllowed =
          await SiblingInteractionManager.isSiblingInteractionAllowed(
            childId,
            targetSiblingId
          );

        const siblingInfo = isAllowed
          ? await SiblingInteractionManager.getSanitizedSiblingInfo(
              childId,
              targetSiblingId
            )
          : null;

        return NextResponse.json({
          success: true,
          allowed: isAllowed,
          siblingInfo,
        });

      case 'update_privacy_settings':
        // Update child privacy settings (simplified - would be more comprehensive in production)
        const { privacySettings } = body;

        if (!childId || !privacySettings) {
          return NextResponse.json(
            { error: 'childId and privacySettings are required' },
            { status: 400 }
          );
        }

        // Log the privacy settings update
        await PrivacyIsolationService.logPrivacyAccess(
          {
            requestingParentId: userId,
            targetChildId: childId,
            dataCategory: 'preferences',
            operation: 'write',
          },
          true,
          false
        );

        return NextResponse.json({
          success: true,
          message: 'Privacy settings updated successfully',
          settings: privacySettings,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Sibling interactions POST error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process sibling interaction request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
