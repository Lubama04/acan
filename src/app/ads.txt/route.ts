import { adsTxt } from "@/lib/ads/ads-txt";

// Generated from NEXT_PUBLIC_ADSENSE_CLIENT_ID: nothing is hard-coded. Without an ID the file is empty,
// which authorises no seller.
export const revalidate = 3600;

export function GET() {
  return new Response(adsTxt(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
