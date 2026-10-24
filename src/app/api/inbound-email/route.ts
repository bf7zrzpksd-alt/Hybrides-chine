import { NextResponse, type NextRequest } from "next/server";
import { logInboundEmail, upsertListings } from "@/lib/db";
import { parseAlertEmail } from "@/lib/parsers/alert-email";

/**
 * Reçoit un e-mail d'alerte transféré par un service d'e-mail entrant.
 * Formats acceptés :
 *  - JSON Postmark : { HtmlBody, Subject, From }
 *  - JSON générique : { html, subject, from }
 *  - formulaire (Mailgun, SendGrid) : body-html / html, subject, from
 * Protégé par INBOUND_SECRET, passé en ?secret=… ou dans l'en-tête x-inbound-secret.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.INBOUND_SECRET;
  const given = req.nextUrl.searchParams.get("secret") ?? req.headers.get("x-inbound-secret");
  if (!secret || given !== secret) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let html = "";
  let subject: string | null = null;
  let from: string | null = null;
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const b = await req.json();
    html = b.HtmlBody ?? b.html ?? "";
    subject = b.Subject ?? b.subject ?? null;
    from = b.From ?? b.from ?? null;
  } else {
    const fd = await req.formData();
    html = String(fd.get("body-html") ?? fd.get("html") ?? "");
    subject = (fd.get("subject") as string) ?? null;
    from = (fd.get("from") as string) ?? null;
  }
  if (!html) return NextResponse.json({ error: "no html body" }, { status: 400 });

  const listings = parseAlertEmail(html);
  const r = await upsertListings(listings);
  await logInboundEmail(from, subject, listings.length, html);
  return NextResponse.json({ found: listings.length, ...r });
}
