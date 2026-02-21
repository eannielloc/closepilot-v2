# ClosePilot — AI Transaction Coordinator

Your AI-powered real estate transaction coordinator. **$99 vs $400** for a human TC.

Upload a purchase agreement PDF → get a complete timeline with automated reminders, deadline tracking, and party coordination in 60 seconds.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** The app runs with mock data by default — no database required for development. All contract parsing, email sending, and auth are mocked.

## With Database (Optional)

To use the full Prisma + PostgreSQL setup:

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL
npm run db:push
npm run db:seed
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page — hero, how it works, testimonials |
| `/dashboard` | All active transactions with stats & deadlines |
| `/transactions/new` | Upload contract PDF, review AI-parsed data |
| `/transactions/[id]` | Transaction detail with timeline, parties, docs |
| `/transactions/[id]/timeline` | Full visual timeline with progress bar |
| `/settings` | Agent profile & notification preferences |

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/transactions` | List all transactions |
| `POST` | `/api/transactions` | Create new transaction |
| `GET` | `/api/transactions/[id]` | Get transaction detail |
| `POST` | `/api/transactions/[id]/parse` | Parse uploaded contract (mock) |
| `PATCH` | `/api/milestones/[id]` | Update milestone status |
| `POST` | `/api/reminders/send` | Trigger reminder email (mock) |

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Prisma + PostgreSQL (optional for dev)
- **Icons:** Lucide React

## What's Mocked

- **Contract parsing** — Returns realistic CT SmartMLS Standard Form data instead of calling Claude API
- **Email sending** — Logs to console instead of sending via Resend/SendGrid
- **Authentication** — Uses a hardcoded mock user
- **File storage** — No actual file upload/storage

## Project Structure

```
src/
├── app/
│   ├── (app)/           # Authenticated app pages
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   └── settings/
│   ├── api/             # API routes
│   └── page.tsx         # Landing page
├── components/
│   ├── ui/              # shadcn/ui primitives
│   ├── timeline-view.tsx
│   ├── transaction-card.tsx
│   ├── party-list.tsx
│   ├── upload-zone.tsx
│   ├── deadline-alert.tsx
│   └── dashboard-stats.tsx
└── lib/
    ├── db.ts            # Prisma client
    ├── mock-data.ts     # Sample transactions
    ├── mock-parser.ts   # Contract parsing mock
    └── utils.ts         # Helpers
```
