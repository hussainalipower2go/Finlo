import type { Metadata } from "next";
import { ToastProvider } from "@/components/providers/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finlo - Personal Finance Planning",
  description: "Know how much you can safely spend until your next income arrives",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
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
