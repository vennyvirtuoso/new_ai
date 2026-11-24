import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0f12" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Frontier Brief — Worldwide AI Research & Deep-Tech Intelligence",
    template: "%s",
  },
  description:
    "Curated real-time worldwide news for AI/ML researchers: frontier papers, major AI labs, quantum computing, semiconductors, energy, biotech, robotics, policy, and entrepreneurship.",
  keywords: [
    "AI research news",
    "machine learning papers",
    "quantum computing news",
    "OpenAI DeepMind NVIDIA news",
    "AI startups entrepreneurship",
    "semiconductor energy AI news",
  ],
  openGraph: {
    type: "website",
    siteName: "Frontier Brief",
    title: "Frontier Brief — Worldwide AI Research & Deep-Tech Intelligence",
    description:
      "Real-time worldwide briefing for AI/ML researchers across frontier papers, major labs, quantum physics, chips & energy, and entrepreneurship.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Frontier Brief — Worldwide AI Research & Deep-Tech Intelligence",
    description:
      "Real-time worldwide briefing for AI/ML researchers across frontier papers, major labs, quantum physics, chips & energy, and entrepreneurship.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Frontier Brief",
  },
  formatDetection: {
    telephone: false,
  },
};

const FOUC_SCRIPT = `try{var s=localStorage.getItem("color-scheme");if(s==="light"||s==="dark"){document.querySelector('meta[name="color-scheme"]').content=s;}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${newsreader.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="light dark" />
        <script dangerouslySetInnerHTML={{ __html: FOUC_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
