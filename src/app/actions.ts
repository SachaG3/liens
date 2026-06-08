"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { clearSession, createSession, requireUser } from "@/lib/auth";
import { createMentionLinks } from "@/lib/mentions";
import { relationTypeOptions } from "@/lib/relation-types";
import { deleteImage, saveImage } from "@/lib/media";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function register(form: FormData) {
  const name = text(form, "name"), email = text(form, "email").toLowerCase(), password = text(form, "password");
  if (!name || !email || password.length < 8) redirect("/register?error=invalid");
  if (await db.user.findUnique({ where: { email } })) redirect("/register?error=exists");
  const user = await db.user.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 12) } });
  await createSession(user.id);
  redirect("/");
}

export async function login(form: FormData) {
  const email = text(form, "email").toLowerCase(), password = text(form, "password");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) redirect("/login?error=invalid");
  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await clearSession();
  redirect("/login");
}

export async function updateAccount(form: FormData) {
  const user = await requireUser();
  const name=text(form,"name"),email=text(form,"email").toLowerCase();
  if(!name||!email)return false;
  const duplicate=await db.user.findFirst({where:{email,id:{not:user.id}}});
  if(duplicate)return false;
  const [motherId,fatherId]=[text(form,"motherId")||null,text(form,"fatherId")||null];
  if(motherId&&fatherId&&motherId===fatherId)return false;
  const parentIds=[motherId,fatherId].filter((id):id is string=>!!id);
  if(parentIds.length!==await db.contact.count({where:{userId:user.id,id:{in:parentIds}}}))return false;
  await db.user.update({where:{id:user.id},data:{name,email,photo:await saveImage(form.get("photo"),user.photo),motherId,fatherId}});
  await db.contactRelationTag.deleteMany({where:{contact:{userId:user.id},tag:{in:["Mère","Père"]}}});
  if(motherId)await db.contactRelationTag.create({data:{contactId:motherId,tag:"Mère"}});
  if(fatherId)await db.contactRelationTag.create({data:{contactId:fatherId,tag:"Père"}});
  revalidatePath("/","layout");revalidatePath("/account");revalidatePath("/map");
  return true;
}

export async function updatePassword(form: FormData) {
  const user=await requireUser();
  const current=text(form,"currentPassword"),password=text(form,"password");
  const stored=await db.user.findUnique({where:{id:user.id}});
  if(!stored||password.length<8||!(await bcrypt.compare(current,stored.passwordHash)))return false;
  await db.user.update({where:{id:user.id},data:{passwordHash:await bcrypt.hash(password,12)}});
  await db.session.deleteMany({where:{userId:user.id,id:{notIn:[]}}});
  await clearSession();
  redirect("/login");
}

export async function addCircle(form: FormData) {
  const user = await requireUser();
  const name = text(form, "name");
  if (!name) return false;
  await db.circle.create({ data: {
    userId: user.id, name, color: text(form, "color") || "#6d5dfc",
    frequency: Number(text(form, "frequency")) || 30, weeklyTarget: Number(text(form, "weeklyTarget")) || 1,
  }});
  revalidatePath("/");
  revalidatePath("/circles");
  return true;
}

export async function updateCircle(form: FormData) {
  const user=await requireUser();const id=text(form,"id"),name=text(form,"name");
  const circle=await db.circle.findFirst({where:{id,userId:user.id}});if(!circle||!name)return false;
  await db.circle.update({where:{id},data:{name,color:text(form,"color")||circle.color,frequency:Number(text(form,"frequency"))||30,weeklyTarget:Number(text(form,"weeklyTarget"))||1}});
  revalidatePath("/");revalidatePath("/circles");revalidatePath("/contacts");return true;
}

