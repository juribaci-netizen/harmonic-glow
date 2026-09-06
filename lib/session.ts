import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { headers } from "next/headers"
import { eq } from "drizzle-orm"

const DEMO_USER = {
  id: "worktime-demo-user",
  name: "Marek Juráň",
  email: "marek@worktime.app",
  emailVerified: true,
  image: null,
} as const

/**
 * Worktime is currently a personal, single-user app, so it opens directly
 * without a login screen. We still keep Better Auth in the project for a
 * future multi-user version.
 */
export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) return session.user

  await db.insert(user).values(DEMO_USER).onConflictDoNothing({ target: user.id })
  return DEMO_USER
}

export async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) return session.user.id

  await db.insert(user).values(DEMO_USER).onConflictDoNothing({ target: user.id })
  return DEMO_USER.id
}
