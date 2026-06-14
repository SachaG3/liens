"use server";

import * as core from "@/app/actions/core";

export async function addContactRelation(form:FormData){return core.addContactRelation(form)}
export async function addConversationItem(form:FormData){return core.addConversationItem(form)}
export async function addCustomField(form:FormData){return core.addCustomField(form)}
export async function addJournalEntry(form:FormData){return core.addJournalEntry(form)}
export async function deleteContactRelation(form:FormData){return core.deleteContactRelation(form)}
export async function deleteConversationItem(form:FormData){return core.deleteConversationItem(form)}
export async function deleteCustomField(form:FormData){return core.deleteCustomField(form)}
export async function deleteJournalEntry(form:FormData){return core.deleteJournalEntry(form)}
export async function toggleConversationItem(form:FormData){return core.toggleConversationItem(form)}
export async function updateContactRelation(form:FormData){return core.updateContactRelation(form)}
export async function updateConversationItem(form:FormData){return core.updateConversationItem(form)}
export async function updateCustomField(form:FormData){return core.updateCustomField(form)}
export async function updateJournalEntry(form:FormData){return core.updateJournalEntry(form)}
