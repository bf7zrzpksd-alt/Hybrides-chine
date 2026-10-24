import { co2Status } from "./co2";
import { estimatedMargin, landedCost, type CostSettings } from "./landed-cost";
import { findSwissPrice, type SwissPrice } from "./db";
import type { Listing } from "./types";

/** Tout ce qu'on calcule pour une annonce : prix rendu, CO2, prix suisse, marge. */
export function evaluate(l: Listing, settings: CostSettings, swissPrices: SwissPrice[]) {
  const cost =
    l.priceEur == null
      ? null
      : landedCost({ priceEur: l.priceEur, vatDeductible: l.vatDeductible, sellerVatRate: l.sellerVatRate }, settings);
  const swiss = findSwissPrice(swissPrices, l);
  const margin = cost ? estimatedMargin(cost.totalChf, swiss?.priceChf ?? null) : null;
  return { cost, co2: co2Status(l.firstRegistration, l.mileageKm), swiss, margin };
}
