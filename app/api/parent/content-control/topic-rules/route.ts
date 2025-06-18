/**
 * Topic Rules Management API
 * Handles CRUD operations for topic rules in the content control system
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { TopicManagementService } from '@/lib/content-control/topic-management';
import {
  TopicAction,
  ContentCategory,
} from '@/lib/content-control/advanced-filtering-engine';

export const dynamic = 'force-dynamic';

// GET /api/parent/content-control/topic-rules - Get topic rules with statistics
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childAccountId = searchParams.get('childAccountId');

    const rules = await TopicManagementService.getTopicRulesWithStats(
      userId,
      childAccountId || undefined
    );

    return NextResponse.json({
      success: true,
      rules,
      count: rules.length,
    });
  } catch (error) {
    console.error('Topic rules GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topic rules' },
      { status: 500 }
    );
  }
}

// POST /api/parent/content-control/topic-rules - Create new topic rule
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { childAccountId, topic, action, reason, category } = body;

    // Validate required fields
    if (!topic || !action || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, action, reason' },
        { status: 400 }
      );
    }

    // Validate action enum
    if (!Object.values(TopicAction).includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: allow, block, monitor, redirect' },
        { status: 400 }
      );
    }

    // Validate category if provided
    if (category && !Object.values(ContentCategory).includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const rule = await TopicManagementService.createTopicRule({
      parentClerkUserId: userId,
      childAccountId: childAccountId || undefined,
      topic,
      action,
      reason,
      category,
    });

    return NextResponse.json(
      {
        success: true,
        rule,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Topic rule creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create topic rule' },
      { status: 500 }
    );
  }
}

// PUT /api/parent/content-control/topic-rules - Update topic rule
export async function PUT(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ruleId, action, reason, category } = body;

    if (!ruleId) {
      return NextResponse.json({ error: 'Missing ruleId' }, { status: 400 });
    }

    const updates: any = {};
    if (action !== undefined) {
      if (!Object.values(TopicAction).includes(action)) {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }
      updates.action = action;
    }
    if (reason !== undefined) updates.reason = reason;
    if (category !== undefined) {
      if (!Object.values(ContentCategory).includes(category)) {
        return NextResponse.json(
          { error: 'Invalid category' },
          { status: 400 }
        );
      }
      updates.category = category;
    }

    const rule = await TopicManagementService.updateTopicRule(
      ruleId,
      userId,
      updates
    );

    return NextResponse.json({
      success: true,
      rule,
    });
  } catch (error) {
    console.error('Topic rule update error:', error);
    return NextResponse.json(
      { error: 'Failed to update topic rule' },
      { status: 500 }
    );
  }
}

// DELETE /api/parent/content-control/topic-rules - Delete topic rule
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Missing ruleId parameter' },
        { status: 400 }
      );
    }

    await TopicManagementService.deleteTopicRule(ruleId, userId);

    return NextResponse.json({
      success: true,
      message: 'Topic rule deleted successfully',
    });
  } catch (error) {
    console.error('Topic rule deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete topic rule' },
      { status: 500 }
    );
  }
}
