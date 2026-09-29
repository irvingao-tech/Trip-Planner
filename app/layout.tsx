import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "旅日手帖 · Japan Trip Planner",
  description: "为手机、iPad 和桌面设计的日本旅行计划工具",
  applicationName: "旅日手帖",
  manifest: "manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "旅日手帖" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f3ee",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
