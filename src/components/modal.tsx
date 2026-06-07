"use client";
import { createContext, FormHTMLAttributes, ReactNode, useContext, useRef, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const ModalCloseContext = createContext<(() => void) | null>(null);

export function Modal({ title, label, children, secondary = false, icon, description = "Renseignez uniquement les informations utiles aujourd’hui.", wide = false }: { title: string; label: string; children: ReactNode; secondary?: boolean; icon?:ReactNode; description?:string; wide?:boolean }) {
  const [open,setOpen]=useState(false);
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger render={<Button variant={secondary?"outline":"default"} size={label?"lg":"icon-sm"} title={label||title}/>}>{icon??(label?<Plus/>:<Pencil/>)}{label}</DialogTrigger>
    <DialogContent className={wide?"max-h-[90vh] overflow-y-auto sm:max-w-2xl":"max-h-[90vh] overflow-y-auto sm:max-w-xl"}>
      <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
      <ModalCloseContext.Provider value={()=>setOpen(false)}>{children}</ModalCloseContext.Provider>
    </DialogContent>
  </Dialog>;
}

export function ModalForm({ action, ...props }: Omit<FormHTMLAttributes<HTMLFormElement>,"action"> & { action:(formData:FormData)=>Promise<boolean|void> }) {
  const close=useContext(ModalCloseContext);
  const formRef=useRef<HTMLFormElement>(null);
  async function submit(formData:FormData) {
    const success=await action(formData);
    if(success!==false) {
      formRef.current?.reset();
      close?.();
    }
  }
  return <form ref={formRef} action={submit} {...props}/>;
}
