import Link from "next/link"
import { Zap } from "lucide-react"

export const metadata = {
  title: "Terms of Service — ClosePilot",
  description: "ClosePilot Terms of Service",
}

export default function TermsPage() {
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
        <h1 className="text-2xl font-bold mb-1">Terms of Service</h1>
        <p className="text-xs text-muted-foreground">Last updated: May 1, 2026</p>

        <section className="space-y-4 text-sm leading-relaxed mt-6">
          <p>
            By using ClosePilot ("the Service"), you agree to these terms. If you don't agree, don't use the Service.
          </p>

          <h2 className="text-lg font-semibold pt-4">1. What ClosePilot is</h2>
          <p>
            ClosePilot is a software tool that helps real estate agents manage purchase-and-sale transactions. It parses contracts, generates timelines, sends reminders, and lets agents share progress with their clients and counterparties.
          </p>
          <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
            <strong>ClosePilot is not a law firm and does not provide legal, tax, or financial advice.</strong> AI-generated contract summaries and clause flags are informational only — always confirm with a licensed attorney and your broker before acting on them.
          </p>

          <h2 className="text-lg font-semibold pt-4">2. Your account</h2>
          <p>
            You must provide accurate information when creating an account and keep your credentials secure. You're responsible for everything that happens under your account.
          </p>

          <h2 className="text-lg font-semibold pt-4">3. Pricing</h2>
          <p>
            Beta access is currently offered free of charge. Production pricing is $99 per closed transaction. Pricing is subject to change with reasonable notice.
          </p>

          <h2 className="text-lg font-semibold pt-4">4. Your data</h2>
          <p>
            You retain ownership of all transaction data, contracts, and documents you upload. You grant ClosePilot a limited license to process this data solely to provide the Service. We won't sell your data and won't use it to train third-party AI models without your consent.
          </p>

          <h2 className="text-lg font-semibold pt-4">5. Acceptable use</h2>
          <p>Don't use the Service to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>upload documents you don't have rights to share;</li>
            <li>impersonate another agent, broker, or client;</li>
            <li>circumvent fee or rate limits;</li>
            <li>scrape, reverse-engineer, or resell the Service;</li>
            <li>do anything illegal under federal, state, or local law (including fair-housing violations).</li>
          </ul>

          <h2 className="text-lg font-semibold pt-4">6. Termination</h2>
          <p>
            We may suspend or terminate accounts that violate these terms. You may cancel anytime by contacting support.
          </p>

          <h2 className="text-lg font-semibold pt-4">7. Disclaimer & liability</h2>
          <p>
            The Service is provided "as is" without warranties of any kind. ClosePilot's maximum aggregate liability for any claim is limited to the fees you've paid in the 12 months prior to the claim, or $100, whichever is greater.
          </p>

          <h2 className="text-lg font-semibold pt-4">8. Changes to these terms</h2>
          <p>
            We may update these terms; material changes will be announced by email or in-app at least 14 days before taking effect.
          </p>

          <h2 className="text-lg font-semibold pt-4">9. Contact</h2>
          <p>
            Questions? Email <a className="text-primary underline" href="mailto:hello@closepilot.ai">hello@closepilot.ai</a>.
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
