import { dispatchMyNotifications, testNotifications, updateNotificationPreference } from "@/app/actions";
import { FormField, SubmitButton, TextField } from "@/components/form-controls";
import { ModalForm } from "@/components/modal";
import { Button } from "@/components/ui/button";
import { ExternalLink, HelpCircle } from "lucide-react";
import Link from "next/link";

type Preference = {
  emailEnabled: boolean;
  emailAddress: string;
  discordEnabled: boolean;
  discordWebhookUrl: string;
  signalEnabled: boolean;
  signalRecipient: string;
  ntfyEnabled: boolean;
  ntfyTopic: string;
};

const emptyPreference: Preference = {
  emailEnabled: false,
  emailAddress: "",
  discordEnabled: false,
  discordWebhookUrl: "",
  signalEnabled: false,
  signalRecipient: "",
  ntfyEnabled: false,
  ntfyTopic: "",
};

export function NotificationSettingsForm({ preference, defaultEmail }: { preference: Preference | null; defaultEmail: string }) {
  const value = preference ?? { ...emptyPreference, emailAddress: defaultEmail };
  return <ModalForm action={updateNotificationPreference} resetOnSuccess={false} refreshOnSuccess successMessage="Notifications enregistrées." className="grid gap-5">
    <Link href="/help/notifications" target="_blank" className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm font-medium transition hover:bg-muted"><HelpCircle className="size-4"/>Guide complet de configuration<ExternalLink className="ml-auto size-3.5 text-muted-foreground"/></Link>
    <Channel enabled={value.emailEnabled} name="emailEnabled" title="E-mail" description="Nécessite la configuration SMTP de l’instance." helpHref="/help/notifications#email">
      <FormField label="Adresse destinataire"><TextField type="email" name="emailAddress" defaultValue={value.emailAddress}/></FormField>
    </Channel>
    <Channel enabled={value.discordEnabled} name="discordEnabled" title="Discord" description="Utilise un webhook entrant, sans créer de bot." helpHref="/help/notifications#discord">
      <FormField label="URL du webhook Discord"><TextField type="url" name="discordWebhookUrl" defaultValue={value.discordWebhookUrl} placeholder="https://discord.com/api/webhooks/…"/></FormField>
    </Channel>
    <Channel enabled={value.signalEnabled} name="signalEnabled" title="Signal" description="L’instance Signal et le numéro émetteur sont configurés par l’administrateur." helpHref="/help/notifications#signal">
      <FormField label="Numéro destinataire"><TextField name="signalRecipient" defaultValue={value.signalRecipient} placeholder="+33600000000"/></FormField>
    </Channel>
    <Channel enabled={value.ntfyEnabled} name="ntfyEnabled" title="ntfy" description="Notifications push simples sur téléphone ou ordinateur. Le serveur est configuré par l’administrateur." helpHref="/help/notifications#ntfy">
      <FormField label="Sujet ntfy"><TextField name="ntfyTopic" defaultValue={value.ntfyTopic} placeholder="un-sujet-secret"/></FormField>
    </Channel>
    <SubmitButton>Enregistrer les notifications</SubmitButton>
  </ModalForm>;
}

export function NotificationActions({ configured }: { configured: boolean }) {
  return <div className="flex flex-wrap gap-2">
    <form action={testNotifications}><Button type="submit" variant="outline" disabled={!configured}>Envoyer un test</Button></form>
    <form action={dispatchMyNotifications}><Button type="submit" variant="outline" disabled={!configured}>Envoyer les rappels dus</Button></form>
  </div>;
}

function Channel({ enabled, name, title, description, helpHref, children }: { enabled: boolean; name: string; title: string; description: string; helpHref: string; children: React.ReactNode }) {
  return <fieldset className="grid gap-3 rounded-lg border bg-muted/20 p-4"><div className="flex items-start gap-3"><label className="flex min-w-0 flex-1 items-start gap-3"><input className="mt-1 size-4" type="checkbox" name={name} defaultChecked={enabled}/><span><b className="text-sm">{title}</b><span className="block text-xs text-muted-foreground">{description}</span></span></label><Link href={helpHref} target="_blank" className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">Aide<ExternalLink className="size-3"/></Link></div>{children}</fieldset>;
}
