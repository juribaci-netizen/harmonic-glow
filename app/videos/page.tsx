"use client"

import { AppShell } from "@/components/app-shell"
import { VideosView } from "@/components/videos-view"
import { concertArchiveSeed } from "@/lib/concert-archive"

const videos = concertArchiveSeed.map((v,index)=>({
  id:index+1,
  title:v.title,
  date:v.date ?? null,
  conductor:v.conductor ?? null,
  venue:v.venue ?? null,
  description:v.description ?? null,
  url:v.url ?? null,
  thumbnailUrl:v.thumbnailUrl ?? null,
}))

export default function VideosPage() {
  return (
    <AppShell user={{ name: "Marek Juran", email: "juribaci@gmail.com" }}>
      <VideosView initialVideos={videos} />
    </AppShell>
  )
}
