import { NextRequest, NextResponse } from "next/server"

const NEW_HOST = "stream.filharmonia.art"
const OLD_HOST = "stream.filharmonia.sk"

function extractCandidates(html: string, baseUrl: string) {
  const normalized = html
    .replaceAll("\\/", "/")
    .replaceAll("\\u002F", "/")
    .replaceAll("&amp;", "&")

  const raw = [
    ...Array.from(normalized.matchAll(/<iframe[^>]+src=["']([^"']+)["']/gi)).map(m => m[1]),
    ...Array.from(normalized.matchAll(/<(?:video|source)[^>]+src=["']([^"']+)["']/gi)).map(m => m[1]),
    ...Array.from(normalized.matchAll(/(?:src|file|url|hls|stream|playlist)[=:]["']([^"']+)["']/gi)).map(m => m[1]),
    ...Array.from(normalized.matchAll(/https?:\/\/[^"'<>\\ ]+/gi)).map(m => m[0]),
  ]

  const resolved = raw.map(x => {
    try { return new URL(x, baseUrl).toString() } catch { return x }
  })

  return Array.from(new Set(resolved)).filter(x =>
    /player\.vimeo\.com|vimeo\.com|youtube\.com|youtu\.be|\.m3u8(?:\?|$)|\.mp4(?:\?|$)|\/video\/|player|stream/i.test(x)
  )
}

function chooseBest(candidates: string[]) {
  return candidates.find(x => /player\.vimeo\.com\/video\//i.test(x))
    ?? candidates.find(x => /\.m3u8(?:\?|$)/i.test(x))
    ?? candidates.find(x => /\.mp4(?:\?|$)/i.test(x))
    ?? candidates.find(x => /youtube\.com\/embed\//i.test(x))
    ?? candidates.find(x => /\/video\//i.test(x))
    ?? candidates.find(x => /player/i.test(x))
    ?? null
}

async function inspect(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
      "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
      "Accept-Language": "sk-SK,sk;q=0.9,en;q=0.8",
      "Referer": "https://stream.filharmonia.art/",
    },
    cache: "no-store",
    redirect: "follow",
  })

  const text = await response.text()
  const candidates = extractCandidates(text, response.url || url)

  return {
    ok: response.ok,
    status: response.status,
    finalUrl: response.url || url,
    contentType: response.headers.get("content-type"),
    xFrameOptions: response.headers.get("x-frame-options"),
    csp: response.headers.get("content-security-policy"),
    candidates,
    embedUrl: chooseBest(candidates),
    htmlSample: text.slice(0, 900),
  }
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url")
  const debug = request.nextUrl.searchParams.get("debug") === "1"

  if (!raw) return NextResponse.json({ error: "Missing url" }, { status: 400 })

  let target: URL
  try { target = new URL(raw) } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 })
  }

  if (target.hostname !== NEW_HOST) {
    return NextResponse.json({ error: "Only official concert URLs are allowed" }, { status: 400 })
  }

  const queryRoute = decodeURIComponent(target.search.slice(1)).replace(/=$/,"")
  const pathId = target.pathname.startsWith("/concert/") ? target.pathname.split("/").filter(Boolean).pop() : null
  const queryId = queryRoute.startsWith("/koncert/") ? queryRoute.split("/").filter(Boolean).pop() : null
  const id = pathId ?? queryId

  if (!id) {
    return NextResponse.json({ error: "Concert id not found" }, { status: 400 })
  }

  const canonicalNewUrl = `https://${NEW_HOST}/?/koncert/${encodeURIComponent(id)}`
  const legacyPlayerUrl = `https://${OLD_HOST}/video/?v=${encodeURIComponent(id)}`

  try {
    const current = await inspect(canonicalNewUrl)
    const legacy = legacyPlayerUrl ? await inspect(legacyPlayerUrl) : null
    const embedUrl = current.embedUrl ?? legacy?.embedUrl ?? null

    if (debug) {
      return NextResponse.json({
        embedUrl,
        sourceUrl: canonicalNewUrl,
        legacyPlayerUrl,
        current,
        legacy,
      }, { headers: { "Cache-Control": "no-store" } })
    }

    return NextResponse.json({
      embedUrl,
      sourceUrl: canonicalNewUrl,
      needsDomainPermission: !embedUrl,
    }, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } })
  } catch (error) {
    return NextResponse.json({
      embedUrl: null,
      sourceUrl: canonicalNewUrl,
      needsDomainPermission: true,
      debugError: debug ? String(error) : undefined,
    }, { status: 200 })
  }
}
