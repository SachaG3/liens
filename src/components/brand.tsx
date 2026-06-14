import { Handshake } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ inverse=false, className }: { inverse?:boolean;className?:string }) {
  return <div className={cn("flex items-center gap-2.5",className)}>
    <span className={cn("relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-[10px] shadow-sm ring-1",inverse?"bg-background text-foreground ring-background/20":"bg-foreground text-background ring-foreground/15")}>
      <span className={cn("absolute -right-2 -top-2 size-5 rounded-full",inverse?"bg-foreground/10":"bg-background/15")}/>
      <Handshake className="relative size-[18px]" strokeWidth={2.25}/>
    </span>
    <span className="text-[15px] font-semibold tracking-[-0.025em]">Liens</span>
  </div>;
}
