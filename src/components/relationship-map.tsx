"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Background, Controls, Edge, Handle, Position, Node, ReactFlow, type NodeTypes } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";

type MapCircle={id:string;name:string;color:string};
type MapPerson={id:string;firstName:string;lastName:string;company:string;relationTags:string[];score:number;circles:Array<MapCircle>};

// Composant de nœud personnalisé avec handles
const CustomNode = ({ data }: { data: { label: string } }) => (
  <>
    <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
    <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
    <Handle type="target" position={Position.Right} style={{ opacity: 0 }} />
    <Handle type="target" position={Position.Bottom} style={{ opacity: 0 }} />
    <div style={{ padding: '8px', textAlign: 'center', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {data.label}
    </div>
    <Handle type="source" position={Position.Top} style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Left} style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
  </>
);

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

export function RelationshipMap({ userName, people, circles, links }: {userName:string;people:MapPerson[];circles:MapCircle[];links:Array<{fromContactId:string;toContactId:string;label:string;source:string}>}) {
  const [activeCircle,setActiveCircle]=useState("all");const [activeRelation,setActiveRelation]=useState("all");const router=useRouter();
  const relations=useMemo(()=>[...new Set(people.flatMap(person=>person.relationTags))].sort((a,b)=>a.localeCompare(b,"fr")),[people]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.id !== "me") router.push(`/contacts/${node.id}`);
  }, [router]);
  const visible=people.filter(person=>(activeCircle==="all"||person.circles.some(circle=>circle.id===activeCircle))&&(activeRelation==="all"||person.relationTags.includes(activeRelation)));
  const {nodes,edges}=useMemo(()=>{
    // Centre de la carte
    const centerX = 0;
    const centerY = 0;

    const resultNodes:Node[]=[{
      id:"me",
      type:"custom",
      position:{x:centerX,y:centerY},
      data:{label:userName},
      style:{width:100,height:100,borderRadius:999,display:"grid",placeItems:"center",fontWeight:700,fontSize:16,background:"var(--foreground)",color:"var(--background)",border:"none",boxShadow:"0 4px 16px rgba(0,0,0,.15)"}
    }];
    const resultEdges:Edge[]=[];

    // Hiérarchie d'importance des relations (plus bas = plus proche)
    const relationshipTiers: Record<string, number> = {
      // Tier 0 - Cercle le plus intime (200px)
      'conjoint': 0, 'conjointe': 0, 'enfant': 0, 'fils': 0, 'fille': 0,

      // Tier 1 - Famille proche et meilleurs amis (350px)
      'mère': 1, 'père': 1, 'parent': 1, 'sœur': 1, 'frère': 1,
      'proche': 1,

      // Tier 2 - Famille élargie et amis proches (500px)
      'famille': 2, 'cousin': 2, 'cousine': 2, 'tante': 2, 'oncle': 2,
      'neveu': 2, 'nièce': 2, 'grand-mère': 2, 'grand-père': 2,
      'ami': 2,

      // Tier 3 - Collègues actuels et activités régulières (650px)
      'collègue': 3, 'manager': 3, 'équipe': 3,
      'sport': 3, 'loisir': 3,

      // Tier 4 - Relations occasionnelles (800px)
      'voisin': 4, 'ancien': 4, 'externe': 4,

      // Tier 5 - Réseau professionnel (950px)
      'professionnel': 5, 'réseau': 5, 'freelance': 5, 'RH': 5,
    };

    // Regrouper les personnes par tier
    const tierGroups: Record<number, MapPerson[]> = {0:[],1:[],2:[],3:[],4:[],5:[],6:[]};

    visible.forEach(person => {
      // Trouver le tier le plus bas (plus important) parmi les tags
      let personTier = 6; // Par défaut: tier le plus éloigné
      person.relationTags.forEach(tag => {
        const tagTier = relationshipTiers[tag.toLowerCase()];
        if (tagTier !== undefined && tagTier < personTier) {
          personTier = tagTier;
        }
      });
      tierGroups[personTier].push(person);
    });

    // Rayons pour chaque tier
    const tierRadii = [200, 350, 500, 650, 800, 950, 1100];

    // Placer les personnes par tier
    Object.entries(tierGroups).forEach(([tierStr, people]) => {
      const tier = parseInt(tierStr);
      if (people.length === 0) return;

      const radius = tierRadii[tier];
      const angleIncrement = (Math.PI * 2) / Math.max(people.length, 1);

      people.forEach((person, index) => {
        const angle = angleIncrement * index - Math.PI / 2;
        const color = person.circles[0]?.color || "#8a8a8a";

        // Taille et style varient selon le tier
        const nodeWidth = tier === 0 ? 160 : tier <= 2 ? 140 : 120;
        const fontSize = tier === 0 ? 14 : tier <= 2 ? 13 : 12;
        const borderWidth = tier === 0 ? 3 : tier <= 2 ? 2 : 1.5;

        resultNodes.push({
          id: person.id,
          type: 'custom',
          position: {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
          },
          data: { label: `${person.firstName} ${person.lastName}` },
          style: {
            width: nodeWidth,
            height: 50,
            borderRadius: 10,
            fontSize,
            fontWeight: tier <= 1 ? 700 : 600,
            background: "var(--card)",
            color: "var(--foreground)",
            border: `${borderWidth}px solid ${color}`,
            boxShadow: tier === 0 ? "0 4px 12px rgba(0,0,0,.12)" : "0 2px 8px rgba(0,0,0,.08)",
          },
        });

        // Lien du centre vers chaque contact (TOUJOURS visible)
        const edgeWidth = tier === 0 ? 3 : tier <= 2 ? 2.5 : 2;
        resultEdges.push({
          id: `me-${person.id}`,
          source: "me",
          target: person.id,
          style: {
            stroke: color,
            strokeWidth: edgeWidth,
          },
          animated: person.score < 45,
        });
      });
    });
    // Ajouter les liens entre contacts de manière sélective
    const visibleIds=new Set(visible.map(person=>person.id));
    const filteredLinks = links.filter(link=>visibleIds.has(link.fromContactId)&&visibleIds.has(link.toContactId));

    // Prioriser uniquement les liens familiaux les plus importants (source: manual)
    // Limiter drastiquement les mentions pour éviter le surcharge visuelle
    const familyLinks = filteredLinks.filter(link => link.source === 'manual').slice(0, 15);
    const mentionLinks = filteredLinks.filter(link => link.source === 'mention').slice(0, 5);

    [...familyLinks, ...mentionLinks].forEach(link=>{
      resultEdges.push({
        id:`link-${link.fromContactId}-${link.toContactId}`,
        source:link.fromContactId,
        target:link.toContactId,
        style:{
          stroke: link.source === 'manual' ? "#666" : "#444",
          strokeWidth: link.source === 'manual' ? 2 : 1.5,
          strokeDasharray: link.source === 'mention' ? "5 4" : undefined
        },
      });
    });


    return {nodes:resultNodes,edges:resultEdges};
  },[visible,userName,links]);
  return <div><div className="mb-4 grid gap-2 sm:grid-cols-2"><div className="flex gap-1 overflow-x-auto">{[{id:"all",name:"Tous les cercles",color:"#888"},...circles].map(circle=><button key={circle.id} onClick={()=>setActiveCircle(circle.id)} className={cn("flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground",activeCircle===circle.id&&"bg-foreground text-background hover:bg-foreground hover:text-background")}><span className="size-2 rounded-full" style={{background:circle.color}}/>{circle.name}</button>)}</div><select value={activeRelation} onChange={event=>setActiveRelation(event.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="all">Toutes les relations</option>{relations.map(tag=><option key={tag} value={tag}>{tag}</option>)}</select></div><div className="relationship-flow h-[calc(100vh-280px)] min-h-[600px] overflow-hidden rounded-xl border bg-card shadow-xs"><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{padding:0.15,minZoom:0.1,maxZoom:1.5}} minZoom={.05} maxZoom={3} defaultViewport={{x:0,y:0,zoom:0.5}} onNodeClick={onNodeClick} proOptions={{hideAttribution:true}} elementsSelectable={false} nodesConnectable={false} nodesDraggable={false} panOnDrag panOnScroll zoomOnScroll><Background color="var(--border)" gap={24} size={1}/><Controls/></ReactFlow></div><div className="mt-3 flex flex-wrap items-start gap-4"><p className="text-xs text-muted-foreground">{visible.length} personne{visible.length!==1?"s":""} affichée{visible.length!==1?"s":""}. Les liens pointillés relient les personnes mentionnées avec @ dans vos notes.</p><div className="ml-auto flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span className="font-medium">Proximité :</span><span>🔴 Intime</span><span>🟡 Famille proche</span><span>🟢 Famille & Amis</span><span>🔵 Collègues</span><span>⚪ Réseau</span></div></div></div>;
}
