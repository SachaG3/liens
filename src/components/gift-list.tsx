import { Check, ExternalLink, Gift, Trash2 } from "lucide-react";
import { deleteGiftIdea, toggleGiftIdea } from "@/app/actions";
import { GiftIdeaForm } from "@/components/forms";
import { Modal } from "@/components/modal";
import { Button } from "@/components/ui/button";

type GiftItem={id:string;title:string;url:string;price:number|null;note:string;purchased:boolean};

export function GiftList({ contactId, gifts }: { contactId:string;gifts:GiftItem[] }) {
  return <section className="card p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-semibold">Idées cadeaux</h2><p className="text-sm text-muted-foreground">{gifts.filter(g=>!g.purchased).length} idée{gifts.filter(g=>!g.purchased).length!==1?"s":""} disponible{gifts.filter(g=>!g.purchased).length!==1?"s":""}</p></div><Modal title="Nouvelle idée cadeau" label="Idée" secondary><GiftIdeaForm contactId={contactId}/></Modal></div>
    <div className="space-y-2">{gifts.map(gift=><div key={gift.id} className={`flex items-start gap-3 rounded-lg border p-3 ${gift.purchased?"opacity-55":""}`}><form action={toggleGiftIdea}><input type="hidden" name="id" value={gift.id}/><Button type="submit" variant={gift.purchased?"default":"outline"} size="icon-sm" className="rounded-full"><Check/></Button></form><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className={`text-sm font-medium ${gift.purchased?"line-through":""}`}>{gift.title}</p>{gift.price!=null&&<span className="text-xs text-muted-foreground">{gift.price.toLocaleString("fr-FR",{style:"currency",currency:"EUR"})}</span>}</div>{gift.note&&<p className="mt-1 text-xs text-muted-foreground">{gift.note}</p>}</div>{gift.url&&<a href={gift.url} target="_blank" rel="noreferrer" className="p-1 text-muted-foreground hover:text-foreground" title="Ouvrir le lien"><ExternalLink className="size-4"/></a>}<form action={deleteGiftIdea}><input type="hidden" name="id" value={gift.id}/><button className="p-1 text-muted-foreground hover:text-destructive" title="Supprimer"><Trash2 className="size-4"/></button></form></div>)}{!gifts.length&&<div className="rounded-lg border border-dashed p-7 text-center"><Gift className="mx-auto mb-2 size-5 text-muted-foreground"/><p className="text-sm font-medium">Aucune idée pour le moment</p><p className="mt-1 text-xs text-muted-foreground">Notez une idée dès qu’elle apparaît.</p></div>}</div>
  </section>;
}
