"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Images, LoaderCircle, UserRound, X } from "lucide-react";
import { linkImmichPerson } from "@/app/actions";
import { FormField, NativeSelect, SubmitButton } from "@/components/form-controls";
import { ModalForm } from "@/components/modal";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ImmichPerson = { id:string;name:string };
type ImmichAsset = { id:string;originalFileName?:string;fileCreatedAt?:string;url:string };

export function AsyncImmichPersonForm({ contactId, selectedId }: { contactId: string; selectedId: string }) {
  const [people,setPeople]=useState<ImmichPerson[]>([]);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  useEffect(()=>{let active=true;fetch("/api/immich/people").then(response=>response.ok?response.json():Promise.reject()).then(body=>{if(active)setPeople(body.people)}).catch(()=>{if(active)setError("Impossible de charger la liste des personnes Immich.")}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);
  const selectedIsMissing=selectedId&&!people.some(person=>person.id===selectedId);
  return <ModalForm action={linkImmichPerson} resetOnSuccess={false} refreshOnSuccess className="grid gap-4">
    <input type="hidden" name="contactId" value={contactId}/>
    <FormField label="Personne Immich" hint="La reconnaissance faciale Immich détermine les photos affichées.">
      <NativeSelect key={loading?"loading":"loaded"} name="immichPersonId" defaultValue={selectedId} disabled={loading}>
        <option value="">{loading?"Chargement…":"Aucune personne liée"}</option>
        {selectedIsMissing&&<option value={selectedId}>Personne Immich actuellement liée</option>}
        {people.map(person=><option key={person.id} value={person.id}>{person.name}</option>)}
      </NativeSelect>
    </FormField>
    {error&&<p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">{error}</p>}
    <SubmitButton>Enregistrer la liaison</SubmitButton>
  </ModalForm>;
}

export function ContactViewSwitcher({ contactId, linked, children }: { contactId:string;linked:boolean;children:React.ReactNode }) {
  const [view,setView]=useState<"contact"|"gallery">("contact");
  const [galleryOpened,setGalleryOpened]=useState(false);
  if(!linked)return children;
  const tabClass=(active:boolean)=>cn("flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition",active?"bg-card text-foreground shadow-sm ring-1 ring-border":"text-muted-foreground hover:bg-card/60 hover:text-foreground");
  return <><div role="tablist" aria-label="Vue de la personne" className="mb-6 flex w-fit gap-1 rounded-xl border bg-muted/50 p-1.5 shadow-xs">
    <button type="button" role="tab" aria-selected={view==="contact"} className={tabClass(view==="contact")} onClick={()=>setView("contact")}><UserRound className="size-4"/>Fiche</button>
    <button type="button" role="tab" aria-selected={view==="gallery"} className={tabClass(view==="gallery")} onClick={()=>{setGalleryOpened(true);setView("gallery")}}><Images className="size-4"/>Photos Immich</button>
  </div><div hidden={view!=="contact"}>{children}</div>{galleryOpened&&<div hidden={view!=="gallery"}><AsyncImmichGallery contactId={contactId}/></div>}</>;
}

function AsyncImmichGallery({contactId}:{contactId:string}) {
  const [assets,setAssets]=useState<ImmichAsset[]>([]);
  const [nextPage,setNextPage]=useState<number|null>(1);
  const [total,setTotal]=useState(0);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  const [selectedIndex,setSelectedIndex]=useState<number|null>(null);
  async function loadMore() {
    if(!nextPage||loading)return 0;
    setLoading(true);setError("");
    try {
      const response=await fetch(`/api/immich/contacts/${encodeURIComponent(contactId)}/gallery?page=${nextPage}`);
      if(!response.ok)throw new Error();
      const body=await response.json();
      const additions=(body.assets as ImmichAsset[]).filter(asset=>!assets.some(item=>item.id===asset.id));
      setAssets(current=>[...current,...additions]);
      setNextPage(body.nextPage);setTotal(body.total);
      return additions.length;
    } catch {
      setError("Impossible de charger les photos depuis Immich.");
      return 0;
    } finally {
      setLoading(false);
    }
  }
  useEffect(()=>{let active=true;fetch(`/api/immich/contacts/${encodeURIComponent(contactId)}/gallery?page=1`).then(response=>response.ok?response.json():Promise.reject()).then(body=>{if(active){setAssets(body.assets);setNextPage(body.nextPage);setTotal(body.total)}}).catch(()=>{if(active)setError("Impossible de charger les photos depuis Immich.")}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[contactId]);
  async function showNext() {
    if(selectedIndex===null)return;
    if(selectedIndex<assets.length-1){setSelectedIndex(selectedIndex+1);return}
    const firstNewIndex=assets.length;
    if(await loadMore()>0)setSelectedIndex(firstNewIndex);
  }
  if(error&&!assets.length)return <section className="card p-6"><p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">{error}</p></section>;
  if(loading&&!assets.length)return <section className="card grid min-h-64 place-items-center p-6 text-sm text-muted-foreground"><LoaderCircle className="animate-spin"/>Chargement des photos Immich…</section>;
  return <section className="card p-6"><div className="mb-5"><h2 className="flex items-center gap-2 text-xl font-semibold"><Images className="size-5"/>Photos Immich</h2><p className="text-sm text-muted-foreground">{assets.length}{total>assets.length?` sur ${total}`:""} photo{total!==1?"s":""} chargée{assets.length!==1?"s":""}</p></div>{assets.length?<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{assets.map((asset,index)=><button type="button" key={asset.id} onClick={()=>setSelectedIndex(index)} className="group relative aspect-square overflow-hidden rounded-lg bg-muted text-left">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={asset.url} alt={asset.originalFileName||"Photo Immich"} loading="lazy" className="size-full object-cover transition duration-300 group-hover:scale-105"/>
    {asset.fileCreatedAt&&<span className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">{new Date(asset.fileCreatedAt).toLocaleDateString("fr-FR")}</span>}
  </button>)}</div>:<p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">Aucune photo reconnue pour cette personne dans Immich.</p>}
  {error&&<p className="mt-4 rounded-lg border border-dashed p-3 text-center text-sm text-muted-foreground">{error}</p>}
  {nextPage&&<Button type="button" variant="outline" size="lg" className="mx-auto mt-6 flex" disabled={loading} onClick={()=>void loadMore()}>{loading&&<LoaderCircle className="animate-spin"/>}{loading?"Chargement…":"Charger 24 photos supplémentaires"}</Button>}
  {selectedIndex!==null&&<PhotoViewer assets={assets} index={selectedIndex} hasMore={!!nextPage} loading={loading} onPrevious={()=>setSelectedIndex(Math.max(0,selectedIndex-1))} onNext={()=>void showNext()} onClose={()=>setSelectedIndex(null)}/>}</section>;
}

function PhotoViewer({assets,index,hasMore,loading,onPrevious,onNext,onClose}:{assets:ImmichAsset[];index:number;hasMore:boolean;loading:boolean;onPrevious:()=>void;onNext:()=>void;onClose:()=>void}) {
  const asset=assets[index];
  useEffect(()=>{const keydown=(event:KeyboardEvent)=>{if(event.key==="Escape")onClose();if(event.key==="ArrowLeft"&&index>0)onPrevious();if(event.key==="ArrowRight"&&(index<assets.length-1||hasMore))onNext()};window.addEventListener("keydown",keydown);return()=>window.removeEventListener("keydown",keydown)},[assets.length,hasMore,index,onClose,onNext,onPrevious]);
  return <div role="dialog" aria-modal="true" aria-label="Lecteur de photos Immich" className="fixed inset-0 z-50 grid grid-rows-[auto_minmax(0,1fr)_auto] bg-black/95 p-3 text-white sm:p-5">
    <div className="flex items-center justify-between gap-3"><p className="truncate text-sm text-white/70">{index+1} / {assets.length}{asset.originalFileName&&` · ${asset.originalFileName}`}</p><button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20" title="Fermer"><X/></button></div>
    <div className="relative flex min-h-0 min-w-0 items-center justify-center overflow-hidden py-2">
      <button type="button" onClick={onPrevious} disabled={index===0} className="absolute left-0 z-10 grid size-11 place-items-center rounded-full bg-black/50 transition hover:bg-white/15 disabled:opacity-20 sm:left-3" title="Photo précédente"><ChevronLeft/></button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset.url} alt={asset.originalFileName||"Photo Immich"} className="block h-auto w-auto max-h-[calc(100dvh-7rem)] max-w-[calc(100vw-1.5rem)] object-contain sm:max-w-[calc(100vw-2.5rem)]"/>
      <button type="button" onClick={onNext} disabled={loading||index===assets.length-1&&!hasMore} className="absolute right-0 z-10 grid size-11 place-items-center rounded-full bg-black/50 transition hover:bg-white/15 disabled:opacity-20 sm:right-3" title={index===assets.length-1&&hasMore?"Charger et afficher la photo suivante":"Photo suivante"}>{loading&&index===assets.length-1?<LoaderCircle className="animate-spin"/>:<ChevronRight/>}</button>
    </div>
    <p className="pt-3 text-center text-xs text-white/55">{index===assets.length-1&&hasMore?"La photo suivante chargera automatiquement le prochain lot.":asset.fileCreatedAt?new Date(asset.fileCreatedAt).toLocaleDateString("fr-FR",{dateStyle:"long"}):"Utilisez les flèches du clavier pour naviguer"}</p>
  </div>;
}
