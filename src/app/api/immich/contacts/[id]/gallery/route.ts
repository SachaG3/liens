import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getImmichAssets, immichAssetUrl } from "@/lib/immich";

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  const user=await getUser();
  if(!user)return new NextResponse("Non autorisé",{status:401});
  const {id}=await params;
  const contact=await db.contact.findFirst({where:{id,userId:user.id},select:{immichPersonId:true}});
  if(!contact?.immichPersonId)return new NextResponse("Aucune liaison Immich",{status:404});
  try {
    const requestedPage=Number(new URL(request.url).searchParams.get("page")??"1");
    const page=Number.isInteger(requestedPage)&&requestedPage>0?requestedPage:1;
    const result=await getImmichAssets(contact.immichPersonId,page);
    return NextResponse.json({
      assets:result.items.map(asset=>({...asset,url:immichAssetUrl(asset.id)})),
      nextPage:result.nextPage?Number(result.nextPage):null,
      total:result.total,
    });
  } catch {
    return new NextResponse("Immich indisponible",{status:502});
  }
}
