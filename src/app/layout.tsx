import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "WhereDaMoney — Know where every rupee goes",
    template: "%s · WhereDaMoney",
  },
  description:
    "Track income and expenses, see where your money went, and understand what changed each month.",
  applicationName: "WhereDaMoney",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased font-sans", inter.variable, geistMono.variable)}
    >
      <body className="min-h-full bg-background font-sans text-foreground selection:bg-primary selection:text-primary-foreground">
        <ToastProvider position="bottom-right">{children}</ToastProvider>
      </body>
    </html>
  );
}
