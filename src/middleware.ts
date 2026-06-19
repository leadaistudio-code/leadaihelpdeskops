import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        if (!token) return false;
        
        const path = req.nextUrl.pathname;
        const isAgent = token.role === "IT_AGENT" || token.role === "ADMIN";
        
        // Protect agent-only routes
        if (
          path.startsWith("/dex") || 
          path.startsWith("/assets") ||
          path.startsWith("/knowledge/new") ||
          path === "/incidents/active" ||
          path === "/incidents/assigned" ||
          path === "/incidents/closed"
        ) {
          return isAgent;
        }
        
        return true;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (the login page itself)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login|p/|$).*)",
  ],
};
