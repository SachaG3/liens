"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Background,
    BaseEdge,
    Controls,
    Handle,
    Position,
    ReactFlow,
    type Edge,
    type EdgeProps,
    type EdgeTypes,
    type Node,
    type NodeTypes,
    type ReactFlowInstance,
} from "@xyflow/react";
import { ChevronDown, ChevronRight, Crosshair, UserRound } from "lucide-react";
import "@xyflow/react/dist/style.css";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type FamilyPerson = {
    id: string;
    firstName: string;
    lastName: string;
    photo: string;
    gender: string;
    motherId: string | null;
    fatherId: string | null;
    spouseId: string | null;
    followUpStatus?: string;
};

type FamilyUser = {
    name: string;
    photo: string;
    motherId: string | null;
    fatherId: string | null;
    spouseId: string | null;
};

type Side = "maternal" | "paternal" | "both";
type BranchSide = Exclude<Side, "both">;
type ParentRole = "mother" | "father";

type AncestorMeta = { side: Side; depth: number; role: ParentRole };

type Kinship = {
    side: Side;
    generation: number;
    label: string;
    branch: string;
    rank: number;
};

type KinshipEntry = { person: FamilyPerson; kinship: Kinship };

type FamilyData = {
    label: string;
    relationship: string;
    photo: string;
    side: Side;
    isUser?: boolean;
};
type ZoneData = { label: string; side: BranchSide };
type GenerationData = { label: string };

/* ------------------------------------------------------------------ */
/* Constantes de mise en page                                          */
/* ------------------------------------------------------------------ */

/** Largeur visuelle d'une carte personne (Tailwind `w-56`). */
const NODE_WIDTH = 224;
/** Pas horizontal entre deux cartes d'un même groupe. */
const NODE_STEP = 340;
const HALF_STEP = NODE_STEP / 2;
/** Espace supplémentaire entre deux groupes d'une même rangée. */
const GROUP_GAP = 130;
/** Hauteur d'une génération (écart vertical entre deux rangées). */
const ROW_HEIGHT = 190;

/** Distance verticale entre une jonction de couple et la rangée des enfants. */
const JUNCTION_Y_OFFSET = 72;
/**
 * Décalage historique vers le centre des cartes pour positionner les
 * jonctions (≈ NODE_WIDTH / 2, conservé tel quel pour ne rien déplacer).
 */
const JUNCTION_CENTER_OFFSET = 108;
/** Moitié du point de jonction (pastille de 8 px). */
const JUNCTION_DOT_HALF = 4;

/** Curseur de départ pour le placement latéral (paternal / maternal). */
const SIDE_START_X = 360;
/** Curseur de départ pour les nœuds « both » répartis de part et d'autre. */
const SHARED_START_X = 440;
/** Position fixe des parents directs autour de « moi ». */
const PARENT_PIN_X = 180;

/** Frontière entre branches : centre de la carte « moi » (NODE_WIDTH / 2). */
const BRANCH_BOUNDARY_OFFSET = 112;
/** Marge minimale entre la frontière et chaque branche. */
const BRANCH_GAP = 48;

/** Couloirs horizontaux des arêtes « parent seul » (anti-chevauchement). */
const LANE_BASE = 42;
const LANE_STEP = 12;
const LANE_COUNT = 6;

/** Marges des zones de branche et des marqueurs de génération. */
const ZONE_PAD_TOP = 75;
const ZONE_PAD_BOTTOM = 160;
const ZONE_PAD_LEFT = 65;
const ZONE_PAD_RIGHT = NODE_WIDTH + ZONE_PAD_LEFT; // 289
const GENERATION_MARKER_X_OFFSET = 230;
const GENERATION_MARKER_Y_OFFSET = 30;

/** Limites de remontée généalogique. */
const EGO_ANCESTOR_MAX_DEPTH = 5;
const PERSON_ANCESTOR_MAX_DEPTH = 4;
/** Au-delà de ces profondeurs, le lien est trop éloigné pour l'arbre. */
const MAX_EGO_DEPTH = 4;
const MAX_PERSON_DEPTH = 3;

const EDGE_STYLE = { stroke: "#94a3b8", strokeWidth: 1.75 } as const;
const SPOUSE_EDGE_STYLE = {
    stroke: "#e879a0",
    strokeWidth: 2.5,
    strokeDasharray: "6 4",
} as const;

const sideStyles: Record<Side, string> = {
    maternal: "border-rose-400 bg-rose-50 dark:bg-rose-950/40",
    paternal: "border-sky-400 bg-sky-50 dark:bg-sky-950/40",
    both: "border-violet-400 bg-violet-50 dark:bg-violet-950/40",
};

/* ------------------------------------------------------------------ */
/* Nœuds et arêtes personnalisés (rendu)                               */
/* ------------------------------------------------------------------ */

function FamilyNode({ data }: { data: FamilyData }) {
    return (
        <>
            <Handle type="target" position={Position.Top} className="opacity-0" />
            <Handle id="parent-left" type="target" position={Position.Top} style={{ left: "32%" }} className="opacity-0" />
            <Handle id="parent-right" type="target" position={Position.Top} style={{ left: "68%" }} className="opacity-0" />
            <Handle id="left" type="target" position={Position.Left} className="opacity-0" />
            <div
                title={`${data.label} · ${data.relationship}`}
                className={cn(
                    "flex min-h-20 w-56 items-center gap-3 rounded-xl border-2 p-3 shadow-sm transition-[box-shadow,border-color] duration-150 hover:shadow-md",
                    data.isUser
                        ? "border-foreground bg-foreground text-background shadow-lg ring-4 ring-foreground/10"
                        : sideStyles[data.side],
                )}
            >
                <ProfileAvatar
                    photo={data.photo}
                    name={data.label}
                    className={`size-10 shrink-0 ${data.isUser ? "ring-2 ring-background/30" : ""}`}
                />
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{data.label}</p>
                    <p className={`mt-0.5 text-[11px] leading-snug ${data.isUser ? "text-background/70" : "text-muted-foreground"}`}>
                        {data.relationship}
                    </p>
                </div>
                {data.isUser && (
                    <span className="ml-auto grid size-7 shrink-0 place-items-center rounded-full bg-background/15">
            <UserRound className="size-3.5" />
          </span>
                )}
            </div>
            <Handle type="source" position={Position.Bottom} className="opacity-0" />
            <Handle id="right" type="source" position={Position.Right} className="opacity-0" />
        </>
    );
}

