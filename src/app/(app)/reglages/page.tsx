import { getSettings, isDemo } from "@/lib/db";
import type { CostSettings } from "@/lib/landed-cost";
import { importEmailAction, saveSettingsAction } from "../actions";

export const dynamic = "force-dynamic";

const FIELDS: [keyof CostSettings, string, string][] = [
  ["eurChf", "Taux EUR → CHF", "1 EUR = x CHF"],
  ["transportToBorderChf", "Transport jusqu'à la frontière (CHF)", "Camion ou convoyage"],
  ["transportInlandChf", "Transport en Suisse (CHF)", ""],
  ["customsAgentChf", "Transitaire / déclaration (CHF)", ""],
  ["registrationChf", "Expertise, plaques, admin. (CHF)", "Selon le canton"],
  ["preparationChf", "Préparation (CHF)", "Nettoyage, petites réparations"],
];

export default async function SettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const s = await getSettings();
  const inboundUrl = `${process.env.APP_URL ?? "https://ton-app.vercel.app"}/api/inbound-email?secret=…`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Réglages</h1>

      <form action={saveSettingsAction} className="card space-y-3">
        <h2 className="font-semibold">Frais d&apos;import</h2>
        {sp.ok && <p className="text-sm text-emerald-700">Réglages enregistrés.</p>}
        <div className="grid gap-3 md:grid-cols-3">
          {FIELDS.map(([k, label, hint]) => (
            <div key={k}>
              <label className="label">{label}</label>
              <input name={k} type="number" step="any" defaultValue={s[k]} className="input" />
              {hint && <p className="mt-0.5 text-xs text-stone-400">{hint}</p>}
            </div>
          ))}
        </div>
        <button className="btn">Enregistrer</button>
      </form>

      <div className="card space-y-2 text-sm">
        <h2 className="font-semibold">Recevoir les alertes automatiquement</h2>
        <ol className="list-decimal space-y-1 pl-5 text-stone-700">
          <li>Sur mobile.de et AutoScout24, crée une recherche (marque, motorisation hybride rechargeable, prix…) et active l&apos;alerte e-mail.</li>
          <li>Fais suivre ces e-mails vers l&apos;adresse de réception (service d&apos;e-mail entrant, par exemple Postmark ou Cloudflare Email Routing).</li>
          <li>Ce service envoie chaque e-mail à l&apos;adresse : <code className="rounded bg-stone-100 px-1">{inboundUrl}</code></li>
        </ol>
        {isDemo && <p className="text-amber-800">En mode démo, les e-mails reçus ne sont gardés qu&apos;en mémoire.</p>}
      </div>

      <form action={importEmailAction} className="card space-y-3">
        <h2 className="font-semibold">Importer un e-mail d&apos;alerte à la main</h2>
        <p className="text-sm text-stone-600">
          Dans ta messagerie, affiche le code source de l&apos;e-mail (ou sa version HTML) et colle-le ici.
        </p>
        {sp.import && (
          <p className="text-sm text-emerald-700">
            {sp.import} annonce(s) trouvée(s), dont {sp.created} nouvelle(s).
          </p>
        )}
        <textarea name="html" rows={6} className="input font-mono text-xs" required />
        <button className="btn">Importer</button>
      </form>
    </div>
  );
}
