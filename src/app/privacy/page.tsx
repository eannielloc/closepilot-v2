import Link from "next/link"
import { Zap } from "lucide-react"

export const metadata = {
  title: "Privacy Policy — ClosePilot",
  description: "ClosePilot Privacy Policy",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <Zap className="h-4 w-4" />
            </div>
            <span className="font-bold text-base">ClosePilot</span>
          </Link>
        </div>
      </header>

      <main className="container max-w-2xl py-10 prose prose-sm prose-slate">
        <h1 className="text-2xl font-bold mb-1">Privacy Policy</h1>
        <p className="text-xs text-muted-foreground">Last updated: May 1, 2026</p>

        <section className="space-y-4 text-sm leading-relaxed mt-6">
          <h2 className="text-lg font-semibold pt-4">What we collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account info:</strong> name, email, phone, brokerage, license number.</li>
            <li><strong>Transaction data:</strong> property addresses, party names and contacts, dates, prices, milestone status, notes, and uploaded documents.</li>
            <li><strong>Usage data:</strong> page views, features used, error logs (no third-party trackers).</li>
          </ul>

          <h2 className="text-lg font-semibold pt-4">How we use it</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To provide and improve the Service.</li>
            <li>To send transactional emails (deadline reminders, system notices).</li>
            <li>To debug and secure the platform.</li>
          </ul>
          <p>
            We <strong>do not</strong> sell your data, run programmatic ad targeting, or share contract contents with anyone outside your transaction's authorized parties.
          </p>

          <h2 className="text-lg font-semibold pt-4">AI processing</h2>
          <p>
            Some features (contract parsing, clause review) send document text to Anthropic's Claude API. Anthropic's data-handling policies apply; per their published policy, API inputs are not used to train models. We don't use any other third-party AI providers without your consent.
          </p>

          <h2 className="text-lg font-semibold pt-4">Storage & security</h2>
          <p>
            Data is stored on Vercel infrastructure (US East). Files are encrypted at rest. Passwords are hashed (bcrypt). Sessions use HttpOnly cookies.
          </p>

          <h2 className="text-lg font-semibold pt-4">Data sharing</h2>
          <p>
            Limited sharing only with vendors strictly required to run the Service: Vercel (hosting), Anthropic (AI processing for contract parsing/review when enabled), the email provider you configure (e.g., SMTP / Gmail), and Stripe (when payments are enabled).
          </p>

          <h2 className="text-lg font-semibold pt-4">Your rights</h2>
          <p>
            You can export, correct, or delete your data anytime. Email <a className="text-primary underline" href="mailto:privacy@closepilot.ai">privacy@closepilot.ai</a> and we'll respond within 30 days. Account deletion removes all associated data within 90 days (excluding backups, which auto-expire).
          </p>

          <h2 className="text-lg font-semibold pt-4">Cookies</h2>
          <p>
            We use one cookie — a session cookie — required for authentication. We don't use third-party analytics or advertising cookies.
          </p>

          <h2 className="text-lg font-semibold pt-4">Children</h2>
          <p>
            ClosePilot is not directed to anyone under 18 and does not knowingly collect data from children.
          </p>

          <h2 className="text-lg font-semibold pt-4">Changes</h2>
          <p>
            We'll notify you in-app at least 14 days before any material change to this policy.
          </p>

          <h2 className="text-lg font-semibold pt-4">Contact</h2>
          <p>
            Privacy questions: <a className="text-primary underline" href="mailto:privacy@closepilot.ai">privacy@closepilot.ai</a>
          </p>
        </section>
      </main>

      <footer className="border-t mt-12 py-6">
        <div className="container text-center text-xs text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          {" • "}
          <Link href="/terms" className="hover:text-foreground">Terms</Link>
          {" • "}
          <Link href="/" className="hover:text-foreground">Home</Link>
        </div>
      </footer>
    </div>
  )
}
