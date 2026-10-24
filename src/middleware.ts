import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, passwordToken } from "@/lib/auth";

// Pages publiques : connexion, liens clients partagés, réception des e-mails (protégée par son propre secret).
const PUBLIC = [/^\/login/, /^\/s\//, /^\/api\/inbound-email/, /^\/_next\//, /^\/favicon/];

export async function middleware(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next(); // pas de mot de passe défini : usage local
  if (PUBLIC.some((re) => re.test(req.nextUrl.pathname))) return NextResponse.next();
  if (req.cookies.get(AUTH_COOKIE)?.value === (await passwordToken(password))) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/((?!_next/static|_next/image).*)"] };
