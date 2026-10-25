"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import Link from "next/link";
import { submitQuote, type FormState } from "@/app/actions/forms";
import {
  BUDGET_OPTIONS,
  LOCATION_OPTIONS,
  SEGMENT_OPTIONS,
  SERVICE_OPTIONS,
  TIMELINE_OPTIONS,
} from "@/lib/site";
import {
  AntiSpamFields,
  describedBy,
  Field,
  FormStatus,
  keepValuesOnSubmit,
  type FormToken,
} from "./form-bits";

const STEPS = ["Votre organisation", "Votre besoin", "Cadre du projet", "Vos coordonnées"] as const;

// Which step holds each field, to jump back to the first step with a server-side error.
const FIELD_STEP: Record<string, number> = {
  segment: 0,
  organization: 0,
  services: 1,
  package_slug: 1,
  message: 1,
  budget_range: 2,
  timeline: 2,
  location: 2,
  full_name: 3,
  email: 3,
  phone: 3,
  consent: 3,
};

export function QuoteForm({
  packages,
  defaultService,
  formToken,
}: {
  packages: { slug: string; name: string }[];
  defaultService?: string;
  formToken: FormToken;
}) {
  const [step, setStep] = useState(0);
  const [state, action, pending] = useActionState<FormState, FormData>(
    async (prev, fd) => {
      const res = await submitQuote(prev, fd);
      if (res.status === "error" && res.fields) {
        const first = Math.min(...Object.keys(res.fields).map((k) => FIELD_STEP[k] ?? 3));
        setStep(first);
      }
      return res;
    },
    { status: "idle" },
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errors = { ...(state.status === "error" ? state.fields : {}), ...clientErrors };

  if (state.status === "success") {
    return (
      <div className="border-border rounded-lg border p-6">
        <FormStatus state={state} />
        <p className="mt-4">
          En attendant, vous pouvez consulter nos{" "}
          <Link href="/services" className="link">
            services
          </Link>{" "}
          ou notre{" "}
          <Link href="/journal" className="link">
            Journal
          </Link>
          .
        </p>
      </div>
    );
  }

  /** Light client-side check of the current step; the server re-validates everything. */
  function validateStep(): boolean {
    const form = formRef.current;
    if (!form) return true;
    const fd = new FormData(form);
    const e: Record<string, string> = {};
    if (step === 0 && !fd.get("segment")) e.segment = "Choisissez un type d'organisation";
    if (step === 1) {
      if (fd.getAll("services").length === 0) e.services = "Choisissez au moins un service";
      if (String(fd.get("message") ?? "").trim().length < 20)
        e.message = "Décrivez votre besoin en quelques phrases (20 caractères minimum)";
    }
    setClientErrors(e);
    return Object.keys(e).length === 0;
  }

  function go(to: number) {
    if (to > step && !validateStep()) return;
    setStep(to);
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  const panel = (i: number) => (i === step ? "" : "hidden");

  return (
    <form
      ref={formRef}
      onSubmit={keepValuesOnSubmit(action, startTransition)}
      noValidate
      className="relative space-y-6"
      aria-describedby="quote-progress"
    >
      <AntiSpamFields formToken={formToken} />
      <p id="quote-progress" aria-live="polite" className="text-slate text-sm font-semibold">
        Étape {step + 1} sur {STEPS.length}
      </p>
      <ol className="grid grid-cols-4 gap-2" aria-hidden="true">
        {STEPS.map((s, i) => (
          <li key={s} className={`h-1.5 rounded-full ${i <= step ? "bg-blue" : "bg-border"}`} />
        ))}
      </ol>
      <h2 ref={headingRef} tabIndex={-1} className="h3 text-navy outline-none">
        {STEPS[step]}
      </h2>

      <FormStatus state={state} />

      {/* Step 1 */}
      <fieldset className={`space-y-5 ${panel(0)}`}>
        <legend className="sr-only">{STEPS[0]}</legend>
        <Field id="segment" label="Vous représentez" required error={errors.segment}>
          <select
            id="segment"
            name="segment"
            className="field"
            defaultValue=""
            aria-invalid={Boolean(errors.segment)}
            aria-describedby={describedBy("segment", errors.segment)}
          >
            <option value="" disabled>
              Choisir…
            </option>
            {SEGMENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="organization" label="Nom de l'organisation" error={errors.organization}>
          <input
            id="organization"
            name="organization"
            className="field"
            maxLength={160}
            autoComplete="organization"
          />
        </Field>
      </fieldset>

      {/* Step 2 */}
      <fieldset className={`space-y-5 ${panel(1)}`}>
        <legend className="sr-only">{STEPS[1]}</legend>
        <div>
          <p className="field-label" id="services-label">
            Services souhaités{" "}
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
            <span className="sr-only"> (obligatoire, au moins un)</span>
          </p>
          <div
            role="group"
            aria-labelledby="services-label"
            aria-describedby={describedBy("services", errors.services)}
            className="grid gap-2 sm:grid-cols-2"
          >
            {SERVICE_OPTIONS.map((o) => (
              <label
                key={o.value}
                className="border-border flex min-h-11 items-center gap-3 rounded-md border px-3 py-2"
              >
                <input
                  type="checkbox"
                  name="services"
                  value={o.value}
                  defaultChecked={o.value === defaultService}
                  className="accent-blue size-5"
                />
                <span>{o.label}</span>
              </label>
            ))}
          </div>
          {errors.services && (
            <p id="services-error" className="field-error">
              {errors.services}
            </p>
          )}
        </div>
        {packages.length > 0 && (
          <Field id="package_slug" label="Un forfait vous intéresse ?" error={errors.package_slug}>
            <select id="package_slug" name="package_slug" className="field" defaultValue="">
              <option value="">Pas de forfait, une mission ponctuelle</option>
              {packages.map((p) => (
                <option key={p.slug} value={p.slug}>
                  Forfait {p.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field
          id="message"
          label="Décrivez votre besoin"
          required
          error={errors.message}
          hint="Contexte, publics visés, dates importantes, contraintes particulières."
        >
          <textarea
            id="message"
            name="message"
            rows={6}
            maxLength={4000}
            className="field"
            aria-invalid={Boolean(errors.message)}
            aria-describedby={describedBy("message", errors.message, "hint")}
          />
        </Field>
      </fieldset>

      {/* Step 3 */}
      <fieldset className={`space-y-5 ${panel(2)}`}>
        <legend className="sr-only">{STEPS[2]}</legend>
        <Field
          id="budget_range"
          label="Budget envisagé"
          error={errors.budget_range}
          hint="Une fourchette nous aide à proposer une solution réaliste."
        >
          <select
            id="budget_range"
            name="budget_range"
            className="field"
            defaultValue="non-defini"
            aria-describedby="budget_range-hint"
          >
            {BUDGET_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="timeline" label="Échéance" error={errors.timeline}>
          <select id="timeline" name="timeline" className="field" defaultValue="non-defini">
            {TIMELINE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="location" label="Lieu principal du projet" error={errors.location}>
          <select id="location" name="location" className="field" defaultValue="ndjamena">
            {LOCATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </fieldset>

      {/* Step 4 */}
      <fieldset className={`space-y-5 ${panel(3)}`}>
        <legend className="sr-only">{STEPS[3]}</legend>
        <Field id="full_name" label="Nom et prénom" required error={errors.full_name}>
          <input
            id="full_name"
            name="full_name"
            className="field"
            autoComplete="name"
            maxLength={120}
            aria-invalid={Boolean(errors.full_name)}
            aria-describedby={describedBy("full_name", errors.full_name)}
          />
        </Field>
        <Field id="email" label="Adresse e-mail" required error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            className="field"
            autoComplete="email"
            maxLength={254}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy("email", errors.email)}
          />
        </Field>
        <Field
          id="phone"
          label="Téléphone ou WhatsApp"
          error={errors.phone}
          hint="Format international, par exemple +235 66 00 00 00."
        >
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            className="field"
            autoComplete="tel"
            maxLength={20}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={describedBy("phone", errors.phone, "hint")}
          />
        </Field>
        <div>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="consent"
              aria-required="true"
              className="accent-blue mt-1 size-5 shrink-0"
              aria-invalid={Boolean(errors.consent)}
              aria-describedby={describedBy("consent", errors.consent)}
            />
            <span>
              J&apos;accepte qu&apos;Africa Média utilise ces informations pour répondre à ma demande. Elles
              sont conservées 24 mois au plus.{" "}
              <Link href="/confidentialite" className="link">
                Politique de confidentialité
              </Link>
              <span className="text-destructive" aria-hidden="true">
                {" "}
                *
              </span>
            </span>
          </label>
          {errors.consent && (
            <p id="consent-error" className="field-error">
              {errors.consent}
            </p>
          )}
        </div>
      </fieldset>

      <div className="border-border flex flex-wrap justify-between gap-3 border-t pt-6">
        {step > 0 ? (
          <button type="button" className="btn btn-secondary" onClick={() => go(step - 1)}>
            Retour
          </button>
        ) : (
          <span />
        )}
        {step < STEPS.length - 1 ? (
          <button type="button" className="btn btn-primary" onClick={() => go(step + 1)}>
            Continuer
          </button>
        ) : (
          <button type="submit" className="btn btn-primary" disabled={pending} aria-disabled={pending}>
            {pending ? "Envoi en cours…" : "Envoyer ma demande"}
          </button>
        )}
      </div>
    </form>
  );
}
