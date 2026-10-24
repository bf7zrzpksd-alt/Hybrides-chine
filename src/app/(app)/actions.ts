"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  addToShortlist,
  createShortlist,
  deleteSwissPrice,
  removeFromShortlist,
  saveSettings,
  saveSwissPrice,
  upsertListings,
} from "@/lib/db";
import { parseAlertEmail } from "@/lib/parsers/alert-email";
import { DEFAULT_SETTINGS, type CostSettings } from "@/lib/landed-cost";

const numOrNull = (v: FormDataEntryValue | null) => (v == null || v === "" ? null : Number(v));

export async function addToShortlistAction(fd: FormData) {
  const listingId = String(fd.get("listingId"));
  let shortlistId = String(fd.get("shortlistId") ?? "");
  const newTitle = String(fd.get("newTitle") ?? "").trim();
  if (!shortlistId && newTitle) shortlistId = await createShortlist(newTitle, String(fd.get("clientName") ?? "") || null);
  if (!shortlistId) throw new Error("Choisis une sélection ou donne un nom à une nouvelle.");
  await addToShortlist(shortlistId, listingId, numOrNull(fd.get("salePriceChf")), String(fd.get("note") ?? "") || null);
  redirect(`/selections/${shortlistId}`);
}

export async function createShortlistAction(fd: FormData) {
  const id = await createShortlist(String(fd.get("title")), String(fd.get("clientName") ?? "") || null);
  redirect(`/selections/${id}`);
}

export async function removeFromShortlistAction(fd: FormData) {
  const shortlistId = String(fd.get("shortlistId"));
  await removeFromShortlist(shortlistId, String(fd.get("listingId")));
  revalidatePath(`/selections/${shortlistId}`);
}

export async function saveSwissPriceAction(fd: FormData) {
  await saveSwissPrice({
    brand: String(fd.get("brand")),
    model: String(fd.get("model")).trim(),
    kind: fd.get("kind") === "neuf" ? "neuf" : "occasion",
    priceChf: Number(fd.get("priceChf")),
    sourceUrl: String(fd.get("sourceUrl") ?? "") || null,
  });
  revalidatePath("/prix-suisses");
}

export async function deleteSwissPriceAction(fd: FormData) {
  await deleteSwissPrice(String(fd.get("id")));
  revalidatePath("/prix-suisses");
}

export async function saveSettingsAction(fd: FormData) {
  const s = {} as CostSettings;
  for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof CostSettings)[]) {
    s[k] = numOrNull(fd.get(k)) ?? DEFAULT_SETTINGS[k];
  }
  await saveSettings(s);
  revalidatePath("/", "layout");
  redirect("/reglages?ok=1");
}

/** Import manuel : coller le code HTML d'un e-mail d'alerte. */
export async function importEmailAction(fd: FormData) {
  const html = String(fd.get("html") ?? "");
  const listings = parseAlertEmail(html);
  const r = await upsertListings(listings);
  revalidatePath("/");
  redirect(`/reglages?import=${listings.length}&created=${r.created}`);
}
