import { Activity, ArrowLeft, Ban, Cake, Check, Link2, Mail, MessageCircle, PawPrint, Phone, Trash2, WalletCards } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addQuickInteraction, deleteInteraction, toggleReminder } from "@/app/actions";
import { EditContactForm, InteractionForm, ReminderForm } from "@/components/forms";
import { Modal } from "@/components/modal";
import { PaginationControls } from "@/components/pagination-controls";
import { Shell } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { effectiveFrequency, relationshipScore } from "@/lib/score";
import { GiftList } from "@/components/gift-list";
import { MentionText } from "@/components/mention-text";
import { Button } from "@/components/ui/button";
import { ContactActivity } from "@/components/contact-activity";
import { ContactWorkspace } from "@/components/contact-workspace";
import { ProfileAvatar } from "@/components/profile-avatar";

const typeLabels: Record<string,string> = { message:"Message", call:"Appel", meeting:"Rencontre", email:"E-mail" };
const INTERACTIONS_PER_PAGE = 10;

export default async function ContactDetail({ params, searchParams }: { params: Promise<{id:string}>; searchParams: Promise<{page?:string}> }) {
  const user = await requireUser();
  const { id } = await params;
  const { page = "1" } = await searchParams;
  const totalInteractions=await db.interaction.count({where:{contactId:id,contact:{userId:user.id}}});
  const totalPages=Math.max(1,Math.ceil(totalInteractions/INTERACTIONS_PER_PAGE));
  const currentPage=Math.min(Math.max(1,parseInt(page)||1),totalPages);
  const [contact,interactions,circles,people] = await Promise.all([
    db.contact.findFirst({where:{id,userId:user.id},include:{relationTags:true,circles:{include:{circle:true}},interactions:{orderBy:{happenedAt:"desc"},take:1},reminders:{orderBy:{dueAt:"asc"}},giftIdeas:{orderBy:[{purchased:"asc"},{createdAt:"desc"}]},journalEntries:{orderBy:{happenedAt:"desc"}},importantDates:{orderBy:{date:"asc"}},conversationItems:{orderBy:{createdAt:"desc"}},customFields:{orderBy:{createdAt:"desc"}},linksFrom:{include:{toContact:true}},linksTo:{include:{fromContact:true}},debts:{where:{settled:false},orderBy:{createdAt:"desc"}},pets:{include:{pet:true}}}}),
    db.interaction.findMany({where:{contactId:id,contact:{userId:user.id}},orderBy:{happenedAt:"desc"},skip:(currentPage-1)*INTERACTIONS_PER_PAGE,take:INTERACTIONS_PER_PAGE}),
    db.circle.findMany({where:{userId:user.id},orderBy:{name:"asc"}}),
    db.contact.findMany({where:{userId:user.id},select:{id:true,firstName:true,lastName:true},orderBy:{firstName:"asc"}}),
  ]);
  if (!contact) notFound();
  const frequency = effectiveFrequency(contact.desiredFrequency,contact.circles.map(({circle})=>circle.frequency));
  const score = relationshipScore(contact.interactions[0]?.happenedAt??null,frequency);
  const today = new Date();today.setHours(0,0,0,0);
  const contactedToday = interactions.some(interaction=>interaction.happenedAt>=today);
  const activeReminders=contact.reminders.filter(reminder=>!reminder.done);
  const noContactUntil=activeReminders.find(reminder=>reminder.kind==="no_contact"&&reminder.dueAt>=today);
  const relationTags=[...new Set([...contact.relationTags.map(item=>item.tag),...(contact.relationType?[contact.relationType]:[])])];
  return <Shell><div className="mx-auto max-w-5xl"><Link href="/contacts" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/>Retour aux personnes</Link>
    <section className="card mb-6 p-6"><div className="flex flex-wrap items-start gap-5"><ProfileAvatar photo={contact.photo} name={contact.firstName+" "+contact.lastName} className="size-16"/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h1 className="text-3xl font-semibold tracking-tight">{contact.firstName} {contact.lastName}</h1>{relationTags.map(tag=><span key={tag} className="rounded-full border bg-muted/60 px-2.5 py-1 text-xs font-medium">{tag}</span>)}{noContactUntil&&<span className="flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-700 dark:text-rose-300"><Ban className="size-3.5"/>Ne pas contacter avant le {noContactUntil.dueAt.toLocaleDateString("fr-FR")}</span>}</div><p className="mt-1 text-muted-foreground">{contact.company||"Contact personnel"}</p><div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">{contact.email&&<a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 transition hover:text-foreground"><Mail size={15}/>{contact.email}</a>}{contact.phone&&<a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 transition hover:text-foreground"><Phone size={15}/>{contact.phone}</a>}{contact.birthday&&<span className="flex items-center gap-1.5"><Cake size={15}/>{contact.birthday.toLocaleDateString("fr-FR",{day:"numeric",month:"long"})}</span>}</div></div><div className="flex flex-wrap gap-2"><Modal title={`Activité de ${contact.firstName}`} label="Activité" secondary icon={<Activity/>} description="Tous les événements enregistrés pour cette personne, du plus récent au plus ancien." wide><ContactActivity contact={contact}/></Modal><form action={addQuickInteraction}><input type="hidden" name="contactId" value={contact.id}/><Button type="submit" variant="outline" size="lg" disabled={contactedToday||!!noContactUntil} title={noContactUntil?`Ne pas contacter avant le ${noContactUntil.dueAt.toLocaleDateString("fr-FR")}`:contactedToday?"Un échange a déjà été enregistré aujourd’hui":"Enregistrer un contact aujourd’hui"}>{noContactUntil?<Ban/>:<Check/>}{noContactUntil?"Ne pas contacter":contactedToday?"Contacté aujourd’hui":"Marquer contacté"}</Button></form><Modal title="Modifier le contact" label="Modifier" secondary><EditContactForm contact={contact} circles={circles} people={people}/></Modal></div></div>
      <div className="mt-6 grid gap-5 border-t pt-5 sm:grid-cols-[1fr_2fr]"><div><p className="text-sm text-muted-foreground">Santé relationnelle</p><p className="text-3xl font-semibold">{score}%</p></div><div className="self-center"><div className="progress"><span style={{width:`${score}%`}}/></div><p className="mt-2 text-xs text-muted-foreground">Rythme effectif : tous les {frequency} jours</p></div></div>
      {contact.circles.length>0&&<div className="mt-5 flex flex-wrap gap-2">{contact.circles.map(({circle})=><span key={circle.id} className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{background:`${circle.color}18`,color:circle.color}}>{circle.name}</span>)}</div>}
      {contact.notes&&<div className="mt-5 rounded-lg bg-muted/60 p-4"><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes privées</p><MentionText text={contact.notes} people={people} className="text-sm"/></div>}
      {(contact.linksFrom.length>0||contact.linksTo.length>0)&&<div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-5"><span className="mr-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Link2 className="size-3.5"/>Personnes liées</span>{[...contact.linksFrom.map(link=>({person:link.toContact,label:link.label})),...contact.linksTo.map(link=>({person:link.fromContact,label:link.label}))].map(({person,label})=><Link key={person.id} href={`/contacts/${person.id}`} className="rounded-full border bg-background px-2.5 py-1 text-xs transition hover:bg-muted">@{person.firstName} {person.lastName}{label&&` · ${label}`}</Link>)}</div>}
    </section>
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]"><section className="card p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-semibold">Historique</h2><p className="text-sm text-muted-foreground">{totalInteractions} échange{totalInteractions!==1?"s":""}</p></div><Modal title="Nouvel échange" label="Échange"><InteractionForm contacts={[contact]} people={people.filter(person=>person.id!==contact.id)}/></Modal></div>
      <div className="space-y-3">{interactions.map(i=><div key={i.id} className="flex gap-3 rounded-lg border p-4"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted"><MessageCircle size={16}/></span><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><b className="text-sm">{typeLabels[i.type]||i.type}</b><span className="text-xs text-muted-foreground">{i.happenedAt.toLocaleDateString("fr-FR")}</span></div>{i.note&&<MentionText text={i.note} people={people} className="mt-1 text-sm text-muted-foreground"/>}</div><form action={deleteInteraction}><input type="hidden" name="id" value={i.id}/><button className="text-muted-foreground hover:text-destructive" title="Supprimer"><Trash2 size={15}/></button></form></div>)}{!interactions.length&&<Empty text="Aucun échange enregistré."/ >}</div>
      <PaginationControls totalItems={totalInteractions} itemsPerPage={INTERACTIONS_PER_PAGE} currentPage={currentPage}/>
    </section><section className="space-y-6"><section className="card p-6"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-semibold">Rappels</h2><Modal title="Nouveau rappel" label="Rappel" secondary><ReminderForm contacts={[contact]}/></Modal></div><div className="space-y-3">{activeReminders.map(r=><form action={toggleReminder} key={r.id} className="flex gap-3 rounded-lg bg-muted/60 p-3"><input type="hidden" name="id" value={r.id}/><button className="mt-0.5 size-5 rounded-full border-2"/><div><div className="flex flex-wrap items-center gap-2"><b className="text-sm">{r.title}</b>{r.kind==="no_contact"&&<span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:text-rose-300">Ne pas contacter</span>}</div><p className="text-xs text-muted-foreground">{r.dueAt.toLocaleDateString("fr-FR")}</p></div></form>)}{!activeReminders.length&&<Empty text="Aucun rappel en attente."/ >}</div></section><RelatedSummary title="Finances en cours" href="/finances" icon={<WalletCards/>} items={contact.debts.map(debt=>`${debt.direction==="owed_to_me"?"Vous doit":"Vous devez"} ${new Intl.NumberFormat("fr-FR",{style:"currency",currency:debt.currency}).format(debt.amount)} · ${debt.title}`)}/><RelatedSummary title="Animaux liés" href="/pets" icon={<PawPrint/>} items={contact.pets.map(({pet})=>`${pet.name} · ${pet.species}`)}/><GiftList contactId={contact.id} gifts={contact.giftIdeas}/></section></div>
    <ContactWorkspace contact={contact} people={people}/>
  </div></Shell>;
}

function Empty({text}:{text:string}) { return <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">{text}</p> }
function RelatedSummary({title,href,icon,items}:{title:string;href:string;icon:React.ReactNode;items:string[]}) {return <section className="card p-6"><div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-semibold">{icon}{title}</h2><Link href={href} className="text-xs text-muted-foreground hover:text-foreground">Gérer</Link></div><div className="space-y-2">{items.map(item=><p key={item} className="rounded-lg bg-muted/60 p-3 text-sm">{item}</p>)}{!items.length&&<p className="text-sm text-muted-foreground">Rien en cours.</p>}</div></section>}
