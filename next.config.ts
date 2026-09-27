import type { NextConfig } from "next";

const repository = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const onGitHubPages = process.env.GITHUB_ACTIONS === "true" && Boolean(repository);

const config: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: onGitHubPages ? `/${repository}` : "",
  assetPrefix: onGitHubPages ? `/${repository}/` : "",
};

export default config;