function FamilyZone({ data }: { data: ZoneData }) {
    const paternal = data.side === "paternal";
    return (
        <div
            className={cn(
                "size-full rounded-[28px] border border-dashed",
                paternal
                    ? "border-sky-300/70 bg-sky-500/[.045] dark:bg-sky-400/[.035]"
                    : "border-rose-300/70 bg-rose-500/[.045] dark:bg-rose-400/[.035]",
            )}
        >
      <span
          className={cn(
              "absolute left-5 top-4 rounded-full border bg-card/90 px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur",
              paternal ? "border-sky-300 text-sky-700 dark:text-sky-300" : "border-rose-300 text-rose-700 dark:text-rose-300",
          )}
      >
        {data.label}
      </span>
        </div>
    );
}

function GenerationMarker({ data }: { data: GenerationData }) {
    return (
        <div className="flex w-36 items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {data.label}
        </div>
    );
}

function JunctionNode() {
    return (
        <>
            <Handle type="target" position={Position.Top} className="opacity-0" />
            <span className="block size-2 rounded-full border-2 border-card bg-muted-foreground shadow-sm" />
            <Handle type="source" position={Position.Bottom} className="opacity-0" />
        </>
    );
}

/** Arête « parent seul » : descend, suit un couloir horizontal, puis rejoint l'enfant. */
function IndependentParentEdge({ id, sourceX, sourceY, targetX, targetY, style, markerEnd, data }: EdgeProps) {
    const laneOffset = Number((data as { laneOffset?: number } | undefined)?.laneOffset ?? 52);
    const laneY = sourceY + laneOffset;
    const path = `M ${sourceX} ${sourceY} V ${laneY} H ${targetX} V ${targetY}`;
    return <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} />;
}

const nodeTypes: NodeTypes = {
    family: FamilyNode,
    zone: FamilyZone,
    generation: GenerationMarker,
    junction: JunctionNode,
};
const edgeTypes: EdgeTypes = { independentParent: IndependentParentEdge };

/* ------------------------------------------------------------------ */
/* Composant principal                                                 */
/* ------------------------------------------------------------------ */

export function FamilyTree({ user, people }: { user: FamilyUser; people: FamilyPerson[] }) {
    const router = useRouter();
    const [flow, setFlow] = useState<ReactFlowInstance<Node, Edge> | null>(null);
    const [hidden, setHidden] = useState<Set<BranchSide>>(new Set());
    const [debugMode, setDebugMode] = useState(false);

    const onNodeClick = useCallback(
        (_: React.MouseEvent, node: Node) => {
            if (node.type === "family" && node.id !== "me") router.push(`/contacts/${node.id}`);
        },
        [router],
    );

    const personMap = useMemo(() => new Map(people.map((person) => [person.id, person])), [people]);
    const tree = useMemo(() => buildTree(user, people), [user, people]);

    const visibleNodes = tree.nodes.filter((node) => !isHiddenNode(node, hidden));
    const nodes = debugMode ? anonymizeNodes(visibleNodes, personMap) : visibleNodes;

    const visibleIds = new Set(nodes.map((node) => node.id));
    const edges = tree.edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target));

    const toggle = (side: BranchSide) =>
        setHidden((current) => {
            const next = new Set(current);
            if (next.has(side)) next.delete(side);
            else next.add(side);
            return next;
        });

    const centerMe = () =>
        flow?.fitView({
            nodes: [{ id: "me" }],
            padding: 2,
            maxZoom: 1,
            duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 260,
        });

    if (!tree.configured) {
        return (
            <div className="grid min-h-[560px] place-items-center rounded-xl border border-dashed bg-muted/20 p-8 text-center">
                <div>
                    <p className="font-semibold">Commencez par définir vos parents</p>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                        Dans Mon compte, sélectionnez votre mère et/ou votre père. Ajoutez ensuite les parents sur leurs fiches pour
                        faire apparaître les différentes branches de la famille.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <BranchToggle side="paternal" hidden={hidden.has("paternal")} onClick={() => toggle("paternal")} />
                <BranchToggle side="maternal" hidden={hidden.has("maternal")} onClick={() => toggle("maternal")} />
                <Button
                    type="button"
                    variant={debugMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDebugMode(!debugMode)}
                    className="ml-auto"
                >
                    🔍 Debug
                </Button>
                <span className="ml-2 hidden text-xs text-muted-foreground sm:block">Ancêtres en haut · Vous en bas</span>
            </div>

            <div className="relationship-flow relative h-[calc(100vh-280px)] min-h-[680px] overflow-hidden rounded-xl border bg-card shadow-xs">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.14, minZoom: 0.18, maxZoom: 0.9 }}
                    minZoom={0.1}
                    maxZoom={2}
                    onInit={setFlow}
                    onNodeClick={onNodeClick}
                    nodesConnectable={false}
                    nodesDraggable={false}
                    proOptions={{ hideAttribution: true }}
                >
                    <Background color="var(--border)" gap={24} size={1} />
                    <Controls />
                </ReactFlow>
                <Button
                    type="button"
                    variant="outline"
                    className="absolute right-3 top-3 z-10 bg-card/90 shadow-sm backdrop-blur"
                    onClick={centerMe}
                >
                    <Crosshair />
                    Recentrer sur moi
                </Button>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span>Les lignes pleines indiquent un lien parental renseigné.</span>
                <span className="border-b border-dashed border-muted-foreground">
          Les lignes pointillées indiquent une branche parentale incomplète.
        </span>
                <span>Cliquez sur une personne pour ouvrir sa fiche.</span>
            </div>
        </div>
    );
}

