import type { Powertrain } from "./types";

/**
 * Marques chinoises suivies. Les alias couvrent les variantes d'écriture
 * rencontrées dans les annonces.
 */
export const CHINESE_BRANDS: { name: string; aliases: string[] }[] = [
  { name: "BYD", aliases: ["byd"] },
  { name: "MG", aliases: ["mg", "mg motor", "mg roewe"] },
  { name: "Lynk & Co", aliases: ["lynk & co", "lynk&co", "lynk and co", "lynk co", "lynk"] },
  { name: "Geely", aliases: ["geely"] },
  { name: "Leapmotor", aliases: ["leapmotor"] },
  { name: "Xpeng", aliases: ["xpeng", "xpeng motors"] },
  { name: "Omoda", aliases: ["omoda"] },
  { name: "Jaecoo", aliases: ["jaecoo"] },
  { name: "Chery", aliases: ["chery"] },
  { name: "NIO", aliases: ["nio"] },
  { name: "Zeekr", aliases: ["zeekr"] },
  { name: "Voyah", aliases: ["voyah"] },
  { name: "DFSK", aliases: ["dfsk", "seres"] },
  { name: "Polestar", aliases: ["polestar"] },
];

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Trouve la marque chinoise citée dans un titre d'annonce, sinon null. */
export function detectBrand(text: string): string | null {
  const t = ` ${text.toLowerCase()} `;
  // Les alias les plus longs d'abord, pour que « lynk & co » gagne sur « lynk ».
  const all = CHINESE_BRANDS.flatMap((b) => b.aliases.map((a) => ({ a, name: b.name }))).sort(
    (x, y) => y.a.length - x.a.length,
  );
  for (const { a, name } of all) {
    const re = new RegExp(`(^|[^a-z0-9])${escapeRe(a)}([^a-z0-9]|$)`);
    if (re.test(t)) return name;
  }
  return null;
}

/** Retire la marque du titre pour obtenir le modèle (approximatif). */
export function detectModel(title: string, brand: string | null): string | null {
  if (!brand) return null;
  const b = CHINESE_BRANDS.find((x) => x.name === brand);
  let rest = title;
  for (const a of [...(b?.aliases ?? [])].sort((x, y) => y.length - x.length)) {
    rest = rest.replace(new RegExp(escapeRe(a), "i"), "");
  }
  const words = rest.trim().split(/\s+/).filter(Boolean);
  return words.length ? words.slice(0, 2).join(" ") : null;
}

/** Devine la motorisation à partir du texte de l'annonce (DE, FR, IT, NL, EN). */
export function detectPowertrain(text: string): Powertrain {
  const t = text.toLowerCase();
  if (/\b(phev|plug-?in|dm-?i|dm-?p|e-?hybrid rechargeable|hybride rechargeable|ibrida plug|em-?i|super hybrid)\b/.test(t))
    return "PHEV";
  if (/\b(erev|range extender|reev)\b/.test(t)) return "EREV";
  if (/\b(hev|vollhybrid|full hybrid|hybride|hybrid|ibrida)\b/.test(t)) return "HEV";
  if (/\b(bev|elektro|électrique|electrique|elettrica|electric|ev)\b/.test(t)) return "BEV";
  if (/\b(benzin|diesel|essence|benzina|petrol)\b/.test(t)) return "ICE";
  return "UNKNOWN";
}
