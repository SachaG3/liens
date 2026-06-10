"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Background, BaseEdge, Controls, Handle, Position, ReactFlow, type Edge, type EdgeProps, type EdgeTypes, type Node, type NodeTypes, type ReactFlowInstance } from "@xyflow/react";
import { ChevronDown, ChevronRight, Crosshair, UserRound } from "lucide-react";
import "@xyflow/react/dist/style.css";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FamilyPerson={id:string;firstName:string;lastName:string;photo:string;gender:string;motherId:string|null;fatherId:string|null;spouseId:string|null;followUpStatus?:string};
type Side="maternal"|"paternal"|"both";
type ParentRole="mother"|"father";
type AncestorMeta={side:Side;depth:number;role:ParentRole};
type Kinship={side:Side;generation:number;label:string;branch:string;rank:number};
type FamilyData={label:string;relationship:string;photo:string;side:Side;isUser?:boolean};
type ZoneData={label:string;side:"maternal"|"paternal"};
type GenerationData={label:string};

const sideStyles:Record<Side,string>={maternal:"border-rose-400 bg-rose-50 dark:bg-rose-950/40",paternal:"border-sky-400 bg-sky-50 dark:bg-sky-950/40",both:"border-violet-400 bg-violet-50 dark:bg-violet-950/40"};
const NODE_STEP=340;
const HALF_STEP=NODE_STEP/2;
const GROUP_GAP=130;

function FamilyNode({data}:{data:FamilyData}) {
    return <><Handle type="target" position={Position.Top} className="opacity-0"/><Handle id="parent-left" type="target" position={Position.Top} style={{left:"32%"}} className="opacity-0"/><Handle id="parent-right" type="target" position={Position.Top} style={{left:"68%"}} className="opacity-0"/><Handle id="left" type="target" position={Position.Left} className="opacity-0"/><div title={`${data.label} · ${data.relationship}`} className={cn("flex min-h-20 w-56 items-center gap-3 rounded-xl border-2 p-3 shadow-sm transition-[box-shadow,border-color] duration-150 hover:shadow-md",data.isUser?"border-foreground bg-foreground text-background shadow-lg ring-4 ring-foreground/10":sideStyles[data.side])}><ProfileAvatar photo={data.photo} name={data.label} className={`size-10 shrink-0 ${data.isUser?"ring-2 ring-background/30":""}`}/><div className="min-w-0"><p className="truncate text-sm font-semibold">{data.label}</p><p className={`mt-0.5 text-[11px] leading-snug ${data.isUser?"text-background/70":"text-muted-foreground"}`}>{data.relationship}</p></div>{data.isUser&&<span className="ml-auto grid size-7 shrink-0 place-items-center rounded-full bg-background/15"><UserRound className="size-3.5"/></span>}</div><Handle type="source" position={Position.Bottom} className="opacity-0"/><Handle id="right" type="source" position={Position.Right} className="opacity-0"/></>;
}

function FamilyZone({data}:{data:ZoneData}) {
    return <div className={cn("size-full rounded-[28px] border border-dashed",data.side==="paternal"?"border-sky-300/70 bg-sky-500/[.045] dark:bg-sky-400/[.035]":"border-rose-300/70 bg-rose-500/[.045] dark:bg-rose-400/[.035]")}><span className={cn("absolute left-5 top-4 rounded-full border bg-card/90 px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur",data.side==="paternal"?"border-sky-300 text-sky-700 dark:text-sky-300":"border-rose-300 text-rose-700 dark:text-rose-300")}>{data.label}</span></div>;
}

function GenerationMarker({data}:{data:GenerationData}) {
    return <div className="flex w-36 items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"><span className="h-px flex-1 bg-border"/>{data.label}</div>;
}

function JunctionNode() {
    return <><Handle type="target" position={Position.Top} className="opacity-0"/><span className="block size-2 rounded-full border-2 border-card bg-muted-foreground shadow-sm"/><Handle type="source" position={Position.Bottom} className="opacity-0"/></>;
}

function IndependentParentEdge({id,sourceX,sourceY,targetX,targetY,style,markerEnd,data}:EdgeProps) {
    const laneY=sourceY+Number((data as {laneOffset?:number}|undefined)?.laneOffset??52);
    const path=`M ${sourceX} ${sourceY} V ${laneY} H ${targetX} V ${targetY}`;
    return <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd}/>;
}

