"use client";

import { useActionState } from "react";
import Link from "next/link";
import { submitContact, type FormState } from "@/app/actions/forms";
import { CONTACT_TOPICS } from "@/lib/site";
import { AntiSpamFields, describedBy, Field, FormStatus } from "./form-bits";

export function ContactForm({ defaultTopic }: { defaultTopic?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitContact, { status: "idle" });
  const errors = state.status === "error" ? (state.fields ?? {}) : {};

  if (state.status === "success") return <FormStatus state={state} />;

  return (
    <form action={action} noValidate className="relative space-y-5">
      <AntiSpamFields />
      <FormStatus state={state} />
      <Field id="c-name" label="Nom et prénom" required error={errors.full_name}>
        <input id="c-name" name="full_name" className="field" autoComplete="name" maxLength={120} aria-invalid={Boolean(errors.full_name)} aria-describedby={describedBy("c-name", errors.full_name)} />
      </Field>
      <Field id="c-email" label="Adresse e-mail" required error={errors.email}>
        <input id="c-email" name="email" type="email" inputMode="email" className="field" autoComplete="email" maxLength={254} aria-invalid={Boolean(errors.email)} aria-describedby={describedBy("c-email", errors.email)} />
      </Field>
      <Field id="c-phone" label="Téléphone ou WhatsApp" error={errors.phone}>
        <input id="c-phone" name="phone" type="tel" inputMode="tel" className="field" autoComplete="tel" maxLength={20} aria-invalid={Boolean(errors.phone)} aria-describedby={describedBy("c-phone", errors.phone)} />
      </Field>
      <Field id="c-topic" label="Sujet" required error={errors.topic}>
        <select id="c-topic" name="topic" className="field" defaultValue={defaultTopic ?? "question"}>
          {CONTACT_TOPICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>
      <Field id="c-message" label="Message" required error={errors.message}>
        <textarea id="c-message" name="message" rows={6} maxLength={4000} className="field" aria-invalid={Boolean(errors.message)} aria-describedby={describedBy("c-message", errors.message)} />
      </Field>
      <div>
        <label className="flex items-start gap-3">
          <input type="checkbox" name="consent" className="mt-1 size-5 shrink-0 accent-blue" aria-invalid={Boolean(errors.consent)} aria-describedby={describedBy("c-consent", errors.consent)} />
          <span>
            J&apos;accepte qu&apos;Africa Média utilise ces informations pour me répondre. Elles sont conservées 12 mois au
            plus.{" "}
            <Link href="/confidentialite" className="link">
              Politique de confidentialité
            </Link>
          </span>
        </label>
        {errors.consent && (
          <p id="c-consent-error" className="field-error">
            {errors.consent}
          </p>
        )}
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Envoi en cours…" : "Envoyer"}
      </button>
    </form>
  );
}
