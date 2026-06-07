"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function SensitiveValue({value}:{value:string}) {
  const [visible,setVisible]=useState(false);
  return <button type="button" onClick={()=>setVisible(current=>!current)} className="flex max-w-48 items-center gap-1 truncate font-medium" title={visible?"Masquer":"Afficher le contenu sensible"}>{visible?<EyeOff className="size-3"/>:<Eye className="size-3"/>}{visible?value:"••••••••"}</button>;
}
