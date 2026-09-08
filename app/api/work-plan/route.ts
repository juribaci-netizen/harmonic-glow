const PDF_URL = "https://raw.githubusercontent.com/juribaci-netizen/harmonic-glow/main/public/work-plan-2026-2027.pdf"

export async function GET() {
  const pdf = await fetch(PDF_URL, { next: { revalidate: 86_400 } })

  if (!pdf.ok || !pdf.body) {
    return new Response("PDF plán práce sa nepodarilo načítať.", { status: 502 })
  }

  return new Response(pdf.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="plan-prace-2026-2027.pdf"',
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  })
}
