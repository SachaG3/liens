import { Bell, CalendarHeart, FileText, Gift, Link2, ListTodo, MessageCircle, Pencil, UserPlus } from "lucide-react";

type Activity={id:string;date:Date;title:string;detail:string;kind:"contact"|"edit"|"interaction"|"reminder"|"gift"|"link"|"journal"|"date"|"conversation"};
const icons={contact:UserPlus,edit:Pencil,interaction:MessageCircle,reminder:Bell,gift:Gift,link:Link2,journal:FileText,date:CalendarHeart,conversation:ListTodo};

export function ContactActivity({contact}:{contact:{
  firstName:string;createdAt:Date;updatedAt:Date;
  interactions:Array<{id:string;type:string;note:string;happenedAt:Date}>;
  reminders:Array<{id:string;title:string;dueAt:Date;done:boolean;createdAt:Date}>;
  giftIdeas:Array<{id:string;title:string;purchased:boolean;createdAt:Date}>;
  linksFrom:Array<{id:string;createdAt:Date;toContact:{firstName:string;lastName:string}}>;
  linksTo:Array<{id:string;createdAt:Date;fromContact:{firstName:string;lastName:string}}>;
  journalEntries:Array<{id:string;title:string;content:string;private:boolean;createdAt:Date}>;
  importantDates:Array<{id:string;title:string;date:Date;createdAt:Date}>;
  conversationItems:Array<{id:string;title:string;detail:string;private:boolean;createdAt:Date}>;
}}) {
  const activities:Activity[]=[
    {id:"created",date:contact.createdAt,title:"Fiche créée",detail:`${contact.firstName} a été ajouté à votre carnet.`,kind:"contact"},
    ...contact.interactions.map(item=>({id:`interaction-${item.id}`,date:item.happenedAt,title:interactionLabel(item.type),detail:item.note||"Échange enregistré sans note.",kind:"interaction" as const})),
    ...contact.reminders.map(item=>({id:`reminder-${item.id}`,date:item.createdAt,title:item.done?"Rappel terminé":"Rappel créé",detail:`${item.title} · prévu le ${item.dueAt.toLocaleDateString("fr-FR")}`,kind:"reminder" as const})),
    ...contact.giftIdeas.map(item=>({id:`gift-${item.id}`,date:item.createdAt,title:item.purchased?"Cadeau acheté":"Idée cadeau ajoutée",detail:item.title,kind:"gift" as const})),
    ...contact.linksFrom.map(item=>({id:`link-from-${item.id}`,date:item.createdAt,title:"Personne liée",detail:`Lien créé avec ${item.toContact.firstName} ${item.toContact.lastName}.`,kind:"link" as const})),
    ...contact.linksTo.map(item=>({id:`link-to-${item.id}`,date:item.createdAt,title:"Personne liée",detail:`Lien créé avec ${item.fromContact.firstName} ${item.fromContact.lastName}.`,kind:"link" as const})),
    ...contact.journalEntries.map(item=>({id:`journal-${item.id}`,date:item.createdAt,title:"Événement ajouté au journal",detail:item.private?"Contenu sensible masqué":item.title,kind:"journal" as const})),
    ...contact.importantDates.map(item=>({id:`date-${item.id}`,date:item.createdAt,title:"Date importante ajoutée",detail:`${item.title} · ${item.date.toLocaleDateString("fr-FR")}`,kind:"date" as const})),
    ...contact.conversationItems.map(item=>({id:`conversation-${item.id}`,date:item.createdAt,title:"Élément de conversation ajouté",detail:item.private?"Contenu sensible masqué":item.title,kind:"conversation" as const})),
  ];
  if(contact.updatedAt.getTime()-contact.createdAt.getTime()>60_000)activities.push({id:"updated",date:contact.updatedAt,title:"Fiche modifiée",detail:"Les informations de cette personne ont été mises à jour.",kind:"edit"});
  activities.sort((a,b)=>b.date.getTime()-a.date.getTime());
  return <div className="space-y-1">{activities.map((activity,index)=>{const Icon=icons[activity.kind];return <div key={activity.id} className="relative flex gap-3 pb-5">{index<activities.length-1&&<span className="absolute left-[17px] top-9 h-[calc(100%-1.25rem)] w-px bg-border"/>}<span className="relative z-10 grid size-9 shrink-0 place-items-center rounded-full border bg-background"><Icon className="size-4"/></span><div className="min-w-0 flex-1 pt-0.5"><div className="flex flex-wrap items-start justify-between gap-2"><p className="text-sm font-medium">{activity.title}</p><time className="text-xs text-muted-foreground">{activity.date.toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}</time></div><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{activity.detail}</p></div></div>})}</div>;
}

function interactionLabel(type:string){return ({message:"Message enregistré",call:"Appel enregistré",meeting:"Rencontre enregistrée",email:"E-mail enregistré"} as Record<string,string>)[type]||"Échange enregistré"}
