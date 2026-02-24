# Changelog

## 2026-02-23 — Professional Document Editor Upgrade

### Feature 1: Rich PDF Form Filling
- **PDF form field detection** — Automatically detects AcroForm fields (text, checkbox, dropdown) in uploaded PDFs using pdf.js `getAnnotations()`
- **Interactive form fields** — Renders HTML inputs/checkboxes/selects directly over detected PDF form fields at exact positions
- **Inline typing** — Text fields are actual `<input>` elements with professional styling (font-serif, subtle borders, focus glow)
- **Upgraded placed fields** — Text fields are now immediately typeable, signatures show cursive preview, dates auto-fill on click, checkboxes toggle
- **Resize handles** — Selected fields show drag handles on corners/edges for resizing
- **Tab navigation** — Tab/Shift+Tab between fields in natural reading order (top-to-bottom, left-to-right)
- **Professional styling** — White bg when empty, subtle blue/green tint when filled, blue ring on focus, emerald indicator for auto-filled fields

### Feature 2: Auto-Populate Deal Data
- **Deal Data sidebar** — Collapsible right panel with 18 fields covering property, terms, buyer, seller, and agent info
- **Smart auto-fill** — Pattern-matching engine scans PDF form field names for common real estate patterns (buyer, seller, address, price, etc.)
- **Auto-fill stats** — Badge shows "Auto-filled X/Y fields" count
- **Auto-save** — Deal data auto-saves after 1.5s of inactivity, persists per transaction
- **API route** — `GET/POST /api/transactions/[id]/deal-data` for saving/loading deal data
- **DB migration** — `deal_data` TEXT column added to transactions table (auto-migrating)

### Other
- Fixed `next.config.js` for Next.js 16 compatibility (`serverExternalPackages` instead of deprecated `experimental.serverComponentsExternalPackages`)
