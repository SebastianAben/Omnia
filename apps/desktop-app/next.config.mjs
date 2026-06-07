/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  transpilePackages: ["@omnia/ui"],
  trailingSlash: true,
};

export default nextConfig;
