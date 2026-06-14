import Link from "next/link";
import { register } from "@/app/actions";
import { FormField, SubmitButton, TextField } from "@/components/form-controls";
import { Brand } from "@/components/brand";

export default async function Register({ searchParams }: { searchParams: Promise<{error?:string}> }) {
  const { error } = await searchParams;
  return <div><div className="mb-8"><Brand className="mb-8 lg:hidden"/><p className="mb-2 text-sm font-medium text-muted-foreground">Votre carnet relationnel privé</p><h1 className="text-3xl font-semibold tracking-tight">Créer votre espace</h1><p className="mt-2 text-sm text-muted-foreground">Quelques secondes suffisent pour commencer.</p></div>
    {error && <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error === "exists" ? "Cet e-mail existe déjà." : "Vérifiez les champs. Le mot de passe doit faire 8 caractères."}</p>}
    <form action={register} noValidate className="grid gap-4"><FormField label="Votre nom"><TextField name="name" required placeholder="Sacha Guignard"/></FormField><FormField label="Adresse e-mail"><TextField type="email" name="email" required placeholder="vous@exemple.fr"/></FormField><FormField label="Mot de passe" hint="8 caractères minimum"><TextField type="password" name="password" minLength={8} required/></FormField><SubmitButton>Créer mon espace</SubmitButton></form>
    <p className="mt-6 text-center text-sm text-muted-foreground">Déjà inscrit ? <Link className="font-medium text-foreground underline underline-offset-4" href="/login">Se connecter</Link></p></div>;
}
