import { NextResponse } from "next/server"
import { verifyLogin, createSession } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const user = await verifyLogin(email, password)
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    await createSession(user.id)

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } })
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
