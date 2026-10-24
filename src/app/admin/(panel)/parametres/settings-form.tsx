"use client";

import { useActionState } from "react";
import { saveSettings, type ActionResult } from "../actions";

const TEXT_FIELDS: [string, string][] = [
  ["legal_name", "Dénomination sociale"],
  ["brand_name", "Nom commercial"],
  ["legal_form", "Forme juridique"],
  ["share_capital", "Capital social"],
  ["rccm", "Numéro RCCM"],
  ["nif", "NIF"],
  ["address", "Adresse du siège"],
  ["city", "Ville"],
  ["phone", "Téléphone public"],
  ["email", "E-mail public"],
  ["publication_director", "Responsable de la publication"],
  ["privacy_contact_email", "Contact données personnelles"],
  ["security_contact_email", "Contact sécurité (security.txt)"],
];

const FLAGS: [string, string][] = [
  ["feature_team", "Afficher les porteurs du projet (page L'agence)"],
  ["feature_case_studies", "Afficher les réalisations (cas réels avec accord client)"],
  ["feature_newsletter", "Ouvrir l'inscription à la lettre d'information"],
  ["feature_media_kit", "Kit média disponible"],
  ["adsense_enabled", "Autoriser Google AdSense (si l'identifiant est configuré)"],
];

const str = (v: unknown) => (typeof v === "string" ? v : "");

export function SettingsForm({ values }: { values: Record<string, unknown> }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(saveSettings, { ok: false, message: "" });
  const socials = (values.social_links ?? {}) as Record<string, string>;
  return (
    <form action={action} className="space-y-8 rounded-lg border border-border bg-white p-6">
      {state.message && (
        <p role={state.ok ? "status" : "alert"} className={state.ok ? "font-semibold text-[#14532D]" : "field-error"}>
          {state.message}
        </p>
      )}
      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="h3 mb-2 text-navy">Identité et mentions légales</legend>
        {TEXT_FIELDS.map(([key, label]) => (
          <label key={key} className="block text-sm font-semibold">
            {label}
            <input name={key} defaultValue={str(values[key])} className="field mt-1" />
          </label>
        ))}
      </fieldset>
      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="h3 mb-2 text-navy">Réseaux sociaux (https://…)</legend>
        {["facebook", "linkedin", "tiktok", "instagram"].map((n) => (
          <label key={n} className="block text-sm font-semibold capitalize">
            {n}
            <input name={`social_${n}`} type="url" defaultValue={socials[n] ?? ""} className="field mt-1" />
          </label>
        ))}
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="h3 mb-2 text-navy">Sections affichées</legend>
        {FLAGS.map(([key, label]) => (
          <label key={key} className="flex items-center gap-3">
            <input type="checkbox" name={key} defaultChecked={values[key] === true} className="size-5 accent-blue" />
            {label}
          </label>
        ))}
      </fieldset>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