function BranchToggle({ side, hidden, onClick }: { side: BranchSide; hidden: boolean; onClick: () => void }) {
    const maternal = side === "maternal";
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={!hidden}
            className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted",
                maternal ? "border-rose-300 text-rose-700 dark:text-rose-300" : "border-sky-300 text-sky-700 dark:text-sky-300",
                hidden && "border-border text-muted-foreground",
            )}
        >
            <span className={cn("size-2 rounded-full", maternal ? "bg-rose-400" : "bg-sky-400", hidden && "bg-muted-foreground")} />
            {maternal ? "Branche maternelle" : "Branche paternelle"}
            {hidden ? <ChevronRight className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
    );
}

/* ------------------------------------------------------------------ */
/* Filtrage et mode debug                                              */
/* ------------------------------------------------------------------ */

function isHiddenNode(node: Node, hidden: Set<BranchSide>) {
    if (node.type === "zone") return hidden.has((node.data as ZoneData).side);
    if (node.type === "junction") {
        const side = (node.data as { side: Side }).side;
        return side !== "both" && hidden.has(side);
    }
    if (node.type !== "family") return false;
    const side = (node.data as FamilyData).side;
    return side !== "both" && hidden.has(side);
}

/**
 * Mode debug : remplace les identités par des numéros stables.
 * La numérotation suit l'ordre des cartes visibles, et les références
 * parentales (M=…, F=…) utilisent la même numérotation.
 */
function anonymizeNodes(visibleNodes: Node[], personMap: Map<string, FamilyPerson>): Node[] {
    const numberById = new Map<string, number>();
    let counter = 0;
    for (const node of visibleNodes) {
        if (node.type === "family") numberById.set(node.id, ++counter);
    }

    return visibleNodes.map((node) => {
        if (node.type !== "family") return node;
        const data = node.data as FamilyData;
        const person = personMap.get(node.id);

        let label = `Person${numberById.get(node.id)}`;
        if (person) {
            const motherNum = person.motherId ? numberById.get(person.motherId) : undefined;
            const fatherNum = person.fatherId ? numberById.get(person.fatherId) : undefined;
            const parents = [motherNum && `M=${motherNum}`, fatherNum && `F=${fatherNum}`].filter(Boolean);
            if (parents.length) label += ` (${parents.join(", ")})`;
        }

        return { ...node, data: { ...data, label, photo: "" } };
    });
}

/* ------------------------------------------------------------------ */
/* Construction de l'arbre                                             */
/* ------------------------------------------------------------------ */

function buildTree(user: FamilyUser, people: FamilyPerson[]) {
    const personMap = new Map(people.map((person) => [person.id, person]));

    // 1. Calcul des liens de parenté (ancêtres directs, collatéraux, conjoints).
    const ancestors = egoAncestors(user, personMap);
    const kinships = computeKinships(user, people, personMap, ancestors);

    // 2. Placement initial des cartes, génération par génération.
    const nodes = layoutGenerations(user, kinships, personMap);
    const personNodes = new Map(nodes.map((node) => [node.id, node]));

    // Les parents directs sont épinglés de part et d'autre de « moi ».
    if (user.fatherId && personNodes.has(user.fatherId)) personNodes.get(user.fatherId)!.position.x = -PARENT_PIN_X;
    if (user.motherId && personNodes.has(user.motherId)) personNodes.get(user.motherId)!.position.x = PARENT_PIN_X;

    // 3. Ajustements globaux : couples/fratries regroupés, recentrage, séparation des branches.
    arrangeGenerationGroups(nodes, personMap, user.spouseId);
    centerTreeOnMe(nodes);
    separateBranchesAroundMe(nodes);

    // 4. Arêtes parent → enfant (avec jonctions de couple), puis liens de couple.
    const edges = buildParentChildEdges(user, kinships, personMap, personNodes, nodes);
    buildSpouseEdges(user, people, personNodes, edges);

    // 5. Habillage : zones de branche et marqueurs de génération.
    addOrientationNodes(nodes, kinships);

    return { nodes, edges, configured: !!(user.motherId || user.fatherId || user.spouseId) };
}

/** Détermine le lien de parenté de chaque contact rattachable à l'arbre. */
function computeKinships(
    user: FamilyUser,
    people: FamilyPerson[],
    personMap: Map<string, FamilyPerson>,
    ancestors: Map<string, AncestorMeta>,
) {
    const kinships = new Map<string, Kinship>();

    // Ancêtres directs (parents, grands-parents, …).
    for (const [id, meta] of ancestors) {
        const person = personMap.get(id);
        if (!person) continue;
        kinships.set(id, {
            side: meta.side,
            generation: -meta.depth,
            label: ancestorLabel(meta),
            branch: `${meta.side}-ancestor`,
            rank: meta.depth,
        });
    }

    // Collatéraux (frères/sœurs, oncles/tantes, cousins, neveux, descendants…).
    for (const person of people) {
        if (kinships.has(person.id)) continue;
        const kinship = collateralKinship(person, ancestors, personMap);
        if (kinship) kinships.set(person.id, kinship);
    }

    attachSpouseKinships(user, people, kinships);
    return kinships;
}

/**
 * Rattache les conjoints/partenaires des personnes déjà présentes dans l'arbre.
 * La boucle est répétée tant qu'un rattachement a lieu, pour suivre les
 * chaînes (le conjoint d'un conjoint, etc.).
 */
