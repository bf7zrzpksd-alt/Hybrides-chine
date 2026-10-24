import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { matchListingUrl, parseAlertEmail } from "@/lib/parsers/alert-email";

describe("matchListingUrl", () => {
  it("mobile.de", () =>
    expect(matchListingUrl("https://suchen.mobile.de/fahrzeuge/details.html?id=412345678")?.sourceId).toBe("412345678"));
  it("lien de suivi qui cache une URL mobile.de", () =>
    expect(
      matchListingUrl("https://click.x.com/t?url=https%3A%2F%2Fsuchen.mobile.de%2Ffahrzeuge%2Fdetails.html%3Fid%3D99999999")
        ?.sourceId,
    ).toBe("99999999"));
  it("AutoScout24 Italie", () => {
    const r = matchListingUrl("https://www.autoscout24.it/offerte/byd-seal-3f2a9c1e-1b2c-4d5e-8f90-123456789abc");
    expect(r?.source).toBe("autoscout24");
    expect(r?.country).toBe("IT");
  });
  it("ignore les autres liens", () => expect(matchListingUrl("https://www.mobile.de/agb")).toBeNull());
});

describe("parseAlertEmail (fixture synthétique)", () => {
  const html = readFileSync(join(__dirname, "fixtures/synthetic-alert.html"), "utf8");
  const listings = parseAlertEmail(html);

  it("trouve 2 annonces, sans doublon", () => expect(listings).toHaveLength(2));

  it("lit l'annonce mobile.de", () => {
    const l = listings.find((x) => x.source === "mobile.de")!;
    expect(l).toMatchObject({
      sourceId: "412345678",
      brand: "BYD",
      powertrain: "PHEV",
      priceEur: 32990,
      mileageKm: 18500,
      firstRegistration: "2025-03",
      vatDeductible: true,
      sellerVatRate: 0.19,
      imageUrl: "https://img.example/1.jpg",
    });
    expect(l.title).toBe("BYD Seal U DM-i Design");
  });

  it("lit l'annonce AutoScout24", () => {
    const l = listings.find((x) => x.source === "autoscout24")!;
    expect(l).toMatchObject({ brand: "Lynk & Co", priceEur: 29500, mileageKm: 4200, firstRegistration: "2025-11", country: "IT" });
  });
});
