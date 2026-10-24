/**
 * Prix de revient d'une voiture achetée dans l'UE et immatriculée en Suisse.
 *
 * - Droits de douane : 0 (supprimés pour les produits industriels depuis le 01.01.2024).
 * - Impôt automobile : 4 % de la valeur à la frontière (prix hors TVA étrangère + transport jusqu'à la frontière).
 * - TVA à l'import : 8,1 % de la valeur à la frontière + impôt auto + transport jusqu'à destination + frais.
 * - TVA étrangère : récupérable si le vendeur est pro et facture hors TVA à l'export.
 *
 * Tous les montants de frais sont des estimations modifiables dans les réglages.
 */

export const SWISS_AUTO_TAX_RATE = 0.04;
export const SWISS_VAT_RATE = 0.081;

export interface CostSettings {
  /** Taux de change : 1 EUR = x CHF. */
  eurChf: number;
  /** Transport jusqu'à la frontière suisse, en CHF. */
  transportToBorderChf: number;
  /** Transport de la frontière jusqu'à ton garage, en CHF. */
  transportInlandChf: number;
  /** Transitaire / déclaration en douane, en CHF. */
  customsAgentChf: number;
  /** Expertise cantonale + plaques + administratif, en CHF. */
  registrationChf: number;
  /** Préparation, nettoyage, petites réparations, en CHF. */
  preparationChf: number;
}

export const DEFAULT_SETTINGS: CostSettings = {
  eurChf: 0.94,
  transportToBorderChf: 900,
  transportInlandChf: 150,
  customsAgentChf: 180,
  registrationChf: 350,
  preparationChf: 300,
};

export interface CostInput {
  priceEur: number;
  /** Le vendeur facture hors TVA à l'export (pro avec TVA déductible). */
  vatDeductible: boolean;
  /** Taux de TVA du pays vendeur (ex. 0.19 pour l'Allemagne). Requis si vatDeductible. */
  sellerVatRate: number | null;
}

export interface CostBreakdown {
  purchaseChf: number;
  foreignVatRefundChf: number;
  purchaseNetChf: number;
  transportToBorderChf: number;
  borderValueChf: number;
  autoTaxChf: number;
  importVatChf: number;
  transportInlandChf: number;
  customsAgentChf: number;
  registrationChf: number;
  preparationChf: number;
  /** Ce que la voiture te coûte, TVA suisse comprise. */
  totalChf: number;
  /** Coût hors TVA suisse : utile si tu récupères la TVA à l'import (entreprise assujettie). */
  totalExVatChf: number;
}

const round = (n: number) => Math.round(n);

export function landedCost(input: CostInput, s: CostSettings = DEFAULT_SETTINGS): CostBreakdown {
  const purchaseChf = input.priceEur * s.eurChf;
  const vatRate = input.vatDeductible ? (input.sellerVatRate ?? 0) : 0;
  const purchaseNetChf = purchaseChf / (1 + vatRate);
  const foreignVatRefundChf = purchaseChf - purchaseNetChf;

  const borderValueChf = purchaseNetChf + s.transportToBorderChf;
  const autoTaxChf = borderValueChf * SWISS_AUTO_TAX_RATE;
  const vatBase = borderValueChf + autoTaxChf + s.transportInlandChf + s.customsAgentChf;
  const importVatChf = vatBase * SWISS_VAT_RATE;

  const totalExVatChf =
    borderValueChf + autoTaxChf + s.transportInlandChf + s.customsAgentChf + s.registrationChf + s.preparationChf;
  const totalChf = totalExVatChf + importVatChf;

  return {
    purchaseChf: round(purchaseChf),
    foreignVatRefundChf: round(foreignVatRefundChf),
    purchaseNetChf: round(purchaseNetChf),
    transportToBorderChf: round(s.transportToBorderChf),
    borderValueChf: round(borderValueChf),
    autoTaxChf: round(autoTaxChf),
    importVatChf: round(importVatChf),
    transportInlandChf: round(s.transportInlandChf),
    customsAgentChf: round(s.customsAgentChf),
    registrationChf: round(s.registrationChf),
    preparationChf: round(s.preparationChf),
    totalChf: round(totalChf),
    totalExVatChf: round(totalExVatChf),
  };
}

/** Marge brute estimée face à un prix de vente suisse TTC. */
export function estimatedMargin(totalChf: number, swissPriceChf: number | null) {
  if (swissPriceChf == null) return null;
  const marginChf = swissPriceChf - totalChf;
  return { marginChf: round(marginChf), marginPct: swissPriceChf ? marginChf / swissPriceChf : 0 };
}

/** TVA standard des principaux pays vendeurs. */
export const VAT_BY_COUNTRY: Record<string, number> = {
  DE: 0.19,
  FR: 0.2,
  IT: 0.22,
  AT: 0.2,
  BE: 0.21,
  NL: 0.21,
  ES: 0.21,
  LU: 0.17,
  PL: 0.23,
  CZ: 0.21,
  DK: 0.25,
  SE: 0.25,
  PT: 0.23,
};
