import { describe, expect, it } from "vitest";
import { detectBrand, detectModel, detectPowertrain } from "@/lib/brands";

describe("detectBrand", () => {
  it.each([
    ["BYD Seal U DM-i Design", "BYD"],
    ["Lynk & Co 01 PHEV", "Lynk & Co"],
    ["MG HS 1.5T PHEV Luxury", "MG"],
    ["Geely Starray EM-i", "Geely"],
    ["Volkswagen Golf GTE", null],
    ["Omega 2.0", null],
  ])("%s → %s", (t, b) => expect(detectBrand(t)).toBe(b));
});

describe("detectModel", () => {
  it("retire la marque", () => expect(detectModel("BYD Seal U DM-i", "BYD")).toBe("Seal U"));
  it("gère Lynk & Co", () => expect(detectModel("Lynk & Co 01 PHEV", "Lynk & Co")).toBe("01 PHEV"));
});

describe("detectPowertrain", () => {
  it.each([
    ["BYD Seal U DM-i Boost", "PHEV"],
    ["MG HS Plug-in Hybrid", "PHEV"],
    ["MG ZS Hybrid+", "HEV"],
    ["BYD Atto 3 Elektro 60 kWh", "BEV"],
    ["Omoda 5 1.6 Benzin", "ICE"],
  ])("%s → %s", (t, p) => expect(detectPowertrain(t)).toBe(p));
});
