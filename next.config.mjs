/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Both read data files from their own package directory at runtime, so they
  // must stay outside the server bundle.
  serverExternalPackages: ["pdfkit", "exceljs"],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
    return {
      fallback: [],
      beforeFiles: [
        {
          source: "/api/:path((?!auth/session|auth/_log|auth/providers|auth/csrf|auth/signin|auth/signout|auth/callback|auth/verify-request|auth/error).*)",
          destination: `${backendUrl}/api/:path*`,
        }
      ]
    };
  },
};

export default nextConfig;
