import { AppShell } from "@/components/app-shell"
import { VideosView } from "@/components/videos-view"
import { getOfficialConcertArchive } from "@/lib/concert-archive"

export default async function VideosPage() {
  const videos = await getOfficialConcertArchive()

  return (
    <AppShell user={{ name: "Marek Juran", email: "juribaci@gmail.com" }}>
      <VideosView initialVideos={videos} />
    </AppShell>
  )
}
