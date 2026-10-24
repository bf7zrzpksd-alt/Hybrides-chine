import { notFound } from "next/navigation";
import { getShortlistByToken } from "@/lib/db";
import { fmtChf, fmtKm, fmtReg } from "@/lib/format";

export const dynamic = "force-dynamic";

const POWERTRAIN_FR: Record<string, string> = {
  PHEV: "Hybride rechargeable",
  HEV: "Hybride",
  EREV: "Électrique à prolongateur",
  BEV: "100 % électrique",
  ICE: "Thermique",
  UNKNOWN: "",
};

/** Page publique pour le client : pas de prix d'achat, pas de coûts, pas de lien vers l'annonce d'origine. */
export default async function PublicShortlist({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const s = await getShortlistByToken(token);
  if (!s) notFound();
  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold">{s.title}</h1>
        {s.clientName && <p className="text-stone-500">Sélection préparée pour {s.clientName}</p>}
      </div>
      {s.items.map(({ listing: l, salePriceChf, note }) => (
        <div key={l.id} className="card flex flex-col gap-4 sm:flex-row">
          {l.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={l.imageUrl} alt="" className="h-40 w-full rounded-lg object-cover sm:w-56" />
          )}
          <div className="space-y-1">
            <div className="text-lg font-medium">{l.title}</div>
            <div className="text-sm text-stone-600">
              {fmtReg(l.firstRegistration)} · {fmtKm(l.mileageKm)} · {POWERTRAIN_FR[l.powertrain]}
            </div>
            <div className="text-xl font-semibold">{fmtChf(salePriceChf)}</div>
            <p className="text-xs text-stone-500">Prix rendu immatriculé en Suisse, TVA comprise.</p>
            {note && <p className="text-sm">{note}</p>}
          </div>
        </div>
      ))}
    </main>
  );
}
