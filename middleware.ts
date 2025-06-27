import { authMiddleware } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: [
    '/', // Landing page
    '/test', // Test page for debugging
    '/debug-auth', // Auth debug page
    '/debug-deploy', // Deployment debug page
    '/simple-landing', // Simple landing page
    '/auth-test', // Auth flow test page
    '/auth-visualizer', // Auth flow visualization tool
    '/sign-in', // Clerk sign-in page
    '/onboarding', // Clerk sign-up page
    '/onboarding/setup', // User type selection page
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
        // Redirect authenticated parents away from landing/auth pages to parent dashboard
        if (
          url.pathname === '/' ||
          url.pathname === '/sign-in' ||
          url.pathname === '/onboarding'
        ) {
          return NextResponse.redirect(new URL('/parent', req.url));
        }

        // Redirect away from onboarding setup if already configured
        if (url.pathname === '/onboarding/setup') {
          return NextResponse.redirect(new URL('/parent', req.url));
        }
      }

      // Handle child users
      if (userType === 'child') {
        // Redirect authenticated children away from landing/auth pages to chat
        if (
          url.pathname === '/' ||
          url.pathname === '/sign-in' ||
          url.pathname === '/onboarding'
        ) {
          return NextResponse.redirect(new URL('/chat', req.url));
        }

        // Redirect away from onboarding setup if already configured
        if (url.pathname === '/onboarding/setup') {
          return NextResponse.redirect(new URL('/chat', req.url));
        }
      }

      // Handle authenticated users without userType (new signups need to complete setup)
      if (!userType) {
        // Allow access to onboarding setup - they need to complete user type selection
        if (url.pathname === '/onboarding/setup') {
          return;
        }

        // Redirect from other pages to setup if user type not set
        if (
          url.pathname === '/' ||
          url.pathname === '/sign-in' ||
          url.pathname === '/onboarding'
        ) {
          return NextResponse.redirect(new URL('/onboarding/setup', req.url));
        }

        // For other protected routes, redirect to setup
        if (
          url.pathname.startsWith('/chat') ||
          url.pathname.startsWith('/parent')
        ) {
          return NextResponse.redirect(new URL('/onboarding/setup', req.url));
        }
      }
    }

    // Unauthenticated users trying to access protected routes
    if (!userId && !auth.isPublicRoute) {
      // If trying to access child chat, redirect to landing page
      if (url.pathname.startsWith('/chat')) {
        return NextResponse.redirect(new URL('/', req.url));
      }

      // If trying to access parent dashboard, redirect to sign-in
      if (url.pathname.startsWith('/parent')) {
        return NextResponse.redirect(new URL('/sign-in', req.url));
      }
    }
  },
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?\!_next|[^?]*\.(?:html?|css|js(?\!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4|mov|avi|mkv|webm|avif)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
