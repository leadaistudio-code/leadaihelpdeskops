import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const isDev = process.env.NODE_ENV !== "production";

// Content Security Policy.
//
// The audit found no CSP, HSTS, or framing protection at all. The directives
// below are the tightest set this app actually runs under today — each
// allowance is here because something concrete needs it, not as a blanket
// wildcard:
//
//   script-src   'unsafe-inline' is required by Next's inline bootstrap and by
//                the GA4 snippet from @next/third-parties. 'unsafe-eval' is
//                needed only by the dev-mode React refresh runtime, so it is
//                gated to development.
//   style-src    'unsafe-inline' is required by Tailwind's runtime style
//                injection and by inline `style` attributes in the app.
//   connect-src  Clerk (session/telemetry) and GA4 collection.
//   frame-src    Clerk renders its sign-in flows and org switcher in frames.
//   frame-ancestors 'none' is the CSP-level equivalent of X-Frame-Options DENY
//                and is what modern browsers actually enforce.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://img.clerk.com https://*.clerk.com https://www.googletagmanager.com https://www.google-analytics.com",
  "media-src 'self'",
  "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com",
  "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Two years, subdomains included, preload-eligible. Only meaningful over
  // HTTPS; browsers ignore it on plain HTTP, so it is safe in dev too.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Redundant with frame-ancestors for modern browsers, kept for older ones.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // This app never needs these; denying them shrinks the damage a successful
  // injection can do.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Pin Turbopack to this app — avoids picking up C:\Users\aryan\package-lock.json as the monorepo root.
  turbopack: {
    root: projectRoot,
  },
  // pdfkit ships its own font metric (.afm) data files and reads them from disk
  // at runtime. Bundling it breaks those reads, so keep it external on the server.
  serverExternalPackages: ["pdfkit"],
  typescript: {
    // Netlify's build resolved TypeScript 7.0.2 — the native port, which does
    // not expose the compiler API `next build` uses for its type-check step —
    // and failed the deploy, despite package-lock.json pinning 5.9.3.
    //
    // Types are still enforced, just not from here: CI runs `npm run typecheck`
    // (tsc --noEmit, on the locked 5.9.3) on every push, and blocks the merge
    // before a deploy is ever triggered. Running the same check a second time
    // inside `next build` bought nothing and made the deploy hostage to whatever
    // TypeScript the build image happens to resolve.
    ignoreBuildErrors: true,
  },
  // Don't advertise the framework version to scanners.
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Every route, including API responses and the marketing site.
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