export async function addContact(form: FormData) {
  const user = await requireUser();
  const requestedCircleIds = form.getAll("circleIds").map(String);
  const relationTags = normalizedRelationTags(form);
  const circles = await db.circle.findMany({ where: { userId: user.id, id: { in: requestedCircleIds } }, select: { id: true } });
  const firstName = text(form, "firstName");
  if (!firstName) return false;
  const [motherId,fatherId]=await validParents(user.id,text(form,"motherId"),text(form,"fatherId"));
  const contact = await db.contact.create({ data: {
    userId: user.id, firstName, lastName: text(form, "lastName"),
    email: text(form, "email"), phone: text(form, "phone"), company: text(form, "company"),
    notes: text(form, "notes"), photo: await saveImage(form.get("photo")), desiredFrequency: Number(text(form, "frequency")) || 30,
    birthday: text(form, "birthday") ? new Date(text(form, "birthday")) : null,
    followUpStatus:followUpStatus(text(form,"followUpStatus")),statusNote:text(form,"statusNote"),deceasedAt:text(form,"deceasedAt")?new Date(text(form,"deceasedAt")):null,
    motherId, fatherId, gender:familyGender(text(form,"gender")),
    circles: { create: circles.map(({ id: circleId }) => ({ circleId })) },
    relationTags: { create: relationTags.map(tag=>({tag})) },
  }});
  await createMentionLinks(user.id, contact.id, contact.notes);
  revalidatePath("/");
  revalidatePath("/contacts");
  revalidatePath("/map");
  return true;
}

export async function updateContact(form: FormData) {
  const user = await requireUser();
  const id = text(form, "id");
  const contact = await db.contact.findFirst({ where: { id, userId: user.id } });
  if (!contact) return false;
  const requestedCircleIds = form.getAll("circleIds").map(String);
  const relationTags = normalizedRelationTags(form);
  const circles = await db.circle.findMany({ where: { userId: user.id, id: { in: requestedCircleIds } }, select: { id: true } });
  const [motherId,fatherId]=await validParents(user.id,text(form,"motherId"),text(form,"fatherId"),id);
  await db.contact.update({ where: { id }, data: {
    firstName: text(form, "firstName") || contact.firstName, lastName: text(form, "lastName"),
    email: text(form, "email"), phone: text(form, "phone"), company: text(form, "company"), relationType: "",
    notes: text(form, "notes"), photo: await saveImage(form.get("photo"),contact.photo), desiredFrequency: Number(text(form, "frequency")) || 30,
    birthday: text(form, "birthday") ? new Date(text(form, "birthday")) : null,
    followUpStatus:followUpStatus(text(form,"followUpStatus")),statusNote:text(form,"statusNote"),deceasedAt:text(form,"deceasedAt")?new Date(text(form,"deceasedAt")):null,
    motherId, fatherId, gender:familyGender(text(form,"gender")),
    circles: { deleteMany: {}, create: circles.map(({ id: circleId }) => ({ circleId })) },
    relationTags: { deleteMany: {}, create: relationTags.map(tag=>({tag})) },
  }});
  await createMentionLinks(user.id, id, text(form, "notes"));
  revalidatePath("/");
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
  revalidatePath("/map");
  return true;
}

export async function addInteraction(form: FormData) {
  const user = await requireUser();
  const contactId = text(form, "contactId");
  const contact = await db.contact.findFirst({ where: { id: contactId, userId: user.id } });
  if (!contact) return false;
  const note = text(form, "note");
  await db.interaction.create({ data: { contactId, type: text(form, "type"), note } });
  await createMentionLinks(user.id, contactId, note);
  revalidatePath("/");
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contactId}`);
  return true;
}

export async function updateInteraction(form:FormData){
  const user=await requireUser();const id=text(form,"id");
  const interaction=await db.interaction.findFirst({where:{id,contact:{userId:user.id}}});if(!interaction)return false;
  const note=text(form,"note");
  await db.interaction.update({where:{id},data:{type:text(form,"type")||"message",note,happenedAt:text(form,"happenedAt")?new Date(text(form,"happenedAt")):interaction.happenedAt}});
  await createMentionLinks(user.id,interaction.contactId,note);
  revalidatePath(`/contacts/${interaction.contactId}`);return true;
}

export async function addQuickInteraction(form: FormData) {
  const user = await requireUser();
  const contactId = text(form, "contactId");
  const contact = await db.contact.findFirst({ where: { id: contactId, userId: user.id } });
  if (!contact || contact.followUpStatus!=="active") return;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const alreadyLogged = await db.interaction.findFirst({ where: { contactId, happenedAt: { gte: today }, note: "Contacté aujourd’hui" } });
  if (alreadyLogged) return;
  await db.interaction.create({ data: { contactId, type: "message", note: "Contacté aujourd’hui" } });
  revalidatePath("/");
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contactId}`);
}

