"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Background, Controls, Handle, Position, ReactFlow, type Edge, type Node, type NodeTypes } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ProfileAvatar } from "@/components/profile-avatar";

export type FamilyPerson={id:string;firstName:string;lastName:string;photo:string;gender:string;motherId:string|null;fatherId:string|null;followUpStatus?:string};
type Side="maternal"|"paternal"|"both";
type ParentRole="mother"|"father";
type AncestorMeta={side:Side;depth:number;role:ParentRole};
type Kinship={side:Side;generation:number;label:string;branch:string;rank:number};
type FamilyData={label:string;relationship:string;photo:string;side:Side;isUser?:boolean};

const sideStyles:Record<Side,string>={maternal:"border-rose-400 bg-rose-50 dark:bg-rose-950/40",paternal:"border-sky-400 bg-sky-50 dark:bg-sky-950/40",both:"border-violet-400 bg-violet-50 dark:bg-violet-950/40"};

function FamilyNode({data}:{data:FamilyData}) {
  return <><Handle type="target" position={Position.Top} className="opacity-0"/><div title={`${data.label} · ${data.relationship}`} className={`flex min-h-20 w-56 items-center gap-3 rounded-xl border-2 p-3 shadow-sm ${data.isUser?"border-foreground bg-foreground text-background":sideStyles[data.side]}`}><ProfileAvatar photo={data.photo} name={data.label} className={`size-10 shrink-0 ${data.isUser?"ring-2 ring-background/30":""}`}/><div className="min-w-0"><p className="truncate text-sm font-semibold">{data.label}</p><p className={`mt-0.5 text-[11px] leading-snug ${data.isUser?"text-background/70":"text-muted-foreground"}`}>{data.relationship}</p></div></div><Handle type="source" position={Position.Bottom} className="opacity-0"/></>;
}

const nodeTypes:NodeTypes={family:FamilyNode};

export function FamilyTree({user,people}:{user:{name:string;photo:string;motherId:string|null;fatherId:string|null};people:FamilyPerson[]}) {
  const router=useRouter();
  const onNodeClick=useCallback((_:React.MouseEvent,node:Node)=>{if(node.id!=="me")router.push(`/contacts/${node.id}`)},[router]);
  const {nodes,edges,configured}=useMemo(()=>buildTree(user,people),[user,people]);
  if(!configured)return <div className="grid min-h-[560px] place-items-center rounded-xl border border-dashed bg-muted/20 p-8 text-center"><div><p className="font-semibold">Commencez par définir vos parents</p><p className="mt-2 max-w-md text-sm text-muted-foreground">Dans Mon compte, sélectionnez votre mère et/ou votre père. Ajoutez ensuite les parents sur leurs fiches pour faire apparaître les différentes branches de la famille.</p></div></div>;
  return <div><div className="mb-4 flex flex-wrap gap-3 text-xs text-muted-foreground"><Legend className="border-rose-400 bg-rose-50 dark:bg-rose-950/40" text="Branche maternelle"/><Legend className="border-sky-400 bg-sky-50 dark:bg-sky-950/40" text="Branche paternelle"/><Legend className="border-violet-400 bg-violet-50 dark:bg-violet-950/40" text="Parents communs aux deux branches"/></div><div className="relationship-flow h-[calc(100vh-280px)] min-h-[680px] overflow-hidden rounded-xl border bg-card shadow-xs"><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{padding:.22,minZoom:.18,maxZoom:.9}} minZoom={.1} maxZoom={2} onNodeClick={onNodeClick} nodesConnectable={false} nodesDraggable={false} proOptions={{hideAttribution:true}}><Background color="var(--border)" gap={24} size={1}/><Controls/></ReactFlow></div><p className="mt-3 text-xs text-muted-foreground">Les demi-frères et demi-sœurs, grands-oncles, grandes-tantes et cousins sont déduits des parents communs. Cliquez sur une personne pour compléter sa branche.</p></div>;
}

