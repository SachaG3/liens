import { addCircle, addContact, addContactRelation, addConversationItem, addCustomField, addDebt, addGiftIdea, addImportantDate, addInteraction, addJournalEntry, addPet, addReminder, updateAccount, updateCircle, updateContact, updateContactRelation, updateConversationItem, updateCustomField, updateDebt, updateGiftIdea, updateImportantDate, updateInteraction, updateJournalEntry, updatePassword, updatePet, updateReminder } from "@/app/actions";
import { CheckPill, FormField, NativeSelect, SubmitButton, TextAreaField, TextField } from "@/components/form-controls";
import { MentionTextarea } from "@/components/mention-textarea";
import { ModalForm } from "@/components/modal";
import { relationTypes } from "@/lib/relation-types";
import { PhotoEditor } from "@/components/photo-editor";
import { FormSteps } from "@/components/form-steps";
import { ParentFields } from "@/components/parent-fields";

type MentionPerson={id:string;firstName:string;lastName:string};

export function CircleForm() {
  return <ModalForm action={addCircle} noValidate className="grid gap-4">
    <FormField label="Nom du cercle"><TextField name="name" required placeholder="Amis proches"/></FormField>
    <div className="grid grid-cols-2 gap-3"><FormField label="Couleur"><TextField className="p-1" type="color" name="color" defaultValue="#6655e8"/></FormField><FormField label="Contact tous les…"><TextField type="number" name="frequency" defaultValue="30" min="1"/></FormField></div>
    <FormField label="Objectif hebdomadaire"><TextField type="number" name="weeklyTarget" defaultValue="1" min="1"/></FormField>
    <SubmitButton>Créer le cercle</SubmitButton>
  </ModalForm>;
}

export function EditCircleForm({circle}:{circle:{id:string;name:string;color:string;frequency:number;weeklyTarget:number}}) {
  return <ModalForm action={updateCircle} noValidate className="grid gap-4"><input type="hidden" name="id" value={circle.id}/>
    <FormField label="Nom du cercle"><TextField name="name" required defaultValue={circle.name}/></FormField>
    <div className="grid grid-cols-2 gap-3"><FormField label="Couleur"><TextField className="p-1" type="color" name="color" defaultValue={circle.color}/></FormField><FormField label="Contact tous les…"><TextField type="number" name="frequency" defaultValue={circle.frequency} min="1"/></FormField></div>
    <FormField label="Objectif hebdomadaire"><TextField type="number" name="weeklyTarget" defaultValue={circle.weeklyTarget} min="1"/></FormField>
    <SubmitButton>Enregistrer le cercle</SubmitButton>
  </ModalForm>;
}

export function AccountForm({user,people}:{user:{name:string;email:string;photo:string;motherId:string|null;fatherId:string|null};people:MentionPerson[]}) {
  return <ModalForm action={updateAccount} resetOnSuccess={false} refreshOnSuccess successMessage="Profil enregistré." className="grid gap-4"><PhotoEditor key={user.photo||"empty"} existingPhoto={user.photo}/><FormField label="Nom"><TextField name="name" required defaultValue={user.name}/></FormField><FormField label="E-mail"><TextField type="email" name="email" required defaultValue={user.email}/></FormField><ParentFields people={people} motherId={user.motherId} fatherId={user.fatherId} forUser/><SubmitButton>Enregistrer le profil</SubmitButton></ModalForm>;
}

export function PasswordForm() {
  return <ModalForm action={updatePassword} className="grid gap-4"><FormField label="Mot de passe actuel"><TextField type="password" name="currentPassword" required autoComplete="current-password"/></FormField><FormField label="Nouveau mot de passe" hint="8 caractères minimum"><TextField type="password" name="password" required minLength={8} autoComplete="new-password"/></FormField><SubmitButton>Changer le mot de passe</SubmitButton></ModalForm>;
}

