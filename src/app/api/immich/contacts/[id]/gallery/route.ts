import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getImmichAssets, immichAssetUrl } from "@/lib/immich";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}) {
  const user=await getUser();
  if(!user)return new NextResponse("Non autorisé",{status:401});
  const {id}=await params;
  const contact=await db.contact.findFirst({where:{id,userId:user.id},select:{immichPersonId:true}});
  if(!contact?.immichPersonId)return new NextResponse("Aucune liaison Immich",{status:404});
  try {
    const assets=await getImmichAssets(contact.immichPersonId);
    return NextResponse.json({assets:assets.map(asset=>({...asset,url:immichAssetUrl(asset.id)}))});
  } catch {
    return new NextResponse("Immich indisponible",{status:502});
  }
}
