import { Images } from "lucide-react";
import { linkImmichPerson } from "@/app/actions";
import { FormField, NativeSelect, SubmitButton } from "@/components/form-controls";
import { ModalForm } from "@/components/modal";
import type { ImmichAsset, ImmichPerson } from "@/lib/immich";
import { immichAssetUrl } from "@/lib/immich";

export function ImmichPersonForm({ contactId, selectedId, people, error }: { contactId: string; selectedId: string; people: ImmichPerson[]; error?: string }) {
  const selectedIsMissing=selectedId&&!people.some(person=>person.id===selectedId);
  return <ModalForm action={linkImmichPerson} resetOnSuccess={false} refreshOnSuccess className="grid gap-4">
    <input type="hidden" name="contactId" value={contactId}/>
    <FormField label="Personne Immich" hint="La reconnaissance faciale Immich détermine les photos affichées.">
      <NativeSelect name="immichPersonId" defaultValue={selectedId}>
        <option value="">Aucune personne liée</option>
        {selectedIsMissing&&<option value={selectedId}>Personne Immich actuellement liée</option>}
        {people.map(person=><option key={person.id} value={person.id}>{person.name||`Personne sans nom · ${person.id.slice(0,8)}`}</option>)}
      </NativeSelect>
    </FormField>
    {error&&<p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">{error}</p>}
    <SubmitButton>Enregistrer la liaison</SubmitButton>
  </ModalForm>;
}

export function ImmichGallery({ assets, error }: { assets: ImmichAsset[]; error?: string }) {
  if (error) return <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">{error}</p>;
  if (!assets.length) return <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">Aucune photo reconnue pour cette personne dans Immich.</p>;
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{assets.map(asset=><a key={asset.id} href={immichAssetUrl(asset.id)} target="_blank" rel="noreferrer" className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
    {/* The signed local proxy keeps the Immich API key on the server. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={immichAssetUrl(asset.id)} alt={asset.originalFileName||"Photo Immich"} loading="lazy" className="size-full object-cover transition duration-300 group-hover:scale-105"/>
    {asset.fileCreatedAt&&<span className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">{new Date(asset.fileCreatedAt).toLocaleDateString("fr-FR")}</span>}
  </a>)}</div>;
}

export function ImmichGalleryTitle({ count }: { count: number }) {
  return <div><h2 className="flex items-center gap-2 text-xl font-semibold"><Images className="size-5"/>Photos Immich</h2><p className="text-sm text-muted-foreground">{count} photo{count!==1?"s":""} récente{count!==1?"s":""}</p></div>;
}
