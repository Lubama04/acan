import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

// Evidence export for transmission to a competent authority (never for retaliation).
export async function GET(_request: Request, ctx: RouteContext<"/admin/securite/export/[id]">) {
  await requireAdmin("admin");
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return new NextResponse(null, { status: 400 });
  const supabase = await createClient();
  const { data: incident } = await supabase.from("incidents").select("*").eq("id", id).single();
  if (!incident) return new NextResponse(null, { status: 404 });
  const body = JSON.stringify({ exported_at: new Date().toISOString(), incident }, null, 2);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="incident-${id}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
