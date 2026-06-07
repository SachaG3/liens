import Link from "next/link";
import { Bell, Cake, CalendarClock, CalendarHeart, Check, Clock3, Trash2 } from "lucide-react";
import { deleteReminder, snoozeReminder, toggleReminder } from "@/app/actions";
import { EditReminderForm, ReminderForm } from "@/components/forms";
import { Modal } from "@/components/modal";
import { PaginationControls } from "@/components/pagination-controls";
import { Shell } from "@/components/shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { initials } from "@/lib/score";

const TODAY=new Date(new Date().setHours(0,0,0,0));

function nextBirthday(date:Date) {
  const next=new Date(TODAY.getFullYear(),date.getUTCMonth(),date.getUTCDate());
  if(next<TODAY)next.setFullYear(next.getFullYear()+1);
  return next;
}

export default async function RemindersPage({searchParams}:{searchParams:Promise<{page?:string}>}) {
  const user=await requireUser();
  const {page="1"}=await searchParams;
  const ITEMS_PER_PAGE=20;

  const [reminders,contacts,importantDates]=await Promise.all([
    db.reminder.findMany({where:{contact:{userId:user.id}},include:{contact:true},orderBy:[{done:"asc"},{dueAt:"asc"}]}),
    db.contact.findMany({where:{userId:user.id},select:{id:true,firstName:true,lastName:true,birthday:true},orderBy:{firstName:"asc"}}),
    db.importantDate.findMany({where:{contact:{userId:user.id}},include:{contact:true},orderBy:{date:"asc"}}),
  ]);
  const open=reminders.filter(r=>!r.done),done=reminders.filter(r=>r.done);
  const overdue=open.filter(r=>r.dueAt<TODAY),upcoming=open.filter(r=>r.dueAt>=TODAY);

  // Pagination pour les rappels terminés
  const totalDone=done.length;
  const totalPages=Math.max(1,Math.ceil(totalDone/ITEMS_PER_PAGE));
  const currentPage=Math.min(Math.max(1,parseInt(page)||1),totalPages);
  const paginatedDone=done.slice((currentPage-1)*ITEMS_PER_PAGE,currentPage*ITEMS_PER_PAGE);

  const birthdays=contacts.filter(c=>c.birthday).map(c=>({...c,next:nextBirthday(c.birthday!)})).filter(c=>c.next.getTime()-TODAY.getTime()<=90*86_400_000).sort((a,b)=>a.next.getTime()-b.next.getTime());
  const dates=importantDates.map(item=>({...item,next:item.recurring?nextBirthday(item.date):item.date})).filter(item=>item.next>=TODAY&&item.next.getTime()-TODAY.getTime()<=90*86_400_000).sort((a,b)=>a.next.getTime()-b.next.getTime());
  return <Shell><div className="mx-auto max-w-5xl"><header className="mb-9 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-sm text-muted-foreground">Votre mémoire externe</p><h1 className="text-3xl font-semibold tracking-tight">Rappels et dates</h1><p className="mt-2 text-sm text-muted-foreground">Ce qui mérite votre attention, au bon moment.</p></div><Modal title="Nouveau rappel" label="Rappel"><ReminderForm contacts={contacts}/></Modal></header>
    <div className="grid gap-8 lg:grid-cols-[1.35fr_.75fr]"><div className="space-y-8">
      <ReminderSection title="En retard" icon={<Clock3/>} reminders={overdue} empty="Aucun rappel en retard." destructive/>
      <ReminderSection title="À venir" icon={<Bell/>} reminders={upcoming} empty="Aucun rappel à venir."/>
      {totalDone>0&&<ReminderSection title="Terminés" icon={<Check/>} reminders={paginatedDone} empty="" completed/>}
    </div>
    <aside className="space-y-7"><div><div className="mb-4 flex items-center gap-2"><Cake className="size-4"/><h2 className="font-semibold">Anniversaires à venir</h2></div><div className="overflow-hidden rounded-xl border bg-card">{birthdays.map((contact,index)=><Link href={`/contacts/${contact.id}`} key={contact.id} className={`flex items-center gap-3 p-4 transition hover:bg-muted/60 ${index>0?"border-t":""}`}><Avatar className="size-9"><AvatarFallback>{initials(contact.firstName,contact.lastName)}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{contact.firstName} {contact.lastName}</p><p className="text-xs text-muted-foreground">{contact.next.toLocaleDateString("fr-FR",{day:"numeric",month:"long"})}</p></div><span className="text-xs text-muted-foreground">{Math.ceil((contact.next.getTime()-TODAY.getTime())/86_400_000)}j</span></Link>)}{!birthdays.length&&<p className="p-6 text-center text-sm text-muted-foreground">Aucun anniversaire dans les 90 prochains jours.</p>}</div></div><div><div className="mb-4 flex items-center gap-2"><CalendarHeart className="size-4"/><h2 className="font-semibold">Dates personnalisées</h2></div><div className="overflow-hidden rounded-xl border bg-card">{dates.map((item,index)=><Link href={`/contacts/${item.contactId}`} key={item.id} className={`block p-4 transition hover:bg-muted/60 ${index>0?"border-t":""}`}><div className="flex justify-between gap-2"><p className="truncate text-sm font-medium">{item.title}</p><span className="text-xs text-muted-foreground">{Math.ceil((item.next.getTime()-TODAY.getTime())/86_400_000)}j</span></div><p className="mt-1 text-xs text-muted-foreground">{item.contact.firstName} · {item.next.toLocaleDateString("fr-FR",{day:"numeric",month:"long"})}</p></Link>)}{!dates.length&&<p className="p-6 text-center text-sm text-muted-foreground">Aucune date personnalisée à venir.</p>}</div></div></aside></div>
    {totalDone>0&&<PaginationControls totalItems={totalDone} itemsPerPage={ITEMS_PER_PAGE} currentPage={currentPage}/>}
  </div></Shell>;
}

