import type { Metadata } from "next";
import { Besley, Albert_Sans } from "next/font/google";
import "./globals.css";

const besley = Besley({
  variable: "--font-besley",
  subsets: ["latin"],
});

const albertSans = Albert_Sans({
  variable: "--font-albert-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ludhiana Burrito — Zomato Lite",
  description: "Reviews for Ludhiana Burrito, Indian, Sector 32.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${besley.variable} ${albertSans.variable} antialiased min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)]`}
      >
        {children}
      </body>
    </html>
  );
}
