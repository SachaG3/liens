import nameDays from "@/data/name-days.fr.json";
import manualNameDayOptions from "@/data/name-day-options.fr.json";

export type DateContact={
  id:string;firstName:string;nameDayReference:string;gender:string;motherId:string|null;fatherId:string|null;followUpStatus:string;
  relationTags:Array<{tag:string}>;
};
export type DateUser={motherId:string|null;fatherId:string|null};
export type ImportantDateSuggestion={contactId:string;sourceKey:string;title:string;date:Date;reason:string;remindDays:number};
type StoredImportantDate={date:Date;recurring:boolean;sourceKey?:string|null};

const partnerTags=new Set(["Copain","Copine","Partenaire","Mari","Femme","Fiancé","Fiancée"]);
const NAME_DAY_SIMILARITY_THRESHOLD=.75;
export const nameDayOptions=(manualNameDayOptions as Array<{name:string;value:string;date:string}>).sort((a,b)=>a.name.localeCompare(b.name,"fr")||a.date.localeCompare(b.date));

export function importantDateSuggestions(user:DateUser,contacts:DateContact[],year=new Date().getFullYear()) {
  const map=new Map(contacts.map(contact=>[contact.id,contact]));
  const familyRoles=familyRolesFromUser(user,map);
  const suggestions:ImportantDateSuggestion[]=[];
  for(const contact of contacts){
    if(contact.followUpStatus==="deceased")continue;
    const add=(sourceKey:string,title:string,date:Date,reason:string,remindDays=7)=>suggestions.push({contactId:contact.id,sourceKey,title,date,reason,remindDays});
    const reference=manualNameDayReference(contact.nameDayReference,year);
    const nameDay=reference?.date??nameDayFor(contact.firstName,year);
    if(nameDay)add("name-day",`Fête de ${contact.firstName}`,nameDay,reference?`Lié manuellement à ${reference.name}`:`Calendrier local des saints · ${contact.firstName}`);
    const role=familyRoles.get(contact.id);
    if(role==="mother")add("mothers-day","Fête des mères",mothersDay(year),"Déduit de votre arbre généalogique",14);
    if(role==="father")add("fathers-day","Fête des pères",nthWeekday(year,5,0,3),"Déduit de votre arbre généalogique",14);
    if(role==="grandmother")add("grandmothers-day","Fête des grands-mères",nthWeekday(year,2,0,1),"Déduit de votre arbre généalogique",14);
    if(role==="grandfather")add("grandfathers-day","Fête des grands-pères",nthWeekday(year,9,0,1),"Déduit de votre arbre généalogique",14);
    if(contact.relationTags.some(({tag})=>partnerTags.has(tag)))add("valentines-day","Saint-Valentin",localDate(year,1,14),"Déduit de votre lien amoureux",14);
  }
  return suggestions;
}

export function familyRolesFromUser(user:DateUser,contacts:Map<string,DateContact>) {
  const roles=new Map<string,"mother"|"father"|"grandmother"|"grandfather">();
  if(user.motherId)roles.set(user.motherId,"mother");
  if(user.fatherId)roles.set(user.fatherId,"father");
  for(const parentId of [user.motherId,user.fatherId]){
    const parent=parentId?contacts.get(parentId):undefined;
    if(parent?.motherId)roles.set(parent.motherId,"grandmother");
    if(parent?.fatherId)roles.set(parent.fatherId,"grandfather");
  }
  return roles;
}

export function nameDayFor(firstName:string,year:number) {
  const normalized=normalizeFirstName(firstName);
  const matches=Object.entries(nameDays as Record<string,string>)
    .map(([name,date])=>({date,score:nameSimilarity(normalized,normalizeFirstName(name))}))
    .filter(match=>match.score>NAME_DAY_SIMILARITY_THRESHOLD)
    .sort((a,b)=>b.score-a.score);
  const best=matches[0];
  if(!best||matches.some(match=>match.score===best.score&&match.date!==best.date))return null;
  const value=best.date;
  if(!value)return null;
  const [month,day]=value.split("-").map(Number);
  return localDate(year,month-1,day);
}

export function validNameDayReference(value:string) {
  if(nameDayOptions.some(option=>option.value===value))return value;
  const normalized=normalizeFirstName(value);
  const legacy=nameDayOptions.find(option=>normalizeFirstName(option.name)===normalized);
  return legacy?.value??"";
}

export function nameSimilarity(firstName:string,candidate:string) {
  const left=phoneticName(normalizeFirstName(firstName));
  const right=phoneticName(normalizeFirstName(candidate));
  if(!left||!right)return 0;
  return 1-levenshteinDistance(left,right)/Math.max(left.length,right.length);
}

