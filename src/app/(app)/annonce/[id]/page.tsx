import { notFound } from "next/navigation";
import { getListing, getSettings, listShortlists, listSwissPrices } from "@/lib/db";
import { evaluate } from "@/lib/evaluate";
import { COUNTRY_NAMES, fmtChf, fmtEur, fmtKm, fmtReg } from "@/lib/format";
import { Co2Badge } from "@/components/Co2Badge";
import { addToShortlistAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = await getListing(id);
  if (!l) notFound();
  const [settings, swissPrices, shortlists] = await Promise.all([getSettings(), listSwissPrices(), listShortlists()]);
  const { cost, co2, swiss, margin } = evaluate(l, settings, swissPrices);

  const lines: [string, number | undefined, string?][] = cost
    ? [
        ["Prix d'achat converti", cost.purchaseChf],
        ["TVA étrangère récupérée", -cost.foreignVatRefundChf, l.vatDeductible ? undefined : "vendeur sans TVA récupérable"],
        ["Transport jusqu'à la frontière", cost.transportToBorderChf],
        ["Impôt automobile 4 %", cost.autoTaxChf],
        ["Transport en Suisse", cost.transportInlandChf],
        ["Transitaire / douane", cost.customsAgentChf],
        ["Expertise, plaques, admin.", cost.registrationChf],
        ["Préparation", cost.preparationChf],
        ["TVA suisse 8,1 %", cost.importVatChf],
      ]
    : [];

  return (
    <div className="grid gap-5 md:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="card space-y-2">
          <h1 className="text-xl font-semibold">{l.title}</h1>
          <div className="text-sm text-stone-600">
            {fmtReg(l.firstRegistration)} · {fmtKm(l.mileageKm)} · {l.powertrain} ·{" "}
            {l.country ? (COUNTRY_NAMES[l.country] ?? l.country) : "pays inconnu"} · source {l.source}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-lg">{fmtEur(l.priceEur)}</span>
            <Co2Badge co2={co2} />
            {l.url !== "#" && (
              <a href={l.url} target="_blank" rel="noreferrer" className="text-sm text-emerald-700 underline">
                Voir l&apos;annonce d&apos;origine
              </a>
            )}
          </div>
          <p className="text-xs text-stone-500">{co2.reason}</p>
        </div>

        <div className="card">
          <h2 className="mb-3 font-semibold">Prix rendu en Suisse</h2>
          {cost ? (
            <table className="w-full text-sm">
              <tbody>
                {lines.map(([label, v, hint]) => (
                  <tr key={label} className="border-b border-stone-100">
                    <td className="py-1.5">
                      {label}
                      {hint && <span className="ml-2 text-xs text-stone-400">({hint})</span>}
                    </td>
                    <td className="py-1.5 text-right tabular-nums">{fmtChf(v)}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="pt-2">Total TTC</td>
                  <td className="pt-2 text-right tabular-nums">{fmtChf(cost.totalChf)}</td>
                </tr>
                <tr className="text-stone-500">
                  <td>Total hors TVA suisse</td>
                  <td className="text-right tabular-nums">{fmtChf(cost.totalExVatChf)}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-stone-500">Prix inconnu dans l&apos;annonce.</p>
          )}
          <p className="mt-3 text-xs text-stone-500">
            Taux EUR/CHF {settings.eurChf}. Les frais sont des estimations, modifiables dans les réglages. Une sanction
            CO2 éventuelle n&apos;est pas incluse.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="card space-y-1">
          <h2 className="font-semibold">Marge estimée</h2>
          {margin && swiss ? (
            <>
              <div className={`text-2xl font-semibold ${margin.marginChf > 0 ? "text-emerald-700" : "text-red-700"}`}>
                {fmtChf(margin.marginChf)}
              </div>
              <p className="text-sm text-stone-600">
                Face à {swiss.brand} {swiss.model} ({swiss.kind}) à {fmtChf(swiss.priceChf)} en Suisse, soit{" "}
                {Math.round(margin.marginPct * 100)} %.
              </p>
            </>
          ) : (
            <p className="text-sm text-stone-500">
              Ajoute un prix suisse pour {l.brand ?? "cette marque"} {l.model ?? ""} dans « Prix suisses ».
            </p>
          )}
        </div>

        <form action={addToShortlistAction} className="card space-y-3">
          <h2 className="font-semibold">Proposer à un client</h2>
          <input type="hidden" name="listingId" value={l.id} />
          <div>
            <label className="label">Sélection</label>
            <select name="shortlistId" className="input" defaultValue="">
              <option value="">Nouvelle sélection…</option>
              {shortlists.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                  {s.clientName ? ` (${s.clientName})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Nom (si nouvelle)</label>
              <input name="newTitle" className="input" placeholder="SUV hybride" />
            </div>
            <div>
              <label className="label">Client</label>
              <input name="clientName" className="input" />
            </div>
          </div>
          <div>
            <label className="label">Prix proposé au client (CHF)</label>
            <input
              name="salePriceChf"
              type="number"
              className="input"
              defaultValue={cost ? Math.ceil((cost.totalChf * 1.1) / 100) * 100 : undefined}
            />
          </div>
          <div>
            <label className="label">Note pour le client</label>
            <textarea name="note" className="input" rows={2} />
          </div>
          <button className="btn">Ajouter</button>
        </form>
      </div>
    </div>
  );
}
