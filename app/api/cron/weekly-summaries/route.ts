import { NextRequest, NextResponse } from 'next/server';
import { WeeklySummaryGenerator } from '@/lib/email-summary';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('Authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== expectedAuth) {
      console.error('Unauthorized cron access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting weekly summary generation...');
    const startTime = Date.now();

    const generator = new WeeklySummaryGenerator();
    await generator.generateWeeklySummaries();

    const duration = Date.now() - startTime;
    const stats = await generator.getSummaryStats();

    console.log('✅ Weekly summary generation completed');
    console.log(`Duration: ${duration}ms`);
    console.log('Stats:', stats);

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Weekly summary generation failed:', error);

    return NextResponse.json(
      {
        error: 'Summary generation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Handle POST requests for manual triggers
export async function POST(request: NextRequest) {
  try {
    // Verify authorization (API key or admin auth)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, parentClerkUserId, childAccountId, weekStart, weekEnd } =
      body;

    const generator = new WeeklySummaryGenerator();

    switch (action) {
      case 'generate_manual':
        if (!parentClerkUserId || !childAccountId) {
          return NextResponse.json(
            {
              error:
                'parentClerkUserId and childAccountId required for manual generation',
            },
            { status: 400 }
          );
        }

        await generator.generateManualSummary(
          parentClerkUserId,
          childAccountId,
          weekStart ? new Date(weekStart) : undefined,
          weekEnd ? new Date(weekEnd) : undefined
        );

        return NextResponse.json({
          success: true,
          message: 'Manual summary generated successfully',
        });

      case 'retry_failed':
        await generator.retryFailedSummaries();

        return NextResponse.json({
          success: true,
          message: 'Failed summaries retry completed',
        });

      case 'get_stats':
        const stats = await generator.getSummaryStats();

        return NextResponse.json({
          success: true,
          stats,
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Manual summary operation failed:', error);

    return NextResponse.json(
      {
        error: 'Operation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
