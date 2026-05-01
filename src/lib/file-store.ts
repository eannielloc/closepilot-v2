// Unified file storage: local FS in dev, Vercel Blob in prod.
// `file_path` in the documents table can be either a relative filename
// (legacy local-disk uploads) or a fully-qualified Blob URL.

import fs from "fs"
import path from "path"
import os from "os"
import { v4 as uuid } from "uuid"
import { isVercel } from "./db-blob"

export function isBlobUrl(filePath: string): boolean {
  return /^https?:\/\//.test(filePath)
}

export function localPathFor(filePath: string): string | null {
  if (isBlobUrl(filePath)) return null
  const candidate = path.join(process.cwd(), "uploads", filePath)
  return fs.existsSync(candidate) ? candidate : null
}

// Returns an absolute filesystem path that the caller can read from.
// For Blob URLs, downloads to a temp file the caller is responsible for cleaning up.
export async function materialize(filePath: string): Promise<{ path: string; cleanup?: () => void }> {
  if (!isBlobUrl(filePath)) {
    const local = localPathFor(filePath)
    if (!local) throw new Error(`Local file not found: ${filePath}`)
    return { path: local }
  }
  const res = await fetch(filePath)
  if (!res.ok) throw new Error(`Failed to fetch blob: HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const tmp = path.join(os.tmpdir(), `cp-doc-${uuid().slice(0, 8)}${path.extname(new URL(filePath).pathname) || ".pdf"}`)
  await fs.promises.writeFile(tmp, buf)
  return { path: tmp, cleanup: () => fs.promises.unlink(tmp).catch(() => {}) }
}

// For client-facing GET /api/documents/[id]/file — returns a redirect URL or local path.
export async function streamFile(filePath: string): Promise<{ redirect: string } | { localPath: string }> {
  if (isBlobUrl(filePath)) return { redirect: filePath }
  const local = localPathFor(filePath)
  if (!local) throw new Error(`File not found: ${filePath}`)
  return { localPath: local }
}

export function isProdStorage(): boolean {
  return isVercel()
}
