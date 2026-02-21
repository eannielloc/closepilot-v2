# ClosePilot Email Notification System

## Overview
Complete email notification/reminder system with professional HTML templates, user preferences, and automated reminder checking.

## Components Built

### 1. Email Service (`src/lib/email.ts`)
- **Nodemailer SMTP** with env var config: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- Defaults to Gmail SMTP (smtp.gmail.com:587)
- **Graceful degradation**: logs warning if SMTP not configured, never crashes
- 4 professional HTML email templates with inline CSS, mobile responsive
- ClosePilot branding, action buttons, footer with settings link

### 2. Database Schema (updated `src/lib/db.ts`)
- **`notification_preferences`** table: user_id, deadline_reminders, overdue_alerts, weekly_digest, reminder_days_before (default 3)
- **`sent_reminders`** table: tracks sent reminders per milestone/user/type/day to prevent duplicates

### 3. API Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/settings/notifications` | GET/PUT | User notification preferences |
| `/api/reminders/check` | GET | Scan milestones, send deadline/overdue reminders |
| `/api/reminders/send` | POST | Send templated or raw emails |
| `/api/reminders/digest` | GET | Send weekly digest to all opted-in users |

### 4. Settings Page (`src/app/(app)/settings/page.tsx`)
- Loads real user data from `/api/auth/me`
- Toggle switches for: deadline reminders, overdue alerts, weekly digest
- Dropdown for reminder timing (1-7 days before)
- Displays email address notifications go to
- Save button with loading/success states

### 5. Email Templates
- **deadline_reminder**: Color-coded urgency (🔴/🟡/🔵), milestone details, action button
- **overdue_alert**: Red alert styling, days overdue count
- **milestone_completed**: Green success styling
- **weekly_digest**: Stats cards (active count, total volume), sections for overdue/upcoming/completed

## To Activate
Add these environment variables (Railway or `.env.local`):
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=ClosePilot <your-email@gmail.com>
```

For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833) (not your regular password).

## Automation
Call these endpoints on a schedule (e.g., Railway cron, external cron service):
- **Daily**: `GET /api/reminders/check` — sends deadline + overdue reminders
- **Weekly**: `GET /api/reminders/digest` — sends weekly summary digest

Duplicate prevention is built in — safe to call multiple times per day.
