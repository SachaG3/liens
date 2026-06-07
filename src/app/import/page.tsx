import { Shell } from "@/components/shell";
import { VcardImport } from "@/components/vcard-import";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function ImportPage() {
  const user=await requireUser();
  const [contacts,circles]=await Promise.all([
    db.contact.findMany({where:{userId:user.id},select:{id:true,firstName:true,lastName:true,email:true,phone:true,company:true,sourceId:true},orderBy:{firstName:"asc"}}),
    db.circle.findMany({where:{userId:user.id},select:{id:true,name:true,color:true},orderBy:{name:"asc"}}),
  ]);
  return <Shell><div className="mx-auto max-w-5xl"><header className="mb-7"><p className="mb-2 text-sm text-muted-foreground">Apple, Google et fichiers standards</p><h1 className="text-3xl font-semibold tracking-tight">Importer des contacts</h1><p className="mt-2 text-sm text-muted-foreground">Vérifiez les doublons, enrichissez les données et choisissez précisément ce qui entre dans votre carnet.</p></header><VcardImport existing={contacts} circles={circles}/></div></Shell>;
}
