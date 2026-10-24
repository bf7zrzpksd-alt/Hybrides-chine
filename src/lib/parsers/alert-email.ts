import * as cheerio from "cheerio";
import type { NewListing, Source } from "../types";
import { detectBrand, detectModel, detectPowertrain } from "../brands";
import { VAT_BY_COUNTRY } from "../landed-cost";
import { extractFirstRegistration, extractMileageKm, extractPriceEur, extractVatDeductible } from "./text-extract";

/**
 * Lit un e-mail d'alerte de recherche (mobile.de ou AutoScout24) et en extrait les annonces.
 *
 * L'approche est volontairement tolérante : on repère les liens vers des pages d'annonce
 * (même cachés derrière un lien de suivi), puis on lit le texte du bloc qui entoure chaque lien.
 * Ainsi, un changement de mise en page de l'e-mail ne casse pas tout.
 */

interface ListingRef {
  source: Source;
  sourceId: string;
  url: string;
  country: string | null;
}

/** Reconnaît une URL d'annonce et renvoie son identifiant. */
export function matchListingUrl(rawUrl: string): ListingRef | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  // Liens de suivi : l'URL réelle est souvent dans un paramètre (url, u, target, redirect…).
  for (const [, v] of url.searchParams) {
    if (/^https?%3A|^https?:/i.test(v)) {
      const inner = matchListingUrl(decodeURIComponent(v));
      if (inner) return inner;
    }
  }

  const host = url.hostname.toLowerCase();

  if (host.endsWith("mobile.de")) {
    const id =
      url.searchParams.get("id") ??
      url.pathname.match(/\/(?:details|fahrzeuge\/details)[^/]*?(\d{6,})/)?.[1] ??
      url.pathname.match(/\/(\d{6,})(?:\.html)?$/)?.[1];
    if (!id || !/details|fahrzeug|auto-inserat/i.test(url.pathname)) return null;
    return {
      source: "mobile.de",
      sourceId: id,
      url: `https://suchen.mobile.de/fahrzeuge/details.html?id=${id}`,
      country: "DE",
    };
  }

  const as24 = host.match(/autoscout24\.(de|at|it|fr|be|nl|es|lu|pl|com)$/);
  if (as24) {
    const m = url.pathname.match(/\/(?:angebote|offerte|offres|aanbod|anuncios|ofertas|lst-offers|offers)\/[^?#]*?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    if (!m) return null;
    const tld = as24[1];
    return {
      source: "autoscout24",
      sourceId: m[1].toLowerCase(),
      url: `https://${url.hostname}${url.pathname}`,
      country: tld === "com" ? null : tld.toUpperCase(),
    };
  }
  return null;
}

/** Remonte depuis le lien jusqu'au bloc qui contient le prix (la « carte » de l'annonce). */
function cardText($: cheerio.CheerioAPI, el: Parameters<cheerio.CheerioAPI>[0]): string {
  let node = $(el);
  for (let i = 0; i < 8; i++) {
    const parent = node.parent();
    if (!parent.length) break;
    const text = parent.text().replace(/\s+/g, " ").trim();
    // On s'arrête dès qu'on a un prix, avant d'englober les annonces voisines.
    if (/€|EUR/.test(text) && text.length < 1200) return text;
    if (text.length >= 1200) break;
    node = parent;
  }
  return node.text().replace(/\s+/g, " ").trim();
}

export function parseAlertEmail(html: string): NewListing[] {
  const $ = cheerio.load(html);
  const byKey = new Map<string, NewListing>();
  // Annonces dont le titre vient d'un vrai texte de lien (et pas d'un repli sur le bloc).
  const titledFromLink = new Set<string>();
  const isGoodTitle = (t: string) => t.length >= 3 && t.length < 120;

  $("a[href]").each((_, a) => {
    const ref = matchListingUrl($(a).attr("href") ?? "");
    if (!ref) return;
    const key = `${ref.source}:${ref.sourceId}`;
    const text = cardText($, a);
    const linkText = $(a).text().replace(/\s+/g, " ").trim();
    const img = $(a).find("img").attr("src") ?? null;

    const prev = byKey.get(key);
    // Un même e-mail répète souvent le lien (photo + titre) : on complète la fiche.
    if (prev) {
      if (!prev.imageUrl && img) prev.imageUrl = img;
      if (isGoodTitle(linkText) && (!titledFromLink.has(key) || linkText.length > prev.title.length)) {
        prev.title = linkText;
        titledFromLink.add(key);
      }
      return;
    }

    if (isGoodTitle(linkText)) titledFromLink.add(key);
    const title = isGoodTitle(linkText) ? linkText : text.slice(0, 100);
    const brand = detectBrand(`${title} ${text}`);
    const vatDeductible = extractVatDeductible(text);
    byKey.set(key, {
      source: ref.source,
      sourceId: ref.sourceId,
      url: ref.url,
      title,
      brand,
      model: detectModel(title, brand),
      powertrain: detectPowertrain(`${title} ${text}`),
      priceEur: extractPriceEur(text),
      vatDeductible,
      sellerVatRate: ref.country ? (VAT_BY_COUNTRY[ref.country] ?? null) : null,
      mileageKm: extractMileageKm(text),
      firstRegistration: extractFirstRegistration(text),
      country: ref.country,
      sellerName: null,
      imageUrl: img,
    });
  });

  // La marque et le modèle se lisent sur le titre final (le premier lien est souvent la photo).
  for (const l of byKey.values()) {
    const brand = detectBrand(l.title) ?? l.brand;
    l.brand = brand;
    l.model = detectModel(l.title, brand);
    if (l.powertrain === "UNKNOWN") l.powertrain = detectPowertrain(l.title);
  }
  return [...byKey.values()];
}
