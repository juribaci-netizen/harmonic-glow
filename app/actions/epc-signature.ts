"use server"

import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { epcSignature } from "@/lib/db/schema"
import { getSessionUser } from "@/lib/session"
import { revalidatePath } from "next/cache"

async function userId(){
  const user=await getSessionUser()
  if(!user)throw new Error("Unauthorized")
  return user.id
}

export async function getEpcSignature(year:number,month:number){
  const id=await userId()
  const rows=await db.select().from(epcSignature)
    .where(and(eq(epcSignature.userId,id),eq(epcSignature.year,year),eq(epcSignature.month,month)))
    .orderBy(desc(epcSignature.updatedAt)).limit(1)
  return rows[0]??null
}

export async function saveEpcSignature(year:number,month:number,signatureData:string){
  const id=await userId()
  const existing=await db.select().from(epcSignature)
    .where(and(eq(epcSignature.userId,id),eq(epcSignature.year,year),eq(epcSignature.month,month)))
    .orderBy(desc(epcSignature.updatedAt)).limit(1)
  if(existing[0]){
    await db.update(epcSignature).set({signatureData,signedAt:new Date(),updatedAt:new Date()})
      .where(eq(epcSignature.id,existing[0].id))
  }else{
    await db.insert(epcSignature).values({userId:id,year,month,signatureData})
  }
  revalidatePath("/timesheet")
  return {ok:true}
}
