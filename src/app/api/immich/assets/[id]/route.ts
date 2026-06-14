import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getImmichAssetThumbnail, validImmichAssetSignature } from "@/lib/immich";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return new NextResponse("Non autorisé", { status: 401 });

  const { id } = await params;
  const signature = new URL(request.url).searchParams.get("signature") ?? "";
  if (!validImmichAssetSignature(id, signature)) return new NextResponse("Introuvable", { status: 404 });

  try {
    const response = await getImmichAssetThumbnail(id);
    return new NextResponse(response.body, {
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Image Immich indisponible", { status: 502 });
  }
}
