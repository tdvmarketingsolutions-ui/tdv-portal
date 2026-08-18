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
  // "Tickets" was renamed to "Aanvragen" — old links (bookmarks, and
  // notification rows already stored in the DB with the pre-rename
  // link_path) still work instead of 404ing.
  async redirects() {
    return [
      { source: "/tickets", destination: "/aanvragen", permanent: true },
      { source: "/tickets/new", destination: "/aanvragen/new", permanent: true },
      { source: "/tickets/:id", destination: "/aanvragen/:id", permanent: true },
      { source: "/admin/tickets", destination: "/admin/aanvragen", permanent: true },
    ];
  },
};

export default nextConfig;
