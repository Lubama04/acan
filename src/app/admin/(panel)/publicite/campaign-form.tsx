"use client";

import { startTransition, useActionState } from "react";
import { keepValuesOnSubmit } from "@/components/forms/form-bits";
import { createCampaign, type ActionResult } from "../actions";

export function CampaignForm() {
  const [state, action, pending] = useActionState<ActionResult, FormData>(createCampaign, {
    ok: false,
    message: "",
  });
  return (
    <form
      onSubmit={keepValuesOnSubmit(action, startTransition)}
      className="border-border mt-4 grid gap-4 rounded-lg border bg-white p-5 md:grid-cols-2"
    >
      {state.message && (
        <p
          role={state.ok ? "status" : "alert"}
          className={`md:col-span-2 ${state.ok ? "font-semibold text-[#14532D]" : "field-error"}`}
        >
          {state.message}
        </p>
      )}
      <label className="block text-sm font-semibold">
        Annonceur
        <input name="advertiser" required maxLength={120} className="field mt-1" />
      </label>
      <label className="block text-sm font-semibold">
        Emplacement
        <select name="slot_key" className="field mt-1">
          <option value="header">Bandeau haut</option>
          <option value="in_article">Dans l&apos;article</option>
          <option value="sidebar">Barre latérale</option>
          <option value="footer">Pied de page</option>
        </select>
      </label>
      <label className="block text-sm font-semibold">
        Mention
        <select name="disclosure" className="field mt-1">
          <option value="Publicité">Publicité</option>
          <option value="Sponsorisé">Sponsorisé</option>
        </select>
      </label>
      <label className="block text-sm font-semibold">
        Plafond d&apos;affichages (facultatif)
        <input name="max_impressions" type="number" min={1} className="field mt-1" />
      </label>
      <label className="block text-sm font-semibold md:col-span-2">
        Image (URL https aux dimensions de l&apos;emplacement)
        <input name="image_url" type="url" required className="field mt-1" />
      </label>
      <label className="block text-sm font-semibold md:col-span-2">
        Texte alternatif de l&apos;image
        <input name="image_alt" required maxLength={200} className="field mt-1" />
      </label>
      <label className="block text-sm font-semibold md:col-span-2">
        Lien de destination (https)
        <input name="target_url" type="url" required className="field mt-1" />
      </label>
      <label className="block text-sm font-semibold">
        Début
        <input name="starts_at" type="datetime-local" required className="field mt-1" />
      </label>
      <label className="block text-sm font-semibold">
        Fin
        <input name="ends_at" type="datetime-local" required className="field mt-1" />
      </label>
      <button
        type="submit"
        className="btn btn-primary md:col-span-2 md:justify-self-start"
        disabled={pending}
      >
        {pending ? "Création…" : "Créer (inactive)"}
      </button>
    </form>
  );
}
