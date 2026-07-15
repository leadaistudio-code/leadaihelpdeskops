import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Pin Turbopack to this app — avoids picking up C:\Users\aryan\package-lock.json as the monorepo root.
  turbopack: {
    root: projectRoot,
  },
  // pdfkit ships its own font metric (.afm) data files and reads them from disk
  // at runtime. Bundling it breaks those reads, so keep it external on the server.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
