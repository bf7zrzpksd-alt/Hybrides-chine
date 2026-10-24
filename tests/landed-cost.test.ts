import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, estimatedMargin, landedCost } from "@/lib/landed-cost";

const zeroFees = {
  ...DEFAULT_SETTINGS,
  eurChf: 1,
  transportToBorderChf: 0,
  transportInlandChf: 0,
  customsAgentChf: 0,
  registrationChf: 0,
  preparationChf: 0,
};

describe("landedCost", () => {
  it("particulier, sans frais : prix + 4 % + 8,1 % sur (prix + 4 %)", () => {
    const r = landedCost({ priceEur: 30000, vatDeductible: false, sellerVatRate: 0.19 }, zeroFees);
    expect(r.autoTaxChf).toBe(1200);
    expect(r.importVatChf).toBe(Math.round(31200 * 0.081));
    expect(r.totalChf).toBe(Math.round(31200 * 1.081));
  });

  it("vendeur pro allemand : la TVA de 19 % est retirée avant les taxes suisses", () => {
    const r = landedCost({ priceEur: 35700, vatDeductible: true, sellerVatRate: 0.19 }, zeroFees);
    expect(r.purchaseNetChf).toBe(30000);
    expect(r.foreignVatRefundChf).toBe(5700);
    expect(r.autoTaxChf).toBe(1200);
  });

  it("le transport jusqu'à la frontière entre dans la base de l'impôt auto", () => {
    const r = landedCost(
      { priceEur: 20000, vatDeductible: false, sellerVatRate: null },
      { ...zeroFees, transportToBorderChf: 1000 },
    );
    expect(r.autoTaxChf).toBe(840);
  });

  it("conversion EUR → CHF", () => {
    const r = landedCost({ priceEur: 10000, vatDeductible: false, sellerVatRate: null }, { ...zeroFees, eurChf: 0.94 });
    expect(r.purchaseChf).toBe(9400);
  });
});

describe("estimatedMargin", () => {
  it("sans prix suisse : null", () => expect(estimatedMargin(30000, null)).toBeNull());
  it("calcule la marge", () => expect(estimatedMargin(30000, 36000)?.marginChf).toBe(6000));
});
