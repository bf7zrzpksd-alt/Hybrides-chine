import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Listing, NewListing } from "./types";
import { DEFAULT_SETTINGS, type CostSettings } from "./landed-cost";
import { DEMO_LISTINGS, DEMO_SWISS_PRICES } from "./demo-data";

export interface SwissPrice {
  id: string;
  brand: string;
  model: string;
  kind: "neuf" | "occasion";
  priceChf: number;
  sourceUrl: string | null;
}

export interface Shortlist {
  id: string;
  token: string;
  title: string;
  clientName: string | null;
  items: { listing: Listing; salePriceChf: number | null; note: string | null }[];
}

export interface ListingFilters {
  brand?: string;
  powertrain?: string;
  maxPriceEur?: number;
  maxKm?: number;
}

/**
 * Sans variables Supabase, l'app tourne en « mode démo » avec des annonces fictives
 * gardées en mémoire. Elles sont signalées comme telles dans l'interface.
 */
export const isDemo = !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;

let client: SupabaseClient | null = null;
function sb(): SupabaseClient {
  if (!client) {
    client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });
  }
  return client;
}

// ---------- conversion lignes <-> objets ----------

type Row = Record<string, unknown>;

function rowToListing(r: Row): Listing {
  return {
    id: r.id as string,
    source: r.source as Listing["source"],
    sourceId: r.source_id as string,
    url: r.url as string,
    title: r.title as string,
    brand: (r.brand as string) ?? null,
    model: (r.model as string) ?? null,
    powertrain: r.powertrain as Listing["powertrain"],
    priceEur: (r.price_eur as number) ?? null,
    vatDeductible: Boolean(r.vat_deductible),
    sellerVatRate: r.seller_vat_rate == null ? null : Number(r.seller_vat_rate),
    mileageKm: (r.mileage_km as number) ?? null,
    firstRegistration: (r.first_registration as string) ?? null,
    country: (r.country as string) ?? null,
    sellerName: (r.seller_name as string) ?? null,
    imageUrl: (r.image_url as string) ?? null,
    firstSeenAt: r.first_seen_at as string,
    lastSeenAt: r.last_seen_at as string,
  };
}

function listingToRow(l: NewListing) {
  return {
    source: l.source,
    source_id: l.sourceId,
    url: l.url,
    title: l.title,
    brand: l.brand,
    model: l.model,
    powertrain: l.powertrain,
    price_eur: l.priceEur,
    vat_deductible: l.vatDeductible,
    seller_vat_rate: l.sellerVatRate,
    mileage_km: l.mileageKm,
    first_registration: l.firstRegistration,
    country: l.country,
    seller_name: l.sellerName,
    image_url: l.imageUrl,
  };
}

// ---------- mode démo (mémoire) ----------

const mem = {
  listings: [...DEMO_LISTINGS],
  swissPrices: [...DEMO_SWISS_PRICES],
  settings: { ...DEFAULT_SETTINGS } as CostSettings,
  shortlists: [] as { id: string; token: string; title: string; clientName: string | null; items: { listingId: string; salePriceChf: number | null; note: string | null }[] }[],
};

const rid = () => crypto.randomUUID();

// ---------- API ----------

export async function listListings(f: ListingFilters = {}): Promise<Listing[]> {
  if (isDemo) {
    return mem.listings
      .filter((l) => !f.brand || l.brand === f.brand)
      .filter((l) => !f.powertrain || l.powertrain === f.powertrain)
      .filter((l) => !f.maxPriceEur || (l.priceEur ?? Infinity) <= f.maxPriceEur)
      .filter((l) => !f.maxKm || (l.mileageKm ?? Infinity) <= f.maxKm)
      .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));
  }
  let q = sb().from("listings").select("*").neq("status", "ecarte").order("last_seen_at", { ascending: false }).limit(500);
  if (f.brand) q = q.eq("brand", f.brand);
  if (f.powertrain) q = q.eq("powertrain", f.powertrain);
  if (f.maxPriceEur) q = q.lte("price_eur", f.maxPriceEur);
  if (f.maxKm) q = q.lte("mileage_km", f.maxKm);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(rowToListing);
}

export async function getListing(id: string): Promise<Listing | null> {
  if (isDemo) return mem.listings.find((l) => l.id === id) ?? null;
  const { data, error } = await sb().from("listings").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? rowToListing(data) : null;
}

/** Ajoute ou met à jour des annonces. Renvoie le nombre d'annonces nouvelles. */
export async function upsertListings(items: NewListing[]): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;
  const now = new Date().toISOString();
  if (isDemo) {
    for (const it of items) {
      const prev = mem.listings.find((l) => l.source === it.source && l.sourceId === it.sourceId);
      if (prev) {
        Object.assign(prev, it, { lastSeenAt: now });
        updated++;
      } else {
        mem.listings.push({ ...it, id: rid(), firstSeenAt: now, lastSeenAt: now });
        created++;
      }
    }
    return { created, updated };
  }
  for (const it of items) {
    const { data: prev } = await sb()
      .from("listings")
      .select("id, price_eur")
      .eq("source", it.source)
      .eq("source_id", it.sourceId)
      .maybeSingle();
    const { data, error } = await sb()
      .from("listings")
      .upsert({ ...listingToRow(it), last_seen_at: now }, { onConflict: "source,source_id" })
      .select("id")
      .single();
    if (error) throw error;
    if (prev) updated++;
    else created++;
    if (it.priceEur != null && (!prev || prev.price_eur !== it.priceEur)) {
      await sb().from("price_history").insert({ listing_id: data.id, price_eur: it.priceEur });
    }
  }
  return { created, updated };
}

