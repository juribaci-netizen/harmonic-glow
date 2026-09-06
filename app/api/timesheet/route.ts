import { NextResponse } from "next/server"
import { getMonthEntries } from "@/app/actions/time-entries"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const now = new Date()
  const year = Number(searchParams.get("year")) || now.getFullYear()
  const month = Number(searchParams.get("month"))
  const safeMonth = Number.isInteger(month) && month >= 0 && month <= 11 ? month : now.getMonth()
  try {
    return NextResponse.json(await getMonthEntries(year, safeMonth))
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
