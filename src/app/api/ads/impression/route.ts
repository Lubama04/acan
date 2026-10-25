import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAdEvent } from "@/lib/ads/events";
import { getServableCampaign } from "@/lib/content";
import { isSameOrigin } from "@/lib/security/request";
import { verifyAdToken } from "@/lib/security/tokens";

const body = z.object({ campaignId: z.uuid(), token: z.string().max(80) }).strict();

export async function POST(request: Request) {
  if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) {
    return new NextResponse(null, { status: 403 });
  }
  const raw = await request.text();
  if (raw.length > 512) return new NextResponse(null, { status: 413 });
  let parsed;
  try {
    parsed = body.safeParse(JSON.parse(raw));
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (!parsed.success) return new NextResponse(null, { status: 400 });

  // Only campaigns that are active, within their dates and under their cap are counted.
  const campaign = await getServableCampaign(parsed.data.campaignId);
  if (campaign) {
    await recordAdEvent(campaign.id, "impression", {
      validToken: verifyAdToken(campaign.id, parsed.data.token),
    });
  }
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
