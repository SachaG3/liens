"use server";

import * as core from "@/app/actions/core";

export async function addGiftIdea(form:FormData){return core.addGiftIdea(form)}
export async function addImportantDate(form:FormData){return core.addImportantDate(form)}
export async function addReminder(form:FormData){return core.addReminder(form)}
export async function addSuggestedImportantDate(form:FormData){return core.addSuggestedImportantDate(form)}
export async function deleteGiftIdea(form:FormData){return core.deleteGiftIdea(form)}
export async function deleteImportantDate(form:FormData){return core.deleteImportantDate(form)}
export async function deleteReminder(form:FormData){return core.deleteReminder(form)}
export async function snoozeReminder(form:FormData){return core.snoozeReminder(form)}
export async function syncSuggestedImportantDates(form:FormData){return core.syncSuggestedImportantDates(form)}
export async function toggleGiftIdea(form:FormData){return core.toggleGiftIdea(form)}
export async function toggleReminder(form:FormData){return core.toggleReminder(form)}
export async function updateGiftIdea(form:FormData){return core.updateGiftIdea(form)}
export async function updateImportantDate(form:FormData){return core.updateImportantDate(form)}
export async function updateReminder(form:FormData){return core.updateReminder(form)}