const nodeTypes:NodeTypes={family:FamilyNode,zone:FamilyZone,generation:GenerationMarker,junction:JunctionNode};
const edgeTypes:EdgeTypes={independentParent:IndependentParentEdge};

export function FamilyTree({user,people}:{user:{name:string;photo:string;motherId:string|null;fatherId:string|null;spouseId:string|null};people:FamilyPerson[]}) {
    const router=useRouter();
    const [flow,setFlow]=useState<ReactFlowInstance<Node,Edge>|null>(null);
    const [hidden,setHidden]=useState<Set<"maternal"|"paternal">>(new Set());
    const [debugMode,setDebugMode]=useState(false);
    const onNodeClick=useCallback((_:React.MouseEvent,node:Node)=>{if(node.type==="family"&&node.id!=="me")router.push(`/contacts/${node.id}`)},[router]);
    const tree=useMemo(()=>buildTree(user,people),[user,people]);
    const nodes=tree.nodes.filter(node=>!isHiddenNode(node,hidden)).map((node,index)=>{
        if(!debugMode||node.type!=="family")return node;
        const data=node.data as FamilyData;
        const person=people.find(p=>p.id===node.id);
        const nodeNum=index+1;
        let anonymized=`Person${nodeNum}`;
        if(person){
            const motherNum=people.findIndex(p=>p.id===person.motherId)+1;
            const fatherNum=people.findIndex(p=>p.id===person.fatherId)+1;
            const parents=[];
            if(motherNum>0)parents.push(`M=${motherNum}`);
            if(fatherNum>0)parents.push(`F=${fatherNum}`);
            if(parents.length>0)anonymized+=` (${parents.join(", ")})`;
        }
        return {...node,data:{...data,label:anonymized,photo:""}};
    });
    const visibleIds=new Set(nodes.map(node=>node.id));
    const edges=tree.edges.filter(edge=>visibleIds.has(edge.source)&&visibleIds.has(edge.target));
    const toggle=(side:"maternal"|"paternal")=>setHidden(current=>{const next=new Set(current);if(next.has(side))next.delete(side);else next.add(side);return next});
    const centerMe=()=>flow?.fitView({nodes:[{id:"me"}],padding:2,maxZoom:1,duration:window.matchMedia("(prefers-reduced-motion: reduce)").matches?0:260});
    if(!tree.configured)return <div className="grid min-h-[560px] place-items-center rounded-xl border border-dashed bg-muted/20 p-8 text-center"><div><p className="font-semibold">Commencez par définir vos parents</p><p className="mt-2 max-w-md text-sm text-muted-foreground">Dans Mon compte, sélectionnez votre mère et/ou votre père. Ajoutez ensuite les parents sur leurs fiches pour faire apparaître les différentes branches de la famille.</p></div></div>;
    return <div><div className="mb-4 flex flex-wrap items-center gap-2"><BranchToggle side="paternal" hidden={hidden.has("paternal")} onClick={()=>toggle("paternal")}/><BranchToggle side="maternal" hidden={hidden.has("maternal")} onClick={()=>toggle("maternal")}/><Button type="button" variant={debugMode?"default":"outline"} size="sm" onClick={()=>setDebugMode(!debugMode)} className="ml-auto">🔍 Debug</Button><span className="ml-2 hidden text-xs text-muted-foreground sm:block">Ancêtres en haut · Vous en bas</span></div><div className="relationship-flow relative h-[calc(100vh-280px)] min-h-[680px] overflow-hidden rounded-xl border bg-card shadow-xs"><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} fitView fitViewOptions={{padding:.14,minZoom:.18,maxZoom:.9}} minZoom={.1} maxZoom={2} onInit={setFlow} onNodeClick={onNodeClick} nodesConnectable={false} nodesDraggable={false} proOptions={{hideAttribution:true}}><Background color="var(--border)" gap={24} size={1}/><Controls/></ReactFlow><Button type="button" variant="outline" className="absolute right-3 top-3 z-10 bg-card/90 shadow-sm backdrop-blur" onClick={centerMe}><Crosshair/>Recentrer sur moi</Button></div><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"><span>Les lignes pleines indiquent un lien parental renseigné.</span><span className="border-b border-dashed border-muted-foreground">Les lignes pointillées indiquent une branche parentale incomplète.</span><span>Cliquez sur une personne pour ouvrir sa fiche.</span></div></div>;
}

