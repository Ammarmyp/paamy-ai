import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function requireUserId(): Promise<
  { userId: string; error?: undefined } | { userId?: undefined; error: NextResponse }
> {
  const { isAuthenticated, userId } = await auth()

  if (!isAuthenticated || !userId) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  return { userId }
}
