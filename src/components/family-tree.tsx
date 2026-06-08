"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Background, Controls, Handle, Position, ReactFlow, type Edge, type Node, type NodeTypes } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ProfileAvatar } from "@/components/profile-avatar";

export type FamilyPerson={id:string;firstName:string;lastName:string;photo:string;gender:string;motherId:string|null;fatherId:string|null};
type Side="maternal"|"paternal"|"both";
type FamilyData={label:string;relationship:string;photo:string;side:Side;isUser?:boolean};

const sideStyles:Record<Side,string>={maternal:"border-rose-400 bg-rose-50 dark:bg-rose-950/40",paternal:"border-sky-400 bg-sky-50 dark:bg-sky-950/40",both:"border-violet-400 bg-violet-50 dark:bg-violet-950/40"};

function FamilyNode({data}:{data:FamilyData}) {
  return <><Handle type="target" position={Position.Top} className="opacity-0"/><div className={`flex min-w-44 items-center gap-3 rounded-xl border-2 p-3 shadow-sm ${data.isUser?"border-foreground bg-foreground text-background":sideStyles[data.side]}`}><ProfileAvatar photo={data.photo} name={data.label} className={`size-10 ${data.isUser?"ring-2 ring-background/30":""}`}/><div className="min-w-0"><p className="truncate text-sm font-semibold">{data.label}</p><p className={`truncate text-[11px] ${data.isUser?"text-background/70":"text-muted-foreground"}`}>{data.relationship}</p></div></div><Handle type="source" position={Position.Bottom} className="opacity-0"/></>;
}

const nodeTypes:NodeTypes={family:FamilyNode};

export function FamilyTree({user,people}:{user:{name:string;photo:string;motherId:string|null;fatherId:string|null};people:FamilyPerson[]}) {
  const router=useRouter();
  const onNodeClick=useCallback((_:React.MouseEvent,node:Node)=>{if(node.id!=="me")router.push(`/contacts/${node.id}`)},[router]);
  const {nodes,edges,configured}=useMemo(()=>buildTree(user,people),[user,people]);
  if(!configured)return <div className="grid min-h-[560px] place-items-center rounded-xl border border-dashed bg-muted/20 p-8 text-center"><div><p className="font-semibold">Commencez par définir vos parents</p><p className="mt-2 max-w-md text-sm text-muted-foreground">Dans Mon compte, sélectionnez votre mère et/ou votre père. Ajoutez ensuite les parents sur leurs fiches pour faire apparaître grands-parents, oncles, tantes et cousins.</p></div></div>;
  return <div><div className="mb-4 flex flex-wrap gap-3 text-xs text-muted-foreground"><Legend className="border-rose-400 bg-rose-50 dark:bg-rose-950/40" text="Branche maternelle"/><Legend className="border-sky-400 bg-sky-50 dark:bg-sky-950/40" text="Branche paternelle"/><Legend className="border-violet-400 bg-violet-50 dark:bg-violet-950/40" text="Branche commune"/></div><div className="relationship-flow h-[calc(100vh-280px)] min-h-[620px] overflow-hidden rounded-xl border bg-card shadow-xs"><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{padding:.18,minZoom:.25,maxZoom:1}} minZoom={.15} maxZoom={2} onNodeClick={onNodeClick} nodesConnectable={false} nodesDraggable={false} proOptions={{hideAttribution:true}}><Background color="var(--border)" gap={24} size={1}/><Controls/></ReactFlow></div><p className="mt-3 text-xs text-muted-foreground">Le côté maternel ou paternel est déduit automatiquement depuis vos parents. Cliquez sur une personne pour compléter ses parents.</p></div>;
}

