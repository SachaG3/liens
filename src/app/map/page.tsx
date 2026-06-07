import { RelationshipMap } from "@/components/relationship-map";
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
  const people=contacts.map(c=>({id:c.id,firstName:c.firstName,lastName:c.lastName,company:c.company,relationTags:c.relationTags.map(item=>item.tag),circles:c.circles.map(({circle})=>({id:circle.id,name:circle.name,color:circle.color})),score:relationshipScore(c.interactions[0]?.happenedAt??null,effectiveFrequency(c.desiredFrequency,c.circles.map(({circle})=>circle.frequency)))}));
  return <Shell><div className="mx-auto max-w-7xl"><header className="mb-7"><p className="mb-2 text-sm text-muted-foreground">Une autre façon de voir votre entourage</p><h1 className="text-3xl font-semibold tracking-tight">Carte relationnelle</h1><p className="mt-2 text-sm text-muted-foreground">Explorez, déplacez-vous et ouvrez une personne directement depuis la carte.</p></header><RelationshipMap userName={user.name.split(" ")[0]} people={people} circles={circles} links={links}/></div></Shell>;
}
