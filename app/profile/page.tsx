import { AppShell } from "@/components/app-shell"
import { ProfileView } from "@/components/profile-view"
import { getProfile } from "@/app/actions/profile"
import { getSessionUser } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  const user = await getSessionUser()
  if (!user) redirect("/sign-in")
  const profile = await getProfile()
  return <AppShell user={{ name: user.name, email: user.email }}><ProfileView user={user} profile={profile} /></AppShell>
}
