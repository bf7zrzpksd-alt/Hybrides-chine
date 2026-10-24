export type Powertrain = "PHEV" | "HEV" | "BEV" | "EREV" | "ICE" | "UNKNOWN";

export type Source = "mobile.de" | "autoscout24" | "openlane" | "autobid" | "manual";

/** Une annonce normalisée, quelle que soit sa source. */
export interface Listing {
  id: string;
  source: Source;
  sourceId: string;
  url: string;
  title: string;
  brand: string | null;
  model: string | null;
  powertrain: Powertrain;
  priceEur: number | null;
  /** true si le prix affiché permet de récupérer la TVA (vendeur pro, TVA déductible). */
  vatDeductible: boolean;
  /** Taux de TVA du pays du vendeur, ex. 0.19 pour l'Allemagne. */
  sellerVatRate: number | null;
  mileageKm: number | null;
  /** Première immatriculation, format AAAA-MM. null = jamais immatriculée (neuve). */
  firstRegistration: string | null;
  country: string | null;
  sellerName: string | null;
  imageUrl: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
}

export type NewListing = Omit<Listing, "id" | "firstSeenAt" | "lastSeenAt">;
