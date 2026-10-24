import { getSettings } from "@/lib/settings";
import { SITE_URL } from "@/lib/site";

// RFC 9116. The contact comes from site_settings.security_contact_email (provided by the owner).
// Until it is set, the file points to the contact form so the endpoint stays valid.
export async function GET() {
  const s = await getSettings();
  const expires = new Date(Date.now() + 180 * 86_400_000).toISOString();
  const contact = s.security_contact_email ? `mailto:${s.security_contact_email}` : `${SITE_URL}/contact?sujet=autre`;
  const body = [
    `Contact: ${contact}`,
    `Expires: ${expires}`,
    "Preferred-Languages: fr, en",
    `Canonical: ${SITE_URL}/.well-known/security.txt`,
    `Policy: ${SITE_URL}/cgu`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" } });
}
