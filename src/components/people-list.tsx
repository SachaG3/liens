"use client";
import { useMemo, useState, useTransition, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Ban, Search, UsersRound, X } from "lucide-react";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/form-controls";
import { cn } from "@/lib/utils";

type Person={id:string;firstName:string;lastName:string;photo:string;email:string;phone:string;company:string;followUpStatus:string;relationTags:string[];score:number;lastInteraction:string|null;circles:Array<{id:string;name:string;color:string}>};

function state(score:number) {
  if(score>=75)return {label:"À jour",dot:"bg-emerald-500"};
  if(score>=45)return {label:"Bientôt",dot:"bg-amber-500"};
  return {label:"À reconnecter",dot:"bg-rose-500"};
}

export function PeopleList({people,circles,totalCount,totalAllContacts,initialRelation="all",initialCircle="all",initialQuery="",initialSort="priority",initialStatus="all"}:{people:Person[];circles:Array<{id:string;name:string;color:string}>;totalCount:number;totalAllContacts:number;initialRelation?:string;initialCircle?:string;initialQuery?:string;initialSort?:string;initialStatus?:string}) {
  const router=useRouter();
  const pathname=usePathname();
  const searchParams=useSearchParams();
  const [isPending,startTransition]=useTransition();

  const [query,setQuery]=useState(initialQuery);
  const [circle,setCircle]=useState(initialCircle);
  const [relation,setRelation]=useState(initialRelation);
  const [sort,setSort]=useState(initialSort);
  const [status,setStatus]=useState(initialStatus);
  const debounceTimer=useRef<NodeJS.Timeout|null>(null);

  const relations=useMemo(()=>[...new Set(people.flatMap(person=>person.relationTags))].sort((a,b)=>a.localeCompare(b,"fr")),[people]);
  const hasFilters=query!==""||circle!=="all"||relation!=="all"||status!=="all";

  const updateURL=(params:Record<string,string>)=>{
    const newParams=new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key,value])=>{
      if(value==="all"||value===""){
        newParams.delete(key);
      }else{
        newParams.set(key,value);
      }
    });
    newParams.delete("page"); // Reset page on filter change
    startTransition(()=>{
      router.push(`${pathname}?${newParams.toString()}`);
    });
  };

  const handleQueryChange=(value:string)=>{
    setQuery(value);
    // Debounce la recherche de 400ms
    if(debounceTimer.current){
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current=setTimeout(()=>{
      updateURL({q:value,circle,relation,sort,status});
    },400);
  };

  // Cleanup du timer au démontage
  useEffect(()=>{
    return ()=>{
      if(debounceTimer.current){
        clearTimeout(debounceTimer.current);
      }
    };
  },[]);

  const handleCircleChange=(value:string)=>{
    setCircle(value);
    updateURL({q:query,circle:value,relation,sort,status});
  };

  const handleRelationChange=(value:string)=>{
    setRelation(value);
    updateURL({q:query,circle,relation:value,sort,status});
  };

  const handleSortChange=(value:string)=>{
    setSort(value);
    updateURL({q:query,circle,relation,sort:value,status});
  };
  const handleStatusChange=(value:string)=>{setStatus(value);updateURL({q:query,circle,relation,sort,status:value})};

  const clearFilters=()=>{
    setQuery("");
    setCircle("all");
    setRelation("all");
    setStatus("all");
    startTransition(()=>{
      router.push(pathname);
    });
  };
  return <><div className="mb-3 grid gap-3 sm:grid-cols-[1fr_180px_180px_180px]"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input value={query} onChange={e=>handleQueryChange(e.target.value)} placeholder="Nom, téléphone, entreprise ou relation…" className="pl-9" disabled={isPending}/></div><NativeSelect value={relation} onChange={e=>handleRelationChange(e.target.value)} disabled={isPending}><option value="all">Toutes les relations</option>{relations.map(tag=><option key={tag} value={tag}>{tag}</option>)}</NativeSelect><NativeSelect value={status} onChange={e=>handleStatusChange(e.target.value)} disabled={isPending}><option value="all">Tous les statuts</option><option value="active">Suivi actif</option><option value="no_contact">Ne pas recontacter</option><option value="deceased">Décédé</option></NativeSelect><NativeSelect value={sort} onChange={e=>handleSortChange(e.target.value)} disabled={isPending}><option value="priority">Priorité relationnelle</option><option value="name">Nom</option><option value="recent">Échange récent</option></NativeSelect></div>
    <div className="mb-5 flex items-center gap-2"><div className="flex flex-1 gap-1 overflow-x-auto">{[{id:"all",name:"Tous les cercles"},...circles].map(c=><button key={c.id} onClick={()=>handleCircleChange(c.id)} disabled={isPending} className={cn("shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50",circle===c.id&&"bg-foreground text-background hover:bg-foreground")}>{c.name}</button>)}</div><span className="hidden shrink-0 text-xs text-muted-foreground sm:block">{hasFilters?`${totalCount} sur ${totalAllContacts}`:totalCount} affichée{totalCount!==1?"s":""}</span>{hasFilters&&<Button variant="ghost" size="icon-sm" title="Effacer les filtres" onClick={clearFilters} disabled={isPending}><X/></Button>}</div>
    <div className={cn("overflow-hidden rounded-xl border bg-card shadow-xs",isPending&&"opacity-50")}>{people.map((p,index)=>{const s=state(p.score);const inactive=p.followUpStatus!=="active";return <Link href={`/contacts/${p.id}`} key={p.id} className={cn("group grid items-center gap-4 p-4 transition hover:bg-muted/60 sm:grid-cols-[1.4fr_1fr_1fr_auto]",index>0&&"border-t",inactive&&"bg-muted/20")}><div className="flex min-w-0 items-center gap-3"><ProfileAvatar photo={p.photo} name={p.firstName+" "+p.lastName}/><div className="min-w-0"><div className="flex items-center gap-1.5"><p className="truncate text-sm font-medium">{p.firstName} {p.lastName}</p>{p.relationTags.slice(0,2).map(tag=><span key={tag} className="hidden rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground md:inline">{tag}</span>)}{p.relationTags.length>2&&<span className="hidden text-[11px] text-muted-foreground md:inline">+{p.relationTags.length-2}</span>}</div><p className="truncate text-xs text-muted-foreground">{p.email||p.phone||"Aucune coordonnée"}</p></div></div><p className="hidden truncate text-sm text-muted-foreground sm:block">{p.company||p.relationTags.join(" · ")||"Personnel"}</p><div className="flex items-center gap-2 text-sm">{inactive?<><Ban className="size-3.5 text-muted-foreground"/><span>{p.followUpStatus==="deceased"?"Décédé":"Ne pas recontacter"}</span></>:<><span className={`size-2 rounded-full ${s.dot}`}/><span className="hidden sm:inline">{s.label}</span><span className="ml-auto font-medium tabular-nums sm:ml-1">{p.score}%</span></>}</div><ArrowUpRight className="hidden size-4 text-muted-foreground opacity-0 transition group-hover:opacity-100 sm:block"/></Link>})}{!people.length&&<div className="grid place-items-center p-16 text-center"><UsersRound className="mb-3 size-6 text-muted-foreground"/><p className="text-sm font-medium">Aucune personne trouvée</p><p className="mt-1 text-xs text-muted-foreground">Modifiez votre recherche ou votre filtre.</p></div>}</div></>;
}
