import { dispatchMyNotifications, testNotifications, updateNotificationPreference } from "@/app/actions";
import { FormField, SubmitButton, TextField } from "@/components/form-controls";
import { ModalForm } from "@/components/modal";
import { Button } from "@/components/ui/button";

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
    <Channel enabled={value.emailEnabled} name="emailEnabled" title="E-mail" description="Nécessite la configuration SMTP de l’instance.">
      <FormField label="Adresse destinataire"><TextField type="email" name="emailAddress" defaultValue={value.emailAddress}/></FormField>
    </Channel>
    <Channel enabled={value.discordEnabled} name="discordEnabled" title="Discord" description="Utilise un webhook entrant, sans créer de bot.">
      <FormField label="URL du webhook Discord"><TextField type="url" name="discordWebhookUrl" defaultValue={value.discordWebhookUrl} placeholder="https://discord.com/api/webhooks/…"/></FormField>
    </Channel>
    <Channel enabled={value.signalEnabled} name="signalEnabled" title="Signal" description="L’instance Signal et le numéro émetteur sont configurés par l’administrateur.">
      <FormField label="Numéro destinataire"><TextField name="signalRecipient" defaultValue={value.signalRecipient} placeholder="+33600000000"/></FormField>
    </Channel>
    <Channel enabled={value.ntfyEnabled} name="ntfyEnabled" title="ntfy" description="Notifications push simples sur téléphone ou ordinateur. Le serveur est configuré par l’administrateur.">
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

function Channel({ enabled, name, title, description, children }: { enabled: boolean; name: string; title: string; description: string; children: React.ReactNode }) {
  return <fieldset className="grid gap-3 rounded-lg border bg-muted/20 p-4"><label className="flex items-start gap-3"><input className="mt-1 size-4" type="checkbox" name={name} defaultChecked={enabled}/><span><b className="text-sm">{title}</b><span className="block text-xs text-muted-foreground">{description}</span></span></label>{children}</fieldset>;
}
