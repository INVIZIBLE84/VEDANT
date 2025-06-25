
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"; // SidebarInset needs SidebarProvider
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/layout/header";
import { AppSidebar } from "@/components/layout/sidebar";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "S.P.A.R.K.",
  description: "Strategic Platform for Analytics, Reports & Knowledgeflow",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SidebarProvider> {/* SidebarProvider wraps AppSidebar and SidebarInset */}
          <AppSidebar />
          <SidebarInset>
            <Header />
            <main className="flex-1 p-4 md:p-6">{children}</main>
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
