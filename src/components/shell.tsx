import { LogOut } from "lucide-react";
import { logout } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { NavLinks } from "@/components/nav-links";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalSearch } from "@/components/global-search";
import { db } from "@/lib/db";

export async function Shell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [contacts,circles,relationTags]=await Promise.all([
    db.contact.findMany({where:{userId:user.id},select:{id:true,firstName:true,lastName:true,company:true,relationTags:true},orderBy:{updatedAt:"desc"},take:30}),
    db.circle.findMany({where:{userId:user.id},select:{id:true,name:true,_count:{select:{members:true}}},orderBy:{name:"asc"}}),
    db.contactRelationTag.groupBy({by:["tag"],where:{contact:{userId:user.id}},_count:{tag:true},orderBy:{tag:"asc"}}),
  ]);
  const searchItems=[
    ...contacts.map(c=>({id:c.id,label:`${c.firstName} ${c.lastName}`.trim(),description:[c.company,...c.relationTags.map(item=>item.tag)].filter(Boolean).join(" · ")||"Personne",href:`/contacts/${c.id}`,type:"person" as const})),
    ...circles.map(c=>({id:c.id,label:c.name,description:`${c._count.members} personne${c._count.members!==1?"s":""}`,href:"/circles",type:"circle" as const})),
    ...relationTags.map(item=>({id:item.tag,label:item.tag,description:`${item._count.tag} personne${item._count.tag!==1?"s":""} · filtrer le carnet`,href:`/contacts?relation=${encodeURIComponent(item.tag)}`,type:"relation" as const})),
  ];
  return <div className="min-h-screen md:flex">
    <aside className="hidden border-r bg-card md:fixed md:inset-y-0 md:flex md:w-60 md:flex-col md:p-4">
      <div className="mb-7 flex h-10 items-center gap-2 px-2"><span className="grid size-7 place-items-center rounded-lg bg-foreground text-xs font-bold text-background">L</span><b className="tracking-tight">Liens</b></div>
      <NavLinks/>
      <div className="mt-auto border-t pt-4"><div className="flex items-center gap-2 px-2"><Avatar className="size-8"><AvatarFallback>{user.name.slice(0,2).toUpperCase()}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{user.name}</p><p className="truncate text-xs text-muted-foreground">{user.email}</p></div><ThemeToggle/><form action={logout}><Button type="submit" variant="ghost" size="icon-sm" title="Déconnexion"><LogOut/></Button></form></div></div>
    </aside>
    <div className="w-full md:ml-60"><header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur md:px-8"><div className="flex items-center gap-2 md:hidden"><span className="grid size-7 place-items-center rounded-md bg-foreground text-xs font-bold text-background">L</span><b>Liens</b></div><GlobalSearch items={searchItems}/><div className="flex items-center gap-1 md:hidden"><ThemeToggle/><form action={logout}><Button type="submit" variant="ghost" size="icon-sm"><LogOut/></Button></form></div></header><main className="px-4 py-8 pb-24 md:px-8 md:pb-8 lg:px-12">{children}</main><div className="fixed inset-x-3 bottom-3 z-20 rounded-lg border bg-card p-2 shadow-lg md:hidden"><NavLinks/></div></div>
  </div>;
}
