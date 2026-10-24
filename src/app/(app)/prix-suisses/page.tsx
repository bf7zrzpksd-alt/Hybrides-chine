import { listSwissPrices } from "@/lib/db";
import { CHINESE_BRANDS } from "@/lib/brands";
import { fmtChf } from "@/lib/format";
import { deleteSwissPriceAction, saveSwissPriceAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function SwissPricesPage() {
  const prices = await listSwissPrices();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Prix suisses de référence</h1>
        <p className="text-sm text-stone-600">
          Le prix auquel le modèle se vend en Suisse (catalogue importateur ou occasions sur AutoScout24.ch). Il sert à
          calculer la marge. Le modèle est comparé au début du modèle de l&apos;annonce : « Seal U » couvre « Seal U DM-i
          Design ».
        </p>
      </div>

      <form action={saveSwissPriceAction} className="card grid grid-cols-2 gap-3 md:grid-cols-6">
        <div>
          <label className="label">Marque</label>
          <select name="brand" className="input" required>
            {CHINESE_BRANDS.map((b) => (
              <option key={b.name}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Modèle</label>
          <input name="model" className="input" required placeholder="Seal U" />
        </div>
        <div>
          <label className="label">Type</label>
          <select name="kind" className="input">
            <option value="occasion">Occasion récente</option>
            <option value="neuf">Neuf</option>
          </select>
        </div>
        <div>
          <label className="label">Prix CHF</label>
          <input name="priceChf" type="number" className="input" required />
        </div>
        <div className="col-span-2">
          <label className="label">Lien source (optionnel)</label>
          <input name="sourceUrl" type="url" className="input" />
        </div>
        <div className="col-span-2 md:col-span-6">
          <button className="btn">Enregistrer</button>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-stone-500">
            <tr>
              <th className="py-1">Marque</th>
              <th>Modèle</th>
              <th>Type</th>
              <th className="text-right">Prix</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {prices.map((p) => (
              <tr key={p.id} className="border-t border-stone-100">
                <td className="py-1.5">{p.brand}</td>
                <td>
                  {p.sourceUrl ? (
                    <a href={p.sourceUrl} className="underline" target="_blank" rel="noreferrer">
                      {p.model}
                    </a>
                  ) : (
                    p.model
                  )}
                </td>
                <td>{p.kind}</td>
                <td className="text-right tabular-nums">{fmtChf(p.priceChf)}</td>
                <td className="text-right">
                  <form action={deleteSwissPriceAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="text-xs text-red-700 hover:underline">Supprimer</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
