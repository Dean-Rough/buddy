/**
 * Topic Suggestions API
 * Provides intelligent topic suggestions based on conversation analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { TopicManagementService } from '@/lib/content-control/topic-management';

export const dynamic = 'force-dynamic';

// GET /api/parent/content-control/suggestions - Get topic suggestions
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childAccountId = searchParams.get('childAccountId');
    const days = parseInt(searchParams.get('days') || '7');

    if (!childAccountId) {
      return NextResponse.json(
        { error: 'childAccountId is required' },
        { status: 400 }
      );
    }

    const suggestions = await TopicManagementService.getTopicSuggestions(
      userId,
      childAccountId,
      days
    );

    return NextResponse.json({
      success: true,
      suggestions,
      count: suggestions.length,
      period: `${days} days`
    });
    
  } catch (error) {
    console.error('Topic suggestions GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topic suggestions' },
      { status: 500 }
    );
  }
}

// POST /api/parent/content-control/suggestions/bulk-create - Create rules from suggestions
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { childAccountId, rules } = body;

    if (!childAccountId || !Array.isArray(rules) || rules.length === 0) {
      return NextResponse.json(
        { error: 'childAccountId and rules array are required' },
        { status: 400 }
      );
    }

    // Validate rule format
    for (const rule of rules) {
      if (!rule.topic || !rule.action || !rule.reason) {
        return NextResponse.json(
          { error: 'Each rule must have topic, action, and reason' },
          { status: 400 }
        );
      }
    }

    const createdRules = await TopicManagementService.createBulkTopicRules(
      userId,
      childAccountId,
      rules
    );

    return NextResponse.json({
      success: true,
      createdRules,
      count: createdRules.length,
      message: `${createdRules.length} topic rules created successfully`
    }, { status: 201 });
    
  } catch (error) {
    console.error('Bulk rule creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create topic rules' },
      { status: 500 }
    );
  }
}