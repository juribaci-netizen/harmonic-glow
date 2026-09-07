import { NextRequest, NextResponse } from "next/server"

const NEW_HOST = "stream.filharmonia.art"
const OLD_HOST = "stream.filharmonia.sk"

function findVideo(html: string, baseUrl: string) {
  const normalized = html.replaceAll("\\/", "/").replaceAll("\\u002F", "/")
  const raw = [
    ...Array.from(normalized.matchAll(/<iframe[^>]+src=["']([^"']+)["']/gi)).map(m => m[1]),
    ...Array.from(normalized.matchAll(/(?:src|file|url)[=:]["']([^"']+\.(?:mp4|m3u8)(?:\?[^"']*)?)["']/gi)).map(m => m[1]),
    ...Array.from(normalized.matchAll(/https?:\/\/player\.vimeo\.com\/video\/\d+(?:\?[^"'<> ]*)?/gi)).map(m => m[0]),
    ...Array.from(normalized.matchAll(/https?:\/\/[^"'<> ]*\.m3u8(?:\?[^"'<> ]*)?/gi)).map(m => m[0]),
    ...Array.from(normalized.matchAll(/https?:\/\/[^"'<> ]*\.mp4(?:\?[^"'<> ]*)?/gi)).map(m => m[0]),
  ]

  const candidates = raw.map(x => {
    const clean = x.replaceAll("&amp;", "&")
    try { return new URL(clean, baseUrl).toString() } catch { return clean }
  })

  return candidates.find(x => /player\.vimeo\.com\/video\//i.test(x))
    ?? candidates.find(x => /\.(m3u8|mp4)(?:\?|$)/i.test(x))
    ?? candidates.find(x => /\/video\//i.test(x))
    ?? null
}

async function inspect(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1",
      "Accept": "text/html,application/xhtml+xml",
    },
    cache: "no-store",
    redirect: "follow",
  })
  if (!response.ok) return null
  return findVideo(await response.text(), response.url || url)
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url")
  if (!raw) return NextResponse.json({ error: "Missing url" }, { status: 400 })

  let target: URL
  try { target = new URL(raw) } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 })
  }

  if (target.hostname !== NEW_HOST || !target.pathname.startsWith("/concert/")) {
    return NextResponse.json({ error: "Only official concert URLs are allowed" }, { status: 400 })
  }

  const id = target.pathname.split("/").filter(Boolean).pop()
  const legacyPlayerUrl = id ? `https://${OLD_HOST}/video/?v=${encodeURIComponent(id)}` : null

  try {
    let embedUrl = await inspect(target.toString())
    if (!embedUrl && legacyPlayerUrl) embedUrl = await inspect(legacyPlayerUrl)

    return NextResponse.json(
      { embedUrl, playerUrl: legacyPlayerUrl, sourceUrl: target.toString() },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } },
    )
  } catch {
    return NextResponse.json(
      { embedUrl: null, playerUrl: legacyPlayerUrl, sourceUrl: target.toString() },
      { status: 200 },
    )
  }
}
