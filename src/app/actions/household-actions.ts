"use server";

import * as core from "@/app/actions/core";

export async function addCircle(form:FormData){return core.addCircle(form)}
export async function addDebt(form:FormData){return core.addDebt(form)}
export async function addPet(form:FormData){return core.addPet(form)}
export async function deleteCircle(form:FormData){return core.deleteCircle(form)}
export async function deleteDebt(form:FormData){return core.deleteDebt(form)}
export async function deletePet(form:FormData){return core.deletePet(form)}
export async function toggleDebt(form:FormData){return core.toggleDebt(form)}
export async function updateCircle(form:FormData){return core.updateCircle(form)}
export async function updateDebt(form:FormData){return core.updateDebt(form)}
export async function updatePet(form:FormData){return core.updatePet(form)}