function buildTree(user:{name:string;photo:string;motherId:string|null;fatherId:string|null},people:FamilyPerson[]) {
  const personMap=new Map(people.map(person=>[person.id,person]));
  const ancestor=new Map<string,{side:Side;depth:number;role:"mother"|"father"}>();
  const visit=(id:string|null,side:Side,depth:number,role:"mother"|"father",seen=new Set<string>())=>{
    if(!id||seen.has(id)||!personMap.has(id))return;
    const previous=ancestor.get(id);
    ancestor.set(id,{side:previous&&previous.side!==side?"both":side,depth:Math.min(previous?.depth??depth,depth),role});
    const person=personMap.get(id)!;const next=new Set(seen).add(id);
    visit(person.motherId,side,depth+1,"mother",next);visit(person.fatherId,side,depth+1,"father",next);
  };
  visit(user.motherId,"maternal",1,"mother");visit(user.fatherId,"paternal",1,"father");
  const userParents=new Set([user.motherId,user.fatherId].filter(Boolean) as string[]);
  const grandparents=new Set([...ancestor].filter(([,meta])=>meta.depth===2).map(([id])=>id));
  const siblingIds=new Set(people.filter(person=>sharesParent(person,userParents)).map(person=>person.id));
  const auntIds=new Set(people.filter(person=>!userParents.has(person.id)&&[person.motherId,person.fatherId].some(id=>id&&grandparents.has(id))).map(person=>person.id));
  const cousinIds=new Set(people.filter(person=>[person.motherId,person.fatherId].some(id=>id&&auntIds.has(id))).map(person=>person.id));
  const included=new Set([...ancestor.keys(),...siblingIds,...auntIds,...cousinIds]);
  const collateralSide=new Map<string,Side>();
  for(const id of auntIds){const person=personMap.get(id);const sides=[person?.motherId,person?.fatherId].map(parentId=>parentId?ancestor.get(parentId)?.side:undefined).filter(Boolean) as Side[];collateralSide.set(id,mergeSides(sides))}
  for(const id of cousinIds){const person=personMap.get(id);const sides=[person?.motherId,person?.fatherId].map(parentId=>parentId?collateralSide.get(parentId):undefined).filter(Boolean) as Side[];collateralSide.set(id,mergeSides(sides))}
  const sideFor=(person:FamilyPerson):Side=>{
    if(ancestor.has(person.id))return ancestor.get(person.id)!.side;
    if(collateralSide.has(person.id))return collateralSide.get(person.id)!;
    const parents=[person.motherId,person.fatherId].filter(Boolean) as string[];
    const sides=parents.map(id=>ancestor.get(id)?.side).filter(Boolean) as Side[];
    if(sides.includes("both")||(sides.includes("maternal")&&sides.includes("paternal")))return "both";
    return sides[0]??"both";
  };
  const generation=(person:FamilyPerson)=>ancestor.has(person.id)?-ancestor.get(person.id)!.depth:auntIds.has(person.id)?-1:0;
  const groups=new Map<number,FamilyPerson[]>();
  for(const id of included){const person=personMap.get(id);if(!person)continue;const gen=generation(person);groups.set(gen,[...(groups.get(gen)??[]),person])}
  const nodes:Node[]=[{id:"me",type:"family",position:{x:0,y:0},data:{label:user.name,relationship:"Vous",photo:user.photo,side:"both",isUser:true} satisfies FamilyData}];
  const horizontal=230,vertical=145;
  for(const [gen,members] of [...groups].sort(([a],[b])=>a-b)){
    members.sort((a,b)=>sideOrder(sideFor(a))-sideOrder(sideFor(b))||a.firstName.localeCompare(b.firstName,"fr"));
    const start=-((members.length-1)*horizontal)/2;
    members.forEach((person,index)=>nodes.push({id:person.id,type:"family",position:{x:start+index*horizontal,y:gen*vertical},data:{label:`${person.firstName} ${person.lastName}`.trim(),relationship:relationshipLabel(person,ancestor,siblingIds,auntIds,cousinIds,sideFor(person)),photo:person.photo,side:sideFor(person)} satisfies FamilyData}));
  }
  const edges:Edge[]=[];
  const edge=(parentId:string|null,childId:string,role:"mother"|"father")=>{if(parentId&&included.has(parentId)&&(childId==="me"||included.has(childId)))edges.push({id:`${parentId}-${childId}-${role}`,source:parentId,target:childId,type:"smoothstep",label:role==="mother"?"Mère":"Père",style:{stroke:role==="mother"?"#fb7185":"#38bdf8",strokeWidth:2},labelStyle:{fontSize:10,fill:"var(--muted-foreground)"},labelBgStyle:{fill:"var(--card)",fillOpacity:.9}})};
  edge(user.motherId,"me","mother");edge(user.fatherId,"me","father");
  for(const id of included){const person=personMap.get(id);if(person){edge(person.motherId,id,"mother");edge(person.fatherId,id,"father")}}
  return {nodes,edges,configured:!!(user.motherId||user.fatherId)};
}

function relationshipLabel(person:FamilyPerson,ancestor:Map<string,{side:Side;depth:number;role:"mother"|"father"}>,siblings:Set<string>,aunts:Set<string>,cousins:Set<string>,side:Side) {
  const meta=ancestor.get(person.id);
  if(meta){if(meta.depth===1)return meta.role==="mother"?"Mère":"Père";if(meta.depth===2)return `${meta.role==="mother"?"Grand-mère":"Grand-père"}${sideSuffix(side,meta.role==="mother")}`;return `${"Arrière-".repeat(meta.depth-2)}${meta.role==="mother"?"grand-mère":"grand-père"}${sideSuffix(side,meta.role==="mother")}`}
  if(siblings.has(person.id))return gendered(person.gender,"Sœur","Frère","Fratrie");
  if(aunts.has(person.id))return `${gendered(person.gender,"Tante","Oncle","Oncle / tante")}${person.gender==="woman"?sideSuffix(side,true):person.gender==="man"?sideSuffix(side,false):sidePhrase(side)}`;
  if(cousins.has(person.id))return `${gendered(person.gender,"Cousine","Cousin","Cousin / cousine")}${person.gender==="woman"?sideSuffix(side,true):person.gender==="man"?sideSuffix(side,false):sidePhrase(side)}`;
  return `Famille${sidePhrase(side)}`;
}
function gendered(gender:string,woman:string,man:string,unknown:string){return gender==="woman"?woman:gender==="man"?man:unknown}
function sideSuffix(side:Side,feminine:boolean){return side==="maternal"?` ${feminine?"maternelle":"maternel"}`:side==="paternal"?` ${feminine?"paternelle":"paternel"}`:""}
function sidePhrase(side:Side){return side==="maternal"?" du côté maternel":side==="paternal"?" du côté paternel":""}
function mergeSides(sides:Side[]):Side{return sides.includes("both")||(sides.includes("maternal")&&sides.includes("paternal"))?"both":sides[0]??"both"}
function sharesParent(person:FamilyPerson,parents:Set<string>){return [person.motherId,person.fatherId].some(id=>id&&parents.has(id))}
function sideOrder(side:Side){return side==="paternal"?0:side==="both"?1:2}
function Legend({className,text}:{className:string;text:string}){return <span className="flex items-center gap-2"><span className={`size-3 rounded border-2 ${className}`}/>{text}</span>}
