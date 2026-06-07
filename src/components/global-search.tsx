"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, CalendarDays, CircleDot, Database, Gift, Network, PawPrint, Search, Tags, UserRound, WalletCards } from "lucide-react";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

type SearchItem={id:string;label:string;description:string;href:string;type:"person"|"circle"|"relation"|"pet"};

export function GlobalSearch({ items }: { items:SearchItem[] }) {
  const [open,setOpen]=useState(false);const router=useRouter();
  useEffect(()=>{const down=(event:KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){event.preventDefault();setOpen(value=>!value)}};document.addEventListener("keydown",down);return()=>document.removeEventListener("keydown",down)},[]);
  function go(href:string){setOpen(false);router.push(href)}
  return <><button onClick={()=>setOpen(true)} className="hidden h-8 w-64 items-center gap-2 rounded-md border bg-card px-3 text-left text-sm text-muted-foreground shadow-xs md:flex"><Search className="size-4"/>Rechercher…<kbd className="ml-auto text-[10px]">⌘ K</kbd></button>
    <CommandDialog open={open} onOpenChange={setOpen} title="Recherche globale" description="Rechercher une personne, un cercle ou une page">
      <Command><CommandInput placeholder="Rechercher une personne ou un cercle…"/><CommandList><CommandEmpty>Aucun résultat.</CommandEmpty>
        <CommandGroup heading="Navigation"><CommandItem onSelect={()=>go("/contacts")}><UserRound/>Toutes les personnes</CommandItem><CommandItem onSelect={()=>go("/reminders")}><CalendarDays/>Rappels et dates</CommandItem><CommandItem onSelect={()=>go("/circles")}><CircleDot/>Tous les cercles</CommandItem><CommandItem onSelect={()=>go("/map")}><Network/>Carte relationnelle</CommandItem><CommandItem onSelect={()=>go("/finances")}><WalletCards/>Finances</CommandItem><CommandItem onSelect={()=>go("/pets")}><PawPrint/>Animaux</CommandItem><CommandItem onSelect={()=>go("/gifts")}><Gift/>Idées cadeaux</CommandItem><CommandItem onSelect={()=>go("/stats")}><BarChart3/>Statistiques relationnelles</CommandItem><CommandItem onSelect={()=>go("/data")}><Database/>Données et export</CommandItem></CommandGroup>
        <CommandGroup heading="Personnes, animaux, cercles et relations">{items.map(item=><CommandItem key={`${item.type}-${item.id}`} value={`${item.label} ${item.description}`} onSelect={()=>go(item.href)}>{item.type==="person"?<UserRound/>:item.type==="pet"?<PawPrint/>:item.type==="circle"?<CircleDot/>:<Tags/>}<div><p>{item.label}</p><p className="text-xs text-muted-foreground">{item.description}</p></div></CommandItem>)}</CommandGroup>
      </CommandList></Command>
    </CommandDialog></>;
}