function attachSpouseKinships(user: FamilyUser, people: FamilyPerson[], kinships: Map<string, Kinship>) {
    // Index inverse : pour chaque personne, qui la déclare comme conjoint·e
    // (dans l'ordre du tableau, pour conserver le comportement d'origine).
    const declaredBy = new Map<string, string[]>();
    for (const person of people) {
        if (!person.spouseId) continue;
        declaredBy.set(person.spouseId, [...(declaredBy.get(person.spouseId) ?? []), person.id]);
    }

    const spouseLabel = (gender: string) => gendered(gender, "Conjointe", "Conjoint", "Partenaire");

    let addedAny = true;
    while (addedAny) {
        addedAny = false;
        for (const person of people) {
            if (kinships.has(person.id)) continue;

            // Conjoint·e de l'utilisateur : génération 0, au centre.
            if (user.spouseId === person.id) {
                kinships.set(person.id, {
                    side: "both",
                    generation: 0,
                    label: spouseLabel(person.gender),
                    branch: "spouse-me",
                    rank: 1,
                });
                addedAny = true;
                continue;
            }

            // Lien déclaré dans un sens ou dans l'autre, vers une personne déjà rattachée.
            const partnerId =
                person.spouseId && kinships.has(person.spouseId)
                    ? person.spouseId
                    : (declaredBy.get(person.id) ?? []).find((id) => kinships.has(id)) ?? null;

            if (!partnerId) continue;
            const partnerKinship = kinships.get(partnerId)!;
            kinships.set(person.id, {
                side: partnerKinship.side,
                generation: partnerKinship.generation,
                label: spouseLabel(person.gender),
                branch: `${partnerKinship.branch}-spouse`,
                rank: partnerKinship.rank,
            });
            addedAny = true;
        }
    }
}

/** Regroupe les liens de parenté par génération. */
function groupByGeneration(kinships: Map<string, Kinship>, personMap: Map<string, FamilyPerson>) {
    const rows = new Map<number, KinshipEntry[]>();
    for (const [id, kinship] of kinships) {
        const person = personMap.get(id);
        if (!person) continue;
        rows.set(kinship.generation, [...(rows.get(kinship.generation) ?? []), { person, kinship }]);
    }
    return rows;
}

/** Crée les cartes personne, rangée par rangée, du plus ancien au plus récent. */
function layoutGenerations(user: FamilyUser, kinships: Map<string, Kinship>, personMap: Map<string, FamilyPerson>) {
    const nodes: Node[] = [
        {
            id: "me",
            type: "family",
            position: { x: 0, y: 0 },
            data: { label: user.name, relationship: "Vous", photo: user.photo, side: "both", isUser: true } satisfies FamilyData,
        },
    ];

    const rows = groupByGeneration(kinships, personMap);

    for (const [generation, members] of [...rows].sort(([a], [b]) => a - b)) {
        const paternal = members.filter((item) => item.kinship.side === "paternal").sort(familySort);
        const both = members.filter((item) => item.kinship.side === "both").sort(familySort);
        const maternal = members.filter((item) => item.kinship.side === "maternal").sort(familySort);

        const positions = new Map<string, number>();
        placeSide(paternal, -1, positions, nodes);
        placeShared(both, paternal.length, maternal.length, positions);
        placeSide(maternal, 1, positions, nodes);

        for (const { person, kinship } of members) {
            nodes.push({
                id: person.id,
                type: "family",
                position: { x: positions.get(person.id) ?? 0, y: generation * ROW_HEIGHT },
                data: {
                    label: fullName(person),
                    relationship: `${kinship.label}${person.followUpStatus === "deceased" ? " · Décédé" : ""}`,
                    photo: person.photo,
                    side: kinship.side,
                } satisfies FamilyData,
            });
        }
    }

    return nodes;
}

/* ------------------------------------------------------------------ */
/* Arêtes                                                              */
/* ------------------------------------------------------------------ */

/**
 * Relie chaque personne à ses parents : via une jonction de couple quand
 * les deux parents sont connus, via une arête pointillée « parent seul » sinon.
 */
function buildParentChildEdges(
    user: FamilyUser,
    kinships: Map<string, Kinship>,
    personMap: Map<string, FamilyPerson>,
    personNodes: Map<string, Node>,
    nodes: Node[],
) {
    const edges: Edge[] = [];
    const familyJunctions = new Map<string, { id: string; node: Node; children: string[] }>();

    const connectFamily = (childId: string, motherId: string | null, fatherId: string | null) => {
        const child = personNodes.get(childId);
        const mother = motherId && personNodes.get(motherId);
        const father = fatherId && personNodes.get(fatherId);
        if (!child) return;

        if (mother && father) {
            const parentIds = [mother.id, father.id].sort();
            const familyKey = parentIds.join("|");
            let family = familyJunctions.get(familyKey);

            if (!family) {
                const junctionId = `junction-family-${parentIds.join("-")}`;
                const junction = {
                    id: junctionId,
                    type: "junction",
                    position: {
                        x: (mother.position.x + father.position.x) / 2 + JUNCTION_CENTER_OFFSET - JUNCTION_DOT_HALF,
                        y: child.position.y - JUNCTION_Y_OFFSET,
                    },
                    data: { side: (child.data as FamilyData).side },
                    selectable: false,
                    draggable: false,
                    zIndex: 2,
                } satisfies Node;

                family = { id: junctionId, node: junction, children: [] };
                familyJunctions.set(familyKey, family);
                nodes.push(junction);
                edges.push(
                    { id: `${mother.id}-${junctionId}`, source: mother.id, target: junctionId, type: "step", style: EDGE_STYLE },
                    { id: `${father.id}-${junctionId}`, source: father.id, target: junctionId, type: "step", style: EDGE_STYLE },
                );
            }

            family.children.push(childId);
            return;
        }

        const parent = mother ?? father;
        if (parent) {
            edges.push({
                ...independentParentEdge(parent, child, { ...EDGE_STYLE, strokeDasharray: "5 5" }, "incomplete"),
                id: `${parent.id}-${childId}-incomplete`,
            });
        }
    };

    connectFamily("me", user.motherId, user.fatherId);
    for (const id of kinships.keys()) {
        const person = personMap.get(id);
        if (person) connectFamily(id, person.motherId, person.fatherId);
    }

    // Une fois tous les enfants connus, chaque jonction est recentrée au-dessus d'eux.
    for (const family of familyJunctions.values()) {
        const children = family.children.flatMap((id) => (personNodes.has(id) ? [personNodes.get(id)!] : []));
        if (!children.length) continue;

        family.node.position.x = averageX(children) + JUNCTION_CENTER_OFFSET - JUNCTION_DOT_HALF;
        family.node.position.y = Math.min(...children.map((child) => child.position.y)) - JUNCTION_Y_OFFSET;

        for (const child of children) {
            edges.push({
                id: `${family.id}-${child.id}`,
                source: family.id,
                target: child.id,
                type: children.length === 1 ? "straight" : "step",
                style: EDGE_STYLE,
            });
        }
    }

    return edges;
}