export async function addJournalEntry(form: FormData) {
  const user=await requireUser();const contactId=text(form,"contactId");const title=text(form,"title");
  const contact=await db.contact.findFirst({where:{id:contactId,userId:user.id}});if(!contact||!title)return false;
  await db.journalEntry.create({data:{contactId,title,type:text(form,"type")||"note",content:text(form,"content"),happenedAt:text(form,"happenedAt")?new Date(text(form,"happenedAt")):new Date(),private:form.get("private")==="on"}});
  revalidatePath(`/contacts/${contactId}`);return true;
}

export async function updateJournalEntry(form:FormData){
  const user=await requireUser();const id=text(form,"id"),title=text(form,"title");
  const item=await db.journalEntry.findFirst({where:{id,contact:{userId:user.id}}});if(!item||!title)return false;
  await db.journalEntry.update({where:{id},data:{title,type:text(form,"type")||"note",content:text(form,"content"),happenedAt:text(form,"happenedAt")?new Date(text(form,"happenedAt")):item.happenedAt,private:form.get("private")==="on"}});
  revalidatePath(`/contacts/${item.contactId}`);return true;
}

export async function deleteJournalEntry(form:FormData){
  const user=await requireUser();const item=await db.journalEntry.findFirst({where:{id:text(form,"id"),contact:{userId:user.id}}});if(!item)return;
  await db.journalEntry.delete({where:{id:item.id}});revalidatePath(`/contacts/${item.contactId}`);
}

export async function addImportantDate(form:FormData){
  const user=await requireUser();const contactId=text(form,"contactId"),title=text(form,"title"),date=text(form,"date");
  const contact=await db.contact.findFirst({where:{id:contactId,userId:user.id}});if(!contact||!title||!date)return false;
  await db.importantDate.create({data:{contactId,title,date:new Date(date),recurring:form.get("recurring")==="on",remindDays:Number(text(form,"remindDays"))||7}});
  revalidatePath(`/contacts/${contactId}`);revalidatePath("/reminders");return true;
}

export async function updateImportantDate(form:FormData){
  const user=await requireUser();const id=text(form,"id"),title=text(form,"title"),date=text(form,"date");
  const item=await db.importantDate.findFirst({where:{id,contact:{userId:user.id}}});if(!item||!title||!date)return false;
  await db.importantDate.update({where:{id},data:{title,date:new Date(date),recurring:form.get("recurring")==="on",remindDays:Number(text(form,"remindDays"))||7}});
  revalidatePath(`/contacts/${item.contactId}`);revalidatePath("/reminders");return true;
}

export async function deleteImportantDate(form:FormData){
  const user=await requireUser();const item=await db.importantDate.findFirst({where:{id:text(form,"id"),contact:{userId:user.id}}});if(!item)return;
  await db.importantDate.delete({where:{id:item.id}});revalidatePath(`/contacts/${item.contactId}`);revalidatePath("/reminders");
}

export async function addConversationItem(form:FormData){
  const user=await requireUser();const contactId=text(form,"contactId"),title=text(form,"title");
  const contact=await db.contact.findFirst({where:{id:contactId,userId:user.id}});if(!contact||!title)return false;
  await db.conversationItem.create({data:{contactId,title,kind:text(form,"kind")||"topic",detail:text(form,"detail"),private:form.get("private")==="on"}});
  revalidatePath(`/contacts/${contactId}`);return true;
}

export async function toggleConversationItem(form:FormData){
  const user=await requireUser();const item=await db.conversationItem.findFirst({where:{id:text(form,"id"),contact:{userId:user.id}}});if(!item)return;
  await db.conversationItem.update({where:{id:item.id},data:{done:!item.done}});revalidatePath(`/contacts/${item.contactId}`);
}

export async function updateConversationItem(form:FormData){
  const user=await requireUser();const id=text(form,"id"),title=text(form,"title");
  const item=await db.conversationItem.findFirst({where:{id,contact:{userId:user.id}}});if(!item||!title)return false;
  await db.conversationItem.update({where:{id},data:{title,kind:text(form,"kind")||"topic",detail:text(form,"detail"),private:form.get("private")==="on"}});
  revalidatePath(`/contacts/${item.contactId}`);return true;
}

export async function deleteConversationItem(form:FormData){
  const user=await requireUser();const item=await db.conversationItem.findFirst({where:{id:text(form,"id"),contact:{userId:user.id}}});if(!item)return;
  await db.conversationItem.delete({where:{id:item.id}});revalidatePath(`/contacts/${item.contactId}`);
}

