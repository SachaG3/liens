import Link from "next/link";
import { ExternalLink, Gift } from "lucide-react";
import { Shell } from "@/components/shell";
import { PaginationControls } from "@/components/pagination-controls";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { initials } from "@/lib/score";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const ITEMS_PER_PAGE = 20;

export default async function GiftsPage({searchParams}:{searchParams:Promise<{page?:string;purchasedPage?:string}>}) {
  const user=await requireUser();
  const {page="1",purchasedPage="1"}=await searchParams;

  const [totalAvailable,totalPurchased]=await Promise.all([
    db.giftIdea.count({where:{contact:{userId:user.id},purchased:false}}),
    db.giftIdea.count({where:{contact:{userId:user.id},purchased:true}}),
  ]);
  const currentPage=Math.min(Math.max(1,parseInt(page)||1),Math.max(1,Math.ceil(totalAvailable/ITEMS_PER_PAGE)));
  const currentPurchasedPage=Math.min(Math.max(1,parseInt(purchasedPage)||1),Math.max(1,Math.ceil(totalPurchased/ITEMS_PER_PAGE)));

  const [available,purchased]=await Promise.all([
    db.giftIdea.findMany({
      where:{contact:{userId:user.id},purchased:false},
      include:{contact:true},
      orderBy:{createdAt:"desc"},
      skip:(currentPage-1)*ITEMS_PER_PAGE,
      take:ITEMS_PER_PAGE,
    }),
    db.giftIdea.findMany({
      where:{contact:{userId:user.id},purchased:true},
      include:{contact:true},
      orderBy:{createdAt:"desc"},
      skip:(currentPurchasedPage-1)*ITEMS_PER_PAGE,
      take:ITEMS_PER_PAGE,
    }),
  ]);

  return <Shell><div className="mx-auto max-w-5xl"><header className="mb-9"><p className="mb-2 text-sm text-muted-foreground">Pour ne plus oublier les bonnes idées</p><h1 className="text-3xl font-semibold tracking-tight">Idées cadeaux</h1><p className="mt-2 text-sm text-muted-foreground">{totalAvailable} idée{totalAvailable!==1?"s":""} à garder sous la main.</p></header>
    <GiftSection title="À offrir" gifts={available}/>
    <PaginationControls totalItems={totalAvailable} itemsPerPage={ITEMS_PER_PAGE} currentPage={currentPage}/>
    {totalPurchased>0&&<div className="mt-8"><GiftSection title="Déjà achetés" gifts={purchased} muted/>
    <PaginationControls totalItems={totalPurchased} itemsPerPage={ITEMS_PER_PAGE} currentPage={currentPurchasedPage} pageParamName="purchasedPage"/></div>}
  </div></Shell>;
}

function GiftSection({title,gifts,muted=false}:{title:string;gifts:Array<{id:string;title:string;url:string;price:number|null;note:string;purchased:boolean;contact:{id:string;firstName:string;lastName:string}}> ;muted?:boolean}) {
  return <section><h2 className="mb-3 text-sm font-semibold">{title}</h2><div className="overflow-hidden rounded-xl border bg-card">{gifts.map((gift,index)=><div key={gift.id} className={`grid items-center gap-3 p-4 sm:grid-cols-[1fr_1fr_auto] ${index>0?"border-t":""} ${muted?"opacity-55":""}`}><Link href={`/contacts/${gift.contact.id}`} className="flex min-w-0 items-center gap-3"><Avatar className="size-9"><AvatarFallback>{initials(gift.contact.firstName,gift.contact.lastName)}</AvatarFallback></Avatar><div><p className="text-sm font-medium">{gift.contact.firstName} {gift.contact.lastName}</p><p className="truncate text-xs text-muted-foreground">{gift.title}</p></div></Link><p className="hidden truncate text-sm text-muted-foreground sm:block">{gift.note||"Aucune note"}</p><div className="flex items-center gap-3 text-sm"><span>{gift.price!=null?gift.price.toLocaleString("fr-FR",{style:"currency",currency:"EUR"}):"—"}</span>{gift.url&&<a href={gift.url} target="_blank" rel="noreferrer"><ExternalLink className="size-4 text-muted-foreground"/></a>}</div></div>)}{!gifts.length&&<div className="p-10 text-center"><Gift className="mx-auto mb-2 size-5 text-muted-foreground"/><p className="text-sm text-muted-foreground">Aucune idée cadeau enregistrée.</p></div>}</div></section>;
}
