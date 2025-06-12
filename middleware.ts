import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: [
    "/",                    // Landing page
    "/sign-in",             // Clerk sign-in page
    "/sign-up",             // Clerk sign-up page (if needed)
    "/api/auth/create-child" // Child account creation API
  ],
  
  // Routes that require authentication but handle user type internally
  ignoredRoutes: [
    "/api/auth/pin/verify"  // Legacy PIN verification (will be removed)
  ],

  // After successful authentication, redirect based on user type
  afterAuth(auth, req) {
    const { userId, sessionClaims } = auth;
    const url = req.nextUrl;
    
    // If user is authenticated
    if (userId) {
      const userType = (sessionClaims?.metadata as any)?.userType || (sessionClaims?.unsafeMetadata as any)?.userType;
      
      // Child users should only access /chat
      if (userType === "child") {
        if (!url.pathname.startsWith("/chat")) {
          return Response.redirect(new URL("/chat", req.url));
        }
      }
      
      // Parent users should access /parent dashboard
      if (userType === "parent") {
        // If parent just completed sign-in and hasn't completed onboarding
        const onboardingComplete = (sessionClaims?.metadata as any)?.onboardingComplete || 
                                  (sessionClaims?.unsafeMetadata as any)?.onboardingComplete;
        
        if (!onboardingComplete && !url.pathname.startsWith("/onboarding")) {
          return Response.redirect(new URL("/onboarding", req.url));
        }
        
        // Redirect authenticated parents away from landing page to dashboard
        if (onboardingComplete && (url.pathname === "/" || url.pathname === "/sign-in")) {
          return Response.redirect(new URL("/parent", req.url));
        }
      }
      
      // Handle existing users without metadata (legacy users or new signups)
      if (userId && !userType) {
        // For users without userType metadata, allow onboarding access
        if (url.pathname.startsWith("/onboarding")) {
          // Allow access to onboarding - they need to complete the flow
          return;
        }
        
        // For other routes, redirect to onboarding to complete setup
        if (url.pathname === "/" || url.pathname === "/sign-in") {
          return Response.redirect(new URL("/onboarding", req.url));
        }
      }
    }
    
    // Unauthenticated users trying to access protected routes
    if (!userId && !auth.isPublicRoute) {
      // If trying to access child chat, redirect to landing page
      if (url.pathname.startsWith("/chat")) {
        return Response.redirect(new URL("/", req.url));
      }
      
      // If trying to access parent dashboard, redirect to sign-in
      if (url.pathname.startsWith("/parent")) {
        return Response.redirect(new URL("/sign-in", req.url));
      }
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?\!_next|[^?]*\.(?:html?|css|js(?\!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4|mov|avi|mkv|webm|avif)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
