import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blokwriter - Mechanical Typewriter",
  description: "A beautiful mechanical typewriter experience with Web Audio API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
