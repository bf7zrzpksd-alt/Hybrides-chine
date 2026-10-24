import { describe, expect, it } from "vitest";
import { co2Status } from "@/lib/co2";

const customs = new Date(2026, 9, 24); // 24.10.2026

describe("co2Status", () => {
  it("voiture neuve : soumise", () => {
    expect(co2Status(null, 10, customs).status).toBe("subject");
  });
  it("plus de 12 mois : exemptée, même avec peu de km", () => {
    expect(co2Status("2025-09", 1000, customs).status).toBe("exempt");
  });
  it("exactement 12 mois pile n'est pas encore « plus de 12 mois »", () => {
    // Immatriculée en octobre 2025 (on prend le 31.10 par prudence) : pas encore exemptée le 24.10.2026.
    const r = co2Status("2025-10", 1000, customs);
    expect(r.status).toBe("subject");
  });
  it("plus de 6 mois et plus de 5'000 km : exemptée", () => {
    expect(co2Status("2026-03", 8000, customs).status).toBe("exempt");
  });
  it("plus de 6 mois mais peu de km : soumise, exemptée à 12 mois", () => {
    const r = co2Status("2026-03", 3000, customs);
    expect(r.status).toBe("subject");
    if (r.status === "subject") expect(r.exemptFrom).toBe("2027-04-01");
  });
  it("moins de 6 mois avec beaucoup de km : soumise, exemptée à 6 mois", () => {
    const r = co2Status("2026-07", 9000, customs);
    expect(r.status).toBe("subject");
    if (r.status === "subject") expect(r.exemptFrom).toBe("2027-02-01");
  });
});
