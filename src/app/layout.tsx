import type { Metadata } from "next";
import "./globals.css";
import { isDemo } from "@/lib/db";

export const metadata: Metadata = {
  title: "Hybrides chinoises",
  description: "Trouver des hybrides chinoises en Europe et calculer leur prix rendu en Suisse",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">
        {isDemo && (
          <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
            Mode démo : les annonces affichées sont fictives. Configure Supabase pour utiliser tes vraies données.
          </div>
        )}
        {children}
      </body>
    </html>
  );
}
