import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/walkup(.*)',
  '/p/(.*)',
  '/api/webhook(.*)',
  '/api/chat(.*)',
  // DEX agent ingest — authenticated by device key, not a user session.
  '/api/agent/(.*)',
]);

// Routes a signed-in user may visit before they belong to a tenant (org).
const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)', '/api/(.*)']);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect({ unauthenticatedUrl: new URL('/login', request.url).toString() });
  }

  // A tenant IS a Clerk organization. If a signed-in user has no active org,
  // send them to onboarding to create (or be invited into) one.
  const { userId, orgId } = await auth();
  if (userId && !orgId && !isPublicRoute(request) && !isOnboardingRoute(request)) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
