/**
 * Create Nudge API Endpoint
 * Creates a new parent nudge request
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ContextWeavingEngine } from '@/lib/conversation/context-weaver';
import { z } from 'zod';

const contextWeaver = new ContextWeavingEngine();

// Validation schema
const createNudgeSchema = z.object({
  childAccountId: z.string(),
  targetTopic: z.string().min(1).max(100),
  naturalPhrasing: z.string().min(1).max(500),
  urgency: z.enum(['low', 'medium', 'high', 'immediate']),
  context: z.string().optional(),
  maxAttempts: z.number().min(1).max(5).default(3),
});

export async function POST(request: NextRequest) {
  try {
    // Verify parent authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Parent authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createNudgeSchema.parse(body);

    // Create nudge request object
    const nudgeRequest = {
      id: `nudge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      parentClerkUserId: userId,
      childAccountId: validatedData.childAccountId,
      targetTopic: validatedData.targetTopic,
      urgency: validatedData.urgency,
      naturalPhrasing: validatedData.naturalPhrasing,
      context: validatedData.context,
      createdAt: new Date(),
      maxAttempts: validatedData.maxAttempts,
      currentAttempts: 0,
      status: 'pending' as const,
    };

    // Queue the nudge
    const result = await contextWeaver.queueParentNudge(nudgeRequest);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create nudge' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      nudgeId: nudgeRequest.id,
      queuePosition: result.queuePosition,
      estimatedDelay: result.estimatedDelay,
      message: 'Nudge queued successfully',
    });
  } catch (error) {
    console.error('Create nudge error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create nudge' },
      { status: 500 }
    );
  }
}