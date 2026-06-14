import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getImmichPeople, isImmichConfigured } from "@/lib/immich";

export async function GET() {
  const user=await getUser();
  if(!user)return new NextResponse("Non autorisé",{status:401});
  if(!isImmichConfigured())return new NextResponse("Immich non configuré",{status:404});
  try {
    return NextResponse.json({people:await getImmichPeople()});
  } catch {
    return new NextResponse("Immich indisponible",{status:502});
  }
}
