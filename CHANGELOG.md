# Changelog

## 2026-02-20 — Elite Upgrade: Pipeline, Tabs, Client Portal, Polish

### Enhanced Dashboard
- **Kanban Pipeline View**: Toggle between card grid and deal pipeline (New → Under Contract → Attorney Review → Inspection → Clear to Close → Closed)
- **Quick Actions**: "Add Transaction", "Upload Document", "Send Reminder" buttons at top
- **Activity Feed**: Recent activity across all deals with icons and timestamps
- **Loading Skeletons**: Full skeleton UI while dashboard loads
- **View Toggle**: Card/Pipeline switch with smooth transitions

### Transaction Detail — Complete Rebuild with Tabs
- **Tabbed Interface**: Timeline, Documents, Tasks, Notes — organized and clean
- **Documents Tab**: Full multi-document management with type detection (Purchase Agreement, Addendum, Lead Paint, Inspection, etc.), status indicators, drag handles, inline actions
- **Task Checklist**: Pre-populated checklist (attorney review, inspection, appraisal, title search, insurance, closing tasks) with categories, progress bar, and custom task creation
- **Notes Section**: Add timestamped notes to track conversations, attorney communications, inspection details
- **Progress Bar**: Transaction-level progress indicator with gradient
- **Share Button**: Copy client portal link to clipboard

### Client Portal (NEW)
- `/portal/[id]` — Read-only view for buyers/sellers
- Shows: property details, purchase price, closing date, countdown
- Progress ring visualization
- Full timeline with completed/pending/overdue indicators
- Document list with status
- Clean, minimal design — no login required
- Branded footer

### Settings — Full Rebuild with Tabs
- **Profile Tab**: Avatar with initials, gradient background, camera upload button, bio field, license number, brokerage
- **Notifications Tab**: Toggle switches with emoji labels, reminder timing selector
- **Templates Tab**: Timeline template management (CT Standard, Cash, FHA) with edit/duplicate/create

### New Components
- `PipelineView` — Kanban-style deal pipeline with stage colors and mini progress bars
- `ActivityFeed` — Recent activity with smart icons and relative timestamps
- `QuickActions` — Colored action buttons
- `DocumentList` — Full document management with type tags, status icons, drag handles
- `NotesSection` — Timestamped notes with author avatars
- `TaskChecklist` — Categorized checklist with progress and custom tasks
- `Skeleton` — Loading skeleton component
- `Tabs` — Radix UI tabs component

### Navigation
- Mobile responsive hamburger menu with slide-in overlay
- Smooth open/close animation
- Auto-close on navigation

### Polish & Elite Feel
- Page-level fade-in animations
- Loading skeletons on dashboard and transaction detail
- Empty states with helpful CTAs
- Custom scrollbar styling
- Card hover effects
- Consistent rounded corners (xl for cards, lg for inputs)
- Progress gradients (blue → emerald)
- Better mobile responsive layout throughout

### Technical
- Build passes clean (`next build` exits 0)
- No new dependencies — uses existing Radix UI, Tailwind, shadcn/ui
- All pages server-render correctly
- 13 static + dynamic routes generated

---

## 2026-02-16 — Major UI Polish & Upgrade

### Landing Page (complete rewrite)
- Premium SaaS-quality hero with gradient orbs, grid background, and animated text
- Anchor navigation (Features, How It Works, Pricing, FAQ)
- "How it works" section with 3-step flow (Upload → Timeline → Autopilot)
- 6-feature grid with icons and descriptions
- Side-by-side pricing comparison: ClosePilot $99 vs Human TC $350-500
- Savings callout badge ($2,500-4,000 on 10 deals)
- Testimonials with avatars and real-looking cards
- "Built by a licensed agent" credibility section
- 7-question FAQ with accordion (native `<details>`)
- Full footer with product/support/legal columns
- Trust strip (SmartMLS, CT Standard Forms, Dotloop, DocuSign, SkySlope)

### Dashboard
- Redesigned stat cards with trend indicators
- Urgent deadlines card with amber styling
- Empty state with CTA for new users
- Volume summary in section header
- Personalized welcome message

### Navigation
- Logo in rounded square badge
- Notification bell with red dot indicator
- User avatar initials (CE)
- Backdrop blur effect

### Components
- **TransactionCard**: Added progress bar, milestone counter, hover effects, chevron indicator
- **UploadZone**: Corner decorations on drag, 3-phase loading indicator, feature pills
- **PartyList**: Colored avatar initials per role, clickable email/phone links, party count
- **DashboardStats**: Trend text, better spacing, hover shadows

### General
- Enhanced globals.css: grid background pattern, gradient animation, float animation, radial mask
- Better meta tags: OpenGraph, Twitter cards, keywords
- Smooth scroll enabled
- Antialiased text rendering

### Technical
- All changes use existing dependencies (no new packages)
- Build passes clean (`next build` exits 0)
- 9 static + dynamic pages generated successfully
