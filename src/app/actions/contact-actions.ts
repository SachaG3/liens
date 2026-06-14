"use server";

import * as core from "@/app/actions/core";

export async function addContact(form:FormData){return core.addContact(form)}
export async function addGroupInteraction(form:FormData){return core.addGroupInteraction(form)}
export async function addInteraction(form:FormData){return core.addInteraction(form)}
export async function addQuickInteraction(form:FormData){return core.addQuickInteraction(form)}
export async function deleteContact(form:FormData){return core.deleteContact(form)}
export async function deleteInteraction(form:FormData){return core.deleteInteraction(form)}
export async function importContacts(form:FormData){return core.importContacts(form)}
export async function linkImmichPerson(form:FormData){return core.linkImmichPerson(form)}
export async function updateContact(form:FormData){return core.updateContact(form)}
export async function updateInteraction(form:FormData){return core.updateInteraction(form)}
