import Link from "next/link";
import { notFound } from "next/navigation";
import { getSettings, getShortlist, listSwissPrices } from "@/lib/db";
import { evaluate } from "@/lib/evaluate";
import { fmtChf, fmtKm, fmtReg } from "@/lib/format";
import { removeFromShortlistAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ShortlistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getShortlist(id);
  if (!s) notFound();
  const [settings, swissPrices] = await Promise.all([getSettings(), listSwissPrices()]);
  const shareUrl = `${process.env.APP_URL ?? ""}/s/${s.token}`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">{s.title}</h1>
        {s.clientName && <p className="text-stone-500">{s.clientName}</p>}
      </div>
      <div className="card text-sm">
        Lien à envoyer au client (sans tes coûts ni tes sources) :{" "}
        <Link href={`/s/${s.token}`} className="break-all text-emerald-700 underline">
          {shareUrl || `/s/${s.token}`}
        </Link>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-stone-500">
            <tr>
              <th className="py-1">Voiture</th>
              <th className="text-right">Prix rendu</th>
              <th className="text-right">Prix client</th>
              <th className="text-right">Marge</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {s.items.map(({ listing: l, salePriceChf }) => {
              const { cost } = evaluate(l, settings, swissPrices);
              const margin = cost && salePriceChf ? salePriceChf - cost.totalChf : null;
              return (
                <tr key={l.id} className="border-t border-stone-100">
                  <td className="py-2">
                    <Link href={`/annonce/${l.id}`} className="underline">
                      {l.title}
                    </Link>
                    <div className="text-xs text-stone-500">
                      {fmtReg(l.firstRegistration)} · {fmtKm(l.mileageKm)}
                    </div>
                  </td>
                  <td className="text-right tabular-nums">{fmtChf(cost?.totalChf)}</td>
                  <td className="text-right tabular-nums">{fmtChf(salePriceChf)}</td>
                  <td className={`text-right tabular-nums ${margin != null && margin < 0 ? "text-red-700" : "text-emerald-700"}`}>
                    {fmtChf(margin)}
                  </td>
                  <td className="text-right">
                    <form action={removeFromShortlistAction}>
                      <input type="hidden" name="shortlistId" value={s.id} />
                      <input type="hidden" name="listingId" value={l.id} />
                      <button className="text-xs text-red-700 hover:underline">Retirer</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {s.items.length === 0 && <p className="text-sm text-stone-500">Ajoute des voitures depuis leur fiche.</p>}
      </div>
    </div>
  );
}
