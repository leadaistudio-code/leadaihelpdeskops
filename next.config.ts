import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit ships its own font metric (.afm) data files and reads them from disk
  // at runtime. Bundling it breaks those reads, so keep it external on the server.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