export async function addCustomField(form:FormData){
  const user=await requireUser();const contactId=text(form,"contactId"),label=text(form,"label"),value=text(form,"value");
  const contact=await db.contact.findFirst({where:{id:contactId,userId:user.id}});if(!contact||!label||!value)return false;
  await db.customField.create({data:{contactId,label,value,private:form.get("private")==="on"}});revalidatePath(`/contacts/${contactId}`);return true;
}

export async function updateCustomField(form:FormData){
  const user=await requireUser();const id=text(form,"id"),label=text(form,"label"),value=text(form,"value");
  const item=await db.customField.findFirst({where:{id,contact:{userId:user.id}}});if(!item||!label||!value)return false;
  await db.customField.update({where:{id},data:{label,value,private:form.get("private")==="on"}});revalidatePath(`/contacts/${item.contactId}`);return true;
}

export async function deleteCustomField(form:FormData){
  const user=await requireUser();const item=await db.customField.findFirst({where:{id:text(form,"id"),contact:{userId:user.id}}});if(!item)return;
  await db.customField.delete({where:{id:item.id}});revalidatePath(`/contacts/${item.contactId}`);
}

export async function addContactRelation(form:FormData){
  const user=await requireUser();const sourceId=text(form,"contactId"),targetId=text(form,"targetId");if(!sourceId||!targetId||sourceId===targetId)return false;
  const count=await db.contact.count({where:{userId:user.id,id:{in:[sourceId,targetId]}}});if(count!==2)return false;
  const [fromContactId,toContactId]=[sourceId,targetId].sort();
  await db.contactLink.upsert({where:{fromContactId_toContactId:{fromContactId,toContactId}},create:{fromContactId,toContactId,source:"manual",label:text(form,"label"),note:text(form,"note")},update:{source:"manual",label:text(form,"label"),note:text(form,"note")}});
  revalidatePath(`/contacts/${sourceId}`);revalidatePath(`/contacts/${targetId}`);revalidatePath("/map");return true;
}

export async function updateContactRelation(form:FormData){
  const user=await requireUser();const id=text(form,"id");
  const link=await db.contactLink.findFirst({where:{id,OR:[{fromContact:{userId:user.id}},{toContact:{userId:user.id}}]}});
  if(!link)return false;
  await db.contactLink.update({where:{id},data:{label:text(form,"label"),note:text(form,"note")}});
  revalidatePath(`/contacts/${link.fromContactId}`);revalidatePath(`/contacts/${link.toContactId}`);revalidatePath("/map");return true;
}

function familyGender(value:string){return ["woman","man","other"].includes(value)?value:""}

async function validParents(userId:string,motherValue:string,fatherValue:string,contactId?:string):Promise<[string|null,string|null]> {
  const motherId=motherValue||null,fatherId=fatherValue||null;
  if((contactId&&(motherId===contactId||fatherId===contactId))||(motherId&&fatherId&&motherId===fatherId))return [null,null];
  const ids=[motherId,fatherId].filter((id):id is string=>!!id);
  const allowed=await db.contact.findMany({where:{userId,id:{in:ids}},select:{id:true}});
  const set=new Set(allowed.map(item=>item.id));
  let mother=motherId&&set.has(motherId)?motherId:null,father=fatherId&&set.has(fatherId)?fatherId:null;
  if(contactId){
    if(mother&&await hasAncestor(mother,contactId))mother=null;
    if(father&&await hasAncestor(father,contactId))father=null;
  }
  return [mother,father];
}

async function hasAncestor(startId:string,targetId:string) {
  const seen=new Set<string>();let current=[startId];
  while(current.length){
    const rows=await db.contact.findMany({where:{id:{in:current}},select:{motherId:true,fatherId:true}});
    const next=rows.flatMap(row=>[row.motherId,row.fatherId]).filter((id):id is string=>!!id&&!seen.has(id));
    if(next.includes(targetId))return true;
    next.forEach(id=>seen.add(id));current=next;
  }
  return false;
}

export async function deleteContactRelation(form:FormData){
  const user=await requireUser();const link=await db.contactLink.findFirst({where:{id:text(form,"id"),OR:[{fromContact:{userId:user.id}},{toContact:{userId:user.id}}]}});if(!link)return;
  await db.contactLink.delete({where:{id:link.id}});revalidatePath(`/contacts/${link.fromContactId}`);revalidatePath(`/contacts/${link.toContactId}`);revalidatePath("/map");
}