function buildTree(user:{name:string;photo:string;motherId:string|null;fatherId:string|null},people:FamilyPerson[]) {
  const personMap=new Map(people.map(person=>[person.id,person]));
  const ancestors=egoAncestors(user,personMap);
  const kinships=new Map<string,Kinship>();

  for(const [id,meta] of ancestors) {
    const person=personMap.get(id);
    if(person)kinships.set(id,{side:meta.side,generation:-meta.depth,label:ancestorLabel(meta),branch:`${meta.side}-ancestor`,rank:meta.depth});
  }

  for(const person of people) {
    if(kinships.has(person.id))continue;
    const kinship=collateralKinship(person,ancestors,personMap);
    if(kinship)kinships.set(person.id,kinship);
  }

  const nodes:Node[]=[{id:"me",type:"family",position:{x:0,y:0},data:{label:user.name,relationship:"Vous",photo:user.photo,side:"both",isUser:true} satisfies FamilyData}];
  const rows=new Map<number,Array<{person:FamilyPerson;kinship:Kinship}>>();
  for(const [id,kinship] of kinships){const person=personMap.get(id);if(person)rows.set(kinship.generation,[...(rows.get(kinship.generation)??[]),{person,kinship}])}

  for(const [generation,members] of [...rows].sort(([a],[b])=>a-b)) {
    const paternal=members.filter(item=>item.kinship.side==="paternal").sort(familySort);
    const both=members.filter(item=>item.kinship.side==="both").sort(familySort);
    const maternal=members.filter(item=>item.kinship.side==="maternal").sort(familySort);
    const positions=new Map<string,number>();
    placeSide(paternal,-1,positions);
    placeShared(both,paternal.length,maternal.length,positions);
    placeSide(maternal,1,positions);
    for(const {person,kinship} of members)nodes.push({id:person.id,type:"family",position:{x:positions.get(person.id)??0,y:generation*190},data:{label:fullName(person),relationship:`${kinship.label}${person.followUpStatus==="deceased"?" · Décédé":""}`,photo:person.photo,side:kinship.side} satisfies FamilyData});
  }

  const included=new Set(kinships.keys());
  const edges:Edge[]=[];
  const edge=(parentId:string|null,childId:string,role:ParentRole)=>{
    if(parentId&&included.has(parentId)&&(childId==="me"||included.has(childId)))edges.push({id:`${parentId}-${childId}-${role}`,source:parentId,target:childId,type:"smoothstep",style:{stroke:role==="mother"?"#fb7185":"#38bdf8",strokeWidth:2}});
  };
  edge(user.motherId,"me","mother");edge(user.fatherId,"me","father");
  for(const id of included){const person=personMap.get(id);if(person){edge(person.motherId,id,"mother");edge(person.fatherId,id,"father")}}
  return {nodes,edges,configured:!!(user.motherId||user.fatherId)};
}

function egoAncestors(user:{motherId:string|null;fatherId:string|null},personMap:Map<string,FamilyPerson>) {
  const result=new Map<string,AncestorMeta>();
  const visit=(id:string|null,side:Side,depth:number,role:ParentRole,seen=new Set<string>())=>{
    if(!id||seen.has(id)||!personMap.has(id)||depth>5)return;
    const previous=result.get(id);
    result.set(id,{side:previous&&previous.side!==side?"both":side,depth:Math.min(previous?.depth??depth,depth),role});
    const person=personMap.get(id)!;const next=new Set(seen).add(id);
    visit(person.motherId,side,depth+1,"mother",next);visit(person.fatherId,side,depth+1,"father",next);
  };
  visit(user.motherId,"maternal",1,"mother");visit(user.fatherId,"paternal",1,"father");
  return result;
}

function collateralKinship(person:FamilyPerson,ego:Map<string,AncestorMeta>,personMap:Map<string,FamilyPerson>):Kinship|null {
  const own=personAncestors(person,personMap);
  const common=[...own].flatMap(([id,personDepth])=>{const meta=ego.get(id);return meta?[{id,personDepth,egoDepth:meta.depth,side:meta.side}]:[]}).sort((a,b)=>(a.egoDepth+a.personDepth)-(b.egoDepth+b.personDepth)||a.egoDepth-b.egoDepth);
  const closest=common[0];
  if(!closest||closest.egoDepth>4||closest.personDepth>3)return null;
  const nearest=common.filter(item=>item.egoDepth===closest.egoDepth&&item.personDepth===closest.personDepth);
  const side=mergeSides(nearest.map(item=>item.side));
  const sharedCount=nearest.length;
  const label=collateralLabel(person.gender,closest.egoDepth,closest.personDepth,sharedCount,side);
  return {side,generation:closest.personDepth-closest.egoDepth,label,branch:`${side}-${closest.id}`,rank:closest.egoDepth+closest.personDepth};
}

