import { NextRequest, NextResponse } from "next/server"

const NEW_HOST = "stream.filharmonia.art"
const OLD_HOST = "stream.filharmonia.sk"

function findVideo(html: string) {
  const normalized = html.replaceAll("\\/", "/").replaceAll("\\u002F", "/")
  const candidates = [
    ...Array.from(normalized.matchAll(/<iframe[^>]+src=["']([^"']+)["']/gi)).map(m => m[1]),
    ...Array.from(normalized.matchAll(/(?:src|file|url)[=:]["']([^"']+\.(?:mp4|m3u8)(?:\?[^"']*)?)["']/gi)).map(m => m[1]),
    ...Array.from(normalized.matchAll(/https?:\/\/player\.vimeo\.com\/video\/\d+(?:\?[^"'<> ]*)?/gi)).map(m => m[0]),
    ...Array.from(normalized.matchAll(/https?:\/\/[^"'<> ]*\.m3u8(?:\?[^"'<> ]*)?/gi)).map(m => m[0]),
    ...Array.from(normalized.matchAll(/https?:\/\/[^"'<> ]*\.mp4(?:\?[^"'<> ]*)?/gi)).map(m => m[0]),
  ]
  const clean = candidates.map(x => x.replaceAll("&amp;", "&"))
  return clean.find(x => /player\.vimeo\.com\/video\//i.test(x))
    ?? clean.find(x => /\.(m3u8|mp4)(?:\?|$)/i.test(x))
    ?? null
}

async function inspect(url: string) {
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" })
  if (!response.ok) return null
  return findVideo(await response.text())
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url")
  if (!raw) return NextResponse.json({ error: "Missing url" }, { status: 400 })

  let target: URL
  try { target = new URL(raw) } catch { return NextResponse.json({ error: "Invalid url" }, { status: 400 }) }
  if (target.hostname !== NEW_HOST || !target.pathname.startsWith("/concert/")) {
    return NextResponse.json({ error: "Only official concert URLs are allowed" }, { status: 400 })
  }

  const id = target.pathname.split("/").filter(Boolean).pop()
  const oldUrl = id ? `https://${OLD_HOST}/video/?v=${encodeURIComponent(id)}` : null

  try {
    // The new archive is still a test version. Prefer it, but fall back to
    // the complete legacy archive because it contains the actual video player.
    let embedUrl = await inspect(target.toString())
    if (!embedUrl && oldUrl) embedUrl = await inspect(oldUrl)
    return NextResponse.json({ embedUrl }, { headers: { "Cache-Control": "public, s-maxage=3600" } })
  } catch {
    try {
      if (oldUrl) {
        const embedUrl = await inspect(oldUrl)
        return NextResponse.json({ embedUrl }, { headers: { "Cache-Control": "public, s-maxage=3600" } })
      }
    } catch {}
    return NextResponse.json({ embedUrl: null }, { status: 200 })
  }
}