export async function addDebt(form:FormData){
  const user=await requireUser();
  const contactId=text(form,"contactId"),title=text(form,"title"),direction=text(form,"direction")==="i_owe"?"i_owe":"owed_to_me";
  const amount=Number(text(form,"amount").replace(",","."));
  const contact=await db.contact.findFirst({where:{id:contactId,userId:user.id}});
  if(!contact||!title||!Number.isFinite(amount)||amount<=0)return false;
  await db.debt.create({data:{userId:user.id,contactId,title,direction,amount,currency:text(form,"currency")||"EUR",note:text(form,"note"),dueAt:text(form,"dueAt")?new Date(text(form,"dueAt")):null}});
  revalidatePath("/finances");revalidatePath(`/contacts/${contactId}`);return true;
}

export async function updateDebt(form:FormData){
  const user=await requireUser();const id=text(form,"id"),title=text(form,"title"),amount=Number(text(form,"amount").replace(",","."));
  const debt=await db.debt.findFirst({where:{id,userId:user.id}});if(!debt||!title||!Number.isFinite(amount)||amount<=0)return false;
  const contactId=text(form,"contactId");const contact=await db.contact.findFirst({where:{id:contactId,userId:user.id}});if(!contact)return false;
  await db.debt.update({where:{id},data:{contactId,title,amount,direction:text(form,"direction")==="i_owe"?"i_owe":"owed_to_me",currency:text(form,"currency")||"EUR",note:text(form,"note"),dueAt:text(form,"dueAt")?new Date(text(form,"dueAt")):null}});
  revalidatePath("/finances");revalidatePath(`/contacts/${debt.contactId}`);revalidatePath(`/contacts/${contactId}`);return true;
}

export async function toggleDebt(form:FormData){
  const user=await requireUser();const debt=await db.debt.findFirst({where:{id:text(form,"id"),userId:user.id}});if(!debt)return;
  await db.debt.update({where:{id:debt.id},data:{settled:!debt.settled}});revalidatePath("/finances");revalidatePath(`/contacts/${debt.contactId}`);
}

export async function deleteDebt(form:FormData){
  const user=await requireUser();const debt=await db.debt.findFirst({where:{id:text(form,"id"),userId:user.id}});if(!debt)return;
  await db.debt.delete({where:{id:debt.id}});revalidatePath("/finances");revalidatePath(`/contacts/${debt.contactId}`);
}

export async function addPet(form:FormData){
  const user=await requireUser();const name=text(form,"name");if(!name)return false;
  const requestedOwnerIds=[...new Set(form.getAll("ownerIds").map(String))];
  const owners=await db.contact.findMany({where:{userId:user.id,id:{in:requestedOwnerIds}},select:{id:true}});
  await db.pet.create({data:{userId:user.id,name,species:text(form,"species")||"Autre",breed:text(form,"breed"),photo:await saveImage(form.get("photo")),birthday:text(form,"birthday")?new Date(text(form,"birthday")):null,notes:text(form,"notes"),owners:{create:owners.map(({id:contactId})=>({contactId}))}}});
  revalidatePath("/pets");return true;
}

export async function updatePet(form:FormData){
  const user=await requireUser();const id=text(form,"id"),name=text(form,"name");
  const pet=await db.pet.findFirst({where:{id,userId:user.id}});if(!pet||!name)return false;
  const requestedOwnerIds=[...new Set(form.getAll("ownerIds").map(String))];
  const owners=await db.contact.findMany({where:{userId:user.id,id:{in:requestedOwnerIds}},select:{id:true}});
  await db.pet.update({where:{id},data:{name,species:text(form,"species")||"Autre",breed:text(form,"breed"),photo:await saveImage(form.get("photo"),pet.photo),birthday:text(form,"birthday")?new Date(text(form,"birthday")):null,notes:text(form,"notes"),owners:{deleteMany:{},create:owners.map(({id:contactId})=>({contactId}))}}});
  revalidatePath("/pets");return true;
}

export async function deletePet(form:FormData){
  const user=await requireUser();const pet=await db.pet.findFirst({where:{id:text(form,"id"),userId:user.id}});if(!pet)return;
  await db.pet.delete({where:{id:pet.id}});await deleteImage(pet.photo);revalidatePath("/pets");
}

