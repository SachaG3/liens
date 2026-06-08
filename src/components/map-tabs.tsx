"use client";

import { useState } from "react";
import { Network, UsersRound } from "lucide-react";
import { FamilyTree, type FamilyPerson } from "@/components/family-tree";
import { RelationshipMap } from "@/components/relationship-map";
import { cn } from "@/lib/utils";

type MapCircle={id:string;name:string;color:string};
type MapPerson=FamilyPerson&{company:string;relationTags:string[];score:number;circles:MapCircle[]};
type MapLink={fromContactId:string;toContactId:string;label:string;source:string};

export function MapTabs({user,people,circles,links}:{user:{name:string;photo:string;motherId:string|null;fatherId:string|null};people:MapPerson[];circles:MapCircle[];links:MapLink[]}) {
  const [active,setActive]=useState<"network"|"family">(()=>user.motherId||user.fatherId?"family":"network");
  return <div><div className="mb-6 grid max-w-md grid-cols-2 rounded-lg border bg-muted/30 p-1"><Tab active={active==="network"} onClick={()=>setActive("network")} icon={<Network/>}>Réseau</Tab><Tab active={active==="family"} onClick={()=>setActive("family")} icon={<UsersRound/>}>Famille</Tab></div>{active==="network"?<RelationshipMap userName={user.name.split(" ")[0]} people={people} circles={circles} links={links}/>:<FamilyTree user={user} people={people}/>}</div>;
}

function Tab({active,onClick,icon,children}:{active:boolean;onClick:()=>void;icon:React.ReactNode;children:React.ReactNode}) {
  return <button type="button" onClick={onClick} className={cn("flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground [&_svg]:size-4",active&&"bg-background text-foreground shadow-sm")}>{icon}{children}</button>;
}
