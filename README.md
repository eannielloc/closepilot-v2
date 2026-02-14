# ClosePilot v2

AI-powered Transaction Coordinator for Real Estate Agents. Upload a contract PDF, and AI extracts every detail — parties, milestones, documents, contingencies, vendors — into a clean dashboard you can manage through closing.

## Features

- **AI Contract Parsing** — Upload a PDF, get a fully structured transaction in seconds
- **Transaction Dashboard** — Track all deals with progress bars, status filters, and closing countdowns
- **Milestone Tracking** — Click to complete milestones, organized by category (Contract, Inspection, Financing, Closing)
- **Document Management** — Track document status (Pending/Received/Missing) per transaction
- **Vendor Directory** — All inspectors, lenders, title companies across your deals
- **Deadline Reminders** — See overdue, this-week, and upcoming milestones at a glance
- **Party Management** — Buyers, sellers, agents, attorneys with contact info

## Tech Stack

- **Frontend:** React + TypeScript + Vite + TailwindCSS
- **Backend:** Node.js + Express
- **Database:** SQLite (via sql.js)
- **Auth:** JWT
- **AI:** Claude for contract parsing

## Quick Start

```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Start server (port 3004)
node server/index.js

# Start client (port 3005)
cd client && npm run dev

# Demo login
# Email: demo@closepilot.ai
# Password: demo123
```

## Project Structure

```
closepilot-v2/
├── server/
│   ├── index.js          # Express app entry
│   ├── db.js             # SQLite schema + seed data
│   ├── auth.js           # JWT middleware
│   └── routes/
│       ├── auth.js       # Login/Register
│       ├── transactions.js  # CRUD + milestones + docs
│       ├── parse.js      # PDF upload + AI parsing
│       └── reminders.js  # Deadline aggregation
├── client/
│   ├── src/
│   │   ├── pages/        # All route pages
│   │   ├── components/   # Shared components
│   │   └── lib/          # API client, auth context, utils
│   └── ...config files
└── package.json
```

## Roadmap

- [ ] Facebook Ads integration (auto-create listing ads)
- [ ] Email notifications for approaching deadlines
- [ ] Multi-agent support (team dashboard)
- [ ] Mobile app (React Native)
- [ ] Stripe billing ($99/mo subscription)

---

Built by [ClosePilot](https://closepilot.ai)
