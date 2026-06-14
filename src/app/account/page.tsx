import { AccountForm, PasswordForm } from "@/components/forms";
import { Shell } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { ProfileAvatar } from "@/components/profile-avatar";
import { db } from "@/lib/db";
import Link from "next/link";
import { Bell, UserRound } from "lucide-react";
import { Modal } from "@/components/modal";
import { NotificationActions, NotificationSettingsForm } from "@/components/notification-settings-form";

export default async function AccountPage({searchParams}:{searchParams:Promise<{notificationTest?:string}>}) {
  const user=await requireUser();
  const {notificationTest}=await searchParams;
  const [people,notificationPreference]=await Promise.all([
    db.contact.findMany({where:{userId:user.id},select:{id:true,firstName:true,lastName:true},orderBy:[{firstName:"asc"},{lastName:"asc"}]}),
    db.notificationPreference.findUnique({where:{userId:user.id}}),
  ]);
  const mother=people.find(person=>person.id===user.motherId),father=people.find(person=>person.id===user.fatherId),spouse=people.find(person=>person.id===user.spouseId);
  const configured=!!notificationPreference&&[notificationPreference.emailEnabled,notificationPreference.discordEnabled,notificationPreference.signalEnabled,notificationPreference.ntfyEnabled].some(Boolean);
  return <Shell><div className="mx-auto max-w-3xl"><header className="mb-8 flex items-center gap-4"><ProfileAvatar photo={user.photo} name={user.name} className="size-16"/><div><p className="mb-1 text-sm text-muted-foreground">Préférences personnelles</p><h1 className="text-3xl font-semibold tracking-tight">Mon compte</h1><p className="mt-1 text-sm text-muted-foreground">Modifiez votre identité de connexion et sécurisez votre accès.</p></div></header>
    {notificationTest&&<NotificationResult result={notificationTest}/>}
    {(mother||father||spouse)&&<section className="card mb-6 p-4"><div className="flex flex-wrap items-center gap-2"><span className="mr-2 flex items-center gap-2 text-sm font-medium"><UserRound className="size-4"/>Généalogie & Partenaire</span>{mother&&<ParentLink label="Mère" person={mother}/>} {father&&<ParentLink label="Père" person={father}/>} {spouse&&<ParentLink label="Partenaire" person={spouse}/>}<Link href="/map" className="ml-auto text-xs font-medium text-muted-foreground hover:text-foreground">Voir l’arbre</Link></div></section>}
    <section className="card mb-6 p-6"><div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-semibold"><Bell className="size-5"/>Notifications</h2><p className="mt-1 text-sm text-muted-foreground">Recevez uniquement les rappels arrivés à échéance.</p></div><Modal title="Configurer les notifications" label={configured?"Modifier":"Configurer"} secondary wide description="Activez seulement les canaux que vous utilisez."><NotificationSettingsForm preference={notificationPreference} defaultEmail={user.email}/></Modal></div><NotificationActions configured={configured}/></section>
    <div className="grid gap-6 md:grid-cols-2"><section className="card p-6"><h2 className="mb-1 text-xl font-semibold">Profil, généalogie & couple</h2><p className="mb-5 text-sm text-muted-foreground">Définissez vos parents et votre partenaire pour enrichir l’arbre familial.</p><AccountForm user={user} people={people}/></section><section className="card p-6"><h2 className="mb-1 text-xl font-semibold">Mot de passe</h2><p className="mb-5 text-sm text-muted-foreground">Vous serez déconnecté après le changement.</p><PasswordForm/></section></div></div></Shell>;
}

function ParentLink({label,person}:{label:string;person:{id:string;firstName:string;lastName:string}}) {
  return <Link href={`/contacts/${person.id}`} className="rounded-full border bg-muted/50 px-3 py-1.5 text-xs font-medium hover:bg-muted">{label} · {person.firstName} {person.lastName}</Link>;
}

function NotificationResult({result}:{result:string}) {
  const success=result==="success";
  const text=success?"Notification de test envoyée sur tous les canaux actifs.":result==="rate-limit"?"Trop de tests envoyés. Réessayez dans quelques minutes.":"Au moins un canal n’a pas pu recevoir la notification de test.";
  return <p role={success?"status":"alert"} className={`mb-6 rounded-lg p-3 text-sm ${success?"bg-emerald-500/10 text-emerald-700 dark:text-emerald-300":"bg-destructive/10 text-destructive"}`}>{text}</p>;
}
