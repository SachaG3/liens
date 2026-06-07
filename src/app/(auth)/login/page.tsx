import Link from "next/link";
import { login } from "@/app/actions";
import { FormField, SubmitButton, TextField } from "@/components/form-controls";

export default async function Login({ searchParams }: { searchParams: Promise<{error?:string}> }) {
  const { error } = await searchParams;
  return <div><div className="mb-8"><div className="mb-8 flex items-center gap-2 lg:hidden"><span className="grid size-8 place-items-center rounded-lg bg-foreground text-sm font-bold text-background">L</span><b>Liens</b></div><p className="mb-2 text-sm font-medium text-muted-foreground">Heureux de vous revoir</p><h1 className="text-3xl font-semibold tracking-tight">Connectez-vous</h1><p className="mt-2 text-sm text-muted-foreground">Retrouvez les personnes qui comptent.</p></div>
    {error && <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">Identifiants incorrects.</p>}
    <form action={login} noValidate className="grid gap-4"><FormField label="Adresse e-mail"><TextField type="email" name="email" required placeholder="vous@exemple.fr"/></FormField><FormField label="Mot de passe"><TextField type="password" name="password" required/></FormField><SubmitButton>Se connecter</SubmitButton></form>
    <p className="mt-6 text-center text-sm text-muted-foreground">Pas encore de compte ? <Link className="font-medium text-foreground underline underline-offset-4" href="/register">Créer votre espace</Link></p></div>;
}
