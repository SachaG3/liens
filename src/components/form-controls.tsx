 "use client";

import { ChevronDown } from "lucide-react";
import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function FormField({ label, hint, children, className }: { label:string; hint?:string; children:React.ReactNode; className?:string }) {
  return <label className={cn("grid gap-1.5",className)}><span className="text-sm font-medium">{label}</span>{children}{hint&&<span className="text-xs text-muted-foreground">{hint}</span>}</label>;
}

export function TextField(props: React.ComponentProps<"input">) {
  return <Input {...props}/>;
}

export function TextAreaField(props: React.ComponentProps<"textarea">) {
  return <Textarea {...props}/>;
}

export function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return <div className="relative"><select className={cn("h-9 w-full appearance-none rounded-md border border-input bg-background px-3 pr-8 text-sm shadow-xs outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30",className)} {...props}>{children}</select><ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/></div>;
}

export function CheckPill({ label, name, value, defaultChecked }: {label:string;name:string;value:string;defaultChecked?:boolean}) {
  return <label className="group flex cursor-pointer items-center gap-2 rounded-md border bg-background px-2.5 py-2 text-sm transition hover:bg-muted"><input className="peer size-4 appearance-none rounded-[4px] border border-input bg-background checked:border-primary checked:bg-primary focus-visible:ring-2 focus-visible:ring-ring/30 checked:after:block checked:after:text-center checked:after:text-[11px] checked:after:leading-[14px] checked:after:text-primary-foreground checked:after:content-['✓']" type="checkbox" name={name} value={value} defaultChecked={defaultChecked}/><span>{label}</span></label>;
}

export function SubmitButton({ children }: { children:React.ReactNode }) {
  const {pending}=useFormStatus();
  return <Button type="submit" size="lg" className="mt-1 w-full" disabled={pending}>{pending&&<LoaderCircle className="animate-spin"/>}{pending?"Enregistrement…":children}</Button>;
}
