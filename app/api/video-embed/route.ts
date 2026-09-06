import { NextRequest, NextResponse } from "next/server"

const ALLOWED_HOST = "stream.filharmonia.art"

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url")
  if (!raw) return NextResponse.json({ error: "Missing url" }, { status: 400 })

  let target: URL
  try { target = new URL(raw) } catch { return NextResponse.json({ error: "Invalid url" }, { status: 400 }) }
  if (target.hostname !== ALLOWED_HOST || !target.pathname.startsWith("/concert/")) {
    return NextResponse.json({ error: "Only official concert URLs are allowed" }, { status: 400 })
  }

  try {
    const response = await fetch(target.toString(), { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 3600 } })
    if (!response.ok) return NextResponse.json({ error: "Concert page unavailable" }, { status: 502 })
    const html = await response.text()

    const candidates = [
      ...Array.from(html.matchAll(/<iframe[^>]+src=["']([^"']+)["']/gi)).map(m => m[1]),
      ...Array.from(html.matchAll(/https?:\\/\\/player\.vimeo\.com\\/video\\/[^"'\\s<]+/gi)).map(m => m[0].replaceAll("\\/", "/")),
      ...Array.from(html.matchAll(/https?:\/\/player\.vimeo\.com\/video\/[^"'\\s<]+/gi)).map(m => m[0]),
    ]
    const embed = candidates.map(x => x.replaceAll("&amp;", "&")).find(x => x.includes("player.vimeo.com/video/"))
    if (!embed) return NextResponse.json({ embedUrl: null }, { status: 200 })
    return NextResponse.json({ embedUrl: embed }, { headers: { "Cache-Control": "public, s-maxage=3600" } })
  } catch {
    return NextResponse.json({ error: "Could not inspect concert page" }, { status: 502 })
  }
}
