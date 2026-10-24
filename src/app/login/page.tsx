import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, passwordToken } from "@/lib/auth";

async function login(fd: FormData) {
  "use server";
  const expected = process.env.APP_PASSWORD;
  if (!expected || fd.get("password") !== expected) redirect("/login?err=1");
  (await cookies()).set(AUTH_COOKIE, await passwordToken(expected), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 60,
    path: "/",
  });
  redirect("/");
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const { err } = await searchParams;
  return (
    <main className="mx-auto max-w-sm px-4 py-20">
      <form action={login} className="card space-y-3">
        <h1 className="text-lg font-semibold">Hybrides chinoises</h1>
        <input name="password" type="password" className="input" placeholder="Mot de passe" autoFocus />
        {err && <p className="text-sm text-red-700">Mot de passe incorrect.</p>}
        <button className="btn w-full justify-center">Entrer</button>
      </form>
    </main>
  );
}
