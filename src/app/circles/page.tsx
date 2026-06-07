import { Trash2, Users } from "lucide-react";
import { deleteCircle } from "@/app/actions";
import { CircleForm } from "@/components/forms";
import { Modal } from "@/components/modal";
import { Shell } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileAvatar } from "@/components/profile-avatar";

const WEEK_AGO = new Date(Date.now() - 7 * 86_400_000);

export default async function CirclesPage() {
  const user = await requireUser();
  const circles = await db.circle.findMany({where:{userId:user.id},include:{members:{include:{contact:{include:{interactions:{where:{happenedAt:{gte:WEEK_AGO}}}}}}}},orderBy:{createdAt:"desc"}});
  return <Shell><div className="mx-auto max-w-5xl"><header className="mb-7 flex items-end justify-between"><div><h1 className="text-3xl font-semibold tracking-tight">Cercles</h1><p className="mt-2 text-sm text-muted-foreground">Organisez vos relations comme vous le souhaitez.</p></div><Modal title="Nouveau cercle" label="Cercle"><CircleForm/></Modal></header>
    <div className="grid gap-4 md:grid-cols-2">{circles.map(c=>{const done=c.members.reduce((n,m)=>n+m.contact.interactions.length,0);const progress=Math.min(100,Math.round(done/c.weeklyTarget*100));return <article key={c.id} className="card p-5"><div className="flex items-start justify-between"><div className="flex items-center gap-3"><span className="size-3 rounded-full" style={{background:c.color}}/><div><h2 className="font-semibold">{c.name}</h2><p className="text-sm text-muted-foreground">Contact souhaité tous les {c.frequency} jours</p></div></div><form action={deleteCircle}><input type="hidden" name="id" value={c.id}/><button className="p-1 text-muted-foreground hover:text-destructive" title="Supprimer"><Trash2 size={17}/></button></form></div>
      <div className="my-4 rounded-lg bg-muted/60 p-3 text-sm"><div className="mb-2 flex items-center gap-2"><Users size={16}/><b>{c.members.length}</b> contact{c.members.length!==1?"s":""}<span className="ml-auto font-semibold">{progress}%</span></div><div className="progress"><span style={{width:`${progress}%`,background:c.color}}/></div><p className="mt-2 text-xs text-muted-foreground">{done}/{c.weeklyTarget} échanges cette semaine</p></div>
      <div className="flex flex-wrap gap-2">{c.members.slice(0,8).map(({contact})=><span key={contact.id} className="flex items-center gap-2 rounded-full border py-1 pl-1 pr-2.5 text-xs"><ProfileAvatar photo={contact.photo} name={contact.firstName+" "+contact.lastName} className="size-6"/>{contact.firstName} {contact.lastName}</span>)}</div>
    </article>})}{!circles.length&&<div className="card p-10 text-center text-muted-foreground">Créez votre premier cercle personnalisé.</div>}</div></div></Shell>;
}
