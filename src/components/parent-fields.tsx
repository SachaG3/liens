"use client";

import { useState } from "react";
import { FormField, NativeSelect } from "@/components/form-controls";

type Person={id:string;firstName:string;lastName:string};

export function ParentFields({people,motherId=null,fatherId=null,spouseId=null,forUser=false}:{people:Person[];motherId?:string|null;fatherId?:string|null;spouseId?:string|null;forUser?:boolean}) {
  const [mother,setMother]=useState(motherId||"");
  const [father,setFather]=useState(fatherId||"");
  const [spouse,setSpouse]=useState(spouseId||"");
  return <fieldset className="grid gap-3 rounded-lg border bg-muted/20 p-3"><legend className="px-1 text-sm font-medium">{forUser?"Mes parents & partenaire":"Parents & partenaire de cette personne"}</legend><p className="text-xs text-muted-foreground">{forUser?"Ces personnes seront directement reliées à vous et définiront les branches maternelle et paternelle de votre arbre.":"Ces liens décrivent sa famille à elle. Ils ne signifient pas automatiquement que ces personnes font partie de votre famille."}</p><div className="grid gap-3 sm:grid-cols-3"><FormField label="Mère"><NativeSelect name="motherId" value={mother} onChange={event=>setMother(event.target.value)}><option value="">Non renseignée</option>{people.map(person=><option key={person.id} value={person.id}>{person.firstName} {person.lastName}</option>)}</NativeSelect></FormField><FormField label="Père"><NativeSelect name="fatherId" value={father} onChange={event=>setFather(event.target.value)}><option value="">Non renseigné</option>{people.map(person=><option key={person.id} value={person.id}>{person.firstName} {person.lastName}</option>)}</NativeSelect></FormField><FormField label="Marié(e) / En couple"><NativeSelect name="spouseId" value={spouse} onChange={event=>setSpouse(event.target.value)}><option value="">Non renseigné(e)</option>{people.map(person=><option key={person.id} value={person.id}>{person.firstName} {person.lastName}</option>)}</NativeSelect></FormField></div>{forUser&&(mother||father||spouse)&&<p className="rounded-md bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">Relié directement à votre compte et à votre arbre.</p>}</fieldset>;
}
