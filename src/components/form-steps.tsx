"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SubmitButton } from "@/components/form-controls";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Step={label:string;description:string;content:ReactNode};

export function FormSteps({steps,submitLabel}:{steps:Step[];submitLabel:string}) {
  const [active,setActive]=useState(0);
  return <div className="grid gap-5">
    <nav className="grid grid-cols-4 gap-1 rounded-lg border bg-muted/30 p-1" aria-label="Étapes du formulaire">{steps.map((step,index)=><button key={step.label} type="button" onClick={()=>setActive(index)} className={cn("min-w-0 rounded-md px-2 py-2 text-xs font-medium text-muted-foreground transition hover:text-foreground sm:text-sm",active===index&&"bg-background text-foreground shadow-sm")}><span className="sm:hidden">{index+1}</span><span className="hidden truncate sm:block">{step.label}</span></button>)}</nav>
    <div><p className="font-semibold">{steps[active].label}</p><p className="mt-1 text-xs text-muted-foreground">{steps[active].description}</p></div>
    <div className="min-h-[330px]">{steps.map((step,index)=><section key={step.label} style={{display:active===index?"grid":"none"}} className="gap-4">{step.content}</section>)}</div>
    <div className="flex flex-wrap items-center gap-2 border-t pt-4">
      {active>0&&<Button type="button" variant="outline" onClick={()=>setActive(value=>Math.max(0,value-1))}><ChevronLeft/>Précédent</Button>}
      {active<steps.length-1&&<Button type="button" variant="outline" onClick={()=>setActive(value=>Math.min(steps.length-1,value+1))}>Suivant<ChevronRight/></Button>}
      <span className="ml-auto text-xs text-muted-foreground">{active+1} / {steps.length}</span>
      <div className="min-w-40"><SubmitButton>{submitLabel}</SubmitButton></div>
    </div>
  </div>;
}
