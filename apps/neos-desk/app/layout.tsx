import type { Metadata, Viewport } from "next"
import { Archivo, JetBrains_Mono } from "next/font/google"

import "@/app/globals.css"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { AppSidebar } from "@/components/desk/app-sidebar"
import { SiteHeader } from "@/components/desk/site-header"

const display = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "800"],
  variable: "--font-display",
})

const data = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-data",
})

export const metadata: Metadata = {
  title: { default: "NEO · Trading Desk", template: "%s · NEO Trading Desk" },
  description:
    "The NEO trading desk — live depth, scanners and setup scoring, rebuilt on shadcn/ui.",
}

export const viewport: Viewport = {
  themeColor: "#0a0c0f",
  colorScheme: "dark",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Dark-only surface: the class is fixed so the shadcn primitives' `dark:`
    // variants resolve against the terminal palette.
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${display.variable} ${data.variable}`}>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "15.5rem",
              "--header-height": "3.25rem",
            } as React.CSSProperties
          }
        >
          <AppSidebar />
          <SidebarInset className="relative min-w-0 bg-background">
            {/* the shell's graph-paper wash, behind everything */}
            <div
              aria-hidden
              className="pointer-events-none fixed inset-0 z-0 grid-texture opacity-35"
            />
            <SiteHeader />
            <div className="relative z-10 flex flex-1 flex-col">{children}</div>
          </SidebarInset>
        </SidebarProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}
