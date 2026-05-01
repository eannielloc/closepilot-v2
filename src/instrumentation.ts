// Next.js instrumentation hook — runs once per server instance (cold start).
// Used to download the SQLite snapshot from Vercel Blob into /tmp before any
// request handler runs, so `getDb()` opens an up-to-date file.

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  if (process.env.VERCEL !== "1") return
  console.log("[instrumentation] starting DB prime...")
  try {
    // webpackIgnore prevents the edge bundle from trying to resolve fs/path
    // that better-sqlite3 transitively imports.
    const mod = await import(/* webpackIgnore: true */ "./lib/db")
    await mod.primeDb()
    console.log("[instrumentation] DB prime complete")
  } catch (err) {
    console.error("[instrumentation] DB prime failed:", err)
  }
}
