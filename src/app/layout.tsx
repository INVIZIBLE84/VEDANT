import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Changed from GeistSans
import "./globals.css";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/layout/header";
import { AppSidebar } from "@/components/layout/sidebar";


const inter = Inter({ // Changed from GeistSans
  variable: "--font-sans", // Changed variable name
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "CampusConnect",
  description: "S.P.A.R.K. - System for Performance Analytics, Recognition & Kinetics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}> {/* Updated font variable */}
        <SidebarProvider>
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