export function ContactForm({ circles, people = [] }: { circles:Array<{id:string;name:string;color:string}>;people?:MentionPerson[] }) {
  return <ModalForm action={addContact} noValidate><FormSteps submitLabel="Ajouter la personne" steps={[
    {label:"Identité",description:"Les informations essentielles et les coordonnées.",content:<><PhotoEditor/><div className="grid grid-cols-2 gap-3"><FormField label="Prénom"><TextField name="firstName" required/></FormField><FormField label="Nom"><TextField name="lastName"/></FormField></div><div className="grid grid-cols-2 gap-3"><FormField label="E-mail"><TextField type="email" name="email"/></FormField><FormField label="Téléphone"><TextField name="phone"/></FormField></div><FormField label="Entreprise"><TextField name="company"/></FormField><FormField label="Anniversaire"><TextField type="date" name="birthday"/></FormField></>},
    {label:"Relations",description:"Séparez son lien avec vous de ses liens avec les autres personnes.",content:<><RelationTagField/><ParentFields people={people}/><FamilyGenderField/>{circles.length>0&&<CircleFields circles={circles}/>}</>},
    {label:"Suivi",description:"Configurez les suggestions de reconnexion, ou désactivez-les.",content:<><FormField label="Rythme souhaité"><TextField type="number" name="frequency" defaultValue="30" min="1"/></FormField><FollowUpFields/></>},
    {label:"Notes",description:"Ajoutez seulement ce qui sera utile plus tard.",content:<FormField label="Notes privées" hint="Tapez @ pour mentionner et relier une personne."><MentionTextarea people={people} name="notes" rows={8} placeholder="Ex. Rencontré grâce à @Camille…"/></FormField>},
  ]}/></ModalForm>;
}

export function EditContactForm({ contact, circles, people }: {
  contact:{id:string;firstName:string;lastName:string;photo:string;email:string;phone:string;company:string;relationType:string;relationTags:Array<{tag:string}>;notes:string;desiredFrequency:number;birthday:Date|null;circles:Array<{circleId:string}>;gender:string;motherId:string|null;fatherId:string|null;followUpStatus:string;statusNote:string;deceasedAt:Date|null};
  circles:Array<{id:string;name:string;color:string}>;
  people:MentionPerson[];
}) {
  const memberships=new Set(contact.circles.map(c=>c.circleId));
  const otherPeople=people.filter(person=>person.id!==contact.id);
  return <ModalForm action={updateContact} noValidate><input type="hidden" name="id" value={contact.id}/><FormSteps submitLabel="Enregistrer" steps={[
    {label:"Identité",description:"Photo, identité et coordonnées.",content:<><PhotoEditor existingPhoto={contact.photo}/><div className="grid grid-cols-2 gap-3"><FormField label="Prénom"><TextField name="firstName" required defaultValue={contact.firstName}/></FormField><FormField label="Nom"><TextField name="lastName" defaultValue={contact.lastName}/></FormField></div><div className="grid grid-cols-2 gap-3"><FormField label="E-mail"><TextField type="email" name="email" defaultValue={contact.email}/></FormField><FormField label="Téléphone"><TextField name="phone" defaultValue={contact.phone}/></FormField></div><FormField label="Entreprise"><TextField name="company" defaultValue={contact.company}/></FormField><FormField label="Anniversaire"><TextField type="date" name="birthday" defaultValue={contact.birthday?.toISOString().slice(0,10)}/></FormField></>},
    {label:"Relations",description:"Séparez son lien avec vous de ses liens avec les autres personnes.",content:<><RelationTagField selected={contact.relationTags.map(item=>item.tag).concat(contact.relationType?[contact.relationType]:[])}/><ParentFields people={otherPeople} motherId={contact.motherId} fatherId={contact.fatherId}/><FamilyGenderField selected={contact.gender}/><CircleFields circles={circles} memberships={memberships}/></>},
    {label:"Suivi",description:"Rythme et statut permanent de la relation.",content:<><FormField label="Rythme souhaité"><TextField type="number" name="frequency" defaultValue={contact.desiredFrequency} min="1"/></FormField><FollowUpFields status={contact.followUpStatus} note={contact.statusNote} deceasedAt={contact.deceasedAt}/></>},
    {label:"Notes",description:"Informations privées et liens avec d’autres personnes.",content:<FormField label="Notes privées" hint="Tapez @ pour mentionner et relier une personne."><MentionTextarea people={otherPeople} name="notes" rows={8} defaultValue={contact.notes}/></FormField>},
  ]}/></ModalForm>;
}

