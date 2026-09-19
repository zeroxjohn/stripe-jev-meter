import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Acme Support AI",
  description:
    "Semantic billing demo. Silence after an answer is not billed as a full resolution.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
