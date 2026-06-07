"use client";

import { useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, FileSpreadsheet, FileUp, RotateCcw, Search, UsersRound } from "lucide-react";
import { importContacts } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/form-controls";
import { cn } from "@/lib/utils";

type ImportedContact={key:string;firstName:string;lastName:string;email:string;phone:string;company:string;birthday:string;notes:string;sourceId:string;fileName:string};
type ExistingContact={id:string;firstName:string;lastName:string;email:string;phone:string;company:string;sourceId:string};
type Circle={id:string;name:string;color:string};
type Decision={action:"create"|"merge"|"skip";targetId?:string};

function clean(value:string) {
  return value.replace(/\\n/gi,"\n").replace(/\\,/g,",").replace(/\\;/g,";").trim();
}
function value(line:string) { return clean(line.slice(line.indexOf(":")+1)); }
export function parseVcard(source:string,fileName:string):ImportedContact[] {
  return source.replace(/\r\n[ \t]/g,"").split(/END:VCARD/i).map((block,index)=>{
    const lines=block.split(/\r?\n/);const full=value(lines.find(l=>/^FN[;:]/i.test(l))??":");const n=value(lines.find(l=>/^N[;:]/i.test(l))??":").split(";");
    const org=value(lines.find(l=>/^ORG[;:]/i.test(l))??":").split(";")[0];const birthday=value(lines.find(l=>/^BDAY[;:]/i.test(l))??":").slice(0,10);
    return {key:`${fileName}-${index}`,firstName:n[1]||full.split(" ")[0]||"",lastName:n[0]||full.split(" ").slice(1).join(" "),email:value(lines.find(l=>/^EMAIL[;:]/i.test(l))??":"),phone:value(lines.find(l=>/^TEL[;:]/i.test(l))??":"),company:org,birthday,notes:value(lines.find(l=>/^NOTE[;:]/i.test(l))??":"),sourceId:value(lines.find(l=>/^UID[;:]/i.test(l))??":"),fileName};
  }).filter(c=>c.firstName||c.lastName||c.email||c.phone);
}
function parseCsvRows(source:string) {
  const separator=(source.split(/\r?\n/,1)[0].match(/;/g)?.length??0)>(source.split(/\r?\n/,1)[0].match(/,/g)?.length??0)?";":source.includes("\t")?"\t":",";
  const rows:string[][]=[];let row:string[]=[],cell="",quoted=false;
  for(let i=0;i<source.length;i++){const char=source[i];if(char==='"'){if(quoted&&source[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(char===separator&&!quoted){row.push(cell);cell="";}else if((char==="\n"||char==="\r")&&!quoted){if(char==="\r"&&source[i+1]==="\n")i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell="";}else cell+=char;}
  row.push(cell);if(row.some(Boolean))rows.push(row);return rows;
}
export function parseCsv(source:string,fileName:string):ImportedContact[] {
  const rows=parseCsvRows(source);if(rows.length<2)return[];const headers=rows[0].map(h=>h.trim().toLowerCase());
  const get=(row:string[],names:string[])=>{const index=headers.findIndex(h=>names.some(name=>h===name||h.includes(name)));return index>=0?clean(row[index]??""):"";};
  return rows.slice(1).map((row,index)=>{const fullIndex=headers.findIndex(header=>["name","nom complet","full name"].includes(header));const full=fullIndex>=0?clean(row[fullIndex]??""):"";const firstName=get(row,["first name","prénom","given name"])||full.split(" ")[0]||"";const lastName=get(row,["last name","nom de famille","family name"])||full.split(" ").slice(1).join(" ");
    return {key:`${fileName}-${index}`,firstName,lastName,email:get(row,["e-mail 1 - value","email address","e-mail address","email","e-mail"]),phone:get(row,["phone 1 - value","phone number","téléphone","phone"]),company:get(row,["organization 1 - name","organization","company","entreprise","société"]),birthday:get(row,["birthday","anniversaire"]).slice(0,10),notes:get(row,["notes","note"]),sourceId:"",fileName};
  }).filter(c=>c.firstName||c.lastName||c.email||c.phone);
}
function normalize(value:string){return value.toLowerCase().replace(/\s/g,"").replace(/[()+.-]/g,"")}
function sameIdentity(a:{email:string;phone:string},b:{email:string;phone:string}) {
  return !!((a.email&&b.email&&normalize(a.email)===normalize(b.email))||(a.phone&&b.phone&&normalize(a.phone)===normalize(b.phone)));
}
function findDuplicate(contact:ImportedContact,existing:ExistingContact[]) {
  return existing.find(person=>(contact.sourceId&&person.sourceId&&contact.sourceId===person.sourceId)||sameIdentity(contact,person));
}

export function VcardImport({existing,circles}:{existing:ExistingContact[];circles:Circle[]}) {
  const [contacts,setContacts]=useState<ImportedContact[]>([]);const [decisions,setDecisions]=useState<Record<string,Decision>>({});const [circleIds,setCircleIds]=useState<string[]>([]);const [query,setQuery]=useState("");const [show,setShow]=useState("all");
  const initialInput=useRef<HTMLInputElement>(null);const additionalInput=useRef<HTMLInputElement>(null);
  async function load(files:FileList) {
    const loaded=(await Promise.all([...files].map(async file=>file.name.toLowerCase().endsWith(".csv")?parseCsv(await file.text(),file.name):parseVcard(await file.text(),file.name)))).flat().map(contact=>({...contact,key:`${contact.key}-${crypto.randomUUID()}`}));
    setContacts(previous=>{const next=[...previous,...loaded];setDecisions(current=>Object.fromEntries(next.map((contact,index)=>{const duplicate=findDuplicate(contact,existing);const repeated=next.findIndex(candidate=>sameIdentity(contact,candidate))<index;return [contact.key,current[contact.key]??(repeated?{action:"skip"}:duplicate?{action:"merge",targetId:duplicate.id}:{action:"create"})]})));return next;});
  }
  const duplicateCount=contacts.filter((contact,index)=>findDuplicate(contact,existing)||contacts.findIndex(candidate=>sameIdentity(contact,candidate))<index).length;
  const selectedCount=contacts.filter(contact=>decisions[contact.key]?.action!=="skip").length;
  const filtered=useMemo(()=>contacts.filter((contact,index)=>{const duplicate=!!findDuplicate(contact,existing)||contacts.findIndex(candidate=>sameIdentity(contact,candidate))<index;const matches=`${contact.firstName} ${contact.lastName} ${contact.email} ${contact.phone} ${contact.company}`.toLowerCase().includes(query.toLowerCase());return matches&&(show==="all"||(show==="duplicates"&&duplicate)||(show==="new"&&!duplicate));}),[contacts,existing,query,show]);
  function reset(){setContacts([]);setDecisions({});setCircleIds([]);setQuery("");setShow("all")}
  if(!contacts.length)return <div className="grid gap-5 lg:grid-cols-[1fr_.75fr]"><div className="card grid min-h-80 place-items-center p-8 text-center transition hover:border-foreground/30 hover:bg-muted/30"><div><span className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-muted"><FileUp className="size-5"/></span><h2 className="text-lg font-semibold">Déposez vos carnets d’adresses</h2><p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Sélectionnez un ou plusieurs fichiers `.vcf` ou `.csv`. Tout est analysé avant l’import.</p><Button type="button" className="mt-5" onClick={()=>initialInput.current?.click()}>Choisir des fichiers</Button><input ref={initialInput} className="sr-only" type="file" multiple accept=".vcf,.csv,text/vcard,text/csv" onChange={event=>event.target.files&&load(event.target.files)}/></div></div><ImportHelp/></div>;
  return <form action={importContacts}><input type="hidden" name="contacts" value={JSON.stringify(contacts.map(contact=>({...contact,decision:decisions[contact.key]??{action:"skip"}})))}/>{circleIds.map(id=><input key={id} type="hidden" name="circleIds" value={id}/>)}
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><Stat value={contacts.length} label="détectés" icon={<UsersRound/>}/><Stat value={contacts.length-duplicateCount} label="nouveaux" icon={<Check/>}/><Stat value={duplicateCount} label="doublons à vérifier" icon={<AlertTriangle/>}/></div>
    <div className="card mb-5 p-4"><div className="flex flex-wrap items-center gap-3"><div className="relative min-w-56 flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher dans l’import…" className="pl-9"/></div><NativeSelect value={show} onChange={e=>setShow(e.target.value)} className="w-48"><option value="all">Tous les contacts</option><option value="new">Nouveaux uniquement</option><option value="duplicates">Doublons uniquement</option></NativeSelect><Button type="button" variant="outline" onClick={()=>additionalInput.current?.click()}><FileSpreadsheet/>Ajouter des fichiers</Button><input ref={additionalInput} className="sr-only" type="file" multiple accept=".vcf,.csv,text/vcard,text/csv" onChange={event=>event.target.files&&load(event.target.files)}/><Button type="button" variant="ghost" onClick={reset}><RotateCcw/>Recommencer</Button></div>
      {circles.length>0&&<div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4"><span className="mr-1 text-sm font-medium">Ajouter aux cercles :</span>{circles.map(circle=><button type="button" key={circle.id} onClick={()=>setCircleIds(ids=>ids.includes(circle.id)?ids.filter(id=>id!==circle.id):[...ids,circle.id])} className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition hover:bg-muted",circleIds.includes(circle.id)&&"border-foreground bg-foreground text-background hover:bg-foreground")}><span className="size-2 rounded-full" style={{background:circle.color}}/>{circle.name}</button>)}</div>}
    </div>
    <div className="overflow-hidden rounded-xl border bg-card">{filtered.map((contact,index)=>{const originalIndex=contacts.findIndex(candidate=>candidate.key===contact.key);const duplicate=findDuplicate(contact,existing);const repeated=contacts.findIndex(candidate=>sameIdentity(contact,candidate))<originalIndex;const decision=decisions[contact.key]??{action:"skip"};return <div key={contact.key} className={cn("grid gap-3 p-4 lg:grid-cols-[1.2fr_1fr_190px]",index>0&&"border-t",decision.action==="skip"&&"opacity-55")}><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><b className="truncate text-sm">{contact.firstName} {contact.lastName}</b>{(duplicate||repeated)&&<span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">Doublon probable</span>}<span className="text-[11px] text-muted-foreground">{contact.fileName}</span></div><p className="mt-1 truncate text-xs text-muted-foreground">{[contact.email,contact.phone,contact.company].filter(Boolean).join(" · ")||"Aucune coordonnée"}</p>{(contact.birthday||contact.notes)&&<p className="mt-1 truncate text-xs text-muted-foreground">{contact.birthday&&`Anniversaire : ${contact.birthday}`}{contact.birthday&&contact.notes&&" · "}{contact.notes}</p>}</div><div className="text-xs text-muted-foreground">{duplicate?<><p>Correspond à</p><p className="mt-1 font-medium text-foreground">{duplicate.firstName} {duplicate.lastName}</p><p className="truncate">{duplicate.email||duplicate.phone}</p></>:repeated?<p className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300"><AlertTriangle className="size-3.5"/>Déjà présent dans ces fichiers</p>:<p className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300"><Check className="size-3.5"/>Nouveau contact</p>}</div><NativeSelect value={decision.action} onChange={event=>setDecisions(current=>({...current,[contact.key]:{action:event.target.value as Decision["action"],targetId:duplicate?.id}}))}><option value="create">Créer une nouvelle fiche</option>{duplicate&&<option value="merge">Fusionner les champs vides</option>}<option value="skip">Ignorer</option></NativeSelect></div>})}{!filtered.length&&<p className="p-10 text-center text-sm text-muted-foreground">Aucun contact ne correspond à ce filtre.</p>}</div>
    <div className="sticky bottom-20 mt-5 flex items-center justify-between gap-4 rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur md:bottom-4"><div><p className="text-sm font-medium">{selectedCount} contact{selectedCount!==1?"s":""} à traiter</p><p className="text-xs text-muted-foreground">Les fusions complètent uniquement les champs encore vides.</p></div><Button type="submit" size="lg" disabled={!selectedCount}>Importer maintenant</Button></div>
  </form>;
}

function Stat({value,label,icon}:{value:number;label:string;icon:React.ReactNode}){return <div className="card flex items-center gap-3 p-4"><span className="grid size-9 place-items-center rounded-lg bg-muted [&_svg]:size-4">{icon}</span><div><p className="text-xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></div>}
function ImportHelp(){return <aside className="card p-6"><h2 className="font-semibold">Formats pris en charge</h2><div className="mt-4 space-y-4 text-sm"><div><b>Apple iCloud</b><p className="mt-1 text-muted-foreground">Contacts sur iCloud.com → sélectionner → Exporter une vCard.</p></div><div><b>Google Contacts</b><p className="mt-1 text-muted-foreground">Exporter au format Google CSV ou vCard.</p></div><div><b>Données reconnues</b><p className="mt-1 text-muted-foreground">Nom, e-mail, téléphone, entreprise, anniversaire et notes.</p></div></div><div className="mt-5 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">Les fichiers restent dans votre navigateur jusqu’à votre confirmation. L’import fonctionne sans connexion à Apple ou Google.</div></aside>}
