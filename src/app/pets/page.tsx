import Link from "next/link";
import { Cake, PawPrint, Trash2, UsersRound } from "lucide-react";
import { deletePet } from "@/app/actions";
import { EditPetForm, PetForm } from "@/components/forms";
import { Modal } from "@/components/modal";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "@/components/profile-avatar";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function PetsPage() {
  const user=await requireUser();
  const [pets,people]=await Promise.all([
    db.pet.findMany({where:{userId:user.id},include:{owners:{include:{contact:true}}},orderBy:{name:"asc"}}),
    db.contact.findMany({where:{userId:user.id},select:{id:true,firstName:true,lastName:true},orderBy:[{firstName:"asc"},{lastName:"asc"}]}),
  ]);
  return <Shell><div className="mx-auto max-w-6xl"><header className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-sm text-muted-foreground">Membres de la famille</p><h1 className="text-3xl font-semibold tracking-tight">Animaux</h1><p className="mt-2 text-sm text-muted-foreground">Des fiches simples, liées à une ou plusieurs personnes.</p></div><Modal title="Ajouter un animal" label="Animal"><PetForm people={people}/></Modal></header>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{pets.map(pet=><article key={pet.id} className="card p-5"><div className="mb-5 flex items-start justify-between"><ProfileAvatar photo={pet.photo} name={pet.name} pet className="size-11"/><div className="flex gap-1"><Modal title={`Modifier ${pet.name}`} label="" secondary><EditPetForm pet={pet} people={people}/></Modal><form action={deletePet}><input type="hidden" name="id" value={pet.id}/><Button type="submit" variant="ghost" size="icon-sm" title="Supprimer"><Trash2/></Button></form></div></div><h2 className="text-xl font-semibold">{pet.name}</h2><p className="mt-1 text-sm text-muted-foreground">{pet.species}{pet.breed&&` · ${pet.breed}`}</p>{pet.birthday&&<p className="mt-4 flex items-center gap-2 text-sm"><Cake className="size-4 text-muted-foreground"/>{pet.birthday.toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}</p>}<div className="mt-4"><p className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground"><UsersRound className="size-3.5"/>Personnes liées</p><div className="flex flex-wrap gap-1.5">{pet.owners.map(({contact})=><Link key={contact.id} href={`/contacts/${contact.id}`} className="rounded-full border bg-background px-2.5 py-1 text-xs hover:bg-muted">{contact.firstName} {contact.lastName}</Link>)}{!pet.owners.length&&<span className="text-xs text-muted-foreground">Aucune personne liée</span>}</div></div>{pet.notes&&<p className="mt-4 whitespace-pre-wrap rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">{pet.notes}</p>}</article>)}{!pets.length&&<div className="col-span-full rounded-xl border border-dashed p-12 text-center"><PawPrint className="mx-auto mb-3 size-6 text-muted-foreground"/><p className="font-medium">Aucun animal enregistré</p><p className="mt-1 text-sm text-muted-foreground">Ajoutez une première fiche et liez-la aux personnes concernées.</p></div>}</div>
  </div></Shell>;
}
