import { authMiddleware } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

// Temporarily bypass Clerk for debugging
export default function middleware() {
  console.log('🔍 Middleware bypassed for debugging');
  return NextResponse.next();
}

/* 
export default authMiddleware({
  // Add error handling
  onError(error, req) {
    console.error('Clerk middleware error:', error);
    // For debugging in production, return 500 instead of default behavior
    return new NextResponse(
      JSON.stringify({
        error: 'Authentication middleware error',
        details:
          process.env.NODE_ENV === 'development'
            ? error.message
            : 'Internal error',
        path: req.nextUrl.pathname,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          'content-type': 'application/json',
        },
      }
    );
  },
  // Public routes that don't require authentication
  publicRoutes: [
    '/', // Landing page
    '/test', // Test page for debugging
    '/debug-auth', // Auth debug page
    '/sign-in', // Clerk sign-in page
    '/sign-up', // Clerk sign-up page (if needed)
    '/api/auth/create-child', // Child account creation API
    '/api/debug/middleware', // Debug route for troubleshooting
  ],

  // Routes that require authentication but handle user type internally
  ignoredRoutes: [
    // No ignored routes currently needed
  ],

  // After successful authentication, redirect based on user type
  afterAuth(auth, req) {
    const { userId, sessionClaims } = auth;
    const url = req.nextUrl;

    // If user is authenticated
    if (userId) {
      const userType =
        (sessionClaims?.metadata as any)?.userType ||
        (sessionClaims?.unsafeMetadata as any)?.userType;

      // Handle parent users
      if (userType === 'parent') {
        // Redirect authenticated parents away from landing page to parent dashboard
        if (url.pathname === '/' || url.pathname === '/sign-in') {
          return Response.redirect(new URL('/parent', req.url));
        }

        // Redirect away from onboarding if already authenticated
        if (url.pathname.startsWith('/onboarding')) {
          return Response.redirect(new URL('/parent', req.url));
        }
      }

      // Handle child users
      if (userType === 'child') {
        // Redirect authenticated children away from landing page to chat
        if (url.pathname === '/' || url.pathname === '/sign-in') {
          return Response.redirect(new URL('/chat', req.url));
        }

        // Redirect away from onboarding if already authenticated
        if (url.pathname.startsWith('/onboarding')) {
          return Response.redirect(new URL('/chat', req.url));
        }
      }

      // Handle existing users without metadata (legacy users or new signups)
      if (userId && !userType) {
        // For users without userType metadata, allow onboarding access
        if (url.pathname.startsWith('/onboarding')) {
          // Allow access to onboarding - they need to complete the flow
          return;
        }

        // For sign-in route, redirect to onboarding to complete setup
        if (url.pathname === '/sign-in') {
          return Response.redirect(new URL('/onboarding', req.url));
        }

        // DO NOT redirect root path - let users see landing page even if logged in without metadata
        // They can complete onboarding by clicking "GET STARTED"
      }
    }

    // Unauthenticated users trying to access protected routes
    if (!userId && !auth.isPublicRoute) {
      // If trying to access child chat, redirect to landing page
      if (url.pathname.startsWith('/chat')) {
        return Response.redirect(new URL('/', req.url));
      }

      // If trying to access parent dashboard, redirect to sign-in
      if (url.pathname.startsWith('/parent')) {
        return Response.redirect(new URL('/sign-in', req.url));
      }
    }
  },
});
*/

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?\!_next|[^?]*\.(?:html?|css|js(?\!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4|mov|avi|mkv|webm|avif)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