export async function addReminder(form: FormData) {
  const user = await requireUser();
  const contactId = text(form, "contactId");
  const kind = reminderKind(text(form, "kind"));
  const contact = await db.contact.findFirst({ where: { id: contactId, userId: user.id } });
  if (!contact || !text(form, "title") || !text(form, "dueAt") || (kind==="contact"&&contact.followUpStatus!=="active")) return false;
  await db.reminder.create({ data: { contactId, kind, title: text(form, "title"), dueAt: new Date(text(form, "dueAt")) } });
  revalidatePath("/");
  revalidatePath("/reminders");
  revalidatePath(`/contacts/${contactId}`);
  return true;
}

export async function toggleReminder(form: FormData) {
  const user = await requireUser();
  const id = text(form, "id");
  const reminder = await db.reminder.findFirst({ where: { id, contact: { userId: user.id } } });
  if (reminder) await db.reminder.update({ where: { id }, data: { done: !reminder.done } });
  revalidatePath("/");
  revalidatePath("/reminders");
  if (reminder) revalidatePath(`/contacts/${reminder.contactId}`);
}

export async function updateReminder(form: FormData) {
  const user = await requireUser();
  const id = text(form, "id");
  const reminder = await db.reminder.findFirst({ where: { id, contact: { userId: user.id } } });
  if (!reminder) return false;
  const title = text(form, "title");
  const dueAt = text(form, "dueAt");
  if (!title || !dueAt) return false;
  await db.reminder.update({ where: { id }, data: { kind: reminderKind(text(form, "kind")), title, dueAt: new Date(dueAt) } });
  revalidatePath("/");
  revalidatePath("/reminders");
  revalidatePath(`/contacts/${reminder.contactId}`);
  return true;
}

export async function snoozeReminder(form: FormData) {
  const user = await requireUser();
  const id = text(form, "id");
  const reminder = await db.reminder.findFirst({ where: { id, contact: { userId: user.id } } });
  if (!reminder) return;
  const dueAt = new Date(Math.max(Date.now(), reminder.dueAt.getTime()) + 7 * 86_400_000);
  await db.reminder.update({ where: { id }, data: { dueAt, done: false } });
  revalidatePath("/");
  revalidatePath("/reminders");
  revalidatePath(`/contacts/${reminder.contactId}`);
}

export async function deleteReminder(form: FormData) {
  const user = await requireUser();
  const id = text(form, "id");
  const reminder = await db.reminder.findFirst({ where: { id, contact: { userId: user.id } } });
  if (!reminder) return;
  await db.reminder.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/reminders");
  revalidatePath(`/contacts/${reminder.contactId}`);
}

function reminderKind(value:string) {
  return ["contact","no_contact","other"].includes(value)?value:"contact";
}

function followUpStatus(value:string) {
  return ["active","no_contact","deceased"].includes(value)?value:"active";
}

function normalizedRelationTags(form:FormData) {
  return [...new Set(form.getAll("relationTags").map(String))];
}

export async function deleteContact(form: FormData) {
  const user = await requireUser();
  const contact=await db.contact.findFirst({where:{id:text(form,"id"),userId:user.id}});if(!contact)return;
  await db.contact.delete({where:{id:contact.id}});await deleteImage(contact.photo);
  revalidatePath("/");
  revalidatePath("/contacts");
  redirect("/contacts");
}

export async function deleteCircle(form: FormData) {
  const user = await requireUser();
  await db.circle.deleteMany({ where: { id: text(form, "id"), userId: user.id } });
  revalidatePath("/");
  revalidatePath("/circles");
  revalidatePath("/contacts");
}

export async function deleteInteraction(form: FormData) {
  const user = await requireUser();
  const id = text(form, "id");
  const interaction = await db.interaction.findFirst({ where: { id, contact: { userId: user.id } } });
  if (!interaction) return;
  await db.interaction.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath(`/contacts/${interaction.contactId}`);
}

export async function addGiftIdea(form: FormData) {
  const user = await requireUser();
  const contactId = text(form, "contactId");
  const contact = await db.contact.findFirst({ where: { id: contactId, userId: user.id } });
  const title = text(form, "title");
  if (!contact || !title) return false;
  const rawPrice = text(form, "price").replace(",", ".");
  await db.giftIdea.create({ data: { contactId, title, url: text(form, "url"), note: text(form, "note"), price: rawPrice ? Number(rawPrice) : null } });
  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/gifts");
  return true;
}

