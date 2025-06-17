import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const pinRecord = await prisma.parentDashboardAccess.findUnique({
      where: { parentClerkUserId: userId },
      select: {
        lockedUntil: true,
        failedAttempts: true,
      },
    });

    if (!pinRecord) {
      return NextResponse.json({
        requiresSetup: true,
        isLocked: false,
      });
    }

    const isLocked =
      pinRecord.lockedUntil && pinRecord.lockedUntil > new Date();

    return NextResponse.json({
      requiresSetup: false,
      isLocked: !!isLocked,
      lockoutUntil: isLocked ? pinRecord.lockedUntil : null,
      failedAttempts: pinRecord.failedAttempts,
    });
  } catch (error) {
    console.error('PIN status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
