import type { NextConfig } from "next";

const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: process.env.NEXT_PUBLIC_APP_MODE === "demo" ? "export" : undefined,
  images: {
    unoptimized: process.env.NEXT_PUBLIC_APP_MODE === "demo",
  },
  basePath: isGitHubPages && repoName ? `/${repoName}` : "",
  assetPrefix: isGitHubPages && repoName ? `/${repoName}/` : "",
};

export default nextConfig;
