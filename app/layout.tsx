import type { Metadata, Viewport } from "next";
import { Poppins, Montserrat } from "next/font/google";
import { ToastProvider } from "@/components/providers/ToastProvider";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Finlo - Personal Finance Planning",
  description: "Know how much you can safely spend until your next income arrives",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/finlo-brand-mark.svg",
    apple: "/finlo-brand-mark.svg",
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
    { media: "(prefers-color-scheme: light)", color: "#FEFBFE" },
    { media: "(prefers-color-scheme: dark)", color: "#FEFBFE" },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning className={`${poppins.variable} ${montserrat.variable}`}>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <ToastProvider>
          <div id="__next">{children}</div>
        </ToastProvider>
      </body>
    </html>
  );
}
