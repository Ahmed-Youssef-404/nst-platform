import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Manrope, Space_Grotesk } from "next/font/google";
import "./styles.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { RouteProgressBar } from "@/components/route-progress-bar";
import { Toaster } from "@/components/ui/toast";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

// Display face for headings — geometric and a little technical, distinct
// from Inter's body-text neutrality. Used sparingly (h1/h2 + a few labels).
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

// Landing-page headline face. Pairs with Space Grotesk (technical labels,
// numbers, node captions): Manrope carries the voice, Space Grotesk the
// "instrument panel" details.
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NST Platform — Northern Stars Team",
  description:
    "Build the mindset of a programmer. Structured roadmaps, practical challenges, and a supportive community to help you grow step by step.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable, spaceGrotesk.variable, manrope.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            <RouteProgressBar />
          </Suspense>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}