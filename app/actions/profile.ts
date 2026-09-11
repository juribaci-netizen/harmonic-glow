"use server"

import { db } from "@/lib/db"
import { profile } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getProfile() {
  const userId = await getUserId()
  const rows = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1)
  return rows[0] ?? null
}

export type ProfileInput = {
  fullName: string
  instrument: string
  section: string
  position: string
  phone: string
}

export async function saveProfile(input: ProfileInput) {
  const userId = await getUserId()
  const existing = await db.select({ id: profile.id }).from(profile).where(eq(profile.userId, userId)).limit(1)

  if (existing.length > 0) {
    await db
      .update(profile)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(profile.userId, userId))
  } else {
    await db.insert(profile).values({ userId, ...input })
  }

  revalidatePath("/profile")
  revalidatePath("/timesheet")
  revalidatePath("/")
  return { ok: true }
}

export async function saveEpcName(fullName: string) {
  if (typeof fullName !== 'string' || !fullName.trim() || fullName.trim().length > 150) {
    throw new Error('Zadajte meno a priezvisko (najviac 150 znakov).')
  }
  const userId = await getUserId()
  const name = fullName.trim().normalize('NFC')
  await db.insert(profile).values({ userId, fullName: name })
    .onConflictDoUpdate({ target: profile.userId, set: { fullName: name, updatedAt: new Date() } })
  revalidatePath('/profile')
  revalidatePath('/timesheet')
  revalidatePath('/')
  return { fullName: name }
}