function RelationTagPicker({selected=[]}:{selected?:string[]}) {
  const selectedSet=new Set(selected);
  return <div className="max-h-52 space-y-3 overflow-y-auto rounded-lg border bg-background p-3">{relationTypes.map(([group,options])=><fieldset key={group}><legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group}</legend><div className="flex flex-wrap gap-1.5">{options.map(option=><CheckPill key={option} label={option} name="relationTags" value={option} defaultChecked={selectedSet.has(option)}/>)}</div></fieldset>)}</div>;
}

function FollowUpFields({status="active",note="",deceasedAt=null}:{status?:string;note?:string;deceasedAt?:Date|null}) {
  return <fieldset className="grid gap-3 rounded-lg border bg-muted/20 p-3"><legend className="px-1 text-sm font-medium">Suivi de la relation</legend><FormField label="Statut" hint="Les personnes non suivies restent dans votre carnet et votre arbre, sans suggestion de reconnexion."><NativeSelect name="followUpStatus" defaultValue={status}><option value="active">Suivi actif</option><option value="no_contact">Ne pas recontacter</option><option value="deceased">Décédé</option></NativeSelect></FormField><div className="grid gap-3 sm:grid-cols-2"><FormField label="Note sur ce statut"><TextField name="statusNote" defaultValue={note} placeholder="Facultatif et privé"/></FormField><FormField label="Date de décès"><TextField type="date" name="deceasedAt" defaultValue={deceasedAt?.toISOString().slice(0,10)}/></FormField></div></fieldset>;
}

function RelationTagField({selected=[]}:{selected?:string[]}) {
  return <fieldset className="grid gap-1.5"><legend className="text-sm font-medium">Lien avec vous</legend><RelationTagPicker selected={selected}/><p className="text-xs text-muted-foreground">Choisissez uniquement ce qui décrit votre propre relation avec cette personne.</p></fieldset>;
}

function CircleFields({circles,memberships=new Set<string>()}:{circles:Array<{id:string;name:string;color:string}>;memberships?:Set<string>}) {
  return <fieldset className="grid gap-2"><legend className="text-sm font-medium">Cercles de suivi</legend><div className="flex flex-wrap gap-2">{circles.map(c=><CheckPill key={c.id} label={c.name} name="circleIds" value={c.id} defaultChecked={memberships.has(c.id)}/>)}</div><p className="text-xs text-muted-foreground">Les cercles servent à organiser le carnet et ajuster le rythme de suivi.</p></fieldset>;
}

