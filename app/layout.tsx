import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/providers/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finlo - Personal Finance Planning",
  description: "Know how much you can safely spend until your next income arrives",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/finlo-brand-mark.png",
    apple: "/finlo-brand-mark.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Finlo",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <ToastProvider>
          <div id="__next">{children}</div>
        </ToastProvider>
      </body>
    </html>
  );
}
