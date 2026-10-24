import Link from "next/link";
import { getSettings, listListings, listSwissPrices } from "@/lib/db";
import { evaluate } from "@/lib/evaluate";
import { CHINESE_BRANDS } from "@/lib/brands";
import { COUNTRY_NAMES, fmtChf, fmtEur, fmtKm, fmtReg } from "@/lib/format";
import { Co2Badge } from "@/components/Co2Badge";

export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | undefined>>;

export default async function ListingsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const filters = {
    brand: sp.brand || undefined,
    powertrain: sp.powertrain || undefined,
    maxPriceEur: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    maxKm: sp.maxKm ? Number(sp.maxKm) : undefined,
  };
  const [listings, settings, swissPrices] = await Promise.all([listListings(filters), getSettings(), listSwissPrices()]);
  let rows = listings.map((l) => ({ l, ...evaluate(l, settings, swissPrices) }));
  if (sp.co2 === "ok") rows = rows.filter((r) => r.co2.status === "exempt");
  if (sp.sort === "marge") rows.sort((a, b) => (b.margin?.marginChf ?? -Infinity) - (a.margin?.marginChf ?? -Infinity));
  if (sp.sort === "prix") rows.sort((a, b) => (a.cost?.totalChf ?? Infinity) - (b.cost?.totalChf ?? Infinity));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-semibold">Annonces</h1>
        <p className="text-sm text-stone-500">{rows.length} annonce(s)</p>
      </div>

      <form className="card grid grid-cols-2 gap-3 md:grid-cols-6">
        <div>
          <label className="label">Marque</label>
          <select name="brand" defaultValue={sp.brand ?? ""} className="input">
            <option value="">Toutes</option>
            {CHINESE_BRANDS.map((b) => (
              <option key={b.name}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Motorisation</label>
          <select name="powertrain" defaultValue={sp.powertrain ?? ""} className="input">
            <option value="">Toutes</option>
            <option value="PHEV">Hybride rechargeable</option>
            <option value="HEV">Hybride</option>
            <option value="EREV">Prolongateur d&apos;autonomie</option>
            <option value="BEV">Électrique</option>
          </select>
        </div>
        <div>
          <label className="label">Prix max (EUR)</label>
          <input name="maxPrice" type="number" defaultValue={sp.maxPrice} className="input" />
        </div>
        <div>
          <label className="label">Km max</label>
          <input name="maxKm" type="number" defaultValue={sp.maxKm} className="input" />
        </div>
        <div>
          <label className="label">CO2</label>
          <select name="co2" defaultValue={sp.co2 ?? ""} className="input">
            <option value="">Tout</option>
            <option value="ok">Sans sanction</option>
          </select>
        </div>
        <div>
          <label className="label">Tri</label>
          <select name="sort" defaultValue={sp.sort ?? ""} className="input">
            <option value="">Plus récentes</option>
            <option value="marge">Meilleure marge</option>
            <option value="prix">Prix rendu le plus bas</option>
          </select>
        </div>
        <div className="col-span-2 flex gap-2 md:col-span-6">
          <button className="btn">Filtrer</button>
          <Link href="/" className="btn-ghost">
            Réinitialiser
          </Link>
        </div>
      </form>

      {rows.length === 0 ? (
        <div className="card text-sm text-stone-600">
          Aucune annonce pour l&apos;instant. Branche tes alertes e-mail dans les{" "}
          <Link href="/reglages" className="underline">
            réglages
          </Link>{" "}
          ou colle un e-mail d&apos;alerte pour l&apos;importer.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map(({ l, cost, co2, swiss, margin }) => (
            <Link key={l.id} href={`/annonce/${l.id}`} className="card flex gap-4 hover:border-emerald-600">
              {l.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.imageUrl} alt="" className="h-24 w-32 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-24 w-32 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-xs text-stone-400">
                  pas de photo
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="truncate font-medium">{l.title}</div>
                <div className="text-xs text-stone-500">
                  {fmtReg(l.firstRegistration)} · {fmtKm(l.mileageKm)} · {l.country ? (COUNTRY_NAMES[l.country] ?? l.country) : "pays ?"} ·{" "}
                  {l.powertrain}
                </div>
                <div className="flex flex-wrap items-baseline gap-x-3 text-sm">
                  <span>{fmtEur(l.priceEur)}</span>
                  <span className="font-semibold">→ {fmtChf(cost?.totalChf)} rendu CH</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Co2Badge co2={co2} />
                  {margin ? (
                    <span className={margin.marginChf > 0 ? "text-emerald-700" : "text-red-700"}>
                      Marge {fmtChf(margin.marginChf)} vs {fmtChf(swiss?.priceChf)} ({swiss?.kind})
                    </span>
                  ) : (
                    <span className="text-stone-400">Pas de prix suisse de référence</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
