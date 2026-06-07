import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request:NextRequest) {
  const user=await getUser();if(!user)return new NextResponse("Non autorisé",{status:401});
  const format=request.nextUrl.searchParams.get("format")||"json";
  const contacts=await db.contact.findMany({where:{userId:user.id},include:{relationTags:true,circles:{include:{circle:true}},interactions:true,reminders:true,giftIdeas:true,journalEntries:true,importantDates:true,conversationItems:true,customFields:true,linksFrom:true,linksTo:true}});
  if(format==="vcf"){
    const body=contacts.map(contact=>["BEGIN:VCARD","VERSION:3.0",`N:${contact.lastName};${contact.firstName};;;`,`FN:${contact.firstName} ${contact.lastName}`,...(contact.email?[`EMAIL:${contact.email}`]:[]),...(contact.phone?[`TEL:${contact.phone}`]:[]),...(contact.company?[`ORG:${contact.company}`]:[]),...(contact.birthday?[`BDAY:${contact.birthday.toISOString().slice(0,10)}`]:[]),...(contact.notes?[`NOTE:${contact.notes.replace(/\n/g,"\\n")}`]:[]),`UID:${contact.sourceId||contact.id}`,"END:VCARD"].join("\r\n")).join("\r\n");
    return new NextResponse(body,{headers:{"Content-Type":"text/vcard; charset=utf-8","Content-Disposition":`attachment; filename="liens-contacts.vcf"`}});
  }
  return NextResponse.json({exportedAt:new Date().toISOString(),version:1,user:{name:user.name,email:user.email},contacts},{headers:{"Content-Disposition":`attachment; filename="liens-backup.json"`}});
}
