import Database from "better-sqlite3"
import path from "path"
import { v4 as uuid } from "uuid"
import bcrypt from "bcryptjs"

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "closepilot.db")

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH)
    _db.pragma("journal_mode = WAL")
    _db.pragma("foreign_keys = ON")
    initSchema(_db)
  }
  return _db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      license_number TEXT,
      brokerage TEXT,
      password_hash TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      property_address TEXT NOT NULL,
      status TEXT DEFAULT 'new',
      buyer_name TEXT,
      seller_name TEXT,
      purchase_price REAL,
      effective_date TEXT,
      closing_date TEXT,
      contract_type TEXT DEFAULT 'CT SmartMLS Standard Form',
      agent_id TEXT NOT NULL,
      notes TEXT,
      parsed_data TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (agent_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      reminders_sent INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS parties (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      company TEXT,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      name TEXT NOT NULL,
      file_path TEXT,
      uploaded_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notification_preferences (
      user_id TEXT PRIMARY KEY,
      deadline_reminders INTEGER DEFAULT 1,
      overdue_alerts INTEGER DEFAULT 1,
      weekly_digest INTEGER DEFAULT 1,
      reminder_days_before INTEGER DEFAULT 3,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sent_reminders (
      id TEXT PRIMARY KEY,
      milestone_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      sent_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS document_fields (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      page_number INTEGER NOT NULL,
      field_type TEXT NOT NULL,
      assignee_role TEXT NOT NULL,
      x REAL NOT NULL,
      y REAL NOT NULL,
      width REAL NOT NULL,
      height REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS signing_sessions (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      signer_role TEXT NOT NULL,
      signer_name TEXT,
      signer_email TEXT,
      status TEXT DEFAULT 'pending',
      token TEXT UNIQUE NOT NULL,
      signed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS field_values (
      id TEXT PRIMARY KEY,
      field_id TEXT NOT NULL,
      signing_session_id TEXT NOT NULL,
      value TEXT,
      filled_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (field_id) REFERENCES document_fields(id) ON DELETE CASCADE,
      FOREIGN KEY (signing_session_id) REFERENCES signing_sessions(id) ON DELETE CASCADE
    );
  `)

  // Add status column to documents if missing
  const docCols = db.prepare("PRAGMA table_info(documents)").all() as any[]
  if (!docCols.find((c: any) => c.name === "status")) {
    db.exec("ALTER TABLE documents ADD COLUMN status TEXT DEFAULT 'draft'")
  }

  // Add parsed_data column to transactions if missing
  const txCols = db.prepare("PRAGMA table_info(transactions)").all() as any[]
  if (!txCols.find((c: any) => c.name === "parsed_data")) {
    db.exec("ALTER TABLE transactions ADD COLUMN parsed_data TEXT")
  }

  // Add password_hash column if missing (migration for existing DBs)
  const cols = db.prepare("PRAGMA table_info(users)").all() as any[]
  if (!cols.find((c: any) => c.name === "password_hash")) {
    db.exec("ALTER TABLE users ADD COLUMN password_hash TEXT")
  }

  // Seed default user if none exists
  const userCount = db.prepare("SELECT COUNT(*) as c FROM users").get() as any
  if (userCount.c === 0) {
    const hash = bcrypt.hashSync("demo123", 10)
    db.prepare(`INSERT INTO users (id, email, name, phone, license_number, brokerage, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run("user_001", "chris@closepilot.ai", "Demo Agent", "(555) 000-0000", "CT-REB.0000xxx", "Premier Realty Group", hash)
    db.prepare(`INSERT OR IGNORE INTO notification_preferences (user_id) VALUES (?)`).run("user_001")
  } else {
    // Ensure seed user has a password
    const seedUser = db.prepare("SELECT password_hash FROM users WHERE id = ?").get("user_001") as any
    if (seedUser && !seedUser.password_hash) {
      const hash = bcrypt.hashSync("demo123", 10)
      db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, "user_001")
    }
  }
}

// ─── CT Real Estate Timeline Generator ───────────────────────────────
// Auto-generates milestones based on CT SmartMLS Standard Form timelines

export interface NewTransaction {
  propertyAddress: string
  buyerName: string
  sellerName: string
  purchasePrice: number
  effectiveDate: string  // YYYY-MM-DD
  closingDate: string    // YYYY-MM-DD
  contractType?: string
  initialDeposit?: number
  additionalDeposit?: number
  financingType?: "conventional" | "fha" | "va" | "cash"
  agentId?: string
}

function addDays(date: string, days: number): string {
  const d = new Date(date + "T12:00:00Z")
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split("T")[0]
}

function minDate(a: string, b: string): string {
  return a < b ? a : b
}

export function generateCTMilestones(tx: NewTransaction): Array<{
  name: string; type: string; dueDate: string; status: string
}> {
  const eff = tx.effectiveDate
  const close = tx.closingDate
  const isCash = tx.financingType === "cash"
  const deposit1 = tx.initialDeposit || Math.round(tx.purchasePrice * 0.01)
  const deposit2 = tx.additionalDeposit || Math.round(tx.purchasePrice * 0.03)

  const milestones = [
    { name: `Contract Executed / Initial Deposit ($${deposit1.toLocaleString()})`, type: "deposit", dueDate: eff, status: "pending" },
    { name: "Attorney Review Deadline", type: "attorney_review", dueDate: addDays(eff, 7), status: "pending" },
    { name: "Inspection Completion Deadline", type: "inspection", dueDate: addDays(eff, 11), status: "pending" },
    { name: "Inspection Objection Deadline", type: "inspection", dueDate: addDays(eff, 14), status: "pending" },
    { name: `Additional Deposit Due ($${deposit2.toLocaleString()})`, type: "deposit", dueDate: addDays(eff, 14), status: "pending" },
    { name: "Radon Test Results Due", type: "inspection", dueDate: addDays(eff, 14), status: "pending" },
    { name: "Title Search Completion", type: "title", dueDate: addDays(eff, 25), status: "pending" },
    { name: "Title Objection Deadline", type: "title", dueDate: addDays(eff, 28), status: "pending" },
  ]

  if (!isCash) {
    milestones.push(
      { name: "Mortgage Application Deadline", type: "loan_approval", dueDate: addDays(eff, 5), status: "pending" },
      { name: "Appraisal Ordered (target)", type: "loan_approval", dueDate: addDays(eff, 14), status: "pending" },
      { name: "Mortgage Commitment Deadline", type: "loan_approval", dueDate: minDate(addDays(eff, 35), addDays(close, -14)), status: "pending" },
    )
  }

  milestones.push(
    { name: "Final Walkthrough", type: "other", dueDate: addDays(close, -1), status: "pending" },
    { name: "CLOSING DATE", type: "closing", dueDate: close, status: "pending" },
  )

  // Sort by date
  milestones.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  return milestones
}

// ─── Draft Transaction (Manual Flow) ─────────────────────────────────

export function createDraftTransaction(propertyAddress: string, agentId?: string) {
  const db = getDb()
  const txId = `tx_${uuid().slice(0, 8)}`
  const aid = agentId || "user_001"

  db.prepare(`
    INSERT INTO transactions (id, property_address, status, agent_id)
    VALUES (?, ?, 'draft', ?)
  `).run(txId, propertyAddress, aid)

  db.prepare(`INSERT INTO activity_log (id, transaction_id, action, details) VALUES (?, ?, ?, ?)`)
    .run(`al_${uuid().slice(0, 8)}`, txId, "transaction_created", `Draft transaction: ${propertyAddress}`)

  return getTransaction(txId)
}

export function populateTransactionFromParse(txId: string, parsed: {
  buyerName?: string
  sellerName?: string
  purchasePrice?: number
  effectiveDate?: string
  closingDate?: string
  parsedData?: Record<string, unknown>
}) {
  const db = getDb()
  const sets: string[] = []
  const vals: unknown[] = []

  if (parsed.buyerName) { sets.push("buyer_name = ?"); vals.push(parsed.buyerName) }
  if (parsed.sellerName) { sets.push("seller_name = ?"); vals.push(parsed.sellerName) }
  if (parsed.purchasePrice) { sets.push("purchase_price = ?"); vals.push(parsed.purchasePrice) }
  if (parsed.effectiveDate) { sets.push("effective_date = ?"); vals.push(parsed.effectiveDate) }
  if (parsed.closingDate) { sets.push("closing_date = ?"); vals.push(parsed.closingDate) }
  if (parsed.parsedData) { sets.push("parsed_data = ?"); vals.push(JSON.stringify(parsed.parsedData)) }

  // Move from draft to active if we have enough data
  if (parsed.buyerName && parsed.sellerName && parsed.purchasePrice && parsed.closingDate) {
    sets.push("status = 'active'")
  }

  if (sets.length > 0) {
    sets.push("updated_at = datetime('now')")
    vals.push(txId)
    db.prepare(`UPDATE transactions SET ${sets.join(", ")} WHERE id = ?`).run(...vals)
  }

  // Generate milestones if we have dates
  if (parsed.effectiveDate && parsed.closingDate && parsed.purchasePrice) {
    const milestones = generateCTMilestones({
      propertyAddress: "",
      buyerName: parsed.buyerName || "TBD",
      sellerName: parsed.sellerName || "TBD",
      purchasePrice: parsed.purchasePrice,
      effectiveDate: parsed.effectiveDate,
      closingDate: parsed.closingDate,
    })
    const insertMs = db.prepare(`INSERT INTO milestones (id, transaction_id, name, type, due_date, status) VALUES (?, ?, ?, ?, ?, ?)`)
    for (const ms of milestones) {
      insertMs.run(`ms_${uuid().slice(0, 8)}`, txId, ms.name, ms.type, ms.dueDate, ms.status)
    }
  }

  db.prepare(`INSERT INTO activity_log (id, transaction_id, action, details) VALUES (?, ?, ?, ?)`)
    .run(`al_${uuid().slice(0, 8)}`, txId, "transaction_parsed", "AI parsed signed documents — data populated")

  return getTransaction(txId)
}

// ─── CRUD Operations ─────────────────────────────────────────────────

export function createTransaction(data: NewTransaction) {
  const db = getDb()
  const txId = `tx_${uuid().slice(0, 8)}`
  const agentId = data.agentId || "user_001"

  db.prepare(`
    INSERT INTO transactions (id, property_address, status, buyer_name, seller_name, purchase_price, effective_date, closing_date, contract_type, agent_id)
    VALUES (?, ?, 'active', ?, ?, ?, ?, ?, ?, ?)
  `).run(txId, data.propertyAddress, data.buyerName, data.sellerName, data.purchasePrice, data.effectiveDate, data.closingDate, data.contractType || "CT SmartMLS Standard Form", agentId)

  // Auto-generate milestones
  const milestones = generateCTMilestones(data)
  const insertMs = db.prepare(`INSERT INTO milestones (id, transaction_id, name, type, due_date, status) VALUES (?, ?, ?, ?, ?, ?)`)
  for (const ms of milestones) {
    insertMs.run(`ms_${uuid().slice(0, 8)}`, txId, ms.name, ms.type, ms.dueDate, ms.status)
  }

  // Log activity
  db.prepare(`INSERT INTO activity_log (id, transaction_id, action, details) VALUES (?, ?, ?, ?)`)
    .run(`al_${uuid().slice(0, 8)}`, txId, "transaction_created", `New transaction: ${data.propertyAddress}`)

  return getTransaction(txId)
}

export function getTransaction(id: string) {
  const db = getDb()
  const tx = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id) as any
  if (!tx) return null

  const milestones = db.prepare("SELECT * FROM milestones WHERE transaction_id = ? ORDER BY due_date").all(id)
  const parties = db.prepare("SELECT * FROM parties WHERE transaction_id = ?").all(id)
  const documents = db.prepare("SELECT * FROM documents WHERE transaction_id = ?").all(id)
  const activity = db.prepare("SELECT * FROM activity_log WHERE transaction_id = ? ORDER BY created_at DESC LIMIT 20").all(id)

  return { ...snakeToCamel(tx), milestones: milestones.map(snakeToCamel), parties: parties.map(snakeToCamel), documents: documents.map(snakeToCamel), activity: activity.map(snakeToCamel) }
}

export function listTransactions(agentId?: string) {
  const db = getDb()
  const txs = agentId
    ? db.prepare("SELECT * FROM transactions WHERE agent_id = ? ORDER BY created_at DESC").all(agentId)
    : db.prepare("SELECT * FROM transactions ORDER BY created_at DESC").all()

  return txs.map((tx: any) => {
    const milestones = db.prepare("SELECT * FROM milestones WHERE transaction_id = ? ORDER BY due_date").all(tx.id)
    const parties = db.prepare("SELECT * FROM parties WHERE transaction_id = ?").all(tx.id)
    return { ...snakeToCamel(tx), milestones: milestones.map(snakeToCamel), parties: parties.map(snakeToCamel) }
  })
}

export function updateTransaction(id: string, updates: Partial<Record<string, any>>) {
  const db = getDb()
  const allowed = ["status", "property_address", "buyer_name", "seller_name", "purchase_price", "closing_date", "notes"]
  const sets: string[] = []
  const vals: any[] = []
  for (const [k, v] of Object.entries(updates)) {
    const col = camelToSnake(k)
    if (allowed.includes(col)) {
      sets.push(`${col} = ?`)
      vals.push(v)
    }
  }
  if (sets.length === 0) return getTransaction(id)
  sets.push("updated_at = datetime('now')")
  vals.push(id)
  db.prepare(`UPDATE transactions SET ${sets.join(", ")} WHERE id = ?`).run(...vals)

  db.prepare(`INSERT INTO activity_log (id, transaction_id, action, details) VALUES (?, ?, ?, ?)`)
    .run(`al_${uuid().slice(0, 8)}`, id, "transaction_updated", `Updated: ${sets.join(", ")}`)

  return getTransaction(id)
}

export function deleteTransaction(id: string) {
  const db = getDb()
  db.prepare("DELETE FROM transactions WHERE id = ?").run(id)
  return { deleted: true }
}

export function updateMilestone(id: string, updates: { status?: string; notes?: string }) {
  const db = getDb()
  const ms = db.prepare("SELECT * FROM milestones WHERE id = ?").get(id) as any
  if (!ms) return null

  if (updates.status) {
    db.prepare("UPDATE milestones SET status = ? WHERE id = ?").run(updates.status, id)
  }
  if (updates.notes) {
    db.prepare("UPDATE milestones SET notes = ? WHERE id = ?").run(updates.notes, id)
  }

  db.prepare(`INSERT INTO activity_log (id, transaction_id, action, details) VALUES (?, ?, ?, ?)`)
    .run(`al_${uuid().slice(0, 8)}`, ms.transaction_id, "milestone_updated", `${ms.name} → ${updates.status || "updated"}`)

  return snakeToCamel(db.prepare("SELECT * FROM milestones WHERE id = ?").get(id))
}

export function addParty(txId: string, party: { role: string; name: string; email?: string; phone?: string; company?: string }) {
  const db = getDb()
  const id = `p_${uuid().slice(0, 8)}`
  db.prepare("INSERT INTO parties (id, transaction_id, role, name, email, phone, company) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(id, txId, party.role, party.name, party.email || null, party.phone || null, party.company || null)
  return snakeToCamel(db.prepare("SELECT * FROM parties WHERE id = ?").get(id))
}

export function getDashboardStats(agentId?: string) {
  const db = getDb()
  const where = agentId ? "WHERE agent_id = ?" : ""
  const params = agentId ? [agentId] : []

  const total = (db.prepare(`SELECT COUNT(*) as c FROM transactions ${where}`).get(...params) as any).c
  const active = (db.prepare(`SELECT COUNT(*) as c FROM transactions ${where.replace("WHERE", "WHERE status IN ('active','new') AND")}`).get(...params) as any).c
  const pendingClosing = (db.prepare(`SELECT COUNT(*) as c FROM transactions ${where.replace("WHERE", "WHERE status = 'pending_closing' AND")}`).get(...params) as any).c
  const closed = (db.prepare(`SELECT COUNT(*) as c FROM transactions ${where.replace("WHERE", "WHERE status = 'closed' AND")}`).get(...params) as any).c

  const totalVolume = (db.prepare(`SELECT COALESCE(SUM(purchase_price), 0) as v FROM transactions ${where}`).get(...params) as any).v

  // Upcoming deadlines (next 7 days)
  const upcomingDeadlines = db.prepare(`
    SELECT m.*, t.property_address FROM milestones m
    JOIN transactions t ON m.transaction_id = t.id
    WHERE m.status = 'pending'
      AND m.due_date BETWEEN date('now') AND date('now', '+7 days')
    ORDER BY m.due_date
    LIMIT 10
  `).all().map(snakeToCamel)

  // Overdue milestones
  const overdue = db.prepare(`
    SELECT m.*, t.property_address FROM milestones m
    JOIN transactions t ON m.transaction_id = t.id
    WHERE m.status = 'pending' AND m.due_date < date('now')
    ORDER BY m.due_date
  `).all().map(snakeToCamel)

  return { total, active, pendingClosing, closed, totalVolume, upcomingDeadlines, overdue }
}

// ─── Helpers ─────────────────────────────────────────────────────────

function snakeToCamel(obj: any): any {
  if (!obj || typeof obj !== "object") return obj
  const result: any = {}
  for (const [k, v] of Object.entries(obj)) {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    result[camel] = v
  }
  return result
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`)
}
