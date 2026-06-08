import Link from "next/link";
import { ArrowRight, Ban, Check, MessageCircle, Plus, Users } from "lucide-react";
import { toggleReminder } from "@/app/actions";
import { ContactForm, InteractionForm } from "@/components/forms";
import { Modal } from "@/components/modal";
import { Shell } from "@/components/shell";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { effectiveFrequency, relationshipScore } from "@/lib/score";

const WEEK_AGO = new Date(Date.now() - 7 * 86_400_000);

function relationState(score:number) {
  if(score>=75)return {label:"À jour",className:"border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"};
  if(score>=45)return {label:"Bientôt",className:"border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"};
  return {label:"Prendre des nouvelles",className:"border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300"};
}

export default async function Dashboard() {
  const user=await requireUser();
  const [contacts,circles,reminders,interactionCount]=await Promise.all([
    db.contact.findMany({where:{userId:user.id},include:{relationTags:true,interactions:{orderBy:{happenedAt:"desc"},take:1},circles:{include:{circle:true}},reminders:{where:{kind:"no_contact",done:false,dueAt:{gte:new Date()}}}},orderBy:{updatedAt:"desc"}}),
    db.circle.findMany({where:{userId:user.id},include:{members:{include:{contact:{include:{interactions:{where:{happenedAt:{gte:WEEK_AGO}}}}}}}},orderBy:{createdAt:"desc"}}),
    db.reminder.findMany({where:{contact:{userId:user.id},done:false,OR:[{kind:{not:"contact"}},{contact:{followUpStatus:"active"}}]},include:{contact:true},orderBy:{dueAt:"asc"},take:5}),
    db.interaction.count({where:{contact:{userId:user.id},happenedAt:{gte:WEEK_AGO}}}),
  ]);
  const scored=contacts.filter(c=>c.followUpStatus==="active"&&!c.reminders.length).map(c=>({...c,score:relationshipScore(c.interactions[0]?.happenedAt??null,effectiveFrequency(c.desiredFrequency,c.circles.map(({circle})=>circle.frequency)))})).sort((a,b)=>a.score-b.score);
  const date=new Intl.DateTimeFormat("fr-FR",{weekday:"long",day:"numeric",month:"long"}).format(new Date());
  return <Shell><div className="mx-auto max-w-6xl">
    <header className="mb-10 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-sm capitalize text-muted-foreground">{date}</p><h1 className="text-3xl font-semibold tracking-tight">Bonjour {user.name.split(" ")[0]}.</h1><p className="mt-2 text-muted-foreground">{scored.filter(c=>c.score<45).length?`${scored.filter(c=>c.score<45).length} personnes méritent un petit message.`:"Vos relations importantes sont à jour."}</p></div><div className="flex gap-2"><Modal title="Enregistrer un échange" label="Échange" secondary><InteractionForm contacts={contacts.filter(c=>c.followUpStatus==="active")}/></Modal><Modal title="Ajouter une personne" label="Personne" wide><ContactForm circles={circles} people={contacts}/></Modal></div></header>

    <section className="mb-10"><div className="mb-4 flex items-end justify-between"><div><h2 className="text-lg font-semibold">À contacter maintenant</h2><p className="text-sm text-muted-foreground">Les suggestions les plus utiles, pas une liste de tâches.</p></div><Link href="/contacts" className="hidden items-center gap-1 text-sm font-medium sm:flex">Voir toutes les personnes <ArrowRight className="size-4"/></Link></div>
      <div className="grid gap-3 md:grid-cols-3">{scored.slice(0,3).map(c=>{const state=relationState(c.score);return <Link key={c.id} href={`/contacts/${c.id}`} className="group rounded-xl border bg-card p-5 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"><div className="mb-7 flex items-start justify-between"><ProfileAvatar photo={c.photo} name={c.firstName+" "+c.lastName} className="size-11"/><Badge variant="outline" className={state.className}>{state.label}</Badge></div><h3 className="font-semibold">{c.firstName} {c.lastName}</h3>{c.relationTags.length>0&&<p className="mt-1 truncate text-xs text-muted-foreground">{c.relationTags.map(item=>item.tag).join(" · ")}</p>}<p className="mt-2 text-sm text-muted-foreground">{c.interactions[0]?`Dernier échange ${c.interactions[0].happenedAt.toLocaleDateString("fr-FR")}`:"Vous n’avez encore rien noté"}</p><div className="mt-5 flex items-center gap-2 text-sm font-medium opacity-0 transition group-hover:opacity-100"><MessageCircle className="size-4"/>Ouvrir la fiche</div></Link>})}{!contacts.length&&<Empty title="Votre carnet est vide" text="Ajoutez une première personne ou importez vos contacts."/ >}</div>
    </section>

    <div className="grid gap-8 lg:grid-cols-[1.35fr_.8fr]"><section><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Cercles cette semaine</h2><Link href="/circles" className="text-sm text-muted-foreground hover:text-foreground">Gérer</Link></div><div className="overflow-hidden rounded-xl border bg-card">{circles.map((c,index)=>{const done=c.members.reduce((n,m)=>n+m.contact.interactions.length,0);const progress=Math.min(100,Math.round(done/c.weeklyTarget*100));return <div key={c.id} className={`flex items-center gap-4 p-4 ${index>0?"border-t":""}`}><span className="size-2.5 rounded-full" style={{background:c.color}}/><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><b className="text-sm">{c.name}</b><span className="text-xs text-muted-foreground">{done}/{c.weeklyTarget} échanges</span></div><div className="progress mt-2"><span style={{width:`${progress}%`,background:c.color}}/></div></div></div>})}{!circles.length&&<div className="p-6"><Empty title="Aucun cercle" text="Créez des groupes qui correspondent à votre vie."/ ></div>}</div></section>
      <section><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Rappels</h2><Link href="/reminders" className="text-sm text-muted-foreground hover:text-foreground">{reminders.length} à venir</Link></div><div className="space-y-2">{reminders.map(r=><form action={toggleReminder} key={r.id} className="flex items-start gap-3 rounded-xl border bg-card p-3 shadow-xs"><input type="hidden" name="id" value={r.id}/><Button type="submit" variant="outline" size="icon-sm" className="mt-0.5 rounded-full"><Check/></Button><div><div className="flex items-center gap-2"><b className="text-sm font-medium">{r.title}</b>{r.kind==="no_contact"&&<Ban className="size-3.5 text-rose-600"/>}</div><p className="mt-0.5 text-xs text-muted-foreground">{r.contact.firstName} · {r.dueAt.toLocaleDateString("fr-FR")}</p></div></form>)}{!reminders.length&&<Empty title="Rien à retenir" text="Vos prochains rappels apparaîtront ici."/ >}</div><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl border bg-card p-4"><Users className="mb-3 size-4 text-muted-foreground"/><p className="text-2xl font-semibold">{contacts.length}</p><p className="text-xs text-muted-foreground">personnes</p></div><div className="rounded-xl border bg-card p-4"><MessageCircle className="mb-3 size-4 text-muted-foreground"/><p className="text-2xl font-semibold">{interactionCount}</p><p className="text-xs text-muted-foreground">échanges cette semaine</p></div></div></section>
    </div>
  </div></Shell>;
}

function Empty({title,text}:{title:string;text:string}) { return <div className="col-span-full rounded-xl border border-dashed p-8 text-center"><Plus className="mx-auto mb-3 size-5 text-muted-foreground"/><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs text-muted-foreground">{text}</p></div> }
