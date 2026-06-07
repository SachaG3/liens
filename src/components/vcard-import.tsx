"use client";

import { useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, ChevronDown, Columns3, FileSpreadsheet, FileUp, ListChecks, PanelRight, RotateCcw, Search, UsersRound, X } from "lucide-react";
import { importContacts } from "@/app/actions";
import { NativeSelect } from "@/components/form-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { relationTypes } from "@/lib/relation-types";
import { cn } from "@/lib/utils";

type ImportedContact={key:string;firstName:string;lastName:string;email:string;phone:string;company:string;birthday:string;notes:string;sourceId:string;fileName:string};
type ExistingContact={id:string;firstName:string;lastName:string;email:string;phone:string;company:string;sourceId:string};
type Circle={id:string;name:string;color:string};
type Action="create"|"merge"|"skip";
type Choice={selected:boolean;action:Action;targetId?:string;circleIds:string[];relationTags:string[]};
type ImportMode="table"|"wizard"|"panel";

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
  const [contacts,setContacts]=useState<ImportedContact[]>([]);
  const [choices,setChoices]=useState<Record<string,Choice>>({});
  const [query,setQuery]=useState("");
  const [show,setShow]=useState("all");
  const [mode,setMode]=useState<ImportMode>("table");
  const [wizardStep,setWizardStep]=useState(0);
  const [activeKey,setActiveKey]=useState("");
  const initialInput=useRef<HTMLInputElement>(null);
  const additionalInput=useRef<HTMLInputElement>(null);

  async function load(files:FileList) {
    const loaded=(await Promise.all([...files].map(async file=>file.name.toLowerCase().endsWith(".csv")?parseCsv(await file.text(),file.name):parseVcard(await file.text(),file.name)))).flat().map(contact=>({...contact,key:`${contact.key}-${crypto.randomUUID()}`}));
    addContacts(loaded);
  }
  function addContacts(loaded:ImportedContact[]) {
    setContacts(previous=>{
      const next=[...previous,...loaded];
      setChoices(current=>Object.fromEntries(next.map((contact,index)=>{
        const duplicate=findDuplicate(contact,existing);
        const repeated=next.findIndex(candidate=>sameIdentity(contact,candidate))<index;
        return [contact.key,current[contact.key]??{selected:!repeated,action:repeated?"skip":duplicate?"merge":"create",targetId:duplicate?.id,circleIds:[],relationTags:[]}];
      })));
      setActiveKey(current=>current||loaded[0]?.key||"");
      return next;
    });
  }
  function loadExample() {
    addContacts([
      {key:`example-1-${crypto.randomUUID()}`,firstName:"Camille",lastName:"Martin",email:"camille.martin@example.com",phone:"0612345678",company:"",birthday:"1992-04-18",notes:"Aime la randonnée",sourceId:"example-1",fileName:"exemple.csv"},
      {key:`example-2-${crypto.randomUUID()}`,firstName:"Alex",lastName:"Dupont",email:"alex.dupont@example.com",phone:"0698765432",company:"Studio Nova",birthday:"",notes:"",sourceId:"example-2",fileName:"exemple.csv"},
      {key:`example-3-${crypto.randomUUID()}`,firstName:"Sophie",lastName:"Martin",email:"sophie.martin@example.com",phone:"",company:"",birthday:"",notes:"Doublon de démonstration",sourceId:"",fileName:"exemple.csv"},
    ]);
  }

  const duplicateCount=contacts.filter((contact,index)=>findDuplicate(contact,existing)||contacts.findIndex(candidate=>sameIdentity(contact,candidate))<index).length;
  const filtered=useMemo(()=>contacts.filter((contact,index)=>{
    const duplicate=!!findDuplicate(contact,existing)||contacts.findIndex(candidate=>sameIdentity(contact,candidate))<index;
    const matches=`${contact.firstName} ${contact.lastName} ${contact.email} ${contact.phone} ${contact.company}`.toLowerCase().includes(query.toLowerCase());
    return matches&&(show==="all"||(show==="duplicates"&&duplicate)||(show==="new"&&!duplicate));
  }),[contacts,existing,query,show]);
  const selectedKeys=contacts.filter(contact=>choices[contact.key]?.selected).map(contact=>contact.key);
  const importCount=contacts.filter(contact=>choices[contact.key]?.selected&&choices[contact.key]?.action!=="skip").length;
  const allFilteredSelected=filtered.length>0&&filtered.every(contact=>choices[contact.key]?.selected);
  const selectedCircleIds=new Set(selectedKeys.flatMap(key=>choices[key]?.circleIds??[]));
  const selectedRelations=new Set(selectedKeys.flatMap(key=>choices[key]?.relationTags??[]));

  function updateSelected(mutator:(choice:Choice)=>Choice) {
    setChoices(current=>Object.fromEntries(Object.entries(current).map(([key,choice])=>[key,selectedKeys.includes(key)?mutator(choice):choice])));
  }
  function updateChoice(key:string,mutator:(choice:Choice)=>Choice) {
    setChoices(current=>({...current,[key]:mutator(current[key])}));
  }
  function toggleChoiceValue(key:string,field:"circleIds"|"relationTags",value:string) {
    updateChoice(key,choice=>({...choice,[field]:choice[field].includes(value)?choice[field].filter(item=>item!==value):[...choice[field],value]}));
  }
  function toggleBatchValue(field:"circleIds"|"relationTags",value:string) {
    const remove=selectedKeys.length>0&&selectedKeys.every(key=>choices[key]?.[field].includes(value));
    updateSelected(choice=>({...choice,[field]:remove?choice[field].filter(item=>item!==value):[...new Set([...choice[field],value])]}));
  }
  function removeBatchValue(field:"circleIds"|"relationTags",value:string) {
    updateSelected(choice=>({...choice,[field]:choice[field].filter(item=>item!==value)}));
  }
  function toggleFiltered() {
    setChoices(current=>({...current,...Object.fromEntries(filtered.map(contact=>[contact.key,{...current[contact.key],selected:!allFilteredSelected}]))}));
  }
  function reset(){setContacts([]);setChoices({});setQuery("");setShow("all");setWizardStep(0);setActiveKey("")}

  if(!contacts.length)return <><ModeSelector mode={mode} setMode={setMode}/><div className="grid gap-5 lg:grid-cols-[1fr_.75fr]"><div className="card grid min-h-80 place-items-center p-8 text-center transition hover:border-foreground/30 hover:bg-muted/30"><div><span className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-muted"><FileUp className="size-5"/></span><h2 className="text-lg font-semibold">Déposez vos carnets d’adresses</h2><p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Sélectionnez un ou plusieurs fichiers `.vcf` ou `.csv`. Tout est analysé avant l’import.</p><p className="mt-2 text-xs text-muted-foreground">Mode choisi : {modeLabel(mode)}</p><div className="mt-5 flex flex-wrap justify-center gap-2"><Button type="button" onClick={()=>initialInput.current?.click()}>Choisir des fichiers</Button><Button type="button" variant="outline" onClick={loadExample}>Tester avec un exemple</Button></div><input ref={initialInput} className="sr-only" type="file" multiple accept=".vcf,.csv,text/vcard,text/csv" onChange={event=>event.target.files&&load(event.target.files)}/></div></div><ImportHelp/></div></>;

  return <form action={importContacts}>
    <input type="hidden" name="contacts" value={JSON.stringify(contacts.map(contact=>({...contact,choice:choices[contact.key]})))}/>
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><Stat value={contacts.length} label="détectés" icon={<UsersRound/>}/><Stat value={contacts.length-duplicateCount} label="nouveaux" icon={<Check/>}/><Stat value={duplicateCount} label="doublons à vérifier" icon={<AlertTriangle/>}/></div>

    <div className="card mb-5 p-4">
      <div className="flex flex-wrap items-center gap-3"><div className="relative min-w-56 flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher dans l’import…" className="pl-9"/></div><NativeSelect value={show} onChange={e=>setShow(e.target.value)} className="w-48"><option value="all">Tous les contacts</option><option value="new">Nouveaux uniquement</option><option value="duplicates">Doublons uniquement</option></NativeSelect><Button type="button" variant="outline" onClick={()=>additionalInput.current?.click()}><FileSpreadsheet/>Ajouter des fichiers</Button><input ref={additionalInput} className="sr-only" type="file" multiple accept=".vcf,.csv,text/vcard,text/csv" onChange={event=>event.target.files&&load(event.target.files)}/><Button type="button" variant="ghost" onClick={reset}><RotateCcw/>Recommencer</Button></div>
      <ModeSelector mode={mode} setMode={setMode} compact/>
    </div>

    {mode==="table"&&<TableMode contacts={filtered} allContacts={contacts} existing={existing} circles={circles} choices={choices} allFilteredSelected={allFilteredSelected} selectedKeys={selectedKeys} selectedCircleIds={selectedCircleIds} selectedRelations={selectedRelations} onToggleFiltered={toggleFiltered} onUpdateSelected={updateSelected} onToggleBatchValue={toggleBatchValue} onRemoveBatchValue={removeBatchValue} onUpdateChoice={updateChoice} onToggleChoiceValue={toggleChoiceValue}/>}
    {mode==="wizard"&&<WizardMode step={wizardStep} setStep={setWizardStep} contacts={filtered} allContacts={contacts} existing={existing} circles={circles} choices={choices} selectedKeys={selectedKeys} selectedCircleIds={selectedCircleIds} selectedRelations={selectedRelations} onToggleBatchValue={toggleBatchValue} onRemoveBatchValue={removeBatchValue} onUpdateChoice={updateChoice}/>}
    {mode==="panel"&&<PanelMode contacts={filtered} allContacts={contacts} existing={existing} circles={circles} choices={choices} activeKey={activeKey} setActiveKey={setActiveKey} onUpdateChoice={updateChoice} onToggleChoiceValue={toggleChoiceValue}/>}

    <div className="sticky bottom-20 mt-5 flex items-center justify-between gap-4 rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur md:bottom-4"><div><p className="text-sm font-medium">{importCount} contact{importCount!==1?"s":""} à importer</p><p className="text-xs text-muted-foreground">Les contacts décochés ou marqués « Ignorer » ne seront pas importés.</p></div><Button type="submit" size="lg" disabled={!importCount}>Importer maintenant</Button></div>
  </form>;
}

