import Link from "next/link";

const NAV = [
  { href: "/", label: "Annonces" },
  { href: "/selections", label: "Sélections clients" },
  { href: "/prix-suisses", label: "Prix suisses" },
  { href: "/reglages", label: "Réglages" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/" className="font-semibold">
            Hybrides chinoises
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm text-stone-600">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-stone-900">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </>
  );
}
