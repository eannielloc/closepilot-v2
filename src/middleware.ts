import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const protectedPaths = ["/dashboard", "/transactions", "/settings"]
const authPaths = ["/login", "/register"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get("closepilot_session")

  // Protect app routes — redirect to login if no session
  if (protectedPaths.some((p) => pathname.startsWith(p))) {
    if (!sessionCookie?.value) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  // Redirect logged-in users away from auth pages
  if (authPaths.some((p) => pathname.startsWith(p))) {
    if (sessionCookie?.value) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/transactions/:path*", "/settings/:path*", "/login", "/register"],
}
