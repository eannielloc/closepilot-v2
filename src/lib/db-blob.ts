// SQLite ↔ Vercel Blob sync layer.
// On Vercel, the SQLite file lives in /tmp (ephemeral). This module
// downloads the latest snapshot from Blob on cold start, and uploads
// after each write. Acceptable for low-concurrency early launch; will
// migrate to managed Postgres when traffic warrants.

import fs from "fs"
import path from "path"

const BLOB_FILENAME = "closepilot-db/closepilot.db"
const TMP_DB_PATH = "/tmp/closepilot.db"

let _downloadPromise: Promise<void> | null = null
let _uploadTimer: ReturnType<typeof setTimeout> | null = null
let _uploadInFlight: Promise<void> | null = null
let _pendingUpload = false

export function isVercel(): boolean {
  return process.env.VERCEL === "1"
}

export function getDbPath(): string {
  if (process.env.DATABASE_PATH) return process.env.DATABASE_PATH
  if (isVercel()) return TMP_DB_PATH
  return path.join(process.cwd(), "closepilot.db")
}

async function downloadFromBlob(): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return
  const dbPath = getDbPath()
  if (fs.existsSync(dbPath)) return // already present in /tmp

  try {
    const { list } = await import("@vercel/blob")
    const { blobs } = await list({
      prefix: BLOB_FILENAME,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })
    const latest = blobs.find(b => b.pathname === BLOB_FILENAME)
    if (!latest) {
      console.log("[db-blob] No remote snapshot yet; starting fresh.")
      return
    }
    const res = await fetch(latest.url)
    if (!res.ok) throw new Error(`Failed to download: HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
    fs.writeFileSync(dbPath, buf)
    console.log(`[db-blob] Downloaded ${buf.length} bytes to ${dbPath}`)
  } catch (err) {
    console.error("[db-blob] download failed:", err)
  }
}

export async function ensureDownloaded(): Promise<void> {
  if (!isVercel()) return
  if (!_downloadPromise) {
    _downloadPromise = downloadFromBlob()
  }
  return _downloadPromise
}

async function doUpload(): Promise<void> {
  if (!isVercel() || !process.env.BLOB_READ_WRITE_TOKEN) return
  const dbPath = getDbPath()
  if (!fs.existsSync(dbPath)) return

  try {
    const { put } = await import("@vercel/blob")
    const buf = fs.readFileSync(dbPath)
    await put(BLOB_FILENAME, buf, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: "application/octet-stream",
    })
    console.log(`[db-blob] Uploaded ${buf.length} bytes`)
  } catch (err) {
    console.error("[db-blob] upload failed:", err)
  }
}

// Debounced upload: many writes in quick succession produce one upload.
// Returns a promise that resolves when the next upload completes.
// Wraps in waitUntil so Vercel keeps the function alive until upload finishes.
export function scheduleUpload(): Promise<void> {
  if (!isVercel()) return Promise.resolve()
  _pendingUpload = true
  const promise = new Promise<void>((resolve) => {
    if (_uploadTimer) clearTimeout(_uploadTimer)
    _uploadTimer = setTimeout(async () => {
      _uploadTimer = null
      while (_pendingUpload) {
        _pendingUpload = false
        _uploadInFlight = doUpload()
        await _uploadInFlight
      }
      resolve()
    }, 250)
  })

  // Tell Vercel to keep the function alive until upload completes.
  try {
    // Lazy import to avoid bundling for non-Vercel environments.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { waitUntil } = require("@vercel/functions") as typeof import("@vercel/functions")
    waitUntil(promise)
  } catch {
    // waitUntil not available; fall back to fire-and-forget (best-effort).
  }
  return promise
}

// Force an immediate flush. Call at end of API requests that did writes.
export async function flushUploads(): Promise<void> {
  if (!isVercel()) return
  if (_uploadTimer) {
    clearTimeout(_uploadTimer)
    _uploadTimer = null
  }
  if (_pendingUpload) {
    _pendingUpload = false
    _uploadInFlight = doUpload()
  }
  if (_uploadInFlight) await _uploadInFlight
}
