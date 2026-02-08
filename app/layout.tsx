import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenFiler",
  description: "Modern open-source file management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
