/**
 * Règle CO2 suisse pour les voitures importées.
 *
 * Une voiture importée est exclue des prescriptions CO2 (pas de sanction) si :
 *  - elle a été immatriculée à l'étranger plus de 12 mois avant la déclaration en douane, ou
 *  - elle a été immatriculée plus de 6 mois avant et affiche plus de 5'000 km.
 * Sinon elle compte comme « neuve » et une sanction peut être due si ses émissions
 * dépassent la valeur cible. Source : notice d'import du canton de St-Gall.
 */
export type Co2Status =
  | { status: "exempt"; reason: string }
  | { status: "subject"; reason: string; exemptFrom: string | null };

/** Nombre de mois entiers entre deux dates AAAA-MM(-JJ). */
function monthsBetween(from: Date, to: Date): number {
  let m = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) m -= 1;
  return m;
}

function parseYm(ym: string): Date {
  const [y, m] = ym.split("-").map(Number);
  // Sans le jour exact, on prend le dernier jour du mois : c'est le cas le plus prudent.
  return new Date(y, m, 0);
}

function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function co2Status(
  firstRegistration: string | null,
  mileageKm: number | null,
  customsDate: Date = new Date(),
): Co2Status {
  if (!firstRegistration) {
    return { status: "subject", reason: "Jamais immatriculée : voiture neuve.", exemptFrom: null };
  }
  const reg = parseYm(firstRegistration);
  const months = monthsBetween(reg, customsDate);
  const after12 = addMonths(reg, 12);
  if (customsDate > after12) {
    return { status: "exempt", reason: "Immatriculée depuis plus de 12 mois." };
  }
  const after6 = addMonths(reg, 6);
  if (customsDate > after6 && (mileageKm ?? 0) > 5000) {
    return { status: "exempt", reason: "Plus de 6 mois et plus de 5'000 km." };
  }
  // On donne la date à partir de laquelle la voiture sera exemptée.
  let exemptFrom = after12;
  if ((mileageKm ?? 0) > 5000 && after6 < after12) exemptFrom = after6;
  const next = new Date(exemptFrom);
  next.setDate(next.getDate() + 1);
  return {
    status: "subject",
    reason: `Immatriculée depuis ${Math.max(months, 0)} mois : comptée comme neuve.`,
    exemptFrom: ymd(next),
  };
}
