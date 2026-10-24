"use client";

import { useActionState, useState, useTransition } from "react";
import { signOut, startEnrollment, verifyMfa, type AuthState } from "../auth-actions";

export function MfaForm({ factorId: existing }: { factorId?: string }) {
  const [enrol, setEnrol] = useState<AuthState>({});
  const [starting, startTransition] = useTransition();
  const [state, action, pending] = useActionState<AuthState, FormData>(verifyMfa, {});
  const factorId = existing ?? enrol.factorId ?? state.factorId;

  return (
    <div className="space-y-5">
      {!existing && !enrol.factorId && (
        <button
          type="button"
          className="btn btn-primary w-full"
          disabled={starting}
          onClick={() => startTransition(async () => setEnrol(await startEnrollment()))}
        >
          {starting ? "Préparation…" : "Configurer mon application"}
        </button>
      )}
      {enrol.error && (
        <p role="alert" className="field-error">
          {enrol.error}
        </p>
      )}
      {enrol.qr && (
        <div className="space-y-3">
          <p>Scannez ce code avec votre application, puis saisissez le code affiché.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enrol.qr} alt="QR code de configuration de la double authentification" width={200} height={200} className="mx-auto" />
          <p className="text-sm text-slate">
            Saisie manuelle : <code className="break-all">{enrol.secret}</code>
          </p>
        </div>
      )}
      {factorId && (
        <form action={action} className="space-y-4">
          <input type="hidden" name="factorId" value={factorId} />
          {state.error && (
            <p role="alert" className="rounded-md border border-destructive bg-[#FEF3F2] p-3 font-semibold text-destructive">
              {state.error}
            </p>
          )}
          <div>
            <label htmlFor="code" className="field-label">
              Code à 6 chiffres
            </label>
            <input
              id="code"
              name="code"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              autoComplete="one-time-code"
              required
              className="field text-center text-2xl tracking-[0.4em]"
            />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={pending}>
            {pending ? "Vérification…" : "Valider"}
          </button>
        </form>
      )}
      <form action={signOut}>
        <button type="submit" className="link text-sm">
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
