import { NextRequest, NextResponse } from 'next/server';
import { WeeklySummaryGenerator } from '@/lib/email-summary';

export async function POST(req: NextRequest) {
  try {
    // Check for CRON_SECRET to verify this is an authorized request
    const authHeader = req.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      return NextResponse.json(
        { error: 'CRON_SECRET not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { maxRetries } = await req.json();
    const retryLimit = maxRetries || 3;

    console.log(
      `Retrying failed weekly summaries (max retries: ${retryLimit})...`
    );

    const generator = new WeeklySummaryGenerator();
    await generator.retryFailedSummaries(retryLimit);

    // Get updated statistics
    const stats = await generator.getSummaryStats();

    return NextResponse.json({
      success: true,
      message: 'Failed summaries retry completed',
      stats,
    });
  } catch (error) {
    console.error('Error retrying failed summaries:', error);
    return NextResponse.json(
      {
        error: 'Failed to retry summaries',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
