import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAdEvent } from "@/lib/ads/events";
import { getActiveCampaigns } from "@/lib/content";

// The destination always comes from the database (never from the query string): no open redirect.
export async function GET(request: Request, ctx: RouteContext<"/api/ads/click/[id]">) {
  const { id } = await ctx.params;
  const fallback = new URL("/", request.url);
  if (!z.uuid().safeParse(id).success) return NextResponse.redirect(fallback, 302);

  const campaign = (await getActiveCampaigns()).find((c) => c.id === id);
  if (!campaign || !/^https:\/\//.test(campaign.target_url)) return NextResponse.redirect(fallback, 302);

  await recordAdEvent(campaign.id, "click");
  const res = NextResponse.redirect(campaign.target_url, 302);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}
