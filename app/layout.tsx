import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Medical Record Extractor",
  description: "Local HIPAA-safe medical record extraction — powered by LiteParse",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen text-gray-900">{children}</body>
    </html>
  );
}
