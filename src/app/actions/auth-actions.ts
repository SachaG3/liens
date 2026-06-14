"use server";

import * as core from "@/app/actions/core";

export async function login(form:FormData){return core.login(form)}
export async function logout(){return core.logout()}
export async function register(form:FormData){return core.register(form)}
export async function updateAccount(form:FormData){return core.updateAccount(form)}
export async function updatePassword(form:FormData){return core.updatePassword(form)}