function ModeButton({active,icon,title,text,onClick}:{active:boolean;icon:React.ReactNode;title:string;text:string;onClick:()=>void}) {
  return <button type="button" onClick={onClick} className={cn("flex items-start gap-3 rounded-lg border p-3 text-left transition hover:bg-muted/60",active&&"border-foreground bg-muted")}><span className="mt-0.5 [&_svg]:size-4">{icon}</span><span><b className="block text-sm">{title}</b><span className="mt-0.5 block text-xs text-muted-foreground">{text}</span></span></button>;
}
function ModeSelector({mode,setMode,compact=false}:{mode:ImportMode;setMode:(mode:ImportMode)=>void;compact?:boolean}) {
  return <section className={cn("card mb-5 p-4",compact&&"mt-4 mb-0 border-x-0 border-b-0 shadow-none")}><div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">Mode d’import</h2><p className="text-xs text-muted-foreground">Vous pourrez changer de mode sans perdre vos choix.</p></div><span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{modeLabel(mode)}</span></div><div className="grid gap-2 sm:grid-cols-3"><ModeButton active={mode==="table"} icon={<Columns3/>} title="Tableau rapide" text="Tout régler directement dans chaque ligne." onClick={()=>setMode("table")}/><ModeButton active={mode==="wizard"} icon={<ListChecks/>} title="Assistant guidé" text="Avancer décision par décision." onClick={()=>setMode("wizard")}/><ModeButton active={mode==="panel"} icon={<PanelRight/>} title="Panneau détaillé" text="Examiner chaque fiche confortablement." onClick={()=>setMode("panel")}/></div></section>;
}
function modeLabel(mode:ImportMode){return mode==="table"?"Tableau rapide":mode==="wizard"?"Assistant guidé":"Panneau détaillé"}
function TableMode({contacts,allContacts,existing,circles,choices,allFilteredSelected,selectedKeys,selectedCircleIds,selectedRelations,onToggleFiltered,onUpdateSelected,onToggleBatchValue,onRemoveBatchValue,onUpdateChoice,onToggleChoiceValue}:{contacts:ImportedContact[];allContacts:ImportedContact[];existing:ExistingContact[];circles:Circle[];choices:Record<string,Choice>;allFilteredSelected:boolean;selectedKeys:string[];selectedCircleIds:Set<string>;selectedRelations:Set<string>;onToggleFiltered:()=>void;onUpdateSelected:(mutator:(choice:Choice)=>Choice)=>void;onToggleBatchValue:(field:"circleIds"|"relationTags",value:string)=>void;onRemoveBatchValue:(field:"circleIds"|"relationTags",value:string)=>void;onUpdateChoice:(key:string,mutator:(choice:Choice)=>Choice)=>void;onToggleChoiceValue:(key:string,field:"circleIds"|"relationTags",value:string)=>void}) {
  return <><BatchBar allFilteredSelected={allFilteredSelected} selectedKeys={selectedKeys} circles={circles} selectedCircleIds={selectedCircleIds} selectedRelations={selectedRelations} onToggleFiltered={onToggleFiltered} onUpdateSelected={onUpdateSelected} onToggleBatchValue={onToggleBatchValue} onRemoveBatchValue={onRemoveBatchValue}/>
    <div className="overflow-hidden rounded-xl border bg-card">{contacts.map((contact,index)=>{const choice=choices[contact.key];return <div key={contact.key} className={cn("grid gap-3 p-4 xl:grid-cols-[auto_minmax(180px,1fr)_180px_180px_180px]",index>0&&"border-t",!choice?.selected&&"opacity-50")}><ContactCheck contact={contact} choice={choice} onUpdate={mutator=>onUpdateChoice(contact.key,mutator)}/><ContactSummary contact={contact} allContacts={allContacts} existing={existing}/><ActionMenu value={choice?.action} disabled={!choice?.selected} onAction={action=>onUpdateChoice(contact.key,current=>({...current,action}))}/><CircleMenu circles={circles} selected={new Set(choice?.circleIds)} disabled={!choice?.selected} onToggle={id=>onToggleChoiceValue(contact.key,"circleIds",id)}/><RelationMenu selected={new Set(choice?.relationTags)} disabled={!choice?.selected} onToggle={tag=>onToggleChoiceValue(contact.key,"relationTags",tag)}/></div>})}<EmptyResults contacts={contacts}/></div>
  </>;
}
function WizardMode({step,setStep,contacts,allContacts,existing,circles,choices,selectedKeys,selectedCircleIds,selectedRelations,onToggleBatchValue,onRemoveBatchValue,onUpdateChoice}:{step:number;setStep:(step:number)=>void;contacts:ImportedContact[];allContacts:ImportedContact[];existing:ExistingContact[];circles:Circle[];choices:Record<string,Choice>;selectedKeys:string[];selectedCircleIds:Set<string>;selectedRelations:Set<string>;onToggleBatchValue:(field:"circleIds"|"relationTags",value:string)=>void;onRemoveBatchValue:(field:"circleIds"|"relationTags",value:string)=>void;onUpdateChoice:(key:string,mutator:(choice:Choice)=>Choice)=>void}) {
  const steps=["Sélection","Doublons","Cercles","Relations","Vérification"];
  const selected=contacts.filter(contact=>choices[contact.key]?.selected);
  const shown=step===0?contacts:selected;
  return <section className="card overflow-hidden"><div className="flex gap-1 overflow-x-auto border-b p-3">{steps.map((label,index)=><button type="button" key={label} onClick={()=>setStep(index)} className={cn("shrink-0 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground",step===index&&"bg-foreground text-background")}>{index+1}. {label}</button>)}</div>
    <div className="p-5"><div className="mb-5"><h2 className="text-lg font-semibold">{steps[step]}</h2><p className="mt-1 text-sm text-muted-foreground">{step===0?"Choisissez les personnes à importer.":step===1?"Décidez quoi faire avec chaque doublon.":step===2?"Ajoutez un ou plusieurs cercles à la sélection.":step===3?"Ajoutez un ou plusieurs types de relation.":"Contrôlez les choix avant l’import."}</p></div>
      {step===0&&<div className="overflow-hidden rounded-lg border">{shown.map((contact,index)=><div key={contact.key} className={cn("flex items-center gap-3 p-3",index>0&&"border-t")}><ContactCheck contact={contact} choice={choices[contact.key]} onUpdate={mutator=>onUpdateChoice(contact.key,mutator)}/><ContactSummary contact={contact} allContacts={allContacts} existing={existing}/></div>)}<EmptyResults contacts={shown}/></div>}
      {step===1&&<div className="space-y-2">{shown.map(contact=><div key={contact.key} className="grid items-center gap-3 rounded-lg border p-3 md:grid-cols-[1fr_260px]"><ContactSummary contact={contact} allContacts={allContacts} existing={existing}/><ActionMenu value={choices[contact.key]?.action} onAction={action=>onUpdateChoice(contact.key,current=>({...current,action}))}/></div>)}</div>}
      {step===2&&<AssignmentStep title={`${selectedKeys.length} personne${selectedKeys.length!==1?"s":""} sélectionnée${selectedKeys.length!==1?"s":""}`} menu={<CircleMenu circles={circles} selected={selectedCircleIds} onToggle={id=>onToggleBatchValue("circleIds",id)}/>} chips={[...selectedCircleIds].map(id=>{const circle=circles.find(item=>item.id===id);return circle&&<SelectionChip key={id} label={circle.name} color={circle.color} onRemove={()=>onRemoveBatchValue("circleIds",id)}/>})}/>}
      {step===3&&<AssignmentStep title={`${selectedKeys.length} personne${selectedKeys.length!==1?"s":""} sélectionnée${selectedKeys.length!==1?"s":""}`} menu={<RelationMenu selected={selectedRelations} onToggle={tag=>onToggleBatchValue("relationTags",tag)}/>} chips={[...selectedRelations].map(tag=><SelectionChip key={tag} label={tag} onRemove={()=>onRemoveBatchValue("relationTags",tag)}/>)}/>}
      {step===4&&<div className="overflow-hidden rounded-lg border">{shown.map((contact,index)=><ReviewRow key={contact.key} contact={contact} choice={choices[contact.key]} circles={circles} index={index}/>)}</div>}
    </div>
    <div className="flex justify-between border-t p-4"><Button type="button" variant="outline" disabled={step===0} onClick={()=>setStep(Math.max(0,step-1))}>Précédent</Button><Button type="button" disabled={step===steps.length-1} onClick={()=>setStep(Math.min(steps.length-1,step+1))}>Suivant</Button></div>
  </section>;
}
function PanelMode({contacts,allContacts,existing,circles,choices,activeKey,setActiveKey,onUpdateChoice,onToggleChoiceValue}:{contacts:ImportedContact[];allContacts:ImportedContact[];existing:ExistingContact[];circles:Circle[];choices:Record<string,Choice>;activeKey:string;setActiveKey:(key:string)=>void;onUpdateChoice:(key:string,mutator:(choice:Choice)=>Choice)=>void;onToggleChoiceValue:(key:string,field:"circleIds"|"relationTags",value:string)=>void}) {
  const active=contacts.find(contact=>contact.key===activeKey)??contacts[0];
  const choice=active&&choices[active.key];
  return <div className="grid min-h-[580px] overflow-hidden rounded-xl border bg-card lg:grid-cols-[320px_1fr]"><div className="border-b lg:border-b-0 lg:border-r"><div className="border-b p-4"><p className="text-sm font-semibold">{contacts.length} personne{contacts.length!==1?"s":""}</p><p className="text-xs text-muted-foreground">Sélectionnez une fiche à examiner.</p></div><div className="max-h-[520px] overflow-y-auto">{contacts.map(contact=><button type="button" key={contact.key} onClick={()=>setActiveKey(contact.key)} className={cn("flex w-full items-center gap-3 border-b p-3 text-left hover:bg-muted/60",active?.key===contact.key&&"bg-muted")}><NativeCheckbox checked={choices[contact.key]?.selected??false}/><span className="min-w-0"><b className="block truncate text-sm">{contact.firstName} {contact.lastName}</b><span className="block truncate text-xs text-muted-foreground">{contact.email||contact.phone||contact.company||"Aucune coordonnée"}</span></span></button>)}</div></div>
    {active&&choice?<div className="p-6"><div className="mb-7 flex items-start justify-between gap-4"><div><p className="text-xs text-muted-foreground">{active.fileName}</p><h2 className="mt-1 text-2xl font-semibold">{active.firstName} {active.lastName}</h2><p className="mt-2 text-sm text-muted-foreground">{[active.email,active.phone,active.company].filter(Boolean).join(" · ")||"Aucune coordonnée"}</p></div><button type="button" onClick={()=>onUpdateChoice(active.key,current=>({...current,selected:!current.selected}))} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"><NativeCheckbox checked={choice.selected}/>{choice.selected?"Incluse":"Exclue"}</button></div><div className="grid gap-6"><EditorSection title="Gestion du doublon" text="Choisissez comment cette personne sera traitée."><ActionMenu value={choice.action} disabled={!choice.selected} onAction={action=>onUpdateChoice(active.key,current=>({...current,action}))}/><div className="mt-3"><ContactSummary contact={active} allContacts={allContacts} existing={existing}/></div></EditorSection><EditorSection title="Cercles" text="Vous pouvez en sélectionner plusieurs."><CircleMenu circles={circles} selected={new Set(choice.circleIds)} disabled={!choice.selected} onToggle={id=>onToggleChoiceValue(active.key,"circleIds",id)}/><ChipSummary choice={choice} circles={circles} field="circleIds" onRemove={id=>onToggleChoiceValue(active.key,"circleIds",id)}/></EditorSection><EditorSection title="Relations" text="Ajoutez tous les rôles qui correspondent."><RelationMenu selected={new Set(choice.relationTags)} disabled={!choice.selected} onToggle={tag=>onToggleChoiceValue(active.key,"relationTags",tag)}/><ChipSummary choice={choice} circles={circles} field="relationTags" onRemove={tag=>onToggleChoiceValue(active.key,"relationTags",tag)}/></EditorSection></div></div>:<p className="grid place-items-center p-12 text-sm text-muted-foreground">Aucun contact dans ce filtre.</p>}</div>;
}
function BatchBar({allFilteredSelected,selectedKeys,circles,selectedCircleIds,selectedRelations,onToggleFiltered,onUpdateSelected,onToggleBatchValue,onRemoveBatchValue}:{allFilteredSelected:boolean;selectedKeys:string[];circles:Circle[];selectedCircleIds:Set<string>;selectedRelations:Set<string>;onToggleFiltered:()=>void;onUpdateSelected:(mutator:(choice:Choice)=>Choice)=>void;onToggleBatchValue:(field:"circleIds"|"relationTags",value:string)=>void;onRemoveBatchValue:(field:"circleIds"|"relationTags",value:string)=>void}) {
  return <div className="card mb-4 p-3"><div className="flex flex-wrap items-center gap-2"><button type="button" onClick={onToggleFiltered} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted"><NativeCheckbox checked={allFilteredSelected}/>{allFilteredSelected?"Désélectionner les résultats":"Sélectionner les résultats"}</button><span className="mr-auto text-xs text-muted-foreground">{selectedKeys.length} sélectionné{selectedKeys.length!==1?"s":""}</span><ActionMenu disabled={!selectedKeys.length} onAction={action=>onUpdateSelected(choice=>({...choice,action}))}/><CircleMenu circles={circles} selected={selectedCircleIds} disabled={!selectedKeys.length} onToggle={id=>onToggleBatchValue("circleIds",id)}/><RelationMenu selected={selectedRelations} disabled={!selectedKeys.length} onToggle={tag=>onToggleBatchValue("relationTags",tag)}/></div>{(selectedCircleIds.size>0||selectedRelations.size>0)&&<div className="mt-3 flex flex-wrap gap-1.5 border-t pt-3">{[...selectedCircleIds].map(id=>{const circle=circles.find(item=>item.id===id);return circle&&<SelectionChip key={id} label={circle.name} color={circle.color} onRemove={()=>onRemoveBatchValue("circleIds",id)}/>})}{[...selectedRelations].map(tag=><SelectionChip key={tag} label={tag} onRemove={()=>onRemoveBatchValue("relationTags",tag)}/>)}</div>}</div>;
}
function ContactCheck({contact,choice,onUpdate}:{contact:ImportedContact;choice:Choice|undefined;onUpdate:(mutator:(choice:Choice)=>Choice)=>void}){return <button type="button" className="self-start rounded-md p-1" aria-label={`${choice?.selected?"Désélectionner":"Sélectionner"} ${contact.firstName} ${contact.lastName}`} onClick={()=>onUpdate(current=>({...current,selected:!current.selected}))}><NativeCheckbox checked={choice?.selected??false}/></button>}
function ContactSummary({contact,allContacts,existing}:{contact:ImportedContact;allContacts:ImportedContact[];existing:ExistingContact[]}){const duplicate=findDuplicate(contact,existing);const currentIndex=allContacts.findIndex(candidate=>candidate.key===contact.key);const repeated=allContacts.some((candidate,index)=>index<currentIndex&&sameIdentity(contact,candidate));return <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><b className="truncate text-sm">{contact.firstName} {contact.lastName}</b>{(duplicate||repeated)&&<span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">Doublon probable</span>}</div><p className="mt-1 truncate text-xs text-muted-foreground">{[contact.email,contact.phone,contact.company].filter(Boolean).join(" · ")||"Aucune coordonnée"}</p>{duplicate&&<p className="mt-1 truncate text-xs text-muted-foreground">Correspond à {duplicate.firstName} {duplicate.lastName}</p>}</div>}
function ReviewRow({contact,choice,circles,index}:{contact:ImportedContact;choice:Choice;circles:Circle[];index:number}){return <div className={cn("grid gap-3 p-3 md:grid-cols-[1fr_auto]",index>0&&"border-t")}><div><b className="text-sm">{contact.firstName} {contact.lastName}</b><div className="mt-1 flex flex-wrap gap-1">{choice.circleIds.map(id=><span key={id} className="rounded-full bg-muted px-2 py-0.5 text-xs">{circles.find(circle=>circle.id===id)?.name}</span>)}{choice.relationTags.map(tag=><span key={tag} className="rounded-full border px-2 py-0.5 text-xs">{tag}</span>)}</div></div><span className="self-start rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{actionLabel(choice.action)}</span></div>}
function AssignmentStep({title,menu,chips}:{title:string;menu:React.ReactNode;chips:React.ReactNode[]}){return <div className="rounded-xl border border-dashed p-8 text-center"><p className="mb-4 text-sm font-medium">{title}</p><div className="mx-auto max-w-sm">{menu}</div><div className="mt-4 flex flex-wrap justify-center gap-1.5">{chips}</div></div>}
function EditorSection({title,text,children}:{title:string;text:string;children:React.ReactNode}){return <section className="rounded-xl border p-4"><h3 className="font-semibold">{title}</h3><p className="mb-4 mt-1 text-xs text-muted-foreground">{text}</p>{children}</section>}
function ChipSummary({choice,circles,field,onRemove}:{choice:Choice;circles:Circle[];field:"circleIds"|"relationTags";onRemove:(value:string)=>void}){const values=choice[field];return <div className="mt-3 flex flex-wrap gap-1.5">{values.map(value=><SelectionChip key={value} label={field==="circleIds"?circles.find(circle=>circle.id===value)?.name??value:value} color={field==="circleIds"?circles.find(circle=>circle.id===value)?.color:undefined} onRemove={()=>onRemove(value)}/>)}</div>}
function EmptyResults({contacts}:{contacts:ImportedContact[]}){return !contacts.length?<p className="p-10 text-center text-sm text-muted-foreground">Aucun contact ne correspond à ce filtre.</p>:null}
function actionLabel(action:Action|undefined){return action==="merge"?"Fusionner":action==="skip"?"Ignorer":"Créer"}

function ActionMenu({value,disabled=false,onAction}:{value?:Action;disabled?:boolean;onAction:(action:Action)=>void}) {
  return <NativeSelect aria-label="Doublons / action" disabled={disabled} value={value??"create"} onChange={event=>onAction(event.target.value as Action)} className="w-full"><option value="create">Toujours créer</option><option value="merge">Fusionner les doublons</option><option value="skip">Ignorer</option></NativeSelect>;
}
function CircleMenu({circles,selected,disabled=false,onToggle}:{circles:Circle[];selected:Set<string>;disabled?:boolean;onToggle:(id:string)=>void}) {
  const isDisabled=disabled||!circles.length;
  return <InlineSelectionMenu label="Cercles" count={selected.size} disabled={isDisabled}>{circles.map(circle=><SelectionOption key={circle.id} label={circle.name} color={circle.color} selected={selected.has(circle.id)} onClick={()=>onToggle(circle.id)}/>)}</InlineSelectionMenu>;
}
function RelationMenu({selected,disabled=false,onToggle}:{selected:Set<string>;disabled?:boolean;onToggle:(tag:string)=>void}) {
  return <InlineSelectionMenu label="Relations" count={selected.size} disabled={disabled}>{relationTypes.map(([group,options])=><div key={group}><p className="px-2 pb-1 pt-2 text-xs font-medium text-muted-foreground">{group}</p>{options.map(option=><SelectionOption key={option} label={option} selected={selected.has(option)} onClick={()=>onToggle(option)}/>)}</div>)}</InlineSelectionMenu>;
}
function InlineSelectionMenu({label,count,disabled,children}:{label:string;count:number;disabled:boolean;children:React.ReactNode}) {
  if(disabled)return <Button type="button" variant="outline" disabled className="w-full justify-between">{label}<ChevronDown/></Button>;
  return <details className="group relative w-full"><summary className="flex h-9 w-full cursor-pointer list-none items-center justify-between rounded-md border bg-background px-3 text-sm font-medium shadow-xs outline-none transition hover:bg-muted/60 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">{label}{count>0&&` (${count})`}<ChevronDown className="size-4 transition group-open:rotate-180"/></summary><div className="mt-1 max-h-72 min-w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">{children}</div></details>;
}
function SelectionOption({label,color,selected,onClick}:{label:string;color?:string;selected:boolean;onClick:()=>void}) {
  return <button type="button" onClick={onClick} className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"><NativeCheckbox checked={selected}/>{color&&<span className="size-2 rounded-full" style={{background:color}}/>}<span className="truncate">{label}</span></button>;
}
function NativeCheckbox({checked}:{checked:boolean}){return <span aria-hidden className={cn("grid size-4 place-items-center rounded border",checked&&"border-primary bg-primary text-primary-foreground")}>{checked&&<Check className="size-3"/>}</span>}
function SelectionChip({label,color,onRemove}:{label:string;color?:string;onRemove:()=>void}){return <button type="button" onClick={onRemove} className="flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs hover:bg-muted">{color&&<span className="size-2 rounded-full" style={{background:color}}/>}{label}<X className="size-3"/></button>}
function Stat({value,label,icon}:{value:number;label:string;icon:React.ReactNode}){return <div className="card flex items-center gap-3 p-4"><span className="grid size-9 place-items-center rounded-lg bg-muted [&_svg]:size-4">{icon}</span><div><p className="text-xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></div>}
function ImportHelp(){return <aside className="card p-6"><h2 className="font-semibold">Formats pris en charge</h2><div className="mt-4 space-y-4 text-sm"><div><b>Apple iCloud</b><p className="mt-1 text-muted-foreground">Contacts sur iCloud.com → sélectionner → Exporter une vCard.</p></div><div><b>Google Contacts</b><p className="mt-1 text-muted-foreground">Exporter au format Google CSV ou vCard.</p></div><div><b>Données reconnues</b><p className="mt-1 text-muted-foreground">Nom, e-mail, téléphone, entreprise, anniversaire et notes.</p></div></div><div className="mt-5 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">Les fichiers restent dans votre navigateur jusqu’à votre confirmation. L’import fonctionne sans connexion à Apple ou Google.</div></aside>}