function ReminderSection({title,icon,reminders,empty,destructive=false,completed=false}:{title:string;icon:React.ReactNode;reminders:Array<{id:string;title:string;dueAt:Date;contactId:string;contact:{firstName:string;lastName:string}}>;empty:string;destructive?:boolean;completed?:boolean}) {
  return <section><div className="mb-3 flex items-center gap-2 text-sm font-semibold [&_svg]:size-4">{icon}<h2>{title}</h2><span className="ml-auto text-xs font-normal text-muted-foreground">{reminders.length}</span></div><div className="overflow-hidden rounded-xl border bg-card">{reminders.map((r,index)=><div key={r.id} className={`flex items-center gap-3 p-3 ${index>0?"border-t":""} ${completed?"opacity-60":""}`}><form action={toggleReminder}><input type="hidden" name="id" value={r.id}/><Button type="submit" variant="outline" size="icon-sm" className="rounded-full"><Check/></Button></form><Link href={`/contacts/${r.contactId}`} className="min-w-0 flex-1"><p className={`truncate text-sm font-medium ${completed?"line-through":""}`}>{r.title}</p><p className={`text-xs ${destructive?"text-destructive":"text-muted-foreground"}`}>{r.contact.firstName} {r.contact.lastName} · {r.dueAt.toLocaleDateString("fr-FR")}</p></Link>{!completed&&<form action={snoozeReminder}><input type="hidden" name="id" value={r.id}/><Button type="submit" variant="ghost" size="icon-sm" title="Reporter de 7 jours"><CalendarClock/></Button></form>}<Modal title="Modifier le rappel" label="" secondary><EditReminderForm reminder={r}/></Modal><form action={deleteReminder}><input type="hidden" name="id" value={r.id}/><Button type="submit" variant="ghost" size="icon-sm" title="Supprimer"><Trash2/></Button></form></div>)}{!reminders.length&&<p className="p-6 text-center text-sm text-muted-foreground">{empty}</p>}</div></section>;
}
