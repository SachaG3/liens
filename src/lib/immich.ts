import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

export type ImmichPerson = {
  id: string;
  name: string;
  isHidden?: boolean;
};

export type ImmichAsset = {
  id: string;
  originalFileName?: string;
  fileCreatedAt?: string;
};

function config() {
  const url = process.env.IMMICH_URL?.trim().replace(/\/+$/, "");
  const apiKey = process.env.IMMICH_API_KEY?.trim();
  if (!url || !apiKey) return null;
  return { baseUrl: url.endsWith("/api") ? url : `${url}/api`, apiKey };
}

export function isImmichConfigured() {
  return config() !== null;
}

async function immichFetch(path: string, init?: RequestInit) {
  const settings = config();
  if (!settings) throw new Error("Immich n’est pas configuré.");
  const response = await fetch(`${settings.baseUrl}${path}`, {
    ...init,
    cache: "no-store",
    signal: init?.signal ?? AbortSignal.timeout(5_000),
    headers: {
      Accept: "application/json",
      "x-api-key": settings.apiKey,
      ...init?.headers,
    },
  });
  if (!response.ok) throw new Error(`Immich a répondu avec le statut ${response.status}.`);
  return response;
}

export async function getImmichPeople(): Promise<ImmichPerson[]> {
  const response = await immichFetch("/people?withHidden=false");
  const body = await response.json() as { people?: ImmichPerson[] } | ImmichPerson[];
  const people = Array.isArray(body) ? body : body.people ?? [];
  return people
    .filter((person) => !person.isHidden)
    .sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id, "fr"));
}

export async function getImmichPerson(id: string): Promise<ImmichPerson> {
  const response = await immichFetch(`/people/${encodeURIComponent(id)}`);
  return response.json() as Promise<ImmichPerson>;
}

export async function getImmichAssets(personId: string): Promise<ImmichAsset[]> {
  const response = await immichFetch("/search/metadata", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      page: 1,
      personIds: [personId],
      size: 24,
      type: "IMAGE",
      withArchived: false,
    }),
  });
  const body = await response.json() as { assets?: { items?: ImmichAsset[] } };
  return body.assets?.items ?? [];
}

function assetSignature(assetId: string) {
  const settings = config();
  if (!settings) return "";
  return createHmac("sha256", settings.apiKey).update(assetId).digest("hex");
}

export function immichAssetUrl(assetId: string) {
  return `/api/immich/assets/${encodeURIComponent(assetId)}?signature=${assetSignature(assetId)}`;
}

export function validImmichAssetSignature(assetId: string, signature: string) {
  const expected = Buffer.from(assetSignature(assetId), "hex");
  const received = Buffer.from(signature, "hex");
  return expected.length > 0 && expected.length === received.length && timingSafeEqual(expected, received);
}

export async function getImmichAssetThumbnail(assetId: string) {
  return immichFetch(`/assets/${encodeURIComponent(assetId)}/thumbnail?size=preview`);
}
