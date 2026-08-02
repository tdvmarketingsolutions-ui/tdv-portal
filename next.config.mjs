/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        // Replace with the Supabase project ref used for storage-served images.
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    // Keeps server-only packages (supabase admin client, etc.) out of the client bundle.
    serverComponentsExternalPackages: ["@supabase/supabase-js"],
  },
};

export default nextConfig;