/** Ajoute les liens de couple comme des arêtes horizontales (❤). */
function buildSpouseEdges(user: FamilyUser, people: FamilyPerson[], personNodes: Map<string, Node>, edges: Edge[]) {
    const addSpouseEdge = (personAId: string, personBId: string) => {
        const nodeA = personNodes.get(personAId);
        const nodeB = personNodes.get(personBId);
        if (!nodeA || !nodeB) return;

        const edgeId = [personAId, personBId].sort().join("-spouse-");
        if (edges.some((edge) => edge.id === edgeId)) return; // déjà tracé dans l'autre sens

        const left = nodeA.position.x <= nodeB.position.x ? nodeA : nodeB;
        const right = left === nodeA ? nodeB : nodeA;
        edges.push({
            id: edgeId,
            source: left.id,
            target: right.id,
            sourceHandle: "right",
            targetHandle: "left",
            type: "straight",
            style: SPOUSE_EDGE_STYLE,
            label: "❤",
            labelStyle: { fontSize: 14 },
        });
    };

    if (user.spouseId) addSpouseEdge("me", user.spouseId);
    for (const person of people) {
        if (person.spouseId && personNodes.has(person.id) && personNodes.has(person.spouseId)) {
            addSpouseEdge(person.id, person.spouseId);
        }
    }
}

/* ------------------------------------------------------------------ */
/* Habillage (zones, marqueurs de génération)                          */
/* ------------------------------------------------------------------ */

function addOrientationNodes(nodes: Node[], kinships: Map<string, Kinship>) {
    const familyNodes = nodes.filter((node) => node.type === "family");
    const minY = Math.min(...familyNodes.map((node) => node.position.y)) - ZONE_PAD_TOP;
    const maxY = Math.max(...familyNodes.map((node) => node.position.y)) + ZONE_PAD_BOTTOM;

    const paternal = familyNodes.filter((node) => (node.data as FamilyData).side === "paternal");
    const maternal = familyNodes.filter((node) => (node.data as FamilyData).side === "maternal");
    const me = familyNodes.find((node) => node.id === "me");
    const boundary = (me?.position.x ?? 0) + BRANCH_BOUNDARY_OFFSET;

    const zone = (side: BranchSide, items: Node[]) => {
        if (!items.length) return;
        const itemMinX = Math.min(...items.map((node) => node.position.x)) - ZONE_PAD_LEFT;
        const itemMaxX = Math.max(...items.map((node) => node.position.x)) + ZONE_PAD_RIGHT;
        // Chaque zone s'arrête à la frontière centrale, côté « moi ».
        const minX = side === "maternal" ? boundary : itemMinX;
        const maxX = side === "paternal" ? boundary : itemMaxX;
        nodes.unshift({
            id: `zone-${side}`,
            type: "zone",
            position: { x: minX, y: minY },
            data: { side, label: side === "paternal" ? "Branche paternelle" : "Branche maternelle" } satisfies ZoneData,
            style: { width: maxX - minX, height: maxY - minY },
            selectable: false,
            draggable: false,
            zIndex: -2,
        });
    };
    zone("paternal", paternal);
    zone("maternal", maternal);

    const generations = [...new Set([...kinships.values()].map((kinship) => kinship.generation).concat(0))].sort(
        (a, b) => a - b,
    );
    const markerX = Math.min(...familyNodes.map((node) => node.position.x)) - GENERATION_MARKER_X_OFFSET;
    for (const generation of generations) {
        nodes.push({
            id: `generation-${generation}`,
            type: "generation",
            position: { x: markerX, y: generation * ROW_HEIGHT + GENERATION_MARKER_Y_OFFSET },
            data: { label: generationLabel(generation) } satisfies GenerationData,
            selectable: false,
            draggable: false,
            zIndex: -1,
        });
    }
}

function generationLabel(generation: number) {
    if (generation === 0) return "Vous";
    if (generation === -1) return "Parents";
    if (generation === -2) return "Grands-parents";
    if (generation < 0) return `${Math.abs(generation)} générations avant`;
    return generation === 1 ? "Enfants" : `${generation} générations après`;
}

/* ------------------------------------------------------------------ */
/* Calcul des liens de parenté                                         */
/* ------------------------------------------------------------------ */

/** Remonte les ancêtres de l'utilisateur en mémorisant côté, profondeur et rôle. */
function egoAncestors(user: { motherId: string | null; fatherId: string | null }, personMap: Map<string, FamilyPerson>) {
    const result = new Map<string, AncestorMeta>();
    result.set("me", { side: "both", depth: 0, role: "father" });

    const visit = (id: string | null, side: Side, depth: number, role: ParentRole, seen = new Set<string>()) => {
        if (!id || seen.has(id) || !personMap.has(id) || depth > EGO_ANCESTOR_MAX_DEPTH) return;
        const previous = result.get(id);
        result.set(id, {
            // Atteint par les deux côtés (implexe) → « both ».
            side: previous && previous.side !== side ? "both" : side,
            depth: Math.min(previous?.depth ?? depth, depth),
            role,
        });
        const person = personMap.get(id)!;
        const next = new Set(seen).add(id);
        visit(person.motherId, side, depth + 1, "mother", next);
        visit(person.fatherId, side, depth + 1, "father", next);
    };

    visit(user.motherId, "maternal", 1, "mother");
    visit(user.fatherId, "paternal", 1, "father");
    return result;
}

