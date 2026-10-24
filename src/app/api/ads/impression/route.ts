import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAdEvent } from "@/lib/ads/events";
import { getActiveCampaigns } from "@/lib/content";
import { isSameOrigin } from "@/lib/security/request";

const body = z.object({ campaignId: z.uuid() }).strict();

export async function POST(request: Request) {
  if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) {
    return new NextResponse(null, { status: 403 });
  }
  let parsed;
  try {
    parsed = body.safeParse(JSON.parse(await request.text()));
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (!parsed.success) return new NextResponse(null, { status: 400 });

  // Only active campaigns can be counted.
  const active = (await getActiveCampaigns()).some((c) => c.id === parsed.data.campaignId);
  if (active) await recordAdEvent(parsed.data.campaignId, "impression");
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
