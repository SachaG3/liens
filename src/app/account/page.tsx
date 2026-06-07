import { AccountForm, PasswordForm } from "@/components/forms";
import { Shell } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { ProfileAvatar } from "@/components/profile-avatar";

export default async function AccountPage() {
  const user=await requireUser();
  return <Shell><div className="mx-auto max-w-3xl"><header className="mb-8 flex items-center gap-4"><ProfileAvatar photo={user.photo} name={user.name} className="size-16"/><div><p className="mb-1 text-sm text-muted-foreground">Préférences personnelles</p><h1 className="text-3xl font-semibold tracking-tight">Mon compte</h1><p className="mt-1 text-sm text-muted-foreground">Modifiez votre identité de connexion et sécurisez votre accès.</p></div></header><div className="grid gap-6 md:grid-cols-2"><section className="card p-6"><h2 className="mb-1 text-xl font-semibold">Profil</h2><p className="mb-5 text-sm text-muted-foreground">Votre photo apparaît dans votre espace personnel.</p><AccountForm user={user}/></section><section className="card p-6"><h2 className="mb-1 text-xl font-semibold">Mot de passe</h2><p className="mb-5 text-sm text-muted-foreground">Vous serez déconnecté après le changement.</p><PasswordForm/></section></div></div></Shell>;
}
