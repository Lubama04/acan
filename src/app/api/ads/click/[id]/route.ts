import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAdEvent } from "@/lib/ads/events";
import { getActiveCampaigns, getServableCampaign } from "@/lib/content";
import { verifyAdToken } from "@/lib/security/tokens";

// The destination always comes from the database (never from the query string): no open redirect.
export async function GET(request: Request, ctx: RouteContext<"/api/ads/click/[id]">) {
  const { id } = await ctx.params;
  const fallback = new URL("/", request.url);
  if (!z.uuid().safeParse(id).success) return NextResponse.redirect(fallback, 302);

  // Expired or capped campaigns still redirect (the visitor clicked) but are no longer counted.
  const campaign = (await getActiveCampaigns()).find((c) => c.id === id);
  if (!campaign || !/^https:\/\//.test(campaign.target_url)) return NextResponse.redirect(fallback, 302);

  if (await getServableCampaign(campaign.id)) {
    const token = new URL(request.url).searchParams.get("t");
    await recordAdEvent(campaign.id, "click", {
      validToken: verifyAdToken(campaign.id, token),
      // Browsers send Sec-Fetch-Site; a click from our page is "same-origin". An <img> or link on
      // another site is "cross-site" and is stored flagged, never counted.
      sameSiteNavigation: request.headers.get("sec-fetch-site") === "same-origin",
    });
  }

  const res = NextResponse.redirect(campaign.target_url, 302);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}