/** Remonte les ancêtres d'un contact (« me » compte comme un ancêtre possible). */
function personAncestors(person: FamilyPerson, personMap: Map<string, FamilyPerson>) {
    const result = new Map<string, number>();

    const visit = (id: string | null, depth: number, seen = new Set<string>()) => {
        if (!id || seen.has(id) || (!personMap.has(id) && id !== "me") || depth > PERSON_ANCESTOR_MAX_DEPTH) return;
        result.set(id, Math.min(result.get(id) ?? depth, depth));
        if (id === "me") return;
        const parent = personMap.get(id)!;
        const next = new Set(seen).add(id);
        visit(parent.motherId, depth + 1, next);
        visit(parent.fatherId, depth + 1, next);
    };

    visit(person.motherId, 1);
    visit(person.fatherId, 1);
    return result;
}

/**
 * Déduit le lien collatéral d'un contact à partir de l'ancêtre commun
 * le plus proche (somme des profondeurs minimale).
 */
function collateralKinship(
    person: FamilyPerson,
    ego: Map<string, AncestorMeta>,
    personMap: Map<string, FamilyPerson>,
): Kinship | null {
    const own = personAncestors(person, personMap);
    const common = [...own]
        .flatMap(([id, personDepth]) => {
            const meta = ego.get(id);
            return meta ? [{ id, personDepth, egoDepth: meta.depth, side: meta.side }] : [];
        })
        .sort((a, b) => a.egoDepth + a.personDepth - (b.egoDepth + b.personDepth) || a.egoDepth - b.egoDepth);

    const closest = common[0];
    if (!closest || closest.egoDepth > MAX_EGO_DEPTH || closest.personDepth > MAX_PERSON_DEPTH) return null;

    // Plusieurs ancêtres communs à même distance = lien « plein » (ex. frère vs demi-frère).
    const nearest = common.filter((item) => item.egoDepth === closest.egoDepth && item.personDepth === closest.personDepth);
    const side = mergeSides(nearest.map((item) => item.side));
    const label = collateralLabel(person.gender, closest.egoDepth, closest.personDepth, nearest.length, side);

    return {
        side,
        generation: closest.personDepth - closest.egoDepth,
        label,
        branch: `${side}-${closest.id}`,
        rank: closest.egoDepth + closest.personDepth,
    };
}

/* ------------------------------------------------------------------ */
/* Libellés                                                            */
/* ------------------------------------------------------------------ */

function collateralLabel(gender: string, egoDepth: number, personDepth: number, sharedCount: number, side: Side) {
    // Descendants directs.
    if (egoDepth === 0) {
        if (personDepth === 1) return gendered(gender, "Fille", "Fils", "Enfant");
        if (personDepth === 2) return gendered(gender, "Petite-fille", "Petit-fils", "Petit-enfant");
        return "Descendant·e";
    }

    // Fratrie (un seul ancêtre commun à distance 1/1 = demi-frère/sœur).
    if (egoDepth === 1 && personDepth === 1) {
        return sharedCount === 1
            ? gendered(gender, "Demi-sœur", "Demi-frère", "Demi-frère ou demi-sœur")
            : gendered(gender, "Sœur", "Frère", "Frère ou sœur");
    }

    if (egoDepth === 1 && personDepth === 2) return gendered(gender, "Nièce", "Neveu", "Neveu ou nièce");

    // Oncles, tantes et leurs degrés « grand- ».
    if (personDepth === 1 && egoDepth >= 2) {
        const prefix = egoDepth === 2 ? "" : `${"Arrière-".repeat(Math.max(0, egoDepth - 3))}grand-`;
        return `${sharedCount === 1 ? "Demi-" : ""}${prefix}${gendered(gender, "tante", "oncle", "oncle ou tante")}${kinSideSuffix(side, gender)}`;
    }

    // Cousins, avec degré et générations d'écart.
    if (personDepth >= 2 && egoDepth >= 2) {
        const degree = Math.min(egoDepth, personDepth) - 1;
        const removed = Math.abs(egoDepth - personDepth);
        const base =
            degree === 1
                ? gendered(gender, "Cousine", "Cousin", "Cousin·e")
                : `${gendered(gender, "Cousine", "Cousin", "Cousin·e")} au ${degree}e degré`;
        return `${base}${removed ? ` avec ${removed} génération${removed > 1 ? "s" : ""} d’écart` : ""}${kinSideSuffix(side, gender)}`;
    }

    return `Famille${sidePhrase(side)}`;
}

function ancestorLabel(meta: AncestorMeta) {
    if (meta.depth === 1) return meta.role === "mother" ? "Mère" : "Père";
    const prefix = meta.depth === 2 ? "" : `${"Arrière-".repeat(meta.depth - 2)}`;
    return `${prefix}${meta.role === "mother" ? "grand-mère" : "grand-père"}${sideSuffix(meta.side, meta.role === "mother")}`;
}

/* ------------------------------------------------------------------ */
/* Placement                                                           */
/* ------------------------------------------------------------------ */

/**
 * Place les cartes d'un côté (paternal ou maternal) pour une génération.
 * Les ancêtres directs sont groupés par branche ; les collatéraux par parent
 * direct, centrés sous celui-ci quand il est déjà positionné.
 */
