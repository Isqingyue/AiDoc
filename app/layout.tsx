import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "知问 · AI 智能用户手册",
  description: "基于企业内网手册的可信智能问答与知识管理平台",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
