"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

// Every action: (1) requireAdmin re-checks session + MFA + role server-side, (2) Zod validation,
// (3) the write goes through the user's own session so RLS applies, (4) generic errors only.

export type ActionResult = { ok: boolean; message: string };
const FAIL: ActionResult = { ok: false, message: "L'opération a échoué. Vérifiez les champs et réessayez." };

const uuid = z.string().uuid();

function fail(scope: string, error: { code?: string } | null) {
  console.error(`[admin] ${scope} failed`, error?.code ?? "validation");
  return FAIL;
}

// ---------------------------------------------------------------- Leads & messages
const leadStatus = z.enum(["new", "in_progress", "quoted", "won", "lost", "archived"]);
const messageStatus = z.enum(["new", "answered", "archived"]);

export async function updateLeadStatus(formData: FormData): Promise<void> {
  await requireAdmin("admin");
  const p = z.object({ id: uuid, status: leadStatus, admin_notes: z.string().max(4000).optional() }).safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    admin_notes: formData.get("admin_notes") ?? undefined,
  });
  if (!p.success) return void fail("lead.update", null);
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ status: p.data.status, admin_notes: p.data.admin_notes || null })
    .eq("id", p.data.id);
  if (error) fail("lead.update", error);
  revalidatePath("/admin/demandes");
}

export async function updateMessageStatus(formData: FormData): Promise<void> {
  await requireAdmin("admin");
  const p = z.object({ id: uuid, status: messageStatus }).safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!p.success) return void fail("message.update", null);
  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").update({ status: p.data.status }).eq("id", p.data.id);
  if (error) fail("message.update", error);
  revalidatePath("/admin/demandes");
}

/** Right to erasure: requires typing SUPPRIMER (irreversible, so an explicit human confirmation). */
export async function deletePersonalRecord(formData: FormData): Promise<void> {
  await requireAdmin("admin");
  const p = z
    .object({ id: uuid, table: z.enum(["leads", "contact_messages", "newsletter_subscribers"]), confirm: z.literal("SUPPRIMER") })
    .safeParse({ id: formData.get("id"), table: formData.get("table"), confirm: formData.get("confirm") });
  if (!p.success) return void fail("record.delete", null);
  const supabase = await createClient();
  const { error } = await supabase.from(p.data.table).delete().eq("id", p.data.id);
  if (error) fail("record.delete", error);
  revalidatePath("/admin/demandes");
}

// ---------------------------------------------------------------- Posts
const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug : lettres minuscules, chiffres et tirets")
  .max(120);

const postSchema = z
  .object({
    id: uuid.optional(),
    slug,
    title: z.string().trim().min(5).max(160),
    excerpt: z.string().trim().min(20).max(320),
    body_md: z.string().max(100000),
    category: z.enum(["conseils", "etudes-de-cas", "actualites-agence", "ressources"]),
    cover_url: z.string().trim().url().startsWith("https://").max(500).optional().or(z.literal("")),
    cover_alt: z.string().trim().max(200).optional(),
    author_name: z.string().trim().min(2).max(120),
    sponsored: z.boolean(),
    sponsor_name: z.string().trim().max(120).optional(),
    seo_title: z.string().trim().max(70).optional(),
    seo_description: z.string().trim().max(170).optional(),
    status: z.enum(["draft", "published"]),
  })
  .refine((p) => !p.sponsored || (p.sponsor_name && p.sponsor_name.length > 1), {
    message: "Un contenu sponsorisé doit nommer le partenaire",
    path: ["sponsor_name"],
  })
  .refine((p) => !p.cover_url || (p.cover_alt && p.cover_alt.length > 2), {
    message: "Une image doit avoir un texte alternatif",
    path: ["cover_alt"],
  });

