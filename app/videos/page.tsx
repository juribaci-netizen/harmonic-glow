import { AppShell } from "@/components/app-shell"
import { VideosView } from "@/components/videos-view"
import { getVideos, seedVideos } from "@/app/actions/videos"
import { getSessionUser } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function VideosPage() {
  const user = await getSessionUser()
  if (!user) redirect("/sign-in")
  const videos = await getVideos()
  return <AppShell user={{ name: user.name, email: user.email }}><VideosView initialVideos={videos} seedVideos={seedVideos} /></AppShell>
}
