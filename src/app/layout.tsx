import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ClosePilot — AI Transaction Coordinator | $99/deal",
  description: "Your AI-powered real estate transaction coordinator. Upload a contract, get a complete timeline with automated reminders. $99 vs $400 for a human TC.",
  keywords: ["transaction coordinator", "real estate", "AI", "contract management", "Connecticut", "closing"],
  openGraph: {
    title: "ClosePilot — AI Transaction Coordinator",
    description: "Upload a contract. Get a timeline. Never miss a deadline. $99/transaction.",
    type: "website",
    url: "https://closepilot.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClosePilot — AI Transaction Coordinator",
    description: "Upload a contract. Get a timeline. Never miss a deadline. $99/transaction.",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