export async function updateGiftIdea(form:FormData){
  const user=await requireUser();const id=text(form,"id"),title=text(form,"title");
  const gift=await db.giftIdea.findFirst({where:{id,contact:{userId:user.id}}});if(!gift||!title)return false;
  const rawPrice=text(form,"price").replace(",",".");
  await db.giftIdea.update({where:{id},data:{title,url:text(form,"url"),note:text(form,"note"),price:rawPrice?Number(rawPrice):null}});
  revalidatePath(`/contacts/${gift.contactId}`);revalidatePath("/gifts");return true;
}

export async function toggleGiftIdea(form: FormData) {
  const user = await requireUser();
  const id = text(form, "id");
  const gift = await db.giftIdea.findFirst({ where: { id, contact: { userId: user.id } } });
  if (!gift) return;
  await db.giftIdea.update({ where: { id }, data: { purchased: !gift.purchased } });
  revalidatePath(`/contacts/${gift.contactId}`);
  revalidatePath("/gifts");
}

export async function deleteGiftIdea(form: FormData) {
  const user = await requireUser();
  const id = text(form, "id");
  const gift = await db.giftIdea.findFirst({ where: { id, contact: { userId: user.id } } });
  if (!gift) return;
  await db.giftIdea.delete({ where: { id } });
  revalidatePath(`/contacts/${gift.contactId}`);
  revalidatePath("/gifts");
}

export async function importContacts(form: FormData) {
  const user = await requireUser();
  const contacts = JSON.parse(text(form, "contacts")) as Array<{ firstName:string;lastName:string;email:string;phone:string;company:string;birthday:string;notes:string;sourceId:string;fileName:string;choice?:{selected:boolean;action:"create"|"merge"|"skip";targetId?:string;circleIds:string[];relationTags:string[]} }>;
  const requestedCircleIds=[...new Set(contacts.flatMap(contact=>contact.choice?.circleIds??[]))];
  const circles=await db.circle.findMany({where:{userId:user.id,id:{in:requestedCircleIds}},select:{id:true}});
  const allowedCircleIds=new Set(circles.map(circle=>circle.id));
  const allowedRelationTags=new Set<string>(relationTypeOptions());
  for (const contact of contacts.slice(0,5000)) {
    const choice=contact.choice;
    if(!choice?.selected||choice.action==="skip")continue;
    const circleIds=[...new Set(choice.circleIds)].filter(id=>allowedCircleIds.has(id));
    const relationTags=[...new Set(choice.relationTags.map(tag=>tag.trim()))].filter(tag=>allowedRelationTags.has(tag));
    const data={firstName:contact.firstName.trim()||contact.lastName.trim()||"Sans nom",lastName:contact.firstName.trim()?contact.lastName.trim():"",email:contact.email.trim(),phone:contact.phone.trim(),company:contact.company.trim(),notes:contact.notes.trim(),birthday:contact.birthday&&!Number.isNaN(new Date(contact.birthday).getTime())?new Date(contact.birthday):null,source:contact.fileName.toLowerCase().endsWith(".csv")?"csv":"vcard",sourceId:contact.sourceId.trim()};
    if(choice.action==="merge"&&choice.targetId){
      const existing=await db.contact.findFirst({where:{id:choice.targetId,userId:user.id}});
      if(!existing)continue;
      await db.contact.update({where:{id:existing.id},data:{firstName:existing.firstName||data.firstName,lastName:existing.lastName||data.lastName,email:existing.email||data.email,phone:existing.phone||data.phone,company:existing.company||data.company,notes:existing.notes||data.notes,birthday:existing.birthday||data.birthday,sourceId:existing.sourceId||data.sourceId}});
      for(const circleId of circleIds)await db.circleMember.upsert({where:{contactId_circleId:{contactId:existing.id,circleId}},create:{contactId:existing.id,circleId},update:{}});
      for(const tag of relationTags)await db.contactRelationTag.upsert({where:{contactId_tag:{contactId:existing.id,tag}},create:{contactId:existing.id,tag},update:{}});
    }else{
      await db.contact.create({data:{...data,userId:user.id,circles:{create:circleIds.map(circleId=>({circleId}))},relationTags:{create:relationTags.map(tag=>({tag}))}}});
    }
  }
  revalidatePath("/");
  revalidatePath("/contacts");
  revalidatePath("/circles");
  redirect("/contacts");
}