function buildTree(user:{name:string;photo:string;motherId:string|null;fatherId:string|null;spouseId:string|null},people:FamilyPerson[]) {
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

    // Inclure également les conjoints/partenaires des personnes de l'arbre
    let addedAny=true;
    while(addedAny){
        addedAny=false;
        for(const person of people){
            if(kinships.has(person.id))continue;
            if(user.spouseId===person.id){
                const label=person.gender==="woman"?"Conjointe":person.gender==="man"?"Conjoint":"Partenaire";
                kinships.set(person.id,{side:"both",generation:0,label,branch:"spouse-me",rank:1});
                addedAny=true;
                continue;
            }
            let partnerId:string|null=null;
            if(person.spouseId&&kinships.has(person.spouseId)){
                partnerId=person.spouseId;
            }else{
                const partner=people.find(p=>p.spouseId===person.id&&kinships.has(p.id));
                if(partner)partnerId=partner.id;
            }
            if(partnerId){
                const partnerKinship=kinships.get(partnerId)!;
                const label=person.gender==="woman"?"Conjointe":person.gender==="man"?"Conjoint":"Partenaire";
                kinships.set(person.id,{side:partnerKinship.side,generation:partnerKinship.generation,label,branch:`${partnerKinship.branch}-spouse`,rank:partnerKinship.rank});
                addedAny=true;
            }
        }
    }

    const nodes:Node[]=[{id:"me",type:"family",position:{x:0,y:0},data:{label:user.name,relationship:"Vous",photo:user.photo,side:"both",isUser:true} satisfies FamilyData}];
    const rows=new Map<number,Array<{person:FamilyPerson;kinship:Kinship}>>();
    for(const [id,kinship] of kinships){const person=personMap.get(id);if(person)rows.set(kinship.generation,[...(rows.get(kinship.generation)??[]),{person,kinship}])}

    for(const [generation,members] of [...rows].sort(([a],[b])=>a-b)) {
        const paternal=members.filter(item=>item.kinship.side==="paternal").sort(familySort);
        const both=members.filter(item=>item.kinship.side==="both").sort(familySort);
        const maternal=members.filter(item=>item.kinship.side==="maternal").sort(familySort);
        const positions=new Map<string,number>();
        placeSide(paternal,-1,positions,personMap,nodes);
        placeShared(both,paternal.length,maternal.length,positions);
        placeSide(maternal,1,positions,personMap,nodes);
        for(const {person,kinship} of members)nodes.push({id:person.id,type:"family",position:{x:positions.get(person.id)??0,y:generation*190},data:{label:fullName(person),relationship:`${kinship.label}${person.followUpStatus==="deceased"?" · Décédé":""}`,photo:person.photo,side:kinship.side} satisfies FamilyData});
    }

    const included=new Set(kinships.keys());
    const personNodes=new Map(nodes.map(node=>[node.id,node]));
    if(user.fatherId&&personNodes.has(user.fatherId))personNodes.get(user.fatherId)!.position.x=-180;
    if(user.motherId&&personNodes.has(user.motherId))personNodes.get(user.motherId)!.position.x=180;

    arrangeGenerationGroups(nodes,personMap,user.spouseId);

    const edges:Edge[]=[];
    const familyJunctions=new Map<string,{id:string;node:Node;children:string[]}>();
    const edgeStyle={stroke:"#94a3b8",strokeWidth:1.75};
    const connectFamily=(childId:string,motherId:string|null,fatherId:string|null)=>{
        const child=personNodes.get(childId);
        const mother=motherId&&personNodes.get(motherId);
        const father=fatherId&&personNodes.get(fatherId);
        if(!child)return;
        if(mother&&father){
            const parentIds=[mother.id,father.id].sort();
            const familyKey=parentIds.join("|");
            let family=familyJunctions.get(familyKey);
            if(!family){
                const junctionId=`junction-family-${parentIds.join("-")}`;
                const junction={id:junctionId,type:"junction",position:{x:(mother.position.x+father.position.x+216)/2-4,y:child.position.y-72},data:{side:(child.data as FamilyData).side},selectable:false,draggable:false,zIndex:2} satisfies Node;
                family={id:junctionId,node:junction,children:[]};
                familyJunctions.set(familyKey,family);
                nodes.push(junction);
                edges.push(
                    {id:`${mother.id}-${junctionId}`,source:mother.id,target:junctionId,type:"step",style:edgeStyle},
                    {id:`${father.id}-${junctionId}`,source:father.id,target:junctionId,type:"step",style:edgeStyle},
                );
            }
            family.children.push(childId);
            return;
        }
        const parent=mother??father;
        if(parent)edges.push({...independentParentEdge(parent,child,{...edgeStyle,strokeDasharray:"5 5"},"incomplete"),id:`${parent.id}-${childId}-incomplete`});
    };
    connectFamily("me",user.motherId,user.fatherId);
    for(const id of included){const person=personMap.get(id);if(person)connectFamily(id,person.motherId,person.fatherId)}
    for(const family of familyJunctions.values()){
        const children=family.children.flatMap(id=>personNodes.has(id)?[personNodes.get(id)!]:[]);
        if(!children.length)continue;
        family.node.position.x=averageX(children)+108-4;
        family.node.position.y=Math.min(...children.map(child=>child.position.y))-72;
        for(const child of children)edges.push({
            id:`${family.id}-${child.id}`,
            source:family.id,
            target:child.id,
            type:children.length===1?"straight":"step",
            style:edgeStyle,
        });
    }

    // Ajouter les liens de couple (spouse) comme des arêtes horizontales
    const spouseEdgeStyle={stroke:"#e879a0",strokeWidth:2.5,strokeDasharray:"6 4"};
    const addSpouseEdge=(personAId:string,personBId:string)=>{
        const nodeA=personNodes.get(personAId),nodeB=personNodes.get(personBId);
        if(!nodeA||!nodeB)return;
        // Éviter les doublons
        const edgeId=[personAId,personBId].sort().join("-spouse-");
        if(edges.some(e=>e.id===edgeId))return;
        const left=nodeA.position.x<=nodeB.position.x?nodeA:nodeB;
        const right=left===nodeA?nodeB:nodeA;
        edges.push({id:edgeId,source:left.id,target:right.id,sourceHandle:"right",targetHandle:"left",type:"straight",style:spouseEdgeStyle,label:"❤",labelStyle:{fontSize:14}});
    };
    // Lien de couple de l'utilisateur
    if(user.spouseId)addSpouseEdge("me",user.spouseId);
    // Liens de couple entre contacts
    for(const person of people){
        if(person.spouseId&&personNodes.has(person.id)&&personNodes.has(person.spouseId))addSpouseEdge(person.id,person.spouseId);
    }

    addOrientationNodes(nodes,rows);
    return {nodes,edges,configured:!!(user.motherId||user.fatherId||user.spouseId)};
}