function personAncestors(person:FamilyPerson,personMap:Map<string,FamilyPerson>) {
  const result=new Map<string,number>();
  const visit=(id:string|null,depth:number,seen=new Set<string>())=>{
    if(!id||seen.has(id)||!personMap.has(id)||depth>4)return;
    result.set(id,Math.min(result.get(id)??depth,depth));
    const parent=personMap.get(id)!;const next=new Set(seen).add(id);
    visit(parent.motherId,depth+1,next);visit(parent.fatherId,depth+1,next);
  };
  visit(person.motherId,1);visit(person.fatherId,1);
  return result;
}

function collateralLabel(gender:string,egoDepth:number,personDepth:number,sharedCount:number,side:Side) {
  if(egoDepth===1&&personDepth===1)return sharedCount===1?gendered(gender,"Demi-sœur","Demi-frère","Demi-frère ou demi-sœur"):gendered(gender,"Sœur","Frère","Frère ou sœur");
  if(personDepth===1&&egoDepth>=2){
    const prefix=egoDepth===2?"":`${"Arrière-".repeat(Math.max(0,egoDepth-3))}grand-`;
    return `${sharedCount===1?"Demi-":""}${prefix}${gendered(gender,"tante","oncle","oncle ou tante")}${kinSideSuffix(side,gender)}`;
  }
  if(personDepth>=2&&egoDepth>=2){
    const degree=Math.min(egoDepth,personDepth)-1;
    const removed=Math.abs(egoDepth-personDepth);
    const base=degree===1?gendered(gender,"Cousine","Cousin","Cousin·e"):`${gendered(gender,"Cousine","Cousin","Cousin·e")} au ${degree}e degré`;
    return `${base}${removed?` avec ${removed} génération${removed>1?"s":""} d’écart`:""}${kinSideSuffix(side,gender)}`;
  }
  return `Famille${sidePhrase(side)}`;
}

function ancestorLabel(meta:AncestorMeta) {
  if(meta.depth===1)return meta.role==="mother"?"Mère":"Père";
  const prefix=meta.depth===2?"":`${"Arrière-".repeat(meta.depth-2)}`;
  return `${prefix}${meta.role==="mother"?"grand-mère":"grand-père"}${sideSuffix(meta.side,meta.role==="mother")}`;
}

function placeSide(items:Array<{person:FamilyPerson;kinship:Kinship}>,direction:-1|1,positions:Map<string,number>) {
  const grouped=new Map<string,typeof items>();
  for(const item of items)grouped.set(item.kinship.branch,[...(grouped.get(item.kinship.branch)??[]),item]);
  let cursor=360;
  for(const group of grouped.values()){for(const item of group){positions.set(item.person.id,direction*cursor);cursor+=280}cursor+=100}
}
function placeShared(items:Array<{person:FamilyPerson;kinship:Kinship}>,paternalCount:number,maternalCount:number,positions:Map<string,number>) {
  let left=440+paternalCount*280,right=440+maternalCount*280;
  items.forEach((item,index)=>{if(index%2===0){positions.set(item.person.id,-left);left+=280}else{positions.set(item.person.id,right);right+=280}});
}
function familySort(a:{person:FamilyPerson;kinship:Kinship},b:{person:FamilyPerson;kinship:Kinship}){return a.kinship.branch.localeCompare(b.kinship.branch)||a.kinship.rank-b.kinship.rank||fullName(a.person).localeCompare(fullName(b.person),"fr")}
function fullName(person:FamilyPerson){return `${person.firstName} ${person.lastName}`.trim()}
function gendered(gender:string,woman:string,man:string,unknown:string){return gender==="woman"?woman:gender==="man"?man:unknown}
function sideSuffix(side:Side,feminine:boolean){return side==="maternal"?` ${feminine?"maternelle":"maternel"}`:side==="paternal"?` ${feminine?"paternelle":"paternel"}`:""}
function sidePhrase(side:Side){return side==="maternal"?" maternel·le":side==="paternal"?" paternel·le":""}
function kinSideSuffix(side:Side,gender:string){return gender==="woman"?sideSuffix(side,true):gender==="man"?sideSuffix(side,false):sidePhrase(side)}
function mergeSides(sides:Side[]):Side{return sides.includes("both")||(sides.includes("maternal")&&sides.includes("paternal"))?"both":sides[0]??"both"}
function Legend({className,text}:{className:string;text:string}){return <span className="flex items-center gap-2"><span className={`size-3 rounded border-2 ${className}`}/>{text}</span>}
