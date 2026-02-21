import { NextResponse } from "next/server"
import { createUser, createSession } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, name, phone, licenseNumber, brokerage } = body

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const user = await createUser({ email, password, name, phone, licenseNumber, brokerage })
    await createSession(user.id)

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } })
  } catch (err: any) {
    if (err.message === "Email already registered") {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
