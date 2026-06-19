"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bell, CalendarDays, CircleDot, Database, Gift, Import, MoreHorizontal, Network, PawPrint, Settings, UsersRound, WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  {href:"/",label:"Aujourd’hui",icon:CalendarDays},
  {href:"/contacts",label:"Personnes",icon:UsersRound},
  {href:"/reminders",label:"Rappels",icon:Bell},
  {href:"/circles",label:"Cercles",icon:CircleDot},
  {href:"/map",label:"Carte",icon:Network},
  {href:"/finances",label:"Finances",icon:WalletCards},
  {href:"/pets",label:"Animaux",icon:PawPrint},
  {href:"/gifts",label:"Cadeaux",icon:Gift},
  {href:"/stats",label:"Statistiques",icon:BarChart3},
  {href:"/data",label:"Données",icon:Database},
  {href:"/import",label:"Importer",icon:Import},
  {href:"/account",label:"Mon compte",icon:Settings},
];

export function NavLinks({mobile=false}:{mobile?:boolean}) {
  const path=usePathname();
  const active=(href:string)=>href==="/" ? path===href : path.startsWith(href);
  if(!mobile)return <nav className="space-y-1">{links.map(({href,label,icon:Icon})=><Link key={href} href={href} className={cn("flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",active(href)&&"bg-foreground text-background hover:bg-foreground hover:text-background")}><Icon className="size-4"/><span>{label}</span></Link>)}</nav>;
  const primary=links.slice(0,3),secondary=links.slice(3),secondaryActive=secondary.some(link=>active(link.href));
  return <nav className="grid h-14 grid-cols-4 gap-1">{primary.map(({href,label,icon:Icon})=><Link key={href} href={href} className={cn("flex h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium text-muted-foreground transition-colors",active(href)&&"bg-foreground text-background")}><Icon className="size-4 shrink-0"/><span className="max-w-full truncate">{label}</span></Link>)}<details className="group relative"><summary className={cn("flex h-12 cursor-pointer list-none flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium text-muted-foreground [&::-webkit-details-marker]:hidden",secondaryActive&&"bg-foreground text-background")}><MoreHorizontal className="size-4 shrink-0"/><span>Plus</span></summary><div className="absolute bottom-16 right-0 grid w-[min(22rem,calc(100vw-1.5rem))] grid-cols-2 gap-1 rounded-xl border bg-card p-2 shadow-xl">{secondary.map(({href,label,icon:Icon})=><Link key={href} href={href} className={cn("flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",active(href)&&"bg-foreground text-background")}><Icon className="size-4"/>{label}</Link>)}</div></details></nav>;
}
