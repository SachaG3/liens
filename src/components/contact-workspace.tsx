import Link from "next/link";
import { CalendarHeart, Check, Eye, FileText, Link2, ListTodo, LockKeyhole, Sparkles } from "lucide-react";
import { toggleConversationItem } from "@/app/actions";
import { ContactRelationForm, ConversationItemForm, CustomFieldForm, ImportantDateForm, JournalEntryForm } from "@/components/forms";
import { Modal } from "@/components/modal";
import { Button } from "@/components/ui/button";
import { SensitiveValue } from "@/components/sensitive-value";

type Person={id:string;firstName:string;lastName:string};
type WorkspaceContact={
  id:string;firstName:string;notes:string;
  interactions:Array<{id:string;type:string;note:string;happenedAt:Date}>;
  journalEntries:Array<{id:string;type:string;title:string;content:string;happenedAt:Date;private:boolean}>;
  importantDates:Array<{id:string;title:string;date:Date;recurring:boolean;remindDays:number}>;
  conversationItems:Array<{id:string;kind:string;title:string;detail:string;done:boolean;private:boolean}>;
  customFields:Array<{id:string;label:string;value:string;private:boolean}>;
  linksFrom:Array<{id:string;label:string;note:string;toContact:Person}>;
  linksTo:Array<{id:string;label:string;note:string;fromContact:Person}>;
};

const kindLabels:Record<string,string>={topic:"Sujet",question:"Question",promise:"Promesse",interest:"Intérêt"};

export function ContactWorkspace({contact,people}:{contact:WorkspaceContact;people:Person[]}) {
  const openItems=contact.conversationItems.filter(item=>!item.done);
  const relations=[...contact.linksFrom.map(link=>({...link,person:link.toContact})),...contact.linksTo.map(link=>({...link,person:link.fromContact}))];
  return <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_.9fr]">
    <section className="card p-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-xl font-semibold">À reprendre</h2><p className="text-sm text-muted-foreground">Sujets, questions et promesses pour la prochaine conversation.</p></div><div className="flex gap-2"><Modal title="Préparer la prochaine rencontre" label="Préparer" secondary icon={<Sparkles/>} description="Un résumé rapide, sans les contenus marqués sensibles." wide><MeetingPrep contact={contact}/></Modal><Modal title="Ajouter au suivi" label="Sujet"><ConversationItemForm contactId={contact.id}/></Modal></div></div>
      <div className="space-y-2">{openItems.map(item=><form action={toggleConversationItem} key={item.id} className="flex gap-3 rounded-lg border p-3"><input type="hidden" name="id" value={item.id}/><Button type="submit" variant="outline" size="icon-sm" className="mt-0.5 rounded-full"><Check/></Button><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{kindLabels[item.kind]||item.kind}</span>{item.private&&<LockKeyhole className="size-3 text-muted-foreground"/>}</div>{item.private?<SensitiveValue value={`${item.title}${item.detail?` — ${item.detail}`:""}`}/>:<><p className="text-sm font-medium">{item.title}</p>{item.detail&&<p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>}</>}</div></form>)}{!openItems.length&&<Empty text="Aucun sujet à reprendre pour le moment."/ >}</div>
    </section>
    <div className="space-y-6">
      <CompactPanel icon={<CalendarHeart/>} title="Dates importantes" count={contact.importantDates.length} modal={<Modal title="Nouvelle date importante" label="" secondary><ImportantDateForm contactId={contact.id}/></Modal>}>{contact.importantDates.slice(0,4).map(item=><div key={item.id} className="flex justify-between gap-3 text-sm"><span className="truncate">{item.title}</span><span className="shrink-0 text-muted-foreground">{item.date.toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</span></div>)}</CompactPanel>
      <CompactPanel icon={<Link2/>} title="Relations entre personnes" count={relations.length} modal={<Modal title="Lier deux personnes" label="" secondary><ContactRelationForm contactId={contact.id} people={people}/></Modal>}>{relations.slice(0,4).map(item=><Link key={item.id} href={`/contacts/${item.person.id}`} className="flex justify-between gap-3 text-sm hover:underline"><span className="truncate">{item.person.firstName} {item.person.lastName}</span><span className="shrink-0 text-muted-foreground">{item.label||"Lié"}</span></Link>)}</CompactPanel>
      <CompactPanel icon={<FileText/>} title="Journal universel" count={contact.journalEntries.length} modal={<Modal title="Ajouter au journal" label="" secondary><JournalEntryForm contactId={contact.id}/></Modal>}>{contact.journalEntries.slice(0,3).map(item=><div key={item.id} className="text-sm">{item.private?<SensitiveValue value={item.title}/>:<span className="truncate font-medium">{item.title}</span>}<p className="text-xs text-muted-foreground">{item.happenedAt.toLocaleDateString("fr-FR")}</p></div>)}</CompactPanel>
      <CompactPanel icon={<ListTodo/>} title="Champs personnalisés" count={contact.customFields.length} modal={<Modal title="Nouveau champ personnalisé" label="" secondary><CustomFieldForm contactId={contact.id}/></Modal>}>{contact.customFields.slice(0,4).map(item=><div key={item.id} className="flex justify-between gap-3 text-sm"><span className="truncate text-muted-foreground">{item.label}</span>{item.private?<SensitiveValue value={item.value}/>:<span className="max-w-40 truncate font-medium">{item.value}</span>}</div>)}</CompactPanel>
    </div>
  </div>;
}

function CompactPanel({icon,title,count,modal,children}:{icon:React.ReactNode;title:string;count:number;modal:React.ReactNode;children:React.ReactNode}){return <section className="card p-5"><div className="mb-4 flex items-center gap-2 [&_svg]:size-4">{icon}<h2 className="font-semibold">{title}</h2><span className="text-xs text-muted-foreground">{count}</span><div className="ml-auto">{modal}</div></div><div className="space-y-2">{children}{!count&&<p className="text-xs text-muted-foreground">Rien d’enregistré.</p>}</div></section>}
function Empty({text}:{text:string}){return <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">{text}</p>}

function MeetingPrep({contact}:{contact:WorkspaceContact}) {
  const items=contact.conversationItems.filter(item=>!item.done&&!item.private);
  const journal=contact.journalEntries.filter(item=>!item.private).slice(0,3);
  const last=contact.interactions[0];
  return <div className="space-y-5"><Prep title="Dernier échange">{last?<><p className="font-medium">{last.happenedAt.toLocaleDateString("fr-FR",{dateStyle:"long"})}</p><p className="mt-1 text-muted-foreground">{last.note||"Aucune note."}</p></>:<p className="text-muted-foreground">Aucun échange enregistré.</p>}</Prep><Prep title="À aborder">{items.length?items.map(item=><div key={item.id} className="flex gap-2"><span>•</span><span><b>{item.title}</b>{item.detail&&` — ${item.detail}`}</span></div>):<p className="text-muted-foreground">Aucun sujet en attente.</p>}</Prep><Prep title="Événements récents">{journal.length?journal.map(item=><div key={item.id}><b>{item.title}</b><p className="text-muted-foreground">{item.content}</p></div>):<p className="text-muted-foreground">Aucun événement récent.</p>}</Prep>{contact.notes&&<Prep title="Contexte général"><p className="text-muted-foreground">{contact.notes}</p></Prep>}<p className="flex items-center gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground"><Eye className="size-4"/>Les éléments sensibles sont volontairement exclus de cette préparation.</p></div>;
}
function Prep({title,children}:{title:string;children:React.ReactNode}){return <section><h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3><div className="space-y-2 rounded-lg border p-4 text-sm">{children}</div></section>}
