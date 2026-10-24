import type { Listing } from "./types";
import type { SwissPrice } from "./db";

/**
 * Annonces FICTIVES pour le mode démo (sans Supabase). Les prix et liens ne
 * correspondent à aucune vraie annonce ; l'interface affiche un bandeau « démo ».
 */
const now = new Date().toISOString();

function demo(i: number, l: Omit<Listing, "id" | "source" | "sourceId" | "url" | "firstSeenAt" | "lastSeenAt" | "sellerName" | "imageUrl">): Listing {
  return {
    id: `demo-${i}`,
    source: "manual",
    sourceId: `demo-${i}`,
    url: "#",
    sellerName: "Annonce fictive",
    imageUrl: null,
    firstSeenAt: now,
    lastSeenAt: now,
    ...l,
  };
}

export const DEMO_LISTINGS: Listing[] = [
  demo(1, { title: "BYD Seal U DM-i Design", brand: "BYD", model: "Seal U", powertrain: "PHEV", priceEur: 31900, vatDeductible: true, sellerVatRate: 0.19, mileageKm: 14000, firstRegistration: "2025-04", country: "DE" }),
  demo(2, { title: "MG HS PHEV Luxury", brand: "MG", model: "HS PHEV", powertrain: "PHEV", priceEur: 24500, vatDeductible: true, sellerVatRate: 0.2, mileageKm: 22000, firstRegistration: "2024-11", country: "FR" }),
  demo(3, { title: "Lynk & Co 01 PHEV", brand: "Lynk & Co", model: "01 PHEV", powertrain: "PHEV", priceEur: 26900, vatDeductible: false, sellerVatRate: 0.21, mileageKm: 3100, firstRegistration: "2026-06", country: "NL" }),
  demo(4, { title: "Geely Starray EM-i Pro", brand: "Geely", model: "Starray EM-i", powertrain: "PHEV", priceEur: 29990, vatDeductible: true, sellerVatRate: 0.22, mileageKm: 9000, firstRegistration: "2026-02", country: "IT" }),
  demo(5, { title: "Jaecoo 7 SHS Plug-in Hybrid", brand: "Jaecoo", model: "7 SHS", powertrain: "PHEV", priceEur: 28400, vatDeductible: true, sellerVatRate: 0.19, mileageKm: null, firstRegistration: null, country: "DE" }),
];

export const DEMO_SWISS_PRICES: SwissPrice[] = [
  { id: "demo-p1", brand: "BYD", model: "Seal U", kind: "occasion", priceChf: 41900, sourceUrl: null },
  { id: "demo-p2", brand: "MG", model: "HS", kind: "occasion", priceChf: 31500, sourceUrl: null },
  { id: "demo-p3", brand: "Lynk & Co", model: "01", kind: "occasion", priceChf: 36900, sourceUrl: null },
];
