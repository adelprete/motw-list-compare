import type { Metadata } from "next";
import { Geist_Mono, Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const graphik = Inter({
  variable: "--font-graphik",
  subsets: ["latin"],
});

const tiempos = Source_Serif_4({
  variable: "--font-tiempos",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MOTW Lists",
  description:
    "Compare Letterboxd MOTW watchlists and see which movies appear most often.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${graphik.variable} ${tiempos.variable} ${geistMono.variable} h-full bg-canvas antialiased`}
    >
      <body className="flex min-h-full flex-col bg-canvas text-ink-body">
        {children}
      </body>
    </html>
  );
}
