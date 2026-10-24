import Link from "next/link";
import { listShortlists } from "@/lib/db";
import { createShortlistAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function ShortlistsPage() {
  const lists = await listShortlists();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Sélections clients</h1>
      <form action={createShortlistAction} className="card flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <label className="label">Nom</label>
          <input name="title" className="input" required placeholder="SUV hybride famille" />
        </div>
        <div className="min-w-48 flex-1">
          <label className="label">Client</label>
          <input name="clientName" className="input" />
        </div>
        <button className="btn">Créer</button>
      </form>
      <div className="grid gap-3 md:grid-cols-2">
        {lists.map((s) => (
          <Link key={s.id} href={`/selections/${s.id}`} className="card hover:border-emerald-600">
            <div className="font-medium">{s.title}</div>
            {s.clientName && <div className="text-sm text-stone-500">{s.clientName}</div>}
          </Link>
        ))}
        {lists.length === 0 && <p className="text-sm text-stone-500">Aucune sélection pour l&apos;instant.</p>}
      </div>
    </div>
  );
}