function addOrientationNodes(nodes:Node[],rows:Map<number,Array<{person:FamilyPerson;kinship:Kinship}>>) {
    const people=nodes.filter(node=>node.type==="family");
    const minY=Math.min(...people.map(node=>node.position.y))-75;
    const maxY=Math.max(...people.map(node=>node.position.y))+160;
    const paternal=people.filter(node=>(node.data as FamilyData).side==="paternal");
    const maternal=people.filter(node=>(node.data as FamilyData).side==="maternal");
    const zone=(side:"paternal"|"maternal",items:Node[])=>{
        if(!items.length)return;
        const minX=Math.min(...items.map(node=>node.position.x))-65;
        const maxX=Math.max(...items.map(node=>node.position.x))+289;
        nodes.unshift({id:`zone-${side}`,type:"zone",position:{x:minX,y:minY},data:{side,label:side==="paternal"?"Branche paternelle":"Branche maternelle"} satisfies ZoneData,style:{width:maxX-minX,height:maxY-minY},selectable:false,draggable:false,zIndex:-2});
    };
    zone("paternal",paternal);zone("maternal",maternal);
    const generations=[...new Set([...rows.keys(),0])].sort((a,b)=>a-b);
    const minX=Math.min(...people.map(node=>node.position.x))-230;
    for(const generation of generations)nodes.push({id:`generation-${generation}`,type:"generation",position:{x:minX,y:generation*190+30},data:{label:generationLabel(generation)} satisfies GenerationData,selectable:false,draggable:false,zIndex:-1});
}

