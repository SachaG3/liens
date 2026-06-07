"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Circle, ImagePlus, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SIZE=640;

export function PhotoEditor({existingPhoto=""}:{existingPhoto?:string}) {
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const inputRef=useRef<HTMLInputElement>(null);
  const imageRef=useRef<HTMLImageElement|null>(null);
  const dragRef=useRef<{x:number;y:number;offsetX:number;offsetY:number}|null>(null);
  const [preview,setPreview]=useState(existingPhoto?`/api/media/${existingPhoto}`:"");
  const [zoom,setZoom]=useState(1);
  const [offset,setOffset]=useState({x:0,y:0});
  const [shape,setShape]=useState<"circle"|"square">("circle");
  const sourceId=useId();

  const draw=useCallback(()=>{
    const canvas=canvasRef.current,image=imageRef.current;if(!canvas||!image)return;
    const context=canvas.getContext("2d");if(!context)return;
    const base=Math.max(SIZE/image.naturalWidth,SIZE/image.naturalHeight);
    const scale=base*zoom,width=image.naturalWidth*scale,height=image.naturalHeight*scale;
    const maxX=Math.max(0,(width-SIZE)/2),maxY=Math.max(0,(height-SIZE)/2);
    const x=Math.max(-maxX,Math.min(maxX,offset.x)),y=Math.max(-maxY,Math.min(maxY,offset.y));
    context.clearRect(0,0,SIZE,SIZE);
    context.drawImage(image,(SIZE-width)/2+x,(SIZE-height)/2+y,width,height);
    canvas.toBlob(blob=>{
      if(!blob||!inputRef.current)return;
      const transfer=new DataTransfer();
      transfer.items.add(new File([blob],"photo-profile.webp",{type:"image/webp"}));
      inputRef.current.files=transfer.files;
    },"image/webp",.9);
  },[offset,zoom]);

  useEffect(()=>{
    if(!preview)return;
    const image=new Image();
    image.onload=()=>{imageRef.current=image;setOffset(current=>({...current}))};
    image.src=preview;
    return()=>{if(preview.startsWith("blob:"))URL.revokeObjectURL(preview)};
  },[preview]);
  useEffect(()=>{draw()},[draw]);

  function choose(file:File|undefined) {
    if(!file||!file.type.startsWith("image/"))return;
    setZoom(1);setOffset({x:0,y:0});setPreview(URL.createObjectURL(file));
  }
  function pointerDown(event:React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current={x:event.clientX,y:event.clientY,offsetX:offset.x,offsetY:offset.y};
  }
  function pointerMove(event:React.PointerEvent<HTMLCanvasElement>) {
    if(!dragRef.current||!canvasRef.current)return;
    const ratio=SIZE/canvasRef.current.getBoundingClientRect().width;
    setOffset({x:dragRef.current.offsetX+(event.clientX-dragRef.current.x)*ratio,y:dragRef.current.offsetY+(event.clientY-dragRef.current.y)*ratio});
  }
  function reset() {setZoom(1);setOffset({x:0,y:0})}

  return <fieldset className="grid gap-2"><legend className="text-sm font-medium">Photo</legend>
    <input ref={inputRef} type="file" name="photo" className="sr-only" accept="image/webp"/>
    <input type="file" className="sr-only" id={sourceId} accept="image/jpeg,image/png,image/webp,image/gif" onChange={event=>choose(event.target.files?.[0])}/>
    {!preview?<label htmlFor={sourceId} className="grid cursor-pointer place-items-center rounded-xl border border-dashed bg-muted/30 p-8 text-center hover:bg-muted/60"><ImagePlus className="mb-2 size-6 text-muted-foreground"/><span className="text-sm font-medium">Choisir une photo</span><span className="mt-1 text-xs text-muted-foreground">Vous pourrez la déplacer et la zoomer.</span></label>:
    <div className="grid gap-3 rounded-xl border bg-muted/20 p-3 sm:grid-cols-[minmax(0,1fr)_150px]"><div className={cn("relative mx-auto aspect-square w-full max-w-80 overflow-hidden bg-muted ring-2 ring-background ring-offset-2 ring-offset-muted-foreground/20",shape==="circle"?"rounded-full":"rounded-xl")}><canvas ref={canvasRef} width={SIZE} height={SIZE} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={()=>dragRef.current=null} className="size-full cursor-grab touch-none object-cover active:cursor-grabbing"/><div className="pointer-events-none absolute inset-0 border-2 border-white/80 shadow-[inset_0_0_24px_rgba(0,0,0,.25)]"/></div><div className="grid content-start gap-3"><div><p className="mb-1.5 text-xs font-medium">Zoom</p><input type="range" min="1" max="3" step=".01" value={zoom} onChange={event=>setZoom(Number(event.target.value))} className="w-full accent-foreground"/></div><div><p className="mb-1.5 text-xs font-medium">Aperçu</p><div className="grid grid-cols-2 gap-1"><Button type="button" size="sm" variant={shape==="circle"?"default":"outline"} onClick={()=>setShape("circle")} title="Aperçu rond"><Circle/></Button><Button type="button" size="sm" variant={shape==="square"?"default":"outline"} onClick={()=>setShape("square")} title="Aperçu carré"><Square/></Button></div></div><Button type="button" size="sm" variant="outline" onClick={reset}><RotateCcw/>Recentrer</Button><label htmlFor={sourceId} className="cursor-pointer rounded-md border bg-background px-3 py-2 text-center text-xs font-medium hover:bg-muted">Changer la photo</label></div></div>}
    <p className="text-xs text-muted-foreground">Déplacez la photo au doigt ou à la souris. Le cadrage enregistré sera utilisé partout.</p>
  </fieldset>;
}
