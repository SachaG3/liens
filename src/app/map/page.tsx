import { MapTabs } from "@/components/map-tabs";
import { Shell } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { effectiveFrequency, relationshipScore } from "@/lib/score";

export default async function MapPage() {
  const user=await requireUser();
  const [contacts,circles,links]=await Promise.all([
    db.contact.findMany({where:{userId:user.id},include:{relationTags:true,circles:{include:{circle:true}},interactions:{orderBy:{happenedAt:"desc"},take:1}},orderBy:{firstName:"asc"}}),
    db.circle.findMany({where:{userId:user.id},select:{id:true,name:true,color:true},orderBy:{name:"asc"}}),
    db.contactLink.findMany({where:{fromContact:{userId:user.id}},select:{fromContactId:true,toContactId:true,label:true,source:true}}),
  ]);
  const people=contacts.map(c=>({id:c.id,firstName:c.firstName,lastName:c.lastName,company:c.company,photo:c.photo,gender:c.gender,followUpStatus:c.followUpStatus,relationTags:c.relationTags.map(item=>item.tag),circles:c.circles.map(({circle})=>({id:circle.id,name:circle.name,color:circle.color})),score:relationshipScore(c.interactions[0]?.happenedAt??null,effectiveFrequency(c.desiredFrequency,c.circles.map(({circle})=>circle.frequency))),motherId:c.motherId,fatherId:c.fatherId,spouseId:c.spouseId}));
  return <Shell><div className="mx-auto max-w-7xl"><header className="mb-7"><p className="mb-2 text-sm text-muted-foreground">Une autre façon de voir votre entourage</p><h1 className="text-3xl font-semibold tracking-tight">Cartes relationnelles</h1><p className="mt-2 text-sm text-muted-foreground">Explorez votre réseau ou reconstruisez votre famille à partir des liens parentaux.</p></header><MapTabs user={{name:user.name,photo:user.photo,motherId:user.motherId,fatherId:user.fatherId,spouseId:user.spouseId}} people={people} circles={circles} links={links}/></div></Shell>;
}
