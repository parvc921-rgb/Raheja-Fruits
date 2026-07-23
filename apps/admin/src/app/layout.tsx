import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/use-auth";

export const metadata: Metadata = {
  title: "Raheja Fruits — Admin",
  description: "Operations dashboard for Raheja Fruits",
};

// Deliberately minimal: the sidebar nav + auth guard live in
// (protected)/layout.tsx, not here, so /login can render without a
// half-built dashboard chrome around it.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
