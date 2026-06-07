"use client";

import { KeyboardEvent, useRef, useState } from "react";
import { UserRound } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type MentionPerson={id:string;firstName:string;lastName:string};

export function MentionTextarea({ people, className, defaultValue = "", ...props }: Omit<React.ComponentProps<"textarea">,"defaultValue"> & {people:MentionPerson[];defaultValue?:string}) {
  const [value,setValue]=useState(defaultValue);const [query,setQuery]=useState<string|null>(null);const [active,setActive]=useState(0);const ref=useRef<HTMLTextAreaElement>(null);
  const matches=query===null?[]:people.filter(person=>`${person.firstName} ${person.lastName}`.toLowerCase().includes(query.toLowerCase())).slice(0,6);
  function inspect(next:string,position:number) {
    const match=next.slice(0,position).match(/(?:^|\s)@([^@\n]*)$/);
    setQuery(match?.[1]??null);setActive(0);
  }
  function select(person:MentionPerson) {
    const element=ref.current;if(!element)return;
    const position=element.selectionStart;const before=value.slice(0,position);const start=before.lastIndexOf("@");
    const mention=`@${person.firstName}${person.lastName?` ${person.lastName}`:""} `;
    const next=value.slice(0,start)+mention+value.slice(position);const caret=start+mention.length;
    setValue(next);setQuery(null);
    requestAnimationFrame(()=>{element.focus();element.setSelectionRange(caret,caret)});
  }
  function onKeyDown(event:KeyboardEvent<HTMLTextAreaElement>) {
    if(!matches.length)return;
    if(event.key==="ArrowDown"){event.preventDefault();setActive(index=>(index+1)%matches.length)}
    if(event.key==="ArrowUp"){event.preventDefault();setActive(index=>(index-1+matches.length)%matches.length)}
    if(event.key==="Enter"||event.key==="Tab"){event.preventDefault();select(matches[active])}
    if(event.key==="Escape"){event.preventDefault();setQuery(null)}
  }
  return <div className="relative"><Textarea ref={ref} className={className} value={value} onChange={event=>{setValue(event.target.value);inspect(event.target.value,event.target.selectionStart)}} onClick={event=>inspect(value,event.currentTarget.selectionStart)} onKeyDown={onKeyDown} {...props}/>
    {query!==null&&matches.length>0&&<div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg">{matches.map((person,index)=><button type="button" key={person.id} onMouseDown={event=>event.preventDefault()} onClick={()=>select(person)} className={cn("flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm",index===active&&"bg-muted")}><span className="grid size-7 place-items-center rounded-full bg-muted"><UserRound className="size-3.5"/></span><span><b className="font-medium">{person.firstName} {person.lastName}</b><span className="ml-2 text-xs text-muted-foreground">@{person.firstName}</span></span></button>)}</div>}
  </div>;
}