export async function savePost(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin("editor");
  const parsed = postSchema.safeParse({
    id: formData.get("id") || undefined,
    slug: formData.get("slug"),
    title: formData.get("title"),
    excerpt: formData.get("excerpt"),
    body_md: formData.get("body_md") ?? "",
    category: formData.get("category"),
    cover_url: formData.get("cover_url") ?? "",
    cover_alt: formData.get("cover_alt") || undefined,
    author_name: formData.get("author_name") || "Africa Média",
    sponsored: formData.get("sponsored") === "on",
    sponsor_name: formData.get("sponsor_name") || undefined,
    seo_title: formData.get("seo_title") || undefined,
    seo_description: formData.get("seo_description") || undefined,
    status: formData.get("status"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? FAIL.message };
  const { id, ...data } = parsed.data;
  const supabase = await createClient();

  let publishedAt: string | null = null;
  if (data.status === "published") {
    const existing = id ? (await supabase.from("posts").select("published_at").eq("id", id).single()).data : null;
    publishedAt = existing?.published_at ?? new Date().toISOString();
  }
  const row = {
    ...data,
    cover_url: data.cover_url || null,
    cover_alt: data.cover_alt || null,
    sponsor_name: data.sponsored ? data.sponsor_name : null,
    seo_title: data.seo_title || null,
    seo_description: data.seo_description || null,
    published_at: publishedAt,
  };
  const { data: saved, error } = id
    ? await supabase.from("posts").update(row).eq("id", id).select("id").single()
    : await supabase.from("posts").insert(row).select("id").single();
  if (error) {
    if (error.code === "23505") return { ok: false, message: "Ce slug est déjà utilisé." };
    return fail("post.save", error);
  }
  updateTag("posts");
  revalidatePath("/admin/journal");
  if (!id && saved) redirect(`/admin/journal/${saved.id}?saved=1`);
  return { ok: true, message: "Article enregistré." };
}

export async function deletePost(formData: FormData): Promise<void> {
  await requireAdmin("admin");
  const p = z.object({ id: uuid, confirm: z.literal("SUPPRIMER") }).safeParse({ id: formData.get("id"), confirm: formData.get("confirm") });
  if (!p.success) return void fail("post.delete", null);
  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", p.data.id);
  if (error) return void fail("post.delete", error);
  updateTag("posts");
  redirect("/admin/journal");
}

// ---------------------------------------------------------------- Ads
export async function updateAdSlot(formData: FormData): Promise<void> {
  await requireAdmin("admin");
  const p = z
    .object({
      key: z.enum(["header", "in_article", "sidebar", "footer"]),
      enabled: z.boolean(),
      adsense_slot_id: z.string().regex(/^\d{6,20}$/).optional().or(z.literal("")),
    })
    .safeParse({ key: formData.get("key"), enabled: formData.get("enabled") === "on", adsense_slot_id: formData.get("adsense_slot_id") ?? "" });
  if (!p.success) return void fail("slot.update", null);
  const supabase = await createClient();
  const { error } = await supabase
    .from("ad_slots")
    .update({ enabled: p.data.enabled, adsense_slot_id: p.data.adsense_slot_id || null })
    .eq("key", p.data.key);
  if (error) fail("slot.update", error);
  updateTag("ads");
  revalidatePath("/admin/publicite");
}

const campaignSchema = z
  .object({
    slot_key: z.enum(["header", "in_article", "sidebar", "footer"]),
    advertiser: z.string().trim().min(2).max(120),
    disclosure: z.enum(["Publicité", "Sponsorisé"]),
    image_url: z.string().trim().url().startsWith("https://").max(500),
    image_alt: z.string().trim().min(3).max(200),
    target_url: z.string().trim().url().startsWith("https://").max(500),
    starts_at: z.string().min(10),
    ends_at: z.string().min(10),
    max_impressions: z.coerce.number().int().positive().optional(),
  })
  .refine((c) => Date.parse(c.ends_at) > Date.parse(c.starts_at), { message: "La fin doit suivre le début", path: ["ends_at"] });

export async function createCampaign(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin("admin");
  const parsed = campaignSchema.safeParse({
    slot_key: formData.get("slot_key"),
    advertiser: formData.get("advertiser"),
    disclosure: formData.get("disclosure"),
    image_url: formData.get("image_url"),
    image_alt: formData.get("image_alt"),
    target_url: formData.get("target_url"),
    starts_at: formData.get("starts_at"),
    ends_at: formData.get("ends_at"),
    max_impressions: formData.get("max_impressions") || undefined,
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? FAIL.message };
  const supabase = await createClient();
  const { error } = await supabase.from("ad_campaigns").insert({
    ...parsed.data,
    starts_at: new Date(parsed.data.starts_at).toISOString(),
    ends_at: new Date(parsed.data.ends_at).toISOString(),
    active: false, // a campaign is activated explicitly after review
  });
  if (error) return fail("campaign.create", error);
  revalidatePath("/admin/publicite");
  return { ok: true, message: "Campagne créée (inactive). Activez-la après vérification du visuel." };
}

export async function toggleCampaign(formData: FormData): Promise<void> {
  await requireAdmin("admin");
  const p = z.object({ id: uuid, active: z.enum(["true", "false"]) }).safeParse({ id: formData.get("id"), active: formData.get("active") });
  if (!p.success) return void fail("campaign.toggle", null);
  const supabase = await createClient();
  const { error } = await supabase.from("ad_campaigns").update({ active: p.data.active === "true" }).eq("id", p.data.id);
  if (error) fail("campaign.toggle", error);
  updateTag("ads");
  revalidatePath("/admin/publicite");
}

// ---------------------------------------------------------------- Settings
const SETTING_RULES: Record<string, z.ZodType> = {
  legal_name: z.string().trim().min(3).max(200),
  brand_name: z.string().trim().min(2).max(80),
  legal_form: z.string().trim().max(60),
  rccm: z.string().trim().max(60),
  nif: z.string().trim().max(60),
  share_capital: z.string().trim().max(60),
  address: z.string().trim().max(200),
  city: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^(\+?[0-9 ()-]{6,20})?$/),
  email: z.string().trim().email().or(z.literal("")),
  publication_director: z.string().trim().max(120),
  privacy_contact_email: z.string().trim().email().or(z.literal("")),
  security_contact_email: z.string().trim().email().or(z.literal("")),
};
const SETTING_FLAGS = ["feature_team", "feature_case_studies", "feature_newsletter", "feature_media_kit", "adsense_enabled"];

export async function saveSettings(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin("admin");
  const rows: { key: string; value: unknown }[] = [];
  for (const [key, rule] of Object.entries(SETTING_RULES)) {
    const raw = String(formData.get(key) ?? "");
    const r = rule.safeParse(raw);
    if (!r.success) return { ok: false, message: `Champ invalide : ${key}` };
    rows.push({ key, value: raw.trim() === "" ? null : raw.trim() });
  }
  for (const key of SETTING_FLAGS) rows.push({ key, value: formData.get(key) === "on" });

  const socials: Record<string, string> = {};
  for (const n of ["facebook", "linkedin", "tiktok", "instagram"]) {
    const v = String(formData.get(`social_${n}`) ?? "").trim();
    if (v && !/^https:\/\/[^\s]+$/.test(v)) return { ok: false, message: `Lien ${n} invalide (https:// requis)` };
    if (v) socials[n] = v;
  }
  rows.push({ key: "social_links", value: socials });

  const supabase = await createClient();
  for (const row of rows) {
    const { error } = await supabase.from("site_settings").update({ value: row.value }).eq("key", row.key);
    if (error) return fail("settings.save", error);
  }
  updateTag("settings");
  revalidatePath("/", "layout");
  return { ok: true, message: "Paramètres enregistrés." };
}

// ---------------------------------------------------------------- Security (SILS)
export async function liftBlock(formData: FormData): Promise<void> {
  const session = await requireAdmin("admin");
  const p = uuid.safeParse(formData.get("id"));
  if (!p.success) return void fail("block.lift", null);
  const supabase = await createClient();
  const { error } = await supabase
    .from("blocked_entities")
    .update({ lifted_at: new Date().toISOString(), lifted_by: session.userId })
    .eq("id", p.data);
  if (error) fail("block.lift", error);
  revalidatePath("/admin/securite");
}

export async function toggleRule(formData: FormData): Promise<void> {
  await requireAdmin("admin");
  const p = z.object({ id: uuid, enabled: z.enum(["true", "false"]) }).safeParse({ id: formData.get("id"), enabled: formData.get("enabled") });
  if (!p.success) return void fail("rule.toggle", null);
  const supabase = await createClient();
  const { error } = await supabase.from("detection_rules").update({ enabled: p.data.enabled === "true" }).eq("id", p.data.id);
  if (error) fail("rule.toggle", error);
  revalidatePath("/admin/securite");
}

const incidentUpdate = z.object({
  id: uuid,
  status: z.enum(["ouvert", "contenu", "en_analyse", "corrige", "clos"]),
  root_cause: z.string().max(4000).optional(),
  impact: z.string().max(4000).optional(),
  remediation_applied: z.string().max(8000).optional(),
  validate: z.boolean(),
});

/** Human validation step: remediation is recorded as applied only when an admin validates it. */
export async function updateIncident(formData: FormData): Promise<void> {
  const session = await requireAdmin("admin");
  const p = incidentUpdate.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    root_cause: formData.get("root_cause") || undefined,
    impact: formData.get("impact") || undefined,
    remediation_applied: formData.get("remediation_applied") || undefined,
    validate: formData.get("validate") === "on",
  });
  if (!p.success) return void fail("incident.update", null);
  const supabase = await createClient();
  const { id, validate, ...rest } = p.data;
  const { error } = await supabase
    .from("incidents")
    .update({
      ...rest,
      ...(validate ? { validated_by: session.userId } : {}),
      ...(rest.status === "clos" ? { closed_at: new Date().toISOString() } : {}),
    })
    .eq("id", id);
  if (error) return void fail("incident.update", error);

  // Learning (SILS phase 7): a closed incident feeds security_memory.
  if (rest.status === "clos") {
    const { data: inc } = await supabase.from("incidents").select("title, vector, root_cause, remediation_applied, evidence").eq("id", id).single();
    if (inc) {
      await supabase.from("security_memory").insert({
        pattern_name: inc.title.slice(0, 120),
        attack_type: inc.vector ?? "inconnu",
        symptoms: JSON.stringify(inc.evidence).slice(0, 4000),
        cause: inc.root_cause,
        fix: inc.remediation_applied,
        linked_incidents: [id],
      });
      // Proposed rule, always disabled: an admin must enable it explicitly.
      if (inc.vector) {
        await supabase.from("detection_rules").insert({
          name: `proposition-${inc.vector}-${id.slice(0, 8)}`,
          event_type: inc.vector,
          threshold: 5,
          window_seconds: 600,
          severity: "medium",
          block_minutes: 30,
          enabled: false,
          proposed_by: "system",
        });
      }
    }
  }
  revalidatePath("/admin/securite");
}