function generationLabel(generation:number){
    if(generation===0)return "Vous";
    if(generation===-1)return "Parents";
    if(generation===-2)return "Grands-parents";
    if(generation<0)return `${Math.abs(generation)} générations avant`;
    return generation===1?"Enfants":`${generation} générations après`;
}

function isHiddenNode(node:Node,hidden:Set<"maternal"|"paternal">) {
    if(node.type==="zone")return hidden.has((node.data as ZoneData).side);
    if(node.type==="junction"){const side=(node.data as {side:Side}).side;return side!=="both"&&hidden.has(side)}
    if(node.type!=="family")return false;
    const side=(node.data as FamilyData).side;
    return side!=="both"&&hidden.has(side);
}

function egoAncestors(user:{motherId:string|null;fatherId:string|null},personMap:Map<string,FamilyPerson>) {
    const result=new Map<string,AncestorMeta>();
    result.set("me", {side:"both",depth:0,role:"father"});
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
        if(!id||seen.has(id)||(!personMap.has(id)&&id!=="me")||depth>4)return;
        result.set(id,Math.min(result.get(id)??depth,depth));
        if(id==="me")return;
        const parent=personMap.get(id)!;const next=new Set(seen).add(id);
        visit(parent.motherId,depth+1,next);visit(parent.fatherId,depth+1,next);
    };
    visit(person.motherId,1);visit(person.fatherId,1);
    return result;
}

