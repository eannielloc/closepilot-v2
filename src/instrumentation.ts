// Next.js instrumentation hook — runs once per server instance (cold start).
// Used to download the SQLite snapshot from Vercel Blob into /tmp before any
// request handler runs, so `getDb()` opens an up-to-date file.

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  if (process.env.VERCEL !== "1") return
  try {
    const { primeDb } = await import("./lib/db")
    await primeDb()
  } catch (err) {
    console.error("[instrumentation] DB prime failed:", err)
  }
}