export async function logInboundEmail(sender: string | null, subject: string | null, parsedCount: number, rawHtml: string) {
  if (isDemo) return;
  await sb().from("inbound_emails").insert({ sender, subject, parsed_count: parsedCount, raw_html: rawHtml.slice(0, 500_000) });
}

export async function getSettings(): Promise<CostSettings> {
  if (isDemo) return mem.settings;
  const { data } = await sb().from("settings").select("data").eq("id", 1).maybeSingle();
  return { ...DEFAULT_SETTINGS, ...((data?.data as Partial<CostSettings>) ?? {}) };
}

export async function saveSettings(s: CostSettings) {
  if (isDemo) {
    mem.settings = s;
    return;
  }
  const { error } = await sb().from("settings").upsert({ id: 1, data: s });
  if (error) throw error;
}

export async function listSwissPrices(): Promise<SwissPrice[]> {
  if (isDemo) return mem.swissPrices;
  const { data, error } = await sb().from("swiss_prices").select("*").order("brand");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    brand: r.brand,
    model: r.model,
    kind: r.kind,
    priceChf: r.price_chf,
    sourceUrl: r.source_url,
  }));
}

export async function saveSwissPrice(p: Omit<SwissPrice, "id">) {
  if (isDemo) {
    const prev = mem.swissPrices.find((x) => x.brand === p.brand && x.model === p.model && x.kind === p.kind);
    if (prev) Object.assign(prev, p);
    else mem.swissPrices.push({ ...p, id: rid() });
    return;
  }
  const { error } = await sb()
    .from("swiss_prices")
    .upsert(
      { brand: p.brand, model: p.model, kind: p.kind, price_chf: p.priceChf, source_url: p.sourceUrl, updated_at: new Date().toISOString() },
      { onConflict: "brand,model,kind" },
    );
  if (error) throw error;
}

export async function deleteSwissPrice(id: string) {
  if (isDemo) {
    mem.swissPrices = mem.swissPrices.filter((p) => p.id !== id);
    return;
  }
  await sb().from("swiss_prices").delete().eq("id", id);
}

/** Prix suisse de référence pour une annonce : même marque, modèle qui commence pareil. */
export function findSwissPrice(prices: SwissPrice[], l: Listing): SwissPrice | null {
  if (!l.brand || !l.model) return null;
  const m = l.model.toLowerCase();
  const candidates = prices.filter((p) => p.brand === l.brand && m.startsWith(p.model.toLowerCase()));
  // Une occasion se compare d'abord à une occasion suisse, sinon au prix neuf.
  const wanted = l.firstRegistration ? "occasion" : "neuf";
  return (
    candidates.sort((a, b) => b.model.length - a.model.length).find((p) => p.kind === wanted) ?? candidates[0] ?? null
  );
}

// ---------- sélections client ----------

export async function listShortlists(): Promise<Omit<Shortlist, "items">[]> {
  if (isDemo) return mem.shortlists.map((s) => ({ id: s.id, token: s.token, title: s.title, clientName: s.clientName }));
  const { data, error } = await sb().from("shortlists").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, token: r.token, title: r.title, clientName: r.client_name }));
}

export async function createShortlist(title: string, clientName: string | null): Promise<string> {
  if (isDemo) {
    const id = rid();
    mem.shortlists.push({ id, token: rid().replace(/-/g, "").slice(0, 24), title, clientName, items: [] });
    return id;
  }
  const { data, error } = await sb().from("shortlists").insert({ title, client_name: clientName }).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function addToShortlist(shortlistId: string, listingId: string, salePriceChf: number | null, note: string | null) {
  if (isDemo) {
    const s = mem.shortlists.find((x) => x.id === shortlistId);
    if (!s) throw new Error("Sélection introuvable");
    s.items = s.items.filter((i) => i.listingId !== listingId);
    s.items.push({ listingId, salePriceChf, note });
    return;
  }
  const { error } = await sb()
    .from("shortlist_items")
    .upsert({ shortlist_id: shortlistId, listing_id: listingId, sale_price_chf: salePriceChf, note });
  if (error) throw error;
}

export async function removeFromShortlist(shortlistId: string, listingId: string) {
  if (isDemo) {
    const s = mem.shortlists.find((x) => x.id === shortlistId);
    if (s) s.items = s.items.filter((i) => i.listingId !== listingId);
    return;
  }
  await sb().from("shortlist_items").delete().eq("shortlist_id", shortlistId).eq("listing_id", listingId);
}

async function loadShortlist(col: "id" | "token", value: string): Promise<Shortlist | null> {
  if (isDemo) {
    const s = mem.shortlists.find((x) => x[col] === value);
    if (!s) return null;
    return {
      ...s,
      items: s.items
        .map((i) => ({ listing: mem.listings.find((l) => l.id === i.listingId)!, salePriceChf: i.salePriceChf, note: i.note }))
        .filter((i) => i.listing),
    };
  }
  const { data: s, error } = await sb().from("shortlists").select("*").eq(col, value).maybeSingle();
  if (error) throw error;
  if (!s) return null;
  const { data: items } = await sb()
    .from("shortlist_items")
    .select("sale_price_chf, note, listings(*)")
    .eq("shortlist_id", s.id);
  return {
    id: s.id,
    token: s.token,
    title: s.title,
    clientName: s.client_name,
    items: (items ?? []).map((i) => ({
      listing: rowToListing(i.listings as unknown as Row),
      salePriceChf: i.sale_price_chf,
      note: i.note,
    })),
  };
}

export const getShortlist = (id: string) => loadShortlist("id", id);
export const getShortlistByToken = (token: string) => loadShortlist("token", token);