function collateralLabel(gender:string,egoDepth:number,personDepth:number,sharedCount:number,side:Side) {
    if(egoDepth===0){
        if(personDepth===1)return gendered(gender,"Fille","Fils","Enfant");
        if(personDepth===2)return gendered(gender,"Petite-fille","Petit-fils","Petit-enfant");
        return "Descendant·e";
    }
    if(egoDepth===1&&personDepth===1)return sharedCount===1?gendered(gender,"Demi-sœur","Demi-frère","Demi-frère ou demi-sœur"):gendered(gender,"Sœur","Frère","Frère ou sœur");
    if(egoDepth===1&&personDepth===2)return gendered(gender,"Nièce","Neveu","Neveu ou nièce");
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

function placeSide(items:Array<{person:FamilyPerson;kinship:Kinship}>,direction:-1|1,positions:Map<string,number>,personMap:Map<string,FamilyPerson>,existingNodes:Node[]) {
    // Grouper par parent direct pour les collatéraux (cousins, neveux, etc.)
    // et par branche pour les ancêtres directs
    const grouped=new Map<string,typeof items>();
    for(const item of items){
        // Déterminer si c'est un ancêtre direct (label contient "grand-", "Mère", "Père")
        const isDirectAncestor=item.kinship.label.match(/^(Mère|Père|.*grand-)/);

        if(isDirectAncestor){
            // Ancêtres directs : grouper par branche comme avant
            grouped.set(item.kinship.branch,[...(grouped.get(item.kinship.branch)??[]),item]);
        }else{
            // Collatéraux (cousins, oncles, tantes, frères, sœurs) : grouper par parent direct
            const parentKey=item.person.motherId||item.person.fatherId||`orphan-${item.person.id}`;
            grouped.set(`parent-${parentKey}`,[...(grouped.get(`parent-${parentKey}`)??[]),item]);
        }
    }

    // Créer une map des positions des parents existants
    const parentPositions=new Map<string,number>();
    for(const node of existingNodes){
        if(node.type==="family")parentPositions.set(node.id,node.position.x);
    }

    // Trier les groupes pour placer d'abord ceux qui ont un parent positionné
    const groupsArray=[...grouped.entries()].sort((a,b)=>{
        const aHasParent=a[0].startsWith("parent-")&&parentPositions.has(a[0].replace("parent-",""));
        const bHasParent=b[0].startsWith("parent-")&&parentPositions.has(b[0].replace("parent-",""));
        if(aHasParent&&!bHasParent)return -1;
        if(!aHasParent&&bHasParent)return 1;
        // Si les deux ont un parent, trier par position X du parent
        if(aHasParent&&bHasParent){
            const aParentX=parentPositions.get(a[0].replace("parent-",""))??0;
            const bParentX=parentPositions.get(b[0].replace("parent-",""))??0;
            return direction*(aParentX-bParentX);
        }
        return 0;
    });

    let cursor=360;
    for(const [groupKey,group] of groupsArray){
        // Si c'est un groupe d'enfants avec parent positionné, centrer sous le parent
        if(groupKey.startsWith("parent-")){
            const parentId=groupKey.replace("parent-","");
            const parentX=parentPositions.get(parentId);
            if(parentX!==undefined){
                // Placer les enfants centrés sous le parent
                const childCount=group.length;
                const totalWidth=(childCount-1)*NODE_STEP;
                let childCursor=parentX-totalWidth/2;
                for(const item of group){
                    positions.set(item.person.id,childCursor);
                    childCursor+=NODE_STEP;
                }
                continue;
            }
        }
        // Placement par défaut pour les ancêtres ou groupes sans parent
        for(const item of group){
            positions.set(item.person.id,direction*cursor);
            cursor+=NODE_STEP;
        }
        cursor+=GROUP_GAP;
    }
}
function placeShared(items:Array<{person:FamilyPerson;kinship:Kinship}>,paternalCount:number,maternalCount:number,positions:Map<string,number>) {
    let left=440+paternalCount*NODE_STEP,right=440+maternalCount*NODE_STEP;
    items.forEach((item,index)=>{if(index%2===0){positions.set(item.person.id,-left);left+=NODE_STEP}else{positions.set(item.person.id,right);right+=NODE_STEP}});
}

function arrangeGenerationGroups(nodes:Node[],personMap:Map<string,FamilyPerson>,userSpouseId:string|null) {
    const nodesById=new Map(nodes.filter(node=>node.type==="family").map(node=>[node.id,node]));
    const rows=new Map<number,Node[]>();
    for(const node of nodesById.values())rows.set(node.position.y,[...(rows.get(node.position.y)??[]),node]);

    const spouseOf=(id:string)=>{
        if(id==="me")return userSpouseId;
        const direct=personMap.get(id)?.spouseId;
        if(direct)return direct;
        return peopleFindId(personMap,person=>person.spouseId===id);
    };

    for(const row of rows.values()){
        const remaining=new Set(row.map(node=>node.id));
        const groups:Array<{nodes:Node[];center:number}>=[];

        // Couples stay together before sibling groups are considered.
        for(const node of row){
            if(!remaining.has(node.id))continue;
            const spouseId=spouseOf(node.id);
            const spouse=spouseId&&nodesById.get(spouseId);
            if(!spouse||spouse.position.y!==node.position.y||!remaining.has(spouse.id))continue;
            const pair=orderCoupleByParents(node,spouse,nodesById,personMap);
            groups.push({nodes:pair,center:averageX(pair)});
            remaining.delete(node.id);remaining.delete(spouse.id);
        }

        const siblings=new Map<string,Node[]>();
        for(const node of row){
            if(!remaining.has(node.id))continue;
            const person=personMap.get(node.id);
            const parentIds=person?[person.motherId,person.fatherId].filter((id):id is string=>!!id).sort():[];
            const key=parentIds.length?parentIds.join("|"):`single-${node.id}`;
            siblings.set(key,[...(siblings.get(key)??[]),node]);
        }
        for(const members of siblings.values()){
            const ordered=members.sort((left,right)=>left.position.x-right.position.x);
            groups.push({nodes:ordered,center:averageX(ordered)});
        }

        groups.sort((left,right)=>left.center-right.center);
        let cursor=Number.NEGATIVE_INFINITY;
        for(const group of groups){
            const desiredStart=group.center-(group.nodes.length-1)*HALF_STEP;
            const start=Math.max(desiredStart,cursor);
            group.nodes.forEach((node,index)=>{node.position.x=start+index*NODE_STEP});
            cursor=start+group.nodes.length*NODE_STEP+GROUP_GAP;
        }

        const before=groups.flatMap(group=>group.nodes).reduce((sum,node)=>sum+node.position.x,0);
        const desired=groups.reduce((sum,group)=>sum+group.center*group.nodes.length,0);
        const shift=(desired-before)/Math.max(1,row.length);
        for(const node of row)node.position.x+=shift;
    }
}

function orderCoupleByParents(first:Node,second:Node,nodesById:Map<string,Node>,personMap:Map<string,FamilyPerson>) {
    const parentKey=(node:Node)=>{
        const person=personMap.get(node.id);
        return person?[person.motherId,person.fatherId].filter((id):id is string=>!!id).sort().join("|"):"";
    };
    const siblingCenter=(node:Node)=>{
        const key=parentKey(node);
        if(!key)return null;
        const siblings=[...nodesById.values()].filter(candidate=>candidate.id!==first.id&&candidate.id!==second.id&&candidate.position.y===node.position.y&&parentKey(candidate)===key);
        return siblings.length?averageX(siblings):null;
    };
    const firstSiblingsX=siblingCenter(first);
    const secondSiblingsX=siblingCenter(second);
    if(firstSiblingsX!==null&&secondSiblingsX===null)return firstSiblingsX<(first.position.x+second.position.x)/2?[first,second]:[second,first];
    if(secondSiblingsX!==null&&firstSiblingsX===null)return secondSiblingsX<(first.position.x+second.position.x)/2?[second,first]:[first,second];
    if(firstSiblingsX!==null&&secondSiblingsX!==null&&firstSiblingsX!==secondSiblingsX)return firstSiblingsX<secondSiblingsX?[first,second]:[second,first];
    const parentCenter=(node:Node)=>{
        const person=personMap.get(node.id);
        const parents=[person?.motherId,person?.fatherId].flatMap(id=>id&&nodesById.has(id)?[nodesById.get(id)!]:[]);
        return parents.length?averageX(parents):null;
    };
    const firstParentX=parentCenter(first);
    const secondParentX=parentCenter(second);
    if(firstParentX!==null&&secondParentX!==null&&firstParentX!==secondParentX)return firstParentX<secondParentX?[first,second]:[second,first];
    return [first,second].sort((left,right)=>left.position.x-right.position.x);
}
function independentParentEdge(parent:Node,child:Node,style:React.CSSProperties,suffix:string):Edge {
    const parentIsLeft=parent.position.x<child.position.x;
    return {id:`${parent.id}-${child.id}-${suffix}`,source:parent.id,target:child.id,targetHandle:parentIsLeft?"parent-left":"parent-right",type:"independentParent",data:{laneOffset:42+stableLane(`${parent.id}-${child.id}`)*12},style};
}
function stableLane(value:string){return [...value].reduce((total,char)=>total+char.charCodeAt(0),0)%6}
function averageX(nodes:Node[]){return nodes.reduce((sum,node)=>sum+node.position.x,0)/nodes.length}
function peopleFindId(personMap:Map<string,FamilyPerson>,predicate:(person:FamilyPerson)=>boolean){for(const person of personMap.values())if(predicate(person))return person.id;return null}
function familySort(a:{person:FamilyPerson;kinship:Kinship},b:{person:FamilyPerson;kinship:Kinship}){return a.kinship.branch.localeCompare(b.kinship.branch)||a.kinship.rank-b.kinship.rank||fullName(a.person).localeCompare(fullName(b.person),"fr")}
function fullName(person:FamilyPerson){return `${person.firstName} ${person.lastName}`.trim()}
function gendered(gender:string,woman:string,man:string,unknown:string){return gender==="woman"?woman:gender==="man"?man:unknown}
function sideSuffix(side:Side,feminine:boolean){return side==="maternal"?` ${feminine?"maternelle":"maternel"}`:side==="paternal"?` ${feminine?"paternelle":"paternel"}`:""}
function sidePhrase(side:Side){return side==="maternal"?" maternel·le":side==="paternal"?" paternel·le":""}
function kinSideSuffix(side:Side,gender:string){return gender==="woman"?sideSuffix(side,true):gender==="man"?sideSuffix(side,false):sidePhrase(side)}
function mergeSides(sides:Side[]):Side{return sides.includes("both")||(sides.includes("maternal")&&sides.includes("paternal"))?"both":sides[0]??"both"}
function BranchToggle({side,hidden,onClick}:{side:"maternal"|"paternal";hidden:boolean;onClick:()=>void}) {
    const maternal=side==="maternal";
    return <button type="button" onClick={onClick} aria-pressed={!hidden} className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted",maternal?"border-rose-300 text-rose-700 dark:text-rose-300":"border-sky-300 text-sky-700 dark:text-sky-300",hidden&&"border-border text-muted-foreground")}><span className={cn("size-2 rounded-full",maternal?"bg-rose-400":"bg-sky-400",hidden&&"bg-muted-foreground")}/>{maternal?"Branche maternelle":"Branche paternelle"}{hidden?<ChevronRight className="size-3.5"/>:<ChevronDown className="size-3.5"/>}</button>;
}