export function nextImportantDate(item:StoredImportantDate,from=new Date()) {
  const year=from.getFullYear();
  if(item.sourceKey){
    const calculated=dateForSourceKey(item.sourceKey,year)??localDate(year,item.date.getMonth(),item.date.getDate());
    const next=dateForSourceKey(item.sourceKey,year+1)??localDate(year+1,item.date.getMonth(),item.date.getDate());
    return calculated>=startOfDay(from)?calculated:next;
  }
  if(!item.recurring)return item.date;
  const current=localDate(year,item.date.getMonth(),item.date.getDate());
  return current>=startOfDay(from)?current:localDate(year+1,item.date.getMonth(),item.date.getDate());
}

export function dateForSourceKey(sourceKey:string,year:number) {
  if(sourceKey==="mothers-day")return mothersDay(year);
  if(sourceKey==="fathers-day")return nthWeekday(year,5,0,3);
  if(sourceKey==="grandmothers-day")return nthWeekday(year,2,0,1);
  if(sourceKey==="grandfathers-day")return nthWeekday(year,9,0,1);
  if(sourceKey==="valentines-day")return localDate(year,1,14);
  return null;
}

export async function frenchPublicHolidays(year:number) {
  try{
    const response=await fetch(`https://calendrier.api.gouv.fr/jours-feries/metropole/${year}.json`,{next:{revalidate:86_400}});
    if(!response.ok)throw new Error("holiday provider unavailable");
    const data=await response.json() as Record<string,string>;
    return Object.entries(data).map(([date,title])=>({date:new Date(`${date}T12:00:00`),title})).sort((a,b)=>a.date.getTime()-b.date.getTime());
  }catch{
    return [{date:localDate(year,0,1),title:"Jour de l’an"},{date:localDate(year,4,1),title:"Fête du Travail"},{date:localDate(year,4,8),title:"Victoire 1945"},{date:localDate(year,6,14),title:"Fête nationale"},{date:localDate(year,7,15),title:"Assomption"},{date:localDate(year,10,1),title:"Toussaint"},{date:localDate(year,10,11),title:"Armistice"},{date:localDate(year,11,25),title:"Noël"}];
  }
}

export async function nominisForDate(date:Date) {
  if(process.env.NOMINIS_ENABLED!=="true")return [];
  try{
    const response=await fetch(`https://nominis.cef.fr/json/nominis.php?jour=${date.getDate()}&mois=${date.getMonth()+1}&annee=${date.getFullYear()}`,{next:{revalidate:604_800}});
    if(!response.ok)return [];
    const data=await response.json();
    return [...new Set(findNominisNames(data))];
  }catch{return []}
}

function findNominisNames(value:unknown):string[]{
  if(Array.isArray(value))return value.flatMap(findNominisNames);
  if(value&&typeof value==="object")return Object.entries(value).flatMap(([key,item])=>{
    if(["majeurs","mineurs","majeur"].includes(key.toLowerCase())&&item&&typeof item==="object")return Object.keys(item);
    return key.toLowerCase().includes("nom")&&typeof item==="string"?[item]:findNominisNames(item);
  });
  return [];
}

function mothersDay(year:number){
  const lastSunday=lastWeekday(year,4,0);
  return isPentecost(lastSunday)?nthWeekday(year,5,0,1):lastSunday;
}
function isPentecost(date:Date){const easter=easterSunday(date.getFullYear());return sameDay(date,new Date(easter.getFullYear(),easter.getMonth(),easter.getDate()+49))}
function easterSunday(year:number){const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=(h+l-7*m+114)%31+1;return localDate(year,month-1,day)}
function nthWeekday(year:number,month:number,weekday:number,n:number){const first=localDate(year,month,1);return localDate(year,month,1+((7+weekday-first.getDay())%7)+(n-1)*7)}
function lastWeekday(year:number,month:number,weekday:number){const last=localDate(year,month+1,0);return localDate(year,month,last.getDate()-((7+last.getDay()-weekday)%7))}
function localDate(year:number,month:number,day:number){return new Date(year,month,day,12)}
function startOfDay(date:Date){return new Date(date.getFullYear(),date.getMonth(),date.getDate())}
function sameDay(a:Date,b:Date){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()}
function manualNameDayReference(value:string,year:number){
  const option=nameDayOptions.find(item=>item.value===value)??nameDayOptions.find(item=>normalizeFirstName(item.name)===normalizeFirstName(value));
  if(!option)return null;
  const [month,day]=option.date.split("-").map(Number);
  return {name:option.name,date:localDate(year,month-1,day)};
}
function normalizeFirstName(value:string){return value.normalize("NFD").replace(/\p{Diacritic}/gu,"").toLowerCase().split(/[\s-]/)[0].replace(/[^a-z]/g,"")}
function phoneticName(value:string){return value.replace(/(?:ch|sh)/g,"x")}
function levenshteinDistance(left:string,right:string){
  const previous=Array.from({length:right.length+1},(_,index)=>index);
  for(let row=1;row<=left.length;row++){
    const current=[row];
    for(let column=1;column<=right.length;column++)current[column]=Math.min(current[column-1]+1,previous[column]+1,previous[column-1]+(left[row-1]===right[column-1]?0:1));
    previous.splice(0,previous.length,...current);
  }
  return previous[right.length];
}
