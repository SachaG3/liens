import { PawPrint } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function ProfileAvatar({photo,name,className,pet=false}:{photo:string;name:string;className?:string;pet?:boolean}) {
  const fallback=name.split(/\s+/).slice(0,2).map(part=>part[0]??"").join("").toUpperCase();
  return <Avatar className={cn("size-9",className)}>{photo&&<AvatarImage src={`/api/media/${photo}`} alt={name}/>}<AvatarFallback>{pet?<PawPrint className="size-4"/>:fallback}</AvatarFallback></Avatar>;
}