function placeSide(items: KinshipEntry[], direction: -1 | 1, positions: Map<string, number>, existingNodes: Node[]) {
    // Note : les ancêtres directs sont reconnus par leur branche structurelle
    // (`maternal-ancestor` / `paternal-ancestor`), pas par leur libellé.
    const grouped = new Map<string, KinshipEntry[]>();
    for (const item of items) {
        const isDirectAncestor = item.kinship.branch.endsWith("-ancestor");
        const key = isDirectAncestor
            ? item.kinship.branch
            : `parent-${item.person.motherId || item.person.fatherId || `orphan-${item.person.id}`}`;
        grouped.set(key, [...(grouped.get(key) ?? []), item]);
    }

    // Positions des parents déjà placés (générations au-dessus).
    const parentPositions = new Map<string, number>();
    for (const node of existingNodes) {
        if (node.type === "family") parentPositions.set(node.id, node.position.x);
    }

    const parentIdOf = (groupKey: string) => groupKey.replace("parent-", "");
    const hasPositionedParent = (groupKey: string) =>
        groupKey.startsWith("parent-") && parentPositions.has(parentIdOf(groupKey));

    // Les groupes avec parent positionné passent en premier, triés par position du parent.
    const groupsArray = [...grouped.entries()].sort((a, b) => {
        const aHasParent = hasPositionedParent(a[0]);
        const bHasParent = hasPositionedParent(b[0]);
        if (aHasParent && !bHasParent) return -1;
        if (!aHasParent && bHasParent) return 1;
        if (aHasParent && bHasParent) {
            const aParentX = parentPositions.get(parentIdOf(a[0])) ?? 0;
            const bParentX = parentPositions.get(parentIdOf(b[0])) ?? 0;
            return direction * (aParentX - bParentX);
        }
        return 0;
    });

    let cursor = SIDE_START_X;
    for (const [groupKey, group] of groupsArray) {
        // Enfants d'un parent positionné : centrés sous lui.
        if (groupKey.startsWith("parent-")) {
            const parentX = parentPositions.get(parentIdOf(groupKey));
            if (parentX !== undefined) {
                const totalWidth = (group.length - 1) * NODE_STEP;
                let childCursor = parentX - totalWidth / 2;
                for (const item of group) {
                    positions.set(item.person.id, childCursor);
                    childCursor += NODE_STEP;
                }
                continue;
            }
        }

        // Placement par défaut : empilés vers l'extérieur.
        for (const item of group) {
            positions.set(item.person.id, direction * cursor);
            cursor += NODE_STEP;
        }
        cursor += GROUP_GAP;
    }
}

/** Répartit les nœuds « both » en alternance de part et d'autre des deux branches. */
function placeShared(items: KinshipEntry[], paternalCount: number, maternalCount: number, positions: Map<string, number>) {
    let left = SHARED_START_X + paternalCount * NODE_STEP;
    let right = SHARED_START_X + maternalCount * NODE_STEP;
    items.forEach((item, index) => {
        if (index % 2 === 0) {
            positions.set(item.person.id, -left);
            left += NODE_STEP;
        } else {
            positions.set(item.person.id, right);
            right += NODE_STEP;
        }
    });
}

/**
 * Réordonne chaque rangée (de bas en haut) : les couples restent côte à côte,
 * les fratries restent groupées, et chaque groupe est centré au-dessus de ses
 * descendants quand il en a.
 */
function arrangeGenerationGroups(nodes: Node[], personMap: Map<string, FamilyPerson>, userSpouseId: string | null) {
    const nodesById = new Map(nodes.filter((node) => node.type === "family").map((node) => [node.id, node]));
    const rows = new Map<number, Node[]>();
    for (const node of nodesById.values()) rows.set(node.position.y, [...(rows.get(node.position.y) ?? []), node]);

    const spouseOf = (id: string) => {
        if (id === "me") return userSpouseId;
        const direct = personMap.get(id)?.spouseId;
        if (direct) return direct;
        return peopleFindId(personMap, (person) => person.spouseId === id);
    };

    for (const [, row] of [...rows.entries()].sort(([leftY], [rightY]) => rightY - leftY)) {
        const remaining = new Set(row.map((node) => node.id));
        const groups: Array<{ nodes: Node[]; center: number }> = [];

        // Les couples sont regroupés avant les fratries.
        for (const node of row) {
            if (!remaining.has(node.id)) continue;
            const spouseId = spouseOf(node.id);
            const spouse = spouseId && nodesById.get(spouseId);
            if (!spouse || spouse.position.y !== node.position.y || !remaining.has(spouse.id)) continue;
            const pair = orderCoupleByParents(node, spouse, nodesById, personMap);
            groups.push({ nodes: pair, center: descendantCenter(pair, nodesById, personMap) ?? averageX(pair) });
            remaining.delete(node.id);
            remaining.delete(spouse.id);
        }

        // Fratries : mêmes parents = même groupe.
        const siblings = new Map<string, Node[]>();
        for (const node of row) {
            if (!remaining.has(node.id)) continue;
            const person = personMap.get(node.id);
            const parentIds = person ? [person.motherId, person.fatherId].filter((id): id is string => !!id).sort() : [];
            const key = parentIds.length ? parentIds.join("|") : `single-${node.id}`;
            siblings.set(key, [...(siblings.get(key) ?? []), node]);
        }
        for (const members of siblings.values()) {
            const ordered = members.sort((left, right) => left.position.x - right.position.x);
            groups.push({ nodes: ordered, center: descendantCenter(ordered, nodesById, personMap) ?? averageX(ordered) });
        }

        // Placement de gauche à droite, sans chevauchement entre groupes.
        groups.sort((left, right) => left.center - right.center);
        let cursor = Number.NEGATIVE_INFINITY;
        for (const group of groups) {
            const desiredStart = group.center - (group.nodes.length - 1) * HALF_STEP;
            const start = Math.max(desiredStart, cursor);
            group.nodes.forEach((node, index) => {
                node.position.x = start + index * NODE_STEP;
            });
            cursor = start + group.nodes.length * NODE_STEP + GROUP_GAP;
        }

        // Petit recentrage global de la rangée vers les positions souhaitées.
        const before = groups.flatMap((group) => group.nodes).reduce((sum, node) => sum + node.position.x, 0);
        const desired = groups.reduce((sum, group) => sum + group.center * group.nodes.length, 0);
        const shift = (desired - before) / Math.max(1, row.length);
        for (const node of row) node.position.x += shift;
    }
}

/** Translate tout l'arbre pour que « moi » soit en x = 0. */
function centerTreeOnMe(nodes: Node[]) {
    const me = nodes.find((node) => node.id === "me");
    if (!me) return;
    const shift = me.position.x;
    for (const node of nodes) node.position.x -= shift;
}

