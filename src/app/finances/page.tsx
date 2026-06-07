import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Check, Trash2 } from "lucide-react";
import { deleteDebt, toggleDebt } from "@/app/actions";
import { DebtForm } from "@/components/forms";
import { Modal } from "@/components/modal";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function FinancesPage() {
  const user=await requireUser();
  const [debts,people]=await Promise.all([
    db.debt.findMany({where:{userId:user.id},include:{contact:true},orderBy:[{settled:"asc"},{dueAt:"asc"},{createdAt:"desc"}]}),
    db.contact.findMany({where:{userId:user.id},select:{id:true,firstName:true,lastName:true},orderBy:[{firstName:"asc"},{lastName:"asc"}]}),
  ]);
  const open=debts.filter(debt=>!debt.settled),settled=debts.filter(debt=>debt.settled);
  const totals=(direction:string)=>open.filter(debt=>debt.direction===direction).reduce((map,debt)=>map.set(debt.currency,(map.get(debt.currency)??0)+debt.amount),new Map<string,number>());
  return <Shell><div className="mx-auto max-w-5xl"><header className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-sm text-muted-foreground">Entre proches, sans ambiguïté</p><h1 className="text-3xl font-semibold tracking-tight">Finances</h1><p className="mt-2 text-sm text-muted-foreground">Suivez simplement ce que vous devez et ce que l’on vous doit.</p></div><Modal title="Ajouter une dette" label="Dette"><DebtForm people={people}/></Modal></header>
    <div className="mb-8 grid gap-3 sm:grid-cols-2"><TotalCard title="On me doit" icon={<ArrowDownLeft/>} totals={totals("owed_to_me")} positive/><TotalCard title="Je dois" icon={<ArrowUpRight/>} totals={totals("i_owe")}/></div>
    <DebtSection title="En cours" debts={open}/>{settled.length>0&&<DebtSection title="Réglées" debts={settled} completed/>}
  </div></Shell>;
}

function TotalCard({title,icon,totals,positive=false}:{title:string;icon:React.ReactNode;totals:Map<string,number>;positive?:boolean}) {
  return <section className="card p-5"><div className={`mb-4 flex items-center gap-2 text-sm font-medium ${positive?"text-emerald-700 dark:text-emerald-300":"text-amber-700 dark:text-amber-300"}`}>{icon}{title}</div><div className="flex flex-wrap gap-x-4 gap-y-1">{totals.size?[...totals].map(([currency,amount])=><b key={currency} className="text-2xl">{money(amount,currency)}</b>):<b className="text-2xl">0 €</b>}</div></section>;
}

function DebtSection({title,debts,completed=false}:{title:string;debts:Array<{id:string;direction:string;amount:number;currency:string;title:string;note:string;dueAt:Date|null;contactId:string;contact:{firstName:string;lastName:string}}>;completed?:boolean}) {
  return <section className="mb-8"><div className="mb-3 flex items-center gap-2"><h2 className="font-semibold">{title}</h2><span className="text-xs text-muted-foreground">{debts.length}</span></div><div className="overflow-hidden rounded-xl border bg-card">{debts.map((debt,index)=><div key={debt.id} className={`flex items-start gap-3 p-4 ${index>0?"border-t":""} ${completed?"opacity-55":""}`}><form action={toggleDebt}><input type="hidden" name="id" value={debt.id}/><Button type="submit" variant="outline" size="icon-sm" className="rounded-full"><Check/></Button></form><Link href={`/contacts/${debt.contactId}`} className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><b className={completed?"line-through":""}>{debt.title}</b><span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${debt.direction==="owed_to_me"?"bg-emerald-500/10 text-emerald-700 dark:text-emerald-300":"bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>{debt.direction==="owed_to_me"?"On me doit":"Je dois"}</span></div><p className="mt-1 text-sm text-muted-foreground">{debt.contact.firstName} {debt.contact.lastName}{debt.dueAt&&` · ${debt.dueAt.toLocaleDateString("fr-FR")}`}</p>{debt.note&&<p className="mt-1 text-xs text-muted-foreground">{debt.note}</p>}</Link><b className="shrink-0">{money(debt.amount,debt.currency)}</b><form action={deleteDebt}><input type="hidden" name="id" value={debt.id}/><Button type="submit" variant="ghost" size="icon-sm" title="Supprimer"><Trash2/></Button></form></div>)}{!debts.length&&<p className="p-8 text-center text-sm text-muted-foreground">Aucune dette en cours.</p>}</div></section>;
}

function money(amount:number,currency:string){return new Intl.NumberFormat("fr-FR",{style:"currency",currency}).format(amount)}
