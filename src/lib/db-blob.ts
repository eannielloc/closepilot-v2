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
let _scheduled: NodeJS.Timeout | null = null
let _uploadInFlight: Promise<void> | null = null

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
  if (fs.existsSync(dbPath)) {
    console.log("[db-blob] /tmp DB already present; skipping download.")
    return
  }

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
    const res = await fetch(latest.url, { cache: "no-store" })
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
      cacheControlMaxAge: 0, // never cache; always re-fetch latest
    })
    console.log(`[db-blob] Uploaded ${buf.length} bytes`)
  } catch (err) {
    console.error("[db-blob] upload failed:", err)
  }
}

// Schedule an upload after writes. Coalesces rapid bursts into a single
// upload via a 100ms tail-window. Returns the in-flight upload promise so
// callers (or waitUntil) can keep the function alive until upload completes.
export function scheduleUpload(): Promise<void> {
  if (!isVercel()) return Promise.resolve()

  // If an upload is currently running, just chain — that upload will pick
  // up the latest /tmp content via the next call once it completes.
  if (!_uploadInFlight) {
    if (_scheduled) clearTimeout(_scheduled)
    _scheduled = setTimeout(() => {
      _scheduled = null
      _uploadInFlight = doUpload().finally(() => {
        _uploadInFlight = null
      })
    }, 100)
  }

  // Build a single promise that resolves once the upload that follows completes.
  const promise = new Promise<void>((resolve) => {
    const tick = () => {
      if (_uploadInFlight) {
        _uploadInFlight.then(resolve, resolve)
      } else if (_scheduled) {
        // Wait for the timer to fire and create _uploadInFlight, then chain.
        setTimeout(tick, 50)
      } else {
        resolve()
      }
    }
    tick()
  })

  try {
    // Lazy require to avoid bundling for non-Vercel environments.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { waitUntil } = require("@vercel/functions") as typeof import("@vercel/functions")
    waitUntil(promise)
  } catch {
    // not on Vercel; ignore.
  }
  return promise
}

// Force an immediate flush. No-op outside Vercel.
export async function flushUploads(): Promise<void> {
  if (!isVercel()) return
  if (_scheduled) {
    clearTimeout(_scheduled)
    _scheduled = null
    _uploadInFlight = doUpload().finally(() => {
      _uploadInFlight = null
    })
  }
  if (_uploadInFlight) await _uploadInFlight
}
