const chf = new Intl.NumberFormat("fr-CH", { style: "currency", currency: "CHF", maximumFractionDigits: 0 });
const eur = new Intl.NumberFormat("fr-CH", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("fr-CH", { maximumFractionDigits: 0 });

export const fmtChf = (n: number | null | undefined) => (n == null ? "–" : chf.format(n));
export const fmtEur = (n: number | null | undefined) => (n == null ? "–" : eur.format(n));
export const fmtKm = (n: number | null | undefined) => (n == null ? "–" : `${num.format(n)} km`);
export const fmtReg = (ym: string | null) => {
  if (!ym) return "Neuve";
  const [y, m] = ym.split("-");
  return `${m}/${y}`;
};

export const COUNTRY_NAMES: Record<string, string> = {
  DE: "Allemagne", FR: "France", IT: "Italie", AT: "Autriche", BE: "Belgique", NL: "Pays-Bas",
  ES: "Espagne", LU: "Luxembourg", PL: "Pologne", CZ: "Tchéquie", DK: "Danemark", SE: "Suède", PT: "Portugal",
};
