"use client";

import { LoaderCircle, Trash2, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function ConfirmDelete({action,id,message="Cette suppression est définitive.",label}:{action:(formData:FormData)=>Promise<void>;id:string;message?:string;label?:string}) {
  const [open,setOpen]=useState(false);
  const [pending,setPending]=useState(false);
  async function remove(formData:FormData) {
    setPending(true);
    try {await action(formData);setOpen(false)}
    finally {setPending(false)}
  }
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger render={<Button type="button" variant={label?"destructive":"ghost"} size={label?"lg":"icon-sm"} title="Supprimer"/>}><Trash2/>{label}</DialogTrigger>
    <DialogContent showCloseButton={!pending}>
      <DialogHeader><div className="mb-1 grid size-10 place-items-center rounded-full bg-destructive/10 text-destructive"><TriangleAlert className="size-5"/></div><DialogTitle>Confirmer la suppression</DialogTitle><DialogDescription>{message}</DialogDescription></DialogHeader>
      <p className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-muted-foreground">Cette action est définitive et ne pourra pas être annulée.</p>
      <DialogFooter><DialogClose render={<Button type="button" variant="outline" disabled={pending}/>}>Annuler</DialogClose><form action={remove}><input type="hidden" name="id" value={id}/><Button type="submit" variant="destructive" disabled={pending}>{pending?<LoaderCircle className="animate-spin"/>:<Trash2/>}{pending?"Suppression…":"Supprimer définitivement"}</Button></form></DialogFooter>
    </DialogContent>
  </Dialog>;
}
