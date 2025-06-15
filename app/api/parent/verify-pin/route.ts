import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { verifyDashboardPin } from '@/lib/parent-auth';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { pin } = await request.json();

    if (!pin || typeof pin !== 'string') {
      return NextResponse.json({ error: 'PIN is required' }, { status: 400 });
    }

    const result = await verifyDashboardPin(userId, pin);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({
        success: false,
        isLocked: result.isLocked,
        remainingAttempts: result.remainingAttempts,
        lockoutUntil: result.lockoutUntil,
        requiresSetup: result.requiresSetup,
      });
    }
  } catch (error) {
    console.error('PIN verification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
