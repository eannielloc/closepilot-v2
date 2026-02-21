import { getDb } from "./db"
import { v4 as uuid } from "uuid"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

const SESSION_COOKIE = "closepilot_session"
const SESSION_DAYS = 30

export async function createUser(data: {
  email: string
  password: string
  name: string
  phone?: string
  licenseNumber?: string
  brokerage?: string
}) {
  const db = getDb()
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(data.email)
  if (existing) {
    throw new Error("Email already registered")
  }

  const id = `user_${uuid().slice(0, 8)}`
  const passwordHash = bcrypt.hashSync(data.password, 10)

  db.prepare(
    `INSERT INTO users (id, email, name, password_hash, phone, license_number, brokerage) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    data.email.toLowerCase(),
    data.name,
    passwordHash,
    data.phone || null,
    data.licenseNumber || null,
    data.brokerage || null
  )

  return { id, email: data.email, name: data.name }
}

export async function verifyLogin(email: string, password: string) {
  const db = getDb()
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase()) as any
  if (!user) return null
  if (!user.password_hash || !bcrypt.compareSync(password, user.password_hash)) return null
  return { id: user.id, email: user.email, name: user.name }
}

export async function createSession(userId: string) {
  const db = getDb()
  const sessionId = uuid()
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString()

  db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(
    sessionId,
    userId,
    expiresAt
  )

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  })

  return sessionId
}

export async function getSession() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value
  if (!sessionId) return null

  const db = getDb()
  const session = db.prepare(
    "SELECT s.*, u.email, u.name FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ? AND s.expires_at > datetime('now')"
  ).get(sessionId) as any

  if (!session) return null
  return { userId: session.user_id, email: session.email, name: session.name }
}

export async function destroySession() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value
  if (sessionId) {
    const db = getDb()
    db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId)
    cookieStore.delete(SESSION_COOKIE)
  }
}
