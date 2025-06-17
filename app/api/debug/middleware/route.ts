import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const headers = Object.fromEntries(request.headers.entries());
    const url = request.nextUrl;
    
    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      url: {
        pathname: url.pathname,
        origin: url.origin,
        host: url.host,
        hostname: url.hostname,
      },
      headers: {
        host: headers.host,
        'user-agent': headers['user-agent'],
        'x-forwarded-for': headers['x-forwarded-for'],
        'x-forwarded-proto': headers['x-forwarded-proto'],
      },
      env: {
        hasClerkPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        hasClerkSecretKey: !!process.env.CLERK_SECRET_KEY,
        clerkPublishableKeyPrefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 20),
        vercelEnv: process.env.VERCEL_ENV,
        vercelUrl: process.env.VERCEL_URL,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Debug middleware error:', error);
    return NextResponse.json(
      {
        error: 'Debug middleware failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}