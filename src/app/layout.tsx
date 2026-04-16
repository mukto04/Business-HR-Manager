import "./globals.css";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { DialogProvider } from "@/components/ui/dialog-provider";

export const metadata: Metadata = {
  title: "AppDevs HR Dashboard",
  description: "Modern HR Management Dashboard built with Next.js, Tailwind CSS, TypeScript and Prisma."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <DialogProvider>
          <AppShell>{children}</AppShell>
        </DialogProvider>
      </body>
    </html>
  );
}