/** Repousse chaque branche de son côté de la frontière centrale si elle déborde. */
function separateBranchesAroundMe(nodes: Node[]) {
    const me = nodes.find((node) => node.id === "me");
    if (!me) return;

    const boundary = me.position.x + BRANCH_BOUNDARY_OFFSET;
    const familyNodes = nodes.filter((node) => node.type === "family");
    const paternal = familyNodes.filter((node) => (node.data as FamilyData).side === "paternal");
    const maternal = familyNodes.filter((node) => (node.data as FamilyData).side === "maternal");

    const paternalOverflow = Math.max(0, ...paternal.map((node) => node.position.x + NODE_WIDTH - (boundary - BRANCH_GAP)));
    const maternalOverflow = Math.max(0, ...maternal.map((node) => boundary + BRANCH_GAP - node.position.x));

    for (const node of paternal) node.position.x -= paternalOverflow;
    for (const node of maternal) node.position.x += maternalOverflow;
}

/** Centre des enfants d'un groupe (pour aligner les parents au-dessus d'eux). */
function descendantCenter(group: Node[], nodesById: Map<string, Node>, personMap: Map<string, FamilyPerson>) {
    const ids = new Set(group.map((node) => node.id));
    const children = [...nodesById.values()].filter((node) => {
        const person = personMap.get(node.id);
        return !!person && (ids.has(person.motherId ?? "") || ids.has(person.fatherId ?? ""));
    });
    return children.length ? averageX(children) : null;
}

/**
 * Ordonne un couple pour que chacun reste du côté de sa propre famille
 * (fratrie en priorité, parents sinon).
 */
function orderCoupleByParents(first: Node, second: Node, nodesById: Map<string, Node>, personMap: Map<string, FamilyPerson>) {
    const parentKey = (node: Node) => {
        const person = personMap.get(node.id);
        return person ? [person.motherId, person.fatherId].filter((id): id is string => !!id).sort().join("|") : "";
    };

    const siblingCenter = (node: Node) => {
        const key = parentKey(node);
        if (!key) return null;
        const siblings = [...nodesById.values()].filter(
            (candidate) =>
                candidate.id !== first.id &&
                candidate.id !== second.id &&
                candidate.position.y === node.position.y &&
                parentKey(candidate) === key,
        );
        return siblings.length ? averageX(siblings) : null;
    };

    const firstSiblingsX = siblingCenter(first);
    const secondSiblingsX = siblingCenter(second);
    const coupleMidX = (first.position.x + second.position.x) / 2;

    if (firstSiblingsX !== null && secondSiblingsX === null) {
        return firstSiblingsX < coupleMidX ? [first, second] : [second, first];
    }
    if (secondSiblingsX !== null && firstSiblingsX === null) {
        return secondSiblingsX < coupleMidX ? [second, first] : [first, second];
    }
    if (firstSiblingsX !== null && secondSiblingsX !== null && firstSiblingsX !== secondSiblingsX) {
        return firstSiblingsX < secondSiblingsX ? [first, second] : [second, first];
    }

    const parentCenter = (node: Node) => {
        const person = personMap.get(node.id);
        const parents = [person?.motherId, person?.fatherId].flatMap((id) => (id && nodesById.has(id) ? [nodesById.get(id)!] : []));
        return parents.length ? averageX(parents) : null;
    };

    const firstParentX = parentCenter(first);
    const secondParentX = parentCenter(second);
    if (firstParentX !== null && secondParentX !== null && firstParentX !== secondParentX) {
        return firstParentX < secondParentX ? [first, second] : [second, first];
    }

    return [first, second].sort((left, right) => left.position.x - right.position.x);
}

/* ------------------------------------------------------------------ */
/* Utilitaires                                                         */
/* ------------------------------------------------------------------ */

function independentParentEdge(parent: Node, child: Node, style: React.CSSProperties, suffix: string): Edge {
    const parentIsLeft = parent.position.x < child.position.x;
    return {
        id: `${parent.id}-${child.id}-${suffix}`,
        source: parent.id,
        target: child.id,
        targetHandle: parentIsLeft ? "parent-left" : "parent-right",
        type: "independentParent",
        data: { laneOffset: LANE_BASE + stableLane(`${parent.id}-${child.id}`) * LANE_STEP },
        style,
    };
}

/** Couloir horizontal stable (0–5) dérivé de l'identifiant de l'arête. */
function stableLane(value: string) {
    return [...value].reduce((total, char) => total + char.charCodeAt(0), 0) % LANE_COUNT;
}

function averageX(nodes: Node[]) {
    return nodes.reduce((sum, node) => sum + node.position.x, 0) / nodes.length;
}

function peopleFindId(personMap: Map<string, FamilyPerson>, predicate: (person: FamilyPerson) => boolean) {
    for (const person of personMap.values()) if (predicate(person)) return person.id;
    return null;
}

function familySort(a: KinshipEntry, b: KinshipEntry) {
    return (
        a.kinship.branch.localeCompare(b.kinship.branch) ||
        a.kinship.rank - b.kinship.rank ||
        fullName(a.person).localeCompare(fullName(b.person), "fr")
    );
}

function fullName(person: FamilyPerson) {
    return `${person.firstName} ${person.lastName}`.trim();
}

function gendered(gender: string, woman: string, man: string, unknown: string) {
    return gender === "woman" ? woman : gender === "man" ? man : unknown;
}

function sideSuffix(side: Side, feminine: boolean) {
    if (side === "maternal") return ` ${feminine ? "maternelle" : "maternel"}`;
    if (side === "paternal") return ` ${feminine ? "paternelle" : "paternel"}`;
    return "";
}

function sidePhrase(side: Side) {
    return side === "maternal" ? " maternel·le" : side === "paternal" ? " paternel·le" : "";
}

function kinSideSuffix(side: Side, gender: string) {
    if (gender === "woman") return sideSuffix(side, true);
    if (gender === "man") return sideSuffix(side, false);
    return sidePhrase(side);
}

function mergeSides(sides: Side[]): Side {
    if (sides.includes("both") || (sides.includes("maternal") && sides.includes("paternal"))) return "both";
    return sides[0] ?? "both";
}