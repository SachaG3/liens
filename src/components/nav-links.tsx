"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bell, CalendarDays, CircleDot, Database, Gift, Import, Network, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  {href:"/",label:"Aujourd’hui",icon:CalendarDays},
  {href:"/contacts",label:"Personnes",icon:UsersRound},
  {href:"/reminders",label:"Rappels",icon:Bell},
  {href:"/circles",label:"Cercles",icon:CircleDot},
  {href:"/map",label:"Carte",icon:Network},
  {href:"/gifts",label:"Cadeaux",icon:Gift},
  {href:"/stats",label:"Statistiques",icon:BarChart3},
  {href:"/data",label:"Données",icon:Database},
  {href:"/import",label:"Importer",icon:Import},
];

export function NavLinks() {
  const path=usePathname();
  return <nav className="flex gap-1 overflow-x-auto md:block md:space-y-1">{links.map(({href,label,icon:Icon})=>{const active=href==="/" ? path===href : path.startsWith(href);return <Link key={href} href={href} className={cn("flex size-10 shrink-0 items-center justify-center gap-3 rounded-lg text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:h-9 md:w-auto md:justify-start md:px-3 md:text-sm",active&&"bg-foreground text-background hover:bg-foreground hover:text-background")}><Icon className="size-4"/><span className="hidden md:inline">{label}</span></Link>})}</nav>;
}
