"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { clearSession, createSession, requireUser } from "@/lib/auth";
import { createMentionLinks } from "@/lib/mentions";

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

export async function addContact(form: FormData) {
  const user = await requireUser();
  const requestedCircleIds = form.getAll("circleIds").map(String);
  const relationTags = [...new Set(form.getAll("relationTags").map(String))];
  const circles = await db.circle.findMany({ where: { userId: user.id, id: { in: requestedCircleIds } }, select: { id: true } });
  const firstName = text(form, "firstName");
  if (!firstName) return false;
  const contact = await db.contact.create({ data: {
    userId: user.id, firstName, lastName: text(form, "lastName"),
    email: text(form, "email"), phone: text(form, "phone"), company: text(form, "company"),
    notes: text(form, "notes"), desiredFrequency: Number(text(form, "frequency")) || 30,
    birthday: text(form, "birthday") ? new Date(text(form, "birthday")) : null,
    circles: { create: circles.map(({ id: circleId }) => ({ circleId })) },
    relationTags: { create: relationTags.map(tag=>({tag})) },
  }});
  await createMentionLinks(user.id, contact.id, contact.notes);
  revalidatePath("/");
  revalidatePath("/contacts");
  return true;
}

export async function updateContact(form: FormData) {
  const user = await requireUser();
  const id = text(form, "id");
  const contact = await db.contact.findFirst({ where: { id, userId: user.id } });
  if (!contact) return false;
  const requestedCircleIds = form.getAll("circleIds").map(String);
  const relationTags = [...new Set(form.getAll("relationTags").map(String))];
  const circles = await db.circle.findMany({ where: { userId: user.id, id: { in: requestedCircleIds } }, select: { id: true } });
  await db.contact.update({ where: { id }, data: {
    firstName: text(form, "firstName") || contact.firstName, lastName: text(form, "lastName"),
    email: text(form, "email"), phone: text(form, "phone"), company: text(form, "company"), relationType: "",
    notes: text(form, "notes"), desiredFrequency: Number(text(form, "frequency")) || 30,
    birthday: text(form, "birthday") ? new Date(text(form, "birthday")) : null,
    circles: { deleteMany: {}, create: circles.map(({ id: circleId }) => ({ circleId })) },
    relationTags: { deleteMany: {}, create: relationTags.map(tag=>({tag})) },
  }});
  await createMentionLinks(user.id, id, text(form, "notes"));
  revalidatePath("/");
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
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

export async function addQuickInteraction(form: FormData) {
  const user = await requireUser();
  const contactId = text(form, "contactId");
  const contact = await db.contact.findFirst({ where: { id: contactId, userId: user.id } });
  if (!contact) return;
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

export async function addImportantDate(form:FormData){
  const user=await requireUser();const contactId=text(form,"contactId"),title=text(form,"title"),date=text(form,"date");
  const contact=await db.contact.findFirst({where:{id:contactId,userId:user.id}});if(!contact||!title||!date)return false;
  await db.importantDate.create({data:{contactId,title,date:new Date(date),recurring:form.get("recurring")==="on",remindDays:Number(text(form,"remindDays"))||7}});
  revalidatePath(`/contacts/${contactId}`);revalidatePath("/reminders");return true;
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

export async function addCustomField(form:FormData){
  const user=await requireUser();const contactId=text(form,"contactId"),label=text(form,"label"),value=text(form,"value");
  const contact=await db.contact.findFirst({where:{id:contactId,userId:user.id}});if(!contact||!label||!value)return false;
  await db.customField.create({data:{contactId,label,value,private:form.get("private")==="on"}});revalidatePath(`/contacts/${contactId}`);return true;
}

export async function addContactRelation(form:FormData){
  const user=await requireUser();const sourceId=text(form,"contactId"),targetId=text(form,"targetId");if(!sourceId||!targetId||sourceId===targetId)return false;
  const count=await db.contact.count({where:{userId:user.id,id:{in:[sourceId,targetId]}}});if(count!==2)return false;
  const [fromContactId,toContactId]=[sourceId,targetId].sort();
  await db.contactLink.upsert({where:{fromContactId_toContactId:{fromContactId,toContactId}},create:{fromContactId,toContactId,source:"manual",label:text(form,"label"),note:text(form,"note")},update:{source:"manual",label:text(form,"label"),note:text(form,"note")}});
  revalidatePath(`/contacts/${sourceId}`);revalidatePath(`/contacts/${targetId}`);revalidatePath("/map");return true;
}

export async function addReminder(form: FormData) {
  const user = await requireUser();
  const contactId = text(form, "contactId");
  const contact = await db.contact.findFirst({ where: { id: contactId, userId: user.id } });
  if (!contact || !text(form, "title") || !text(form, "dueAt")) return false;
  await db.reminder.create({ data: { contactId, title: text(form, "title"), dueAt: new Date(text(form, "dueAt")) } });
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
  await db.reminder.update({ where: { id }, data: { title, dueAt: new Date(dueAt) } });
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

export async function deleteContact(form: FormData) {
  const user = await requireUser();
  await db.contact.deleteMany({ where: { id: text(form, "id"), userId: user.id } });
  revalidatePath("/");
  revalidatePath("/contacts");
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
  const contacts = JSON.parse(text(form, "contacts")) as Array<{ firstName:string;lastName:string;email:string;phone:string;company:string;birthday:string;notes:string;sourceId:string;fileName:string;decision:{action:"create"|"merge"|"skip";targetId?:string} }>;
  const requestedCircleIds=form.getAll("circleIds").map(String);
  const circles=await db.circle.findMany({where:{userId:user.id,id:{in:requestedCircleIds}},select:{id:true}});
  for (const contact of contacts.slice(0,5000)) {
    if(contact.decision.action==="skip")continue;
    const data={firstName:contact.firstName.trim()||contact.lastName.trim()||"Sans nom",lastName:contact.firstName.trim()?contact.lastName.trim():"",email:contact.email.trim(),phone:contact.phone.trim(),company:contact.company.trim(),notes:contact.notes.trim(),birthday:contact.birthday&&!Number.isNaN(new Date(contact.birthday).getTime())?new Date(contact.birthday):null,source:contact.fileName.toLowerCase().endsWith(".csv")?"csv":"vcard",sourceId:contact.sourceId.trim()};
    if(contact.decision.action==="merge"&&contact.decision.targetId){
      const existing=await db.contact.findFirst({where:{id:contact.decision.targetId,userId:user.id}});
      if(!existing)continue;
      await db.contact.update({where:{id:existing.id},data:{firstName:existing.firstName||data.firstName,lastName:existing.lastName||data.lastName,email:existing.email||data.email,phone:existing.phone||data.phone,company:existing.company||data.company,notes:existing.notes||data.notes,birthday:existing.birthday||data.birthday,sourceId:existing.sourceId||data.sourceId}});
      for(const {id:circleId} of circles)await db.circleMember.upsert({where:{contactId_circleId:{contactId:existing.id,circleId}},create:{contactId:existing.id,circleId},update:{}});
    }else{
      await db.contact.create({data:{...data,userId:user.id,circles:{create:circles.map(({id:circleId})=>({circleId}))}}});
    }
  }
  revalidatePath("/");
  revalidatePath("/contacts");
  revalidatePath("/circles");
  redirect("/contacts");
}
