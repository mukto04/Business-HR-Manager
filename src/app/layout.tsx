import "./globals.css";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { DialogProvider } from "@/components/ui/dialog-provider";

import { masterPrisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const branding = await masterPrisma.landingPageContent.findUnique({
      where: { section: "BRANDING" }
    });
    
    const content = branding?.content as any || {};
    
    return {
      title: content.siteTitle || "AppDevs HR Dashboard",
      description: content.siteDescription || "Modern HR Management Dashboard built with Next.js, Tailwind CSS, TypeScript and Prisma.",
      icons: {
        icon: content.favicon || "/favicon.png",
      },
    };
  } catch (e) {
    return {
      title: "AppDevs HR Dashboard",
      description: "Modern HR Management Dashboard",
      icons: { icon: "/favicon.png" }
    };
  }
}

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
