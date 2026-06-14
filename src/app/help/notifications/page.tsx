import Link from "next/link";
import { ArrowLeft, ExternalLink, Mail, MessageSquare, Radio, Send } from "lucide-react";
import { Shell } from "@/components/shell";

export default function NotificationHelpPage() {
  return <Shell><article className="mx-auto max-w-4xl"><header className="mb-9"><Link href="/account" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4"/>Retour au compte</Link><p className="mb-2 text-sm text-muted-foreground">Guide de configuration</p><h1 className="text-3xl font-semibold tracking-tight">Notifications</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Configurez les services côté serveur, puis activez les canaux souhaités depuis Mon compte → Notifications. Terminez toujours avec le bouton « Envoyer un test ».</p></header>
    <nav aria-label="Canaux de notification" className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><ChannelLink href="#email" icon={<Mail/>} label="E-mail"/><ChannelLink href="#discord" icon={<MessageSquare/>} label="Discord"/><ChannelLink href="#signal" icon={<Send/>} label="Signal"/><ChannelLink href="#ntfy" icon={<Radio/>} label="ntfy"/></nav>
    <div className="space-y-8">
      <HelpSection id="email" title="E-mail" summary="Envoi via le serveur SMTP de votre fournisseur.">
        <Steps items={["Récupérez les paramètres SMTP auprès de votre fournisseur de messagerie.", "Ajoutez les variables SMTP dans la configuration du conteneur Liens.", "Redémarrez Liens, activez E-mail dans la modale et saisissez l’adresse destinataire.", "Envoyez une notification de test."]}/>
        <Code>{`SMTP_HOST=mail.exemple.fr
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=liens@exemple.fr
SMTP_PASSWORD=mot-de-passe
SMTP_FROM=Liens <liens@exemple.fr>`}</Code>
        <Note>Utilisez `SMTP_SECURE=true` avec le port 465. Pour le port 587 avec STARTTLS, utilisez généralement `false`.</Note>
        <OfficialLink href="https://nodemailer.com/smtp">Documentation SMTP Nodemailer</OfficialLink>
      </HelpSection>
      <HelpSection id="discord" title="Discord" summary="Envoi dans un salon avec un webhook entrant, sans bot.">
        <Steps items={["Dans Discord, ouvrez Paramètres du serveur → Intégrations → Webhooks.", "Créez un webhook et choisissez le salon destinataire.", "Copiez son URL, activez Discord dans Liens et collez l’URL.", "Enregistrez puis envoyez un test."]}/>
        <Note>L’URL du webhook est un secret : toute personne qui la possède peut publier dans le salon.</Note>
        <OfficialLink href="https://docs.discord.com/developers/resources/webhook">Documentation officielle des webhooks Discord</OfficialLink>
      </HelpSection>
      <HelpSection id="signal" title="Signal" summary="Envoi via une instance signal-cli-rest-api liée à un compte Signal.">
        <Steps items={["Déployez signal-cli-rest-api et conservez son volume de données.", "Ouvrez `/v1/qrcodelink?device_name=Liens` sur cette API puis scannez le QR code depuis Signal → Appareils liés.", "Configurez SIGNAL_API_URL et SIGNAL_SENDER dans le conteneur Liens.", "Dans Liens, activez Signal et saisissez le numéro destinataire au format international."]}/>
        <Code>{`SIGNAL_API_URL=http://signal-api:8080
SIGNAL_SENDER=+33600000000`}</Code>
        <Note>L’API Signal doit rester privée et accessible uniquement depuis le réseau Docker ou un réseau protégé.</Note>
        <OfficialLink href="https://github.com/bbernhard/signal-cli-rest-api">Documentation signal-cli-rest-api</OfficialLink>
      </HelpSection>
      <HelpSection id="ntfy" title="ntfy" summary="Notifications push simples sur téléphone et ordinateur.">
        <Steps items={["Installez l’application ntfy ou ouvrez son application web.", "Choisissez un nom de sujet long et difficile à deviner.", "Abonnez-vous à ce sujet dans ntfy.", "Dans Liens, activez ntfy, saisissez exactement le même sujet et envoyez un test."]}/>
        <Code>{`NTFY_BASE_URL=https://ntfy.sh`}</Code>
        <Note>Sur ntfy.sh sans authentification, le nom du sujet agit comme un mot de passe. Ne choisissez pas un nom prévisible.</Note>
        <div className="flex flex-wrap gap-4"><OfficialLink href="https://docs.ntfy.sh/subscribe/web/">S’abonner à un sujet ntfy</OfficialLink><OfficialLink href="https://docs.ntfy.sh/publish/">Documentation d’envoi ntfy</OfficialLink></div>
      </HelpSection>
      <HelpSection id="automatic" title="Envoi automatique" summary="Vérification périodique des rappels arrivés à échéance.">
        <Steps items={["Générez un secret long avec `openssl rand -hex 32`.", "Ajoutez NOTIFICATION_CRON_SECRET et APP_URL à la configuration.", "Démarrez le profil Docker notifications.", "Vérifiez les journaux du service notifications."]}/>
        <Code>{`NOTIFICATION_CRON_SECRET=un-secret-long-et-aleatoire
APP_URL=https://liens.exemple.fr

docker compose --profile notifications up -d
docker compose logs -f notifications`}</Code>
      </HelpSection>
    </div>
  </article></Shell>;
}

function ChannelLink({href,icon,label}:{href:string;icon:React.ReactNode;label:string}) {
  return <Link href={href} className="flex items-center gap-2 rounded-lg border bg-card p-3 text-sm font-medium transition hover:bg-muted [&_svg]:size-4">{icon}{label}</Link>;
}

function HelpSection({id,title,summary,children}:{id:string;title:string;summary:string;children:React.ReactNode}) {
  return <section id={id} className="scroll-mt-20 rounded-xl border bg-card p-6"><h2 className="text-xl font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{summary}</p><div className="mt-5 grid gap-4">{children}</div></section>;
}

function Steps({items}:{items:string[]}) {
  return <ol className="grid gap-2 text-sm">{items.map((item,index)=><li key={item} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">{index+1}</span><span className="pt-0.5">{item}</span></li>)}</ol>;
}

function Code({children}:{children:string}) {
  return <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs"><code>{children}</code></pre>;
}

function Note({children}:{children:React.ReactNode}) {
  return <p className="rounded-lg border-l-4 border-amber-500 bg-amber-500/10 p-3 text-sm">{children}</p>;
}

function OfficialLink({href,children}:{href:string;children:React.ReactNode}) {
  return <a href={href} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium underline underline-offset-4">{children}<ExternalLink className="size-3.5"/></a>;
}
