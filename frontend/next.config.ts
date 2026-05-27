import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // ADD THIS BLOCK FOR PROXYING:
  async rewrites() {
    // Determine backend URL depending on development vs production environment
    const backendUrl = process.env.NODE_ENV === "production"
      ? process.env.BACKEND_PRODUCTION_URL // e.g., https://api.yourproductiondomain.com
      : "http://localhost:5001";          // Your local express port

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;