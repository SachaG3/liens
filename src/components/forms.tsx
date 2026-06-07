import { addCircle, addContact, addContactRelation, addConversationItem, addCustomField, addGiftIdea, addImportantDate, addInteraction, addJournalEntry, addReminder, updateContact, updateReminder } from "@/app/actions";
import { CheckPill, FormField, NativeSelect, SubmitButton, TextAreaField, TextField } from "@/components/form-controls";
import { MentionTextarea } from "@/components/mention-textarea";
import { ModalForm } from "@/components/modal";
import { relationTypes } from "@/lib/relation-types";

type MentionPerson={id:string;firstName:string;lastName:string};

export function CircleForm() {
  return <ModalForm action={addCircle} noValidate className="grid gap-4">
    <FormField label="Nom du cercle"><TextField name="name" required placeholder="Amis proches"/></FormField>
    <div className="grid grid-cols-2 gap-3"><FormField label="Couleur"><TextField className="p-1" type="color" name="color" defaultValue="#6655e8"/></FormField><FormField label="Contact tous les…"><TextField type="number" name="frequency" defaultValue="30" min="1"/></FormField></div>
    <FormField label="Objectif hebdomadaire"><TextField type="number" name="weeklyTarget" defaultValue="1" min="1"/></FormField>
    <SubmitButton>Créer le cercle</SubmitButton>
  </ModalForm>;
}

export function ContactForm({ circles, people = [] }: { circles:Array<{id:string;name:string;color:string}>;people?:MentionPerson[] }) {
  return <ModalForm action={addContact} noValidate className="grid gap-4">
    <div className="grid grid-cols-2 gap-3"><FormField label="Prénom"><TextField name="firstName" required/></FormField><FormField label="Nom"><TextField name="lastName"/></FormField></div>
    <div className="grid grid-cols-2 gap-3"><FormField label="E-mail"><TextField type="email" name="email"/></FormField><FormField label="Téléphone"><TextField name="phone"/></FormField></div>
    <RelationTagField/>
    <FormField label="Entreprise"><TextField name="company"/></FormField>
    <div className="grid grid-cols-2 gap-3"><FormField label="Anniversaire"><TextField type="date" name="birthday"/></FormField><FormField label="Rythme souhaité"><TextField type="number" name="frequency" defaultValue="30" min="1"/></FormField></div>
    {circles.length>0&&<fieldset className="grid gap-2"><legend className="mb-1 text-sm font-medium">Cercles</legend><div className="flex flex-wrap gap-2">{circles.map(c=><CheckPill key={c.id} label={c.name} name="circleIds" value={c.id}/>)}</div></fieldset>}
    <FormField label="Notes" hint="Tapez @ pour mentionner et relier une personne."><MentionTextarea people={people} name="notes" rows={3} placeholder="Ex. Rencontré grâce à @Camille…"/></FormField>
    <SubmitButton>Ajouter la personne</SubmitButton>
  </ModalForm>;
}

export function EditContactForm({ contact, circles, people }: {
  contact:{id:string;firstName:string;lastName:string;email:string;phone:string;company:string;relationType:string;relationTags:Array<{tag:string}>;notes:string;desiredFrequency:number;birthday:Date|null;circles:Array<{circleId:string}>};
  circles:Array<{id:string;name:string;color:string}>;
  people:MentionPerson[];
}) {
  const memberships=new Set(contact.circles.map(c=>c.circleId));
  return <ModalForm action={updateContact} noValidate className="grid gap-4"><input type="hidden" name="id" value={contact.id}/>
    <div className="grid grid-cols-2 gap-3"><FormField label="Prénom"><TextField name="firstName" required defaultValue={contact.firstName}/></FormField><FormField label="Nom"><TextField name="lastName" defaultValue={contact.lastName}/></FormField></div>
    <div className="grid grid-cols-2 gap-3"><FormField label="E-mail"><TextField type="email" name="email" defaultValue={contact.email}/></FormField><FormField label="Téléphone"><TextField name="phone" defaultValue={contact.phone}/></FormField></div>
    <RelationTagField selected={contact.relationTags.map(item=>item.tag).concat(contact.relationType?[contact.relationType]:[])}/>
    <FormField label="Entreprise"><TextField name="company" defaultValue={contact.company}/></FormField>
    <div className="grid grid-cols-2 gap-3"><FormField label="Anniversaire"><TextField type="date" name="birthday" defaultValue={contact.birthday?.toISOString().slice(0,10)}/></FormField><FormField label="Rythme souhaité"><TextField type="number" name="frequency" defaultValue={contact.desiredFrequency} min="1"/></FormField></div>
    <fieldset className="grid gap-2"><legend className="mb-1 text-sm font-medium">Cercles</legend><div className="flex flex-wrap gap-2">{circles.map(c=><CheckPill key={c.id} label={c.name} name="circleIds" value={c.id} defaultChecked={memberships.has(c.id)}/>)}</div></fieldset>
    <FormField label="Notes privées" hint="Tapez @ pour mentionner et relier une personne."><MentionTextarea people={people.filter(person=>person.id!==contact.id)} name="notes" rows={4} defaultValue={contact.notes}/></FormField>
    <SubmitButton>Enregistrer les modifications</SubmitButton>
  </ModalForm>;
}

