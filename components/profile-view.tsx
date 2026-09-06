"use client"

import { useState, useTransition } from "react"
import { useI18n } from "@/components/language-provider"
import { saveProfile } from "@/app/actions/profile"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

type Profile = { fullName:string|null; instrument:string|null; section:string|null; position:string|null; phone:string|null }
export function ProfileView({user,profile}:{user:{name:string;email:string};profile:Profile|null}) {
 const {t}=useI18n(); const [pending,startTransition]=useTransition(); const [saved,setSaved]=useState(false); const [form,setForm]=useState({fullName:profile?.fullName??user.name,instrument:profile?.instrument??"",section:profile?.section??"",position:profile?.position??"",phone:profile?.phone??""})
 const set=(k:keyof typeof form,v:string)=>setForm(x=>({...x,[k]:v}))
 const submit=(e:React.FormEvent)=>{e.preventDefault();setSaved(false);startTransition(async()=>{await saveProfile(form);setSaved(true)})}
 return <div className="mx-auto max-w-2xl space-y-6"><header><h1 className="font-serif text-3xl font-semibold">{t.myProfile}</h1><p className="mt-1 text-sm text-muted-foreground">{t.profileSubtitle}</p></header><Card className="p-6"><form onSubmit={submit} className="space-y-5"><div><Label>{t.fullName}</Label><Input className="mt-1.5" value={form.fullName} onChange={e=>set("fullName",e.target.value)} /></div><div><Label>{t.email}</Label><Input className="mt-1.5" value={user.email} disabled /></div><div className="grid gap-5 sm:grid-cols-2"><div><Label>{t.instrument}</Label><Input className="mt-1.5" value={form.instrument} onChange={e=>set("instrument",e.target.value)} placeholder="Violin" /></div><div><Label>{t.section}</Label><Input className="mt-1.5" value={form.section} onChange={e=>set("section",e.target.value)} /></div><div><Label>{t.position}</Label><Input className="mt-1.5" value={form.position} onChange={e=>set("position",e.target.value)} /></div><div><Label>{t.phone}</Label><Input className="mt-1.5" value={form.phone} onChange={e=>set("phone",e.target.value)} /></div></div><div className="flex items-center gap-3"><Button type="submit" disabled={pending}>{pending?t.saving:t.save}</Button>{saved&&<span className="text-sm text-muted-foreground">{t.saved}</span>}</div></form></Card></div>
}
