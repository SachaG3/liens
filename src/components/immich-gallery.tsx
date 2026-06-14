"use client";

import { useEffect, useState } from "react";
import { Images, LoaderCircle, UserRound } from "lucide-react";
import { linkImmichPerson } from "@/app/actions";
import { FormField, NativeSelect, SubmitButton } from "@/components/form-controls";
import { ModalForm } from "@/components/modal";
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
  if(!linked)return children;
  return <><div className="mb-6 flex w-fit rounded-lg border bg-muted/40 p-1">
    <Button type="button" size="sm" variant={view==="contact"?"default":"ghost"} onClick={()=>setView("contact")}><UserRound/>Fiche</Button>
    <Button type="button" size="sm" variant={view==="gallery"?"default":"ghost"} onClick={()=>setView("gallery")}><Images/>Photos Immich</Button>
  </div>{view==="contact"?children:<AsyncImmichGallery contactId={contactId}/>}</>;
}

function AsyncImmichGallery({contactId}:{contactId:string}) {
  const [assets,setAssets]=useState<ImmichAsset[]|null>(null);
  const [error,setError]=useState("");
  useEffect(()=>{let active=true;fetch(`/api/immich/contacts/${encodeURIComponent(contactId)}/gallery`).then(response=>response.ok?response.json():Promise.reject()).then(body=>{if(active)setAssets(body.assets)}).catch(()=>{if(active)setError("Impossible de charger les photos depuis Immich.")});return()=>{active=false}},[contactId]);
  if(error)return <section className="card p-6"><p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">{error}</p></section>;
  if(!assets)return <section className="card grid min-h-64 place-items-center p-6 text-sm text-muted-foreground"><LoaderCircle className="animate-spin"/>Chargement des photos Immich…</section>;
  return <section className="card p-6"><div className="mb-5"><h2 className="flex items-center gap-2 text-xl font-semibold"><Images className="size-5"/>Photos Immich</h2><p className="text-sm text-muted-foreground">{assets.length} photo{assets.length!==1?"s":""} récente{assets.length!==1?"s":""}</p></div>{assets.length?<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{assets.map(asset=><a key={asset.id} href={asset.url} target="_blank" rel="noreferrer" className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={asset.url} alt={asset.originalFileName||"Photo Immich"} loading="lazy" className="size-full object-cover transition duration-300 group-hover:scale-105"/>
    {asset.fileCreatedAt&&<span className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">{new Date(asset.fileCreatedAt).toLocaleDateString("fr-FR")}</span>}
  </a>)}</div>:<p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">Aucune photo reconnue pour cette personne dans Immich.</p>}</section>;
}
