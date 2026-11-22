import type { Metadata, Viewport } from "next";
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
  metadataBase: new URL("https://nextleap-zomato-lite.vercel.app"),
  title: "Ludhiana Burrito — Zomato Lite",
  description: "Reviews for Ludhiana Burrito, Indian, Sector 32.",
  openGraph: {
    title: "Ludhiana Burrito — Zomato Lite",
    description: "Reviews for Ludhiana Burrito, Indian, Sector 32.",
    images: ["/images/ludhiana-burrito.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ludhiana Burrito — Zomato Lite",
    description: "Reviews for Ludhiana Burrito, Indian, Sector 32.",
    images: ["/images/ludhiana-burrito.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#f8f5ef",
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
