import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Market Intelligence Agent",
  description: "Multi-agent AI market analysis — Bull vs Bear vs Macro",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
