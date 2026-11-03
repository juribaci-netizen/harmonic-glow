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
  if (!input || typeof input !== "object") throw new Error("Neplatné údaje profilu.")
  const clean = (value: unknown, label: string, max: number, required = false) => {
    if (typeof value !== "string") throw new Error("Neplatné údaje profilu.")
    const result = value.trim().normalize("NFC")
    if (required && !result) throw new Error("Zadajte meno a priezvisko.")
    if (result.length > max) throw new Error(`${label}: maximálne ${max} znakov.`)
    return result
  }
  const values: ProfileInput = {
    fullName: clean(input.fullName, "Meno a priezvisko", 150, true),
    instrument: clean(input.instrument, "Nástroj", 100),
    section: clean(input.section, "Sekcia", 100),
    position: clean(input.position, "Pozícia", 100),
    phone: clean(input.phone, "Telefón", 40),
  }
  const userId = await getUserId()
  const existing = await db.select({ id: profile.id }).from(profile).where(eq(profile.userId, userId)).limit(1)

  if (existing.length > 0) {
    await db
      .update(profile)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(profile.userId, userId))
  } else {
    await db.insert(profile).values({ userId, ...values })
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
