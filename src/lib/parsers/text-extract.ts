/** Petites fonctions pour lire prix, km et date dans un texte d'annonce (formats DE/FR/IT/NL). */

/** "32.990", "32 990", "32'990", "32,990" → 32990 */
function toInt(raw: string): number {
  return Number(raw.replace(/[.\s'’,  ]/g, ""));
}

export function extractPriceEur(text: string): number | null {
  const m =
    text.match(/€\s*([\d][\d.\s'’,  ]{2,})/) ?? text.match(/([\d][\d.\s'’,  ]{2,})\s*(?:€|EUR)/i);
  if (!m) return null;
  const n = toInt(m[1].replace(/[,.]\d{2}$/, "").trim());
  return Number.isFinite(n) && n >= 1000 && n <= 500000 ? n : null;
}

export function extractMileageKm(text: string): number | null {
  const m = text.match(/([\d][\d.\s'’,  ]*)\s*km\b/i);
  if (!m) return null;
  const n = toInt(m[1].trim());
  return Number.isFinite(n) && n >= 0 && n <= 1_000_000 ? n : null;
}

/** "EZ 03/2024", "03/2024", "1re immat. 03/2024", "2024-03" → "2024-03" */
export function extractFirstRegistration(text: string): string | null {
  const m = text.match(/\b(0?[1-9]|1[0-2])\s*\/\s*(20\d{2})\b/);
  if (m) return `${m[2]}-${m[1].padStart(2, "0")}`;
  const iso = text.match(/\b(20\d{2})-(0[1-9]|1[0-2])\b/);
  if (iso) return `${iso[1]}-${iso[2]}`;
  return null;
}

/** Vendeur pro avec TVA récupérable : "MwSt. ausweisbar", "TVA récupérable", "IVA esposta"… */
export function extractVatDeductible(text: string): boolean {
  return /mwst\.?\s*ausweisbar|ust\.?\s*ausweisbar|tva\s*r[ée]cup[ée]rable|iva\s*(esposta|deducibile)|btw\s*(aftrekbaar|verrekenbaar)|vat\s*deductible/i.test(
    text,
  );
}
