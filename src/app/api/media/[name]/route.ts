import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { mediaPath } from "@/lib/media";

const contentTypes:Record<string,string>={".jpg":"image/jpeg",".png":"image/png",".webp":"image/webp",".gif":"image/gif"};

export async function GET(_:Request,{params}:{params:Promise<{name:string}>}) {
  const user=await getUser();if(!user)return new NextResponse("Non autorisé",{status:401});
  const {name}=await params;if(name!==path.basename(name))return new NextResponse("Introuvable",{status:404});
  const matches=await Promise.all([
    db.contact.findFirst({where:{userId:user.id,photo:name},select:{id:true}}),
    db.pet.findFirst({where:{userId:user.id,photo:name},select:{id:true}}),
  ]);
  if(!matches.some(Boolean))return new NextResponse("Introuvable",{status:404});
  try {
    const body=await readFile(mediaPath(name));
    return new NextResponse(body,{headers:{"Content-Type":contentTypes[path.extname(name)]??"application/octet-stream","Cache-Control":"private, max-age=86400"}});
  } catch {
    return new NextResponse("Introuvable",{status:404});
  }
}