export function InteractionForm({ contacts, people = contacts }: { contacts:MentionPerson[];people?:MentionPerson[] }) {
  return <ModalForm action={addInteraction} noValidate className="grid gap-4">
    <FormField label="Personne"><NativeSelect name="contactId" required>{contacts.map(c=><option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}</NativeSelect></FormField>
    <FormField label="Type"><NativeSelect name="type"><option value="message">Message</option><option value="call">Appel</option><option value="meeting">Rencontre</option><option value="email">E-mail</option></NativeSelect></FormField>
    <FormField label="Note" hint="Tapez @ pour mentionner les personnes évoquées."><MentionTextarea people={people} name="note" rows={3} placeholder="De quoi avez-vous parlé ?"/></FormField>
    <SubmitButton>Enregistrer l’échange</SubmitButton>
  </ModalForm>;
}

export function EditInteractionForm({interaction,people}:{interaction:{id:string;type:string;note:string;happenedAt:Date};people:MentionPerson[]}) {
  return <ModalForm action={updateInteraction} noValidate className="grid gap-4"><input type="hidden" name="id" value={interaction.id}/><FormField label="Type"><NativeSelect name="type" defaultValue={interaction.type}><option value="message">Message</option><option value="call">Appel</option><option value="meeting">Rencontre</option><option value="email">E-mail</option></NativeSelect></FormField><FormField label="Date"><TextField type="date" name="happenedAt" defaultValue={interaction.happenedAt.toISOString().slice(0,10)}/></FormField><FormField label="Note"><MentionTextarea people={people} name="note" rows={4} defaultValue={interaction.note}/></FormField><SubmitButton>Enregistrer l’échange</SubmitButton></ModalForm>;
}

export function ReminderForm({ contacts }: { contacts:Array<{id:string;firstName:string;lastName:string}> }) {
  return <ModalForm action={addReminder} noValidate className="grid gap-4">
    <FormField label="Personne"><NativeSelect name="contactId" required>{contacts.map(c=><option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}</NativeSelect></FormField>
    <FormField label="Type"><NativeSelect name="kind" defaultValue="contact"><option value="contact">À contacter</option><option value="no_contact">Ne pas contacter avant cette date</option><option value="other">Autre rappel</option></NativeSelect></FormField>
    <FormField label="Rappel"><TextField name="title" required placeholder="Lui demander des nouvelles"/></FormField>
    <FormField label="Date"><TextField type="date" name="dueAt" required/></FormField>
    <SubmitButton>Créer le rappel</SubmitButton>
  </ModalForm>;
}

export function EditReminderForm({ reminder }: { reminder:{id:string;kind:string;title:string;dueAt:Date} }) {
  return <ModalForm action={updateReminder} noValidate className="grid gap-4"><input type="hidden" name="id" value={reminder.id}/>
    <FormField label="Type"><NativeSelect name="kind" defaultValue={reminder.kind}><option value="contact">À contacter</option><option value="no_contact">Ne pas contacter avant cette date</option><option value="other">Autre rappel</option></NativeSelect></FormField>
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

export function EditGiftIdeaForm({gift}:{gift:{id:string;title:string;url:string;price:number|null;note:string}}) {
  return <ModalForm action={updateGiftIdea} noValidate className="grid gap-4"><input type="hidden" name="id" value={gift.id}/><FormField label="Idée"><TextField name="title" required defaultValue={gift.title}/></FormField><div className="grid grid-cols-[1fr_120px] gap-3"><FormField label="Lien"><TextField type="url" name="url" defaultValue={gift.url}/></FormField><FormField label="Budget (€)"><TextField type="number" step="0.01" min="0" name="price" defaultValue={gift.price??undefined}/></FormField></div><FormField label="Note"><TextAreaField name="note" rows={2} defaultValue={gift.note}/></FormField><SubmitButton>Enregistrer l’idée</SubmitButton></ModalForm>;
}

export function JournalEntryForm({contactId}:{contactId:string}) {
  return <ModalForm action={addJournalEntry} className="grid gap-4"><input type="hidden" name="contactId" value={contactId}/><FormField label="Titre"><TextField name="title" required placeholder="Voyage à Lyon, changement de travail…"/></FormField><div className="grid grid-cols-2 gap-3"><FormField label="Type"><NativeSelect name="type"><option value="note">Note</option><option value="event">Événement</option><option value="milestone">Étape importante</option><option value="conflict">Conflit</option><option value="memory">Souvenir</option></NativeSelect></FormField><FormField label="Date"><TextField type="date" name="happenedAt"/></FormField></div><FormField label="Détails"><TextAreaField name="content" rows={4}/></FormField><PrivateToggle/><SubmitButton>Ajouter au journal</SubmitButton></ModalForm>;
}

export function EditJournalEntryForm({item}:{item:{id:string;type:string;title:string;content:string;happenedAt:Date;private:boolean}}) {
  return <ModalForm action={updateJournalEntry} className="grid gap-4"><input type="hidden" name="id" value={item.id}/><FormField label="Titre"><TextField name="title" required defaultValue={item.title}/></FormField><div className="grid grid-cols-2 gap-3"><FormField label="Type"><NativeSelect name="type" defaultValue={item.type}><option value="note">Note</option><option value="event">Événement</option><option value="milestone">Étape importante</option><option value="conflict">Conflit</option><option value="memory">Souvenir</option></NativeSelect></FormField><FormField label="Date"><TextField type="date" name="happenedAt" defaultValue={item.happenedAt.toISOString().slice(0,10)}/></FormField></div><FormField label="Détails"><TextAreaField name="content" rows={4} defaultValue={item.content}/></FormField><PrivateToggle selected={item.private}/><SubmitButton>Enregistrer l’entrée</SubmitButton></ModalForm>;
}

export function ImportantDateForm({contactId}:{contactId:string}) {
  return <ModalForm action={addImportantDate} className="grid gap-4"><input type="hidden" name="contactId" value={contactId}/><FormField label="Nom de la date"><TextField name="title" required placeholder="Anniversaire de rencontre"/></FormField><div className="grid grid-cols-2 gap-3"><FormField label="Date"><TextField type="date" name="date" required/></FormField><FormField label="Prévenir avant"><NativeSelect name="remindDays" defaultValue="7"><option value="0">Le jour même</option><option value="3">3 jours</option><option value="7">7 jours</option><option value="14">14 jours</option><option value="30">30 jours</option></NativeSelect></FormField></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="recurring" defaultChecked/>Répéter chaque année</label><SubmitButton>Ajouter la date</SubmitButton></ModalForm>;
}

export function EditImportantDateForm({item}:{item:{id:string;title:string;date:Date;recurring:boolean;remindDays:number}}) {
  return <ModalForm action={updateImportantDate} className="grid gap-4"><input type="hidden" name="id" value={item.id}/><FormField label="Nom de la date"><TextField name="title" required defaultValue={item.title}/></FormField><div className="grid grid-cols-2 gap-3"><FormField label="Date"><TextField type="date" name="date" required defaultValue={item.date.toISOString().slice(0,10)}/></FormField><FormField label="Prévenir avant"><NativeSelect name="remindDays" defaultValue={String(item.remindDays)}><option value="0">Le jour même</option><option value="3">3 jours</option><option value="7">7 jours</option><option value="14">14 jours</option><option value="30">30 jours</option></NativeSelect></FormField></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="recurring" defaultChecked={item.recurring}/>Répéter chaque année</label><SubmitButton>Enregistrer la date</SubmitButton></ModalForm>;
}

export function ConversationItemForm({contactId}:{contactId:string}) {
  return <ModalForm action={addConversationItem} className="grid gap-4"><input type="hidden" name="contactId" value={contactId}/><FormField label="Type"><NativeSelect name="kind"><option value="topic">Sujet à reprendre</option><option value="question">Question à poser</option><option value="promise">Promesse / chose à faire</option><option value="interest">Centre d’intérêt</option></NativeSelect></FormField><FormField label="Titre"><TextField name="title" required placeholder="Demander comment avance son projet"/></FormField><FormField label="Détails"><TextAreaField name="detail" rows={3}/></FormField><PrivateToggle/><SubmitButton>Ajouter au suivi</SubmitButton></ModalForm>;
}

export function EditConversationItemForm({item}:{item:{id:string;kind:string;title:string;detail:string;private:boolean}}) {
  return <ModalForm action={updateConversationItem} className="grid gap-4"><input type="hidden" name="id" value={item.id}/><FormField label="Type"><NativeSelect name="kind" defaultValue={item.kind}><option value="topic">Sujet à reprendre</option><option value="question">Question à poser</option><option value="promise">Promesse / chose à faire</option><option value="interest">Centre d’intérêt</option></NativeSelect></FormField><FormField label="Titre"><TextField name="title" required defaultValue={item.title}/></FormField><FormField label="Détails"><TextAreaField name="detail" rows={3} defaultValue={item.detail}/></FormField><PrivateToggle selected={item.private}/><SubmitButton>Enregistrer le suivi</SubmitButton></ModalForm>;
}

export function CustomFieldForm({contactId}:{contactId:string}) {
  return <ModalForm action={addCustomField} className="grid gap-4"><input type="hidden" name="contactId" value={contactId}/><FormField label="Nom du champ"><TextField name="label" required placeholder="Taille de vêtement, adresse…"/></FormField><FormField label="Valeur"><TextAreaField name="value" required rows={3}/></FormField><PrivateToggle/><SubmitButton>Ajouter le champ</SubmitButton></ModalForm>;
}

export function EditCustomFieldForm({item}:{item:{id:string;label:string;value:string;private:boolean}}) {
  return <ModalForm action={updateCustomField} className="grid gap-4"><input type="hidden" name="id" value={item.id}/><FormField label="Nom du champ"><TextField name="label" required defaultValue={item.label}/></FormField><FormField label="Valeur"><TextAreaField name="value" required rows={3} defaultValue={item.value}/></FormField><PrivateToggle selected={item.private}/><SubmitButton>Enregistrer le champ</SubmitButton></ModalForm>;
}

export function ContactRelationForm({contactId,people}:{contactId:string;people:MentionPerson[]}) {
  return <ModalForm action={addContactRelation} className="grid gap-4">
    <input type="hidden" name="contactId" value={contactId}/>
    <FormField label="Personne liée">
      <NativeSelect name="targetId">
        {people.filter(person=>person.id!==contactId).map(person=><option key={person.id} value={person.id}>{person.firstName} {person.lastName}</option>)}
      </NativeSelect>
    </FormField>
    <FormField label="Nature du lien">
      <TextField name="label" placeholder="Sœur, collègue, partenaire…"/>
    </FormField>
    <FormField label="Note">
      <TextAreaField name="note" rows={2}/>
    </FormField>
    <SubmitButton>Créer le lien</SubmitButton>
  </ModalForm>;
}

export function EditContactRelationForm({item}:{item:{id:string;label:string;note:string}}) {
  return <ModalForm action={updateContactRelation} className="grid gap-4">
    <input type="hidden" name="id" value={item.id}/>
    <FormField label="Nature du lien">
      <TextField name="label" placeholder="Sœur, collègue, partenaire…" defaultValue={item.label}/>
    </FormField>
    <FormField label="Note">
      <TextAreaField name="note" rows={2} defaultValue={item.note}/>
    </FormField>
    <SubmitButton>Enregistrer le lien</SubmitButton>
  </ModalForm>;
}

export function DebtForm({people}:{people:MentionPerson[]}) {
  return <ModalForm action={addDebt} className="grid gap-4">
    <FormField label="Personne"><NativeSelect name="contactId" required>{people.map(person=><option key={person.id} value={person.id}>{person.firstName} {person.lastName}</option>)}</NativeSelect></FormField>
    <FormField label="Sens"><NativeSelect name="direction" defaultValue="owed_to_me"><option value="owed_to_me">Cette personne me doit</option><option value="i_owe">Je dois à cette personne</option></NativeSelect></FormField>
    <div className="grid grid-cols-[1fr_110px] gap-3"><FormField label="Montant"><TextField type="number" name="amount" min="0.01" step="0.01" required/></FormField><FormField label="Devise"><NativeSelect name="currency"><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="CHF">CHF</option></NativeSelect></FormField></div>
    <FormField label="Objet"><TextField name="title" required placeholder="Restaurant, billet, avance…"/></FormField>
    <FormField label="Échéance"><TextField type="date" name="dueAt"/></FormField>
    <FormField label="Note"><TextAreaField name="note" rows={2}/></FormField>
    <SubmitButton>Ajouter la dette</SubmitButton>
  </ModalForm>;
}

export function EditDebtForm({debt,people}:{debt:{id:string;contactId:string;direction:string;amount:number;currency:string;title:string;note:string;dueAt:Date|null};people:MentionPerson[]}) {
  return <ModalForm action={updateDebt} className="grid gap-4"><input type="hidden" name="id" value={debt.id}/><FormField label="Personne"><NativeSelect name="contactId" required defaultValue={debt.contactId}>{people.map(person=><option key={person.id} value={person.id}>{person.firstName} {person.lastName}</option>)}</NativeSelect></FormField><FormField label="Sens"><NativeSelect name="direction" defaultValue={debt.direction}><option value="owed_to_me">Cette personne me doit</option><option value="i_owe">Je dois à cette personne</option></NativeSelect></FormField><div className="grid grid-cols-[1fr_110px] gap-3"><FormField label="Montant"><TextField type="number" name="amount" min="0.01" step="0.01" required defaultValue={debt.amount}/></FormField><FormField label="Devise"><NativeSelect name="currency" defaultValue={debt.currency}><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="CHF">CHF</option></NativeSelect></FormField></div><FormField label="Objet"><TextField name="title" required defaultValue={debt.title}/></FormField><FormField label="Échéance"><TextField type="date" name="dueAt" defaultValue={debt.dueAt?.toISOString().slice(0,10)}/></FormField><FormField label="Note"><TextAreaField name="note" rows={2} defaultValue={debt.note}/></FormField><SubmitButton>Enregistrer la dette</SubmitButton></ModalForm>;
}

export function PetForm({people}:{people:MentionPerson[]}) {
  return <ModalForm action={addPet} className="grid gap-4">
    <PhotoEditor/>
    <div className="grid grid-cols-2 gap-3"><FormField label="Nom"><TextField name="name" required/></FormField><FormField label="Espèce"><NativeSelect name="species"><option value="Chien">Chien</option><option value="Chat">Chat</option><option value="Oiseau">Oiseau</option><option value="Lapin">Lapin</option><option value="Cheval">Cheval</option><option value="Poisson">Poisson</option><option value="Autre">Autre</option></NativeSelect></FormField></div>
    <div className="grid grid-cols-2 gap-3"><FormField label="Race"><TextField name="breed"/></FormField><FormField label="Anniversaire"><TextField type="date" name="birthday"/></FormField></div>
    {people.length>0&&<fieldset className="grid gap-2"><legend className="text-sm font-medium">Personnes liées</legend><div className="max-h-44 overflow-y-auto rounded-lg border p-2">{people.map(person=><CheckPill key={person.id} label={`${person.firstName} ${person.lastName}`} name="ownerIds" value={person.id}/>)}</div><p className="text-xs text-muted-foreground">Vous pouvez choisir plusieurs responsables.</p></fieldset>}
    <FormField label="Notes"><TextAreaField name="notes" rows={3} placeholder="Habitudes, vétérinaire, alimentation…"/></FormField>
    <SubmitButton>Ajouter l’animal</SubmitButton>
  </ModalForm>;
}

export function EditPetForm({pet,people}:{pet:{id:string;name:string;species:string;breed:string;photo:string;birthday:Date|null;notes:string;owners:Array<{contactId:string}>};people:MentionPerson[]}) {
  const owners=new Set(pet.owners.map(owner=>owner.contactId));
  return <ModalForm action={updatePet} className="grid gap-4"><input type="hidden" name="id" value={pet.id}/>
    <PhotoEditor existingPhoto={pet.photo}/>
    <div className="grid grid-cols-2 gap-3"><FormField label="Nom"><TextField name="name" required defaultValue={pet.name}/></FormField><FormField label="Espèce"><NativeSelect name="species" defaultValue={pet.species}><option value="Chien">Chien</option><option value="Chat">Chat</option><option value="Oiseau">Oiseau</option><option value="Lapin">Lapin</option><option value="Cheval">Cheval</option><option value="Poisson">Poisson</option><option value="Autre">Autre</option></NativeSelect></FormField></div>
    <div className="grid grid-cols-2 gap-3"><FormField label="Race"><TextField name="breed" defaultValue={pet.breed}/></FormField><FormField label="Anniversaire"><TextField type="date" name="birthday" defaultValue={pet.birthday?.toISOString().slice(0,10)}/></FormField></div>
    <fieldset className="grid gap-2"><legend className="text-sm font-medium">Personnes liées</legend><div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border p-2">{people.map(person=><CheckPill key={person.id} label={`${person.firstName} ${person.lastName}`} name="ownerIds" value={person.id} defaultChecked={owners.has(person.id)}/>)}</div></fieldset>
    <FormField label="Notes"><TextAreaField name="notes" rows={3} defaultValue={pet.notes}/></FormField>
    <SubmitButton>Enregistrer l’animal</SubmitButton>
  </ModalForm>;
}

function PrivateToggle({selected=false}:{selected?:boolean}){return <label className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-sm"><input type="checkbox" name="private" defaultChecked={selected}/>Contenu sensible : masquer dans la préparation rapide</label>}

function FamilyGenderField({selected=""}:{selected?:string}) {
  return <FormField label="Terme utilisé dans l’arbre" hint="Facultatif. Permet d’afficher automatiquement sœur/frère, tante/oncle…"><NativeSelect name="gender" defaultValue={selected}><option value="">Neutre</option><option value="woman">Féminin</option><option value="man">Masculin</option><option value="other">Autre</option></NativeSelect></FormField>;
}
