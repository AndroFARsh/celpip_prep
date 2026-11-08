import type { Metadata } from "next"
import Link from "next/link"
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"

import { ModeToggle } from "@/components/mode-toggle"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "CELPIP Practice",
  description: "Mock CELPIP Reading, Listening and Writing tests",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <header className="flex items-center justify-between border-b px-4 py-3">
            <Link href="/" className="font-semibold">
              CELPIP Practice
            </Link>
            <ModeToggle />
          </header>
          <main className="flex flex-1 flex-col">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
