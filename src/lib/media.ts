import "server-only";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const mediaDir=path.join(process.cwd(),"prisma","data","uploads");
const allowed=new Map([["image/jpeg","jpg"],["image/png","png"],["image/webp","webp"],["image/gif","gif"]]);

export async function saveImage(file:FormDataEntryValue|null,previous="") {
  if(!(file instanceof File)||file.size===0)return previous;
  const extension=allowed.get(file.type);
  if(!extension||file.size>5_000_000)return previous;
  await mkdir(mediaDir,{recursive:true});
  const name=`${randomBytes(18).toString("hex")}.${extension}`;
  await writeFile(path.join(mediaDir,name),Buffer.from(await file.arrayBuffer()));
  if(previous)await deleteImage(previous);
  return name;
}

export async function deleteImage(name:string) {
  if(!name||name!==path.basename(name))return;
  await unlink(path.join(mediaDir,name)).catch(()=>undefined);
}

export function mediaPath(name:string) {
  return path.join(mediaDir,path.basename(name));
}
