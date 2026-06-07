import { ContactForm } from "@/components/forms";
import { Modal } from "@/components/modal";
import { PeopleList } from "@/components/people-list";
import { PaginationControls } from "@/components/pagination-controls";
import { Shell } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { effectiveFrequency, relationshipScore } from "@/lib/score";
import type { Prisma } from "@prisma/client";

const ITEMS_PER_PAGE = 30;

export default async function Contacts({searchParams}:{searchParams:Promise<{relation?:string;page?:string;circle?:string;q?:string;sort?:string}>}) {
  const user=await requireUser();
  const {relation="all",page="1",circle="all",q="",sort="priority"}=await searchParams;

  const where:Prisma.ContactWhereInput={userId:user.id};
  const andConditions:Prisma.ContactWhereInput[]=[];

  // Filtre par cercle
  if(circle!=="all"){
    andConditions.push({circles:{some:{circleId:circle}}});
  }

  // Filtre par relation
  if(relation!=="all"){
    andConditions.push({
      OR:[
        {relationTags:{some:{tag:relation}}},
        {relationType:relation}
      ]
    });
  }

  // Recherche textuelle
  if(q){
    andConditions.push({
      OR:[
        {firstName:{contains:q}},
        {lastName:{contains:q}},
        {email:{contains:q}},
        {phone:{contains:q}},
        {company:{contains:q}},
        {relationTags:{some:{tag:{contains:q}}}},
      ]
    });
  }

  if(andConditions.length>0){
    where.AND=andConditions;
  }

  const [contacts,circles,totalAllContacts]=await Promise.all([
    db.contact.findMany({
      where,
      include:{relationTags:true,interactions:{orderBy:{happenedAt:"desc"},take:1},circles:{include:{circle:true}}},
      orderBy:[{firstName:"asc"},{lastName:"asc"}],
    }),
    db.circle.findMany({where:{userId:user.id},orderBy:{name:"asc"}}),
    db.contact.count({where:{userId:user.id}}),
  ]);

  const totalContacts=contacts.length;
  const totalPages=Math.max(1,Math.ceil(totalContacts/ITEMS_PER_PAGE));
  const currentPage=Math.min(Math.max(1,parseInt(page)||1),totalPages);

  const allPeople=contacts.map(c=>({id:c.id,firstName:c.firstName,lastName:c.lastName,photo:c.photo,email:c.email,phone:c.phone,company:c.company,relationTags:[...new Set([...c.relationTags.map(item=>item.tag),...(c.relationType?[c.relationType]:[])])],lastInteraction:c.interactions[0]?.happenedAt.toISOString()??null,score:relationshipScore(c.interactions[0]?.happenedAt??null,effectiveFrequency(c.desiredFrequency,c.circles.map(({circle})=>circle.frequency))),circles:c.circles.map(({circle})=>circle)}));

  if(sort==="priority"){
    allPeople.sort((a,b)=>a.score-b.score||a.firstName.localeCompare(b.firstName,"fr"));
  }else if(sort==="recent"){
    allPeople.sort((a,b)=>(b.lastInteraction?new Date(b.lastInteraction).getTime():0)-(a.lastInteraction?new Date(a.lastInteraction).getTime():0)||a.firstName.localeCompare(b.firstName,"fr"));
  }
  const people=allPeople.slice((currentPage-1)*ITEMS_PER_PAGE,currentPage*ITEMS_PER_PAGE);

  const hasFilters=circle!=="all"||relation!=="all"||q!=="";

  return <Shell><div className="mx-auto max-w-6xl"><header className="mb-8 flex items-end justify-between gap-4"><div><p className="mb-2 text-sm text-muted-foreground">Votre carnet</p><h1 className="text-3xl font-semibold tracking-tight">Personnes</h1><p className="mt-2 text-sm text-muted-foreground">{hasFilters?`${totalContacts} sur ${totalAllContacts}`:`${totalContacts}`} relation{totalContacts!==1?"s":""}, personnelles et professionnelles.</p></div><Modal title="Ajouter une personne" label="Personne"><ContactForm circles={circles} people={contacts}/></Modal></header><PeopleList people={people} circles={circles} totalCount={totalContacts} totalAllContacts={totalAllContacts} initialRelation={relation} initialCircle={circle} initialQuery={q} initialSort={sort}/><PaginationControls totalItems={totalContacts} itemsPerPage={ITEMS_PER_PAGE} currentPage={currentPage}/></div></Shell>;
}