function RelationTagPicker({selected=[]}:{selected?:string[]}) {
  const selectedSet=new Set(selected);
  return <div className="max-h-52 space-y-3 overflow-y-auto rounded-lg border bg-background p-3">{relationTypes.map(([group,options])=><fieldset key={group}><legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group}</legend><div className="flex flex-wrap gap-1.5">{options.map(option=><CheckPill key={option} label={option} name="relationTags" value={option} defaultChecked={selectedSet.has(option)}/>)}</div></fieldset>)}</div>;
}

function RelationTagField({selected=[]}:{selected?:string[]}) {
  return <fieldset className="grid gap-1.5"><legend className="text-sm font-medium">Relations</legend><RelationTagPicker selected={selected}/><p className="text-xs text-muted-foreground">Vous pouvez en choisir plusieurs.</p></fieldset>;
}

export function InteractionForm({ contacts, people = contacts }: { contacts:MentionPerson[];people?:MentionPerson[] }) {
  return <ModalForm action={addInteraction} noValidate className="grid gap-4">
    <FormField label="Personne"><NativeSelect name="contactId" required>{contacts.map(c=><option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}</NativeSelect></FormField>
    <FormField label="Type"><NativeSelect name="type"><option value="message">Message</option><option value="call">Appel</option><option value="meeting">Rencontre</option><option value="email">E-mail</option></NativeSelect></FormField>
    <FormField label="Note" hint="Tapez @ pour mentionner les personnes évoquées."><MentionTextarea people={people} name="note" rows={3} placeholder="De quoi avez-vous parlé ?"/></FormField>
    <SubmitButton>Enregistrer l’échange</SubmitButton>
  </ModalForm>;
}

export function ReminderForm({ contacts }: { contacts:Array<{id:string;firstName:string;lastName:string}> }) {
  return <ModalForm action={addReminder} noValidate className="grid gap-4">
    <FormField label="Personne"><NativeSelect name="contactId" required>{contacts.map(c=><option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}</NativeSelect></FormField>
    <FormField label="Rappel"><TextField name="title" required placeholder="Lui demander des nouvelles"/></FormField>
    <FormField label="Date"><TextField type="date" name="dueAt" required/></FormField>
    <SubmitButton>Créer le rappel</SubmitButton>
  </ModalForm>;
}

export function EditReminderForm({ reminder }: { reminder:{id:string;title:string;dueAt:Date} }) {
  return <ModalForm action={updateReminder} noValidate className="grid gap-4"><input type="hidden" name="id" value={reminder.id}/>
    <FormField label="Rappel"><TextField name="title" required defaultValue={reminder.title}/></FormField>
    <FormField label="Date"><TextField type="date" name="dueAt" required defaultValue={reminder.dueAt.toISOString().slice(0,10)}/></FormField>
    <SubmitButton>Enregistrer le rappel</SubmitButton>
  </ModalForm>;
}

export function GiftIdeaForm({ contactId }: { contactId:string }) {
  return <ModalForm action={addGiftIdea} noValidate className="grid gap-4"><input type="hidden" name="contactId" value={contactId}/>
    <FormField label="Idée"><TextField name="title" required placeholder="Livre, expérience, objet…"/></FormField>
    <div className="grid grid-cols-[1fr_120px] gap-3"><FormField label="Lien"><TextField type="url" name="url" placeholder="https://…"/></FormField><FormField label="Budget (€)"><TextField type="number" step="0.01" min="0" name="price"/></FormField></div>
    <FormField label="Note"><TextAreaField name="note" rows={2} placeholder="Taille, couleur, pourquoi cette idée…"/></FormField>
    <SubmitButton>Ajouter l’idée</SubmitButton>
  </ModalForm>;
}

export function JournalEntryForm({contactId}:{contactId:string}) {
  return <ModalForm action={addJournalEntry} className="grid gap-4"><input type="hidden" name="contactId" value={contactId}/><FormField label="Titre"><TextField name="title" required placeholder="Voyage à Lyon, changement de travail…"/></FormField><div className="grid grid-cols-2 gap-3"><FormField label="Type"><NativeSelect name="type"><option value="note">Note</option><option value="event">Événement</option><option value="milestone">Étape importante</option><option value="conflict">Conflit</option><option value="memory">Souvenir</option></NativeSelect></FormField><FormField label="Date"><TextField type="date" name="happenedAt"/></FormField></div><FormField label="Détails"><TextAreaField name="content" rows={4}/></FormField><PrivateToggle/><SubmitButton>Ajouter au journal</SubmitButton></ModalForm>;
}

export function ImportantDateForm({contactId}:{contactId:string}) {
  return <ModalForm action={addImportantDate} className="grid gap-4"><input type="hidden" name="contactId" value={contactId}/><FormField label="Nom de la date"><TextField name="title" required placeholder="Anniversaire de rencontre"/></FormField><div className="grid grid-cols-2 gap-3"><FormField label="Date"><TextField type="date" name="date" required/></FormField><FormField label="Prévenir avant"><NativeSelect name="remindDays" defaultValue="7"><option value="0">Le jour même</option><option value="3">3 jours</option><option value="7">7 jours</option><option value="14">14 jours</option><option value="30">30 jours</option></NativeSelect></FormField></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="recurring" defaultChecked/>Répéter chaque année</label><SubmitButton>Ajouter la date</SubmitButton></ModalForm>;
}

export function ConversationItemForm({contactId}:{contactId:string}) {
  return <ModalForm action={addConversationItem} className="grid gap-4"><input type="hidden" name="contactId" value={contactId}/><FormField label="Type"><NativeSelect name="kind"><option value="topic">Sujet à reprendre</option><option value="question">Question à poser</option><option value="promise">Promesse / chose à faire</option><option value="interest">Centre d’intérêt</option></NativeSelect></FormField><FormField label="Titre"><TextField name="title" required placeholder="Demander comment avance son projet"/></FormField><FormField label="Détails"><TextAreaField name="detail" rows={3}/></FormField><PrivateToggle/><SubmitButton>Ajouter au suivi</SubmitButton></ModalForm>;
}

export function CustomFieldForm({contactId}:{contactId:string}) {
  return <ModalForm action={addCustomField} className="grid gap-4"><input type="hidden" name="contactId" value={contactId}/><FormField label="Nom du champ"><TextField name="label" required placeholder="Taille de vêtement, adresse…"/></FormField><FormField label="Valeur"><TextAreaField name="value" required rows={3}/></FormField><PrivateToggle/><SubmitButton>Ajouter le champ</SubmitButton></ModalForm>;
}

export function ContactRelationForm({contactId,people}:{contactId:string;people:MentionPerson[]}) {
  return <ModalForm action={addContactRelation} className="grid gap-4"><input type="hidden" name="contactId" value={contactId}/><FormField label="Personne liée"><NativeSelect name="targetId">{people.filter(person=>person.id!==contactId).map(person=><option key={person.id} value={person.id}>{person.firstName} {person.lastName}</option>)}</NativeSelect></FormField><FormField label="Nature du lien"><TextField name="label" placeholder="Sœur, collègue, partenaire…"/></FormField><FormField label="Note"><TextAreaField name="note" rows={2}/></FormField><SubmitButton>Créer le lien</SubmitButton></ModalForm>;
}

function PrivateToggle(){return <label className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-sm"><input type="checkbox" name="private"/>Contenu sensible : masquer dans la préparation rapide</label>}
