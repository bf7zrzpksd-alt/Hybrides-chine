/** Protection simple par mot de passe unique (APP_PASSWORD). Fonctionne en Edge et en Node. */
export const AUTH_COOKIE = "hc_auth";

export async function passwordToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`hybrides-chine:${password}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
